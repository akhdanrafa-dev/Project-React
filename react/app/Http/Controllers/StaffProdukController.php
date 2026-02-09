<?php

// app/Http/Controllers/StaffProdukController.php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
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
                'stock' => $product->stock,
                'status' => $product->status,
                'description' => $product->description,
                'image' => $product->image,
            ];
        })->values();

        $categories = Category::all(['id', 'name', 'slug', 'description']);

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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products',
            'category' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
        ]);

        // Create product
        // Product::create($validated);

        return redirect()->route('staff.produk.index')
            ->with('message', 'Produk berhasil ditambahkan');
    }

    /**
     * Update the specified product
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string',
            'category' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'description' => 'sometimes|string',
        ]);

        // Update product
        Product::find($id)->update($validated);

        return redirect()->route('staff.produk.index')
            ->with('message', 'Produk berhasil diperbarui');
    }

    /**
     * Remove the specified product
     */
    public function destroy($id)
    {
        // Delete product
        // Product::find($id)->delete();

        return redirect()->route('staff.produk.index')
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
                'stock' => $product->stock,
                'status' => $product->status,
                'description' => $product->description,
                'image' => $product->image,
            ];
        });

        return response()->json($products);
    }
}
