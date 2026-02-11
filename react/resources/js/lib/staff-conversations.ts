export type StaffChatMessage = {
  id: number
  sender: "developer" | "staff"
  message: string
  time: string
}

export type StaffConversationMap = Record<number, StaffChatMessage[]>

export const initialStaffConversations: StaffConversationMap = {
  201: [
    {
      id: 1,
      sender: "staff",
      message: "Halo dev, ada update terkait bug di halaman checkout.",
      time: "09:12",
    },
    {
      id: 2,
      sender: "developer",
      message: "Siap, saya cek log-nya dulu ya.",
      time: "09:14",
    },
  ],
  202: [
    {
      id: 3,
      sender: "staff",
      message: "Produk baru sudah saya input, tapi belum tampil di katalog.",
      time: "08:45",
    },
  ],
  203: [
    {
      id: 4,
      sender: "staff",
      message: "Testing terakhir: issue pembayaran masih muncul di iOS.",
      time: "07:30",
    },
    {
      id: 5,
      sender: "developer",
      message: "Oke, nanti saya patch setelah standup.",
      time: "07:45",
    },
  ],
  204: [],
}
