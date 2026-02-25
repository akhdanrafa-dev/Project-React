# Fitur Kolaborasi Admin untuk Bug Tickets

## Ringkasan Perubahan

Fitur kolaborasi telah diimplementasikan untuk memungkinkan admin IT bekerja sama dalam menyelesaikan bug tickets. Berikut adalah detail lengkap dari semua perubahan:

---

## 1. Database Migration
**File:** `2026_02_25_000002_add_collaboration_to_bug_tickets_table.php`

Menambahkan 2 kolom baru ke tabel `bug_tickets`:
- `collaboration_type` (enum: 'solo', 'collab') - Default 'solo'
- `collaborators` (json) - Menyimpan array ID dari admin yang berkolaborasi

---

## 2. Model BugTicket
**File:** `app/Models/BugTicket.php`

### Perubahan:
- **$fillable**: Menambah `collaboration_type` dan `collaborators`
- **$casts**: Menambah casting untuk `collaborators` sebagai array
- **Method baru:**
  - `getCollaboratorsDetails()` - Mengambil detail info collaborator dari database
  - `addCollaborator($userId)` - Menambah collaborator ke array
  - `removeCollaborator($userId)` - Menghapus collaborator dari array

---

## 3. Backend API Endpoints
**File:** `app/Http/Controllers/BugTicketController.php`

### Method Baru:

#### 1. `inviteCollaborator(Request $request, BugTicket $bugTicket)`
- **Route:** `POST /api/bug-tickets/{bugTicket}/collaborators/invite`
- **Parameters:** `collaborator_id` (required)
- **Logic:**
  - Validasi bahwa user adalah admin IT
  - Validasi bahwa user adalah pemilik ticket (assigned_to)
  - Validasi collaborator adalah admin IT
  - Tambah collaborator ke array
  - Ubah collaboration_type menjadi 'collab'
- **Response:** Ticket + daftar collaborators

#### 2. `removeCollaborator(Request $request, BugTicket $bugTicket)`
- **Route:** `DELETE /api/bug-tickets/{bugTicket}/collaborators/remove`
- **Parameters:** `collaborator_id` (required)
- **Logic:**
  - Validasi bahwa user adalah pemilik ticket
  - Hapus collaborator dari array
  - Jika tidak ada collaborator lagi, ubah collaboration_type ke 'solo'
- **Response:** Ticket + daftar collaborators

#### 3. `getCollaborators(BugTicket $bugTicket)`
- **Route:** `GET /api/bug-tickets/{bugTicket}/collaborators`
- **Response:** 
  ```json
  {
    "success": true,
    "collaboration_type": "collab/solo",
    "collaborators": [...],
    "main_admin": {...}
  }
  ```

### Update Existing Methods:

#### `getAdminStats($adminId)`
- Tambah statistik `collaboration_count` - Hitung berapa banyak ticket dengan collaboration_type 'collab'
- Update `difficulty_breakdown` untuk include kategori 'collab'

#### `getAdminActivityStats()`
- Tambah field `collaboration_count` untuk setiap admin

---

## 4. API Routes
**File:** `routes/web.php`

```php
Route::post('/api/bug-tickets/{bugTicket}/collaborators/invite', [BugTicketController::class, 'inviteCollaborator']);
Route::delete('/api/bug-tickets/{bugTicket}/collaborators/remove', [BugTicketController::class, 'removeCollaborator']);
Route::get('/api/bug-tickets/{bugTicket}/collaborators', [BugTicketController::class, 'getCollaborators']);
```

---

## 5. Frontend UI - Admin IT Chats
**File:** `resources/js/Pages/admin-it-chats.tsx`

### Interface Updates:
```typescript
interface Ticket {
  // ... existing fields
  collaboration_type?: string      // 'solo' | 'collab'
  collaborators?: number[] | null   // Array of admin IDs
}

interface AdminUser {
  id: number
  name: string
  email: string
}
```

### State Management:
Tambah state baru:
- `adminList` - List semua admin IT (exclude current user)
- `selectedCollaborator` - Admin yang dipilih untuk diundang
- `collaboratorsDetails` - Detail info collaborators (diambil dari API)
- `isInvitingCollaborator` - Loading state saat invite
- `showCollaborationModal` - Kontrol modal visibility

### Effect Hooks:
- `useEffect` untuk fetch admin list saat komponen mount → `fetchAdminList()`
- `useEffect` untuk fetch collaborators details saat ticket berubah → `fetchCollaboratorsDetails(ticketId)`

### Method Baru:

#### `fetchAdminList()`
Ambil list admin IT dari `/api/developers`

#### `fetchCollaboratorsDetails(ticketId)`
Ambil detail collaborators dari `/api/bug-tickets/{ticketId}/collaborators`

#### `handleInviteCollaborator()`
- Validasi selected collaborator
- Validasi user adalah pemilik ticket
- Call API untuk invite collaborator
- Update UI dan state

#### `handleRemoveCollaborator(collaboratorId)`
- Validasi user adalah pemilik ticket
- Call API untuk remove collaborator
- Update UI dan state

### UI Changes:

1. **Tombol Kolaborasi** muncul saat:
   - Ticket status = 'in_progress'
   - User adalah pemilik ticket (assigned_to === currentUserId)
   - Button akan membuka modal kolaborasi

2. **Modal Kolaborasi** menampilkan:
   - List kolaborator saat ini dengan tombol hapus
   - Dropdown untuk memilih admin untuk diundang
   - Tombol "Tambah Kolaborator"
   - Info catatan tentang fitur kolaborasi

---

## 6. Workflow Penggunaan

### Skenario: Admin A mengambil ticket dan mengundang Admin B

1. **Admin A membuka detail ticket** (di `/admin-it/chats`)
   - Status: Open (Terbuka)

2. **Admin A mengklik "Ambil Tiket"**
   - Status berubah menjadi "in_progress"
   - `assigned_to` = Admin A
   - Button "Ambil Tiket" hilang, muncul button "Kolaborasi" dan "Tandai Terselesaikan"

3. **Admin A mengklik "Kolaborasi"**
   - Modal kolaborasi terbuka
   - Admin A memilih "Admin B" dari dropdown
   - Admin A klik "Tambah Kolaborator"

4. **Backend memproses:**
   - Validasi Admin B adalah admin IT
   - Tambah Admin B ke array `collaborators`
   - Set `collaboration_type` = 'collab'
   - Save ticket

5. **Frontend update:**
   - Modal menampilkan Admin B di list "Kolaborator Saat Ini"
   - Tombol "Hapus" tersedia untuk menghapus Admin B

6. **Saat ticket diselesaikan:**
   - Statistik akan menambah count untuk `collaboration_count`
   - `difficulty_breakdown` akan include tiket ini dengan type 'collab'

---

## 7. Statistik & Tracking

### Di `getAdminStats()`:
```json
{
  "difficulty_breakdown": {
    "easy": 5,
    "medium": 3,
    "hard": 2,
    "collab": 4        // NEW: Count ticket dengan collaboration_type = 'collab'
  },
  "collaboration_count": 4   // NEW: Total collaboration tickets
}
```

### Di `getAdminActivityStats()`:
Setiap admin akan memiliki field `collaboration_count`

---

## 8. Notes & Best Practices

1. **Security:**
   - Hanya pemilik ticket (assigned_to) yang bisa manage collaborators
   - Hanya admin IT yang bisa menjadi collaborator
   - Tidak bisa invite diri sendiri

2. **Data Integrity:**
   - Jika tidak ada collaborator, `collaboration_type` otomatis reset ke 'solo'
   - `collaborators` array selalu ter-sanitize dari duplicate

3. **Performance:**
   - Collaborators di-fetch setiap kali ticket dipilih
   - Admin list di-fetch sekali saat page load

4. **User Experience:**
   - Tombol "Kolaborasi" hanya muncul saat ticket sudah diambil admin
   - Modal memberikan feedback jika ada error
   - Daftar admin exclude current user untuk menghindari self-invite

---

## 9. Implementation Checklist

- [x] Database migration untuk add `collaboration_type` dan `collaborators`
- [x] Update BugTicket model dengan methods kolaborasi
- [x] API endpoint untuk invite collaborator
- [x] API endpoint untuk remove collaborator
- [x] API endpoint untuk get collaborators
- [x] Update admin stats untuk track collaboration
- [x] Frontend UI untuk manage collaborators
- [x] Modal untuk invite/remove collaborators
- [x] Validasi dan error handling
- [x] Integration testing

---

## 10. Testing

### Manual Testing Checklist:
1. Admin A membuka ticket terbuka dan klik "Ambil Tiket" ✓
2. Admin A klik "Kolaborasi" dan invite Admin B ✓
3. Verify ticket status berubah ke `collaboration_type: 'collab'` ✓
4. Admin A hapus Admin B dari collaborators ✓
5. Verify ticket status berubah kembali ke `collaboration_type: 'solo'` ✓
6. Check statistics menampilkan `collaboration_count` dengan benar ✓
7. Verify tidak bisa invite admin yang sudah menjadi collaborator ✓
8. Verify tidak bisa invite diri sendiri ✓

---

## 11. Future Enhancements

Fitur-fitur yang bisa ditambahkan di masa depan:
- Notification system untuk collaborators yang diinvite
- Activity log untuk track siapa yang add/remove collaborators
- Role-based permissions untuk collaborators (read-only vs edit)
- Bulk collaboration assignment
- Collaboration history tracking
