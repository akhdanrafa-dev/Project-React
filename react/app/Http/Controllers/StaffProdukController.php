<?php

// app/Http/Controllers/StaffProdukController.php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StaffProdukController extends Controller
{
    /**
     * Display product management page (Staff & Developer)
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Check if user is staff or developer
        if (!in_array($user->role, ['staff', 'developer'])) {
            abort(403, 'Access denied. Only staff and developer can access this page.');
        }

        $query = Product::with('category');

        if ($request->has('category') && $request->category) {
            $query->where('category_id', $request->category);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->get()->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category' => $product->category?->name ?? 'Unknown',
                'category_id' => $product->category_id,
                'price' => $product->price,
                'discount' => (float) ($product->discount ?? 0),
                'stock' => $product->stock,
                'status' => $product->status,
                'description' => $product->description,
                'image' => $product->image,
            ];
        })->values();

        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description']);

        // Render different template based on role
        $template = $user->role === 'developer' ? 'kelola-produk' : 'staff/kelola-produk';

        return Inertia::render($template, [
            'products' => $products,
            'categories' => $categories,
            'selectedCategory' => $request->category ? (int)$request->category : null,
            'searchTerm' => $request->search ?? '',
            'role' => $user->role,
        ]);
    }

    /**
     * Store a newly created product
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['staff', 'developer'], true)) {
            abort(403, 'Access denied. Only staff and developer can create products.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:255|unique:products,sku',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0|max:100',
            'stock' => 'required|integer|min:0',
            'description' => 'sometimes|nullable|string',
            'image' => 'sometimes|nullable|string|max:2048',
        ]);

        $price = (float) $validated['price'];
        $discount = array_key_exists('discount', $validated)
            ? (float) $validated['discount']
            : 0.0;

        $categoryId = $this->resolveCategoryId((string) $validated['category']);

        if (!$categoryId) {
            throw ValidationException::withMessages([
                'category' => ['Kategori produk tidak valid.'],
            ]);
        }

        $description = array_key_exists('description', $validated)
            ? trim((string) $validated['description'])
            : null;
        $image = array_key_exists('image', $validated)
            ? trim((string) $validated['image'])
            : null;

        $product = Product::create([
            'name' => trim((string) $validated['name']),
            'sku' => trim((string) $validated['sku']),
            'category_id' => $categoryId,
            'price' => $price,
            'discount' => $discount,
            'stock' => $validated['stock'],
            'status' => $this->resolveStatusFromStock((int) $validated['stock']),
            'description' => $description !== '' ? $description : null,
            'image' => $image !== '' ? $image : null,
        ]);

        $product->load('category');

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Produk berhasil ditambahkan',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => (float) $product->price,
                    'discount' => (float) ($product->discount ?? 0),
                    'stock' => (int) $product->stock,
                    'image' => $product->image,
                    'category_slug' => $product->category?->slug,
                    'category_name' => $product->category?->name,
                ],
            ], 201);
        }

        return redirect()->route('kelola.produk')
            ->with('message', 'Produk berhasil ditambahkan');
    }

    /**
     * Store a newly created category
     */
    public function storeCategory(Request $request)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['staff', 'developer'], true)) {
            abort(403, 'Access denied. Only staff and developer can create categories.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'sometimes|nullable|string|max:500',
        ]);

        $name = trim((string) $validated['name']);
        $description = array_key_exists('description', $validated)
            ? trim((string) $validated['description'])
            : null;
        $slug = Str::slug($name);

        if ($slug === '') {
            throw ValidationException::withMessages([
                'name' => ['Nama kategori tidak valid.'],
            ]);
        }

        $existingCategory = Category::query()
            ->where('slug', $slug)
            ->orWhereRaw('LOWER(name) = ?', [Str::lower($name)])
            ->first();

        if ($existingCategory) {
            return response()->json([
                'message' => 'Kategori sudah tersedia',
                'category' => $this->transformCategory($existingCategory),
            ]);
        }

        $createdCategory = Category::create([
            'name' => $name,
            'slug' => $slug,
            'description' => $description !== '' ? $description : null,
        ]);

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan',
            'category' => $this->transformCategory($createdCategory),
        ], 201);
    }

    /**
     * Update the specified category
     */
    public function updateCategory(Request $request, int $id)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['staff', 'developer'], true)) {
            abort(403, 'Access denied. Only staff and developer can update categories.');
        }

        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
            'description' => 'sometimes|nullable|string|max:500',
        ]);

        $name = trim((string) $validated['name']);
        $description = array_key_exists('description', $validated)
            ? trim((string) $validated['description'])
            : $category->description;

        if ($name === '') {
            throw ValidationException::withMessages([
                'name' => ['Nama kategori tidak boleh kosong.'],
            ]);
        }

        $category->name = $name;
        if (array_key_exists('description', $validated)) {
            $category->description = $description !== '' ? $description : null;
        }
        $category->save();

        return response()->json([
            'message' => 'Kategori berhasil diperbarui',
            'category' => $this->transformCategory($category),
        ]);
    }

    /**
     * Update the specified product
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['staff', 'developer'], true)) {
            abort(403, 'Access denied. Only staff and developer can update products.');
        }

        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('products', 'sku')->ignore($product->id),
            ],
            'category' => 'sometimes|string|max:100',
            'price' => 'sometimes|numeric|min:0',
            'discount' => 'sometimes|numeric|min:0|max:100',
            'stock' => 'sometimes|integer|min:0',
            'description' => 'sometimes|nullable|string',
            'image' => 'sometimes|nullable|string|max:2048',
        ]);

        $payload = [];

        if (array_key_exists('name', $validated)) {
            $payload['name'] = trim((string) $validated['name']);
        }

        if (array_key_exists('sku', $validated)) {
            $payload['sku'] = trim((string) $validated['sku']);
        }

        if (array_key_exists('price', $validated)) {
            $payload['price'] = $validated['price'];
        }

        if (array_key_exists('discount', $validated)) {
            $payload['discount'] = (float) $validated['discount'];
        }

        if (array_key_exists('stock', $validated)) {
            $payload['stock'] = $validated['stock'];
        }

        if (array_key_exists('description', $validated)) {
            $description = is_string($validated['description'])
                ? trim($validated['description'])
                : null;
            $payload['description'] = $description !== '' ? $description : null;
        }

        if (array_key_exists('image', $validated)) {
            $image = is_string($validated['image'])
                ? trim($validated['image'])
                : null;
            $payload['image'] = $image !== '' ? $image : null;
        }

        if (array_key_exists('category', $validated)) {
            $categoryId = $this->resolveCategoryId((string) $validated['category']);

            if (!$categoryId) {
                throw ValidationException::withMessages([
                    'category' => ['Kategori produk tidak valid.'],
                ]);
            }

            $payload['category_id'] = $categoryId;
        }

        if (!empty($payload)) {
            $product->update($payload);
        }

        $product->load('category');

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Produk berhasil diperbarui',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => (float) $product->price,
                    'discount' => (float) ($product->discount ?? 0),
                    'stock' => (int) $product->stock,
                    'image' => $product->image,
                    'category_slug' => $product->category?->slug,
                    'category_name' => $product->category?->name,
                ],
            ]);
        }

        return redirect()->route('kelola.produk')
            ->with('message', 'Produk berhasil diperbarui');
    }

    /**
     * Remove the specified product
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, ['staff', 'developer'], true)) {
            abort(403, 'Access denied. Only staff and developer can delete products.');
        }

        $product = Product::findOrFail($id);
        $productId = (int) $product->id;
        $product->delete();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Produk berhasil dihapus',
                'product_id' => $productId,
            ]);
        }

        return redirect()->route('kelola.produk')
            ->with('message', 'Produk berhasil dihapus');
    }

    /**
     * API endpoint to get products for dashboard
     */
    public function apiIndex(Request $request)
    {
        $products = Product::with('category')->get()->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category' => $product->category->name,
                'category_id' => $product->category_id,
                'price' => $product->price,
                'discount' => (float) ($product->discount ?? 0),
                'stock' => $product->stock,
                'status' => $product->status,
                'description' => $product->description,
                'image' => $product->image,
            ];
        });

        return response()->json($products);
    }

    private function resolveCategoryId(string $category): ?int
    {
        $trimmed = trim($category);

        if ($trimmed === '') {
            return null;
        }

        if (ctype_digit($trimmed)) {
            $matchedById = Category::find((int) $trimmed, ['id']);
            if ($matchedById) {
                return (int) $matchedById->id;
            }
        }

        $normalized = Str::slug($trimmed);

        if ($normalized === '') {
            return null;
        }

        $aliases = [
            'chair' => ['kursi'],
            'accessories' => ['holder-stand', 'meja'],
            'gamepad' => ['docking-station'],
            'deskmat' => ['mousepad'],
        ];

        $candidateSlugs = array_merge([$normalized], $aliases[$normalized] ?? []);

        foreach ($candidateSlugs as $slug) {
            $matchedCategory = Category::where('slug', $slug)->first(['id']);

            if ($matchedCategory) {
                return (int) $matchedCategory->id;
            }
        }

        $matchedByName = Category::whereRaw('LOWER(name) = ?', [Str::lower($trimmed)])
            ->first(['id']);

        if ($matchedByName) {
            return (int) $matchedByName->id;
        }

        return null;
    }

    private function transformCategory(Category $category): array
    {
        return [
            'id' => (int) $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
        ];
    }

    private function resolveStatusFromStock(int $stock): string
    {
        if ($stock <= 0) {
            return 'Out of Stock';
        }

        if ($stock < 10) {
            return 'Low Stock';
        }

        return 'Active';
    }
}
