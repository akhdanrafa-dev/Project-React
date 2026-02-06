// app/Http/Controllers/StaffDashboardController.php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StaffDashboardController extends Controller
{
    /**
     * Display the staff dashboard
     */
    public function index(Request $request)
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
            ];
        });

        return Inertia::render('StaffDashboard', [
            'products' => $products,
        ]);
    }
}
