<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $keyboardCategory = Category::where('slug', 'keyboard')->first();
        $mouseCategory = Category::where('slug', 'mouse')->first();
        $mousepadCategory = Category::where('slug', 'mousepad')->first();
        $monitorCategory = Category::where('slug', 'monitor')->first();
        $mejaCategory = Category::where('slug', 'meja')->first();
        $kursiCategory = Category::where('slug', 'kursi')->first();
        $deskmatCategory = Category::where('slug', 'deskmat')->first();
        $dockingCategory = Category::where('slug', 'docking-station')->first();
        $holderCategory = Category::where('slug', 'holder-stand')->first();

        $products = [
            [
                'name' => 'Keyboard Mechanical RGB',
                'sku' => 'KEY-RGB-001',
                'category_id' => $keyboardCategory?->id,
                'price' => 1200000,
                'stock' => 8,
                'status' => 'Active',
                'description' => 'Keyboard mekanis dengan RGB lighting',
            ],
            [
                'name' => 'Keyboard Wireless Logitech',
                'sku' => 'KEY-LOG-002',
                'category_id' => $keyboardCategory?->id,
                'price' => 850000,
                'stock' => 15,
                'status' => 'Active',
                'description' => 'Keyboard wireless dengan teknologi unifying',
            ],
            [
                'name' => 'Mouse Logitech MX Master',
                'sku' => 'MOU-LOG-001',
                'category_id' => $mouseCategory?->id,
                'price' => 750000,
                'stock' => 45,
                'status' => 'Active',
                'description' => 'Mouse presisi untuk produktivitas maksimal',
            ],
            [
                'name' => 'Mouse Gaming Corsair',
                'sku' => 'MOU-COR-002',
                'category_id' => $mouseCategory?->id,
                'price' => 680000,
                'stock' => 22,
                'status' => 'Active',
                'description' => 'Mouse gaming dengan sensor 16000 DPI',
            ],
            [
                'name' => 'Mousepad Extended RGB',
                'sku' => 'PAD-RGB-001',
                'category_id' => $mousepadCategory?->id,
                'price' => 450000,
                'stock' => 30,
                'status' => 'Active',
                'description' => 'Mousepad besar dengan RGB lighting',
            ],
            [
                'name' => 'Mousepad Premium Leather',
                'sku' => 'PAD-LEA-002',
                'category_id' => $mousepadCategory?->id,
                'price' => 350000,
                'stock' => 25,
                'status' => 'Active',
                'description' => 'Mousepad premium dengan bahan kulit',
            ],
            [
                'name' => 'Webcam Logitech 1080p',
                'sku' => 'WEB-LOG-001',
                'category_id' => $holderCategory?->id,
                'price' => 450000,
                'stock' => 22,
                'status' => 'Active',
                'description' => 'Webcam 1080p untuk video call profesional',
            ],
            [
                'name' => 'USB Hub 7-Port',
                'sku' => 'HUB-USB-001',
                'category_id' => $dockingCategory?->id,
                'price' => 280000,
                'stock' => 18,
                'status' => 'Active',
                'description' => 'Hub USB dengan 7 port dan fast charging',
            ],
            [
                'name' => 'Monitor 4K 27 Inch',
                'sku' => 'MON-4K-001',
                'category_id' => $monitorCategory?->id,
                'price' => 3500000,
                'stock' => 5,
                'status' => 'Low Stock',
                'description' => 'Monitor 4K 27 inch untuk kebutuhan profesional',
            ],
            [
                'name' => 'Monitor Gaming 144Hz',
                'sku' => 'MON-GAM-002',
                'category_id' => $monitorCategory?->id,
                'price' => 2800000,
                'stock' => 8,
                'status' => 'Active',
                'description' => 'Monitor gaming 144Hz 24 inch FHD',
            ],
            [
                'name' => 'Meja Gaming Racecar',
                'sku' => 'DESK-GAM-001',
                'category_id' => $mejaCategory?->id,
                'price' => 2500000,
                'stock' => 3,
                'status' => 'Low Stock',
                'description' => 'Meja gaming desain racecar dengan LED',
            ],
            [
                'name' => 'Meja Studio Minimalis',
                'sku' => 'DESK-MIN-002',
                'category_id' => $mejaCategory?->id,
                'price' => 1800000,
                'stock' => 6,
                'status' => 'Active',
                'description' => 'Meja studio minimalis dengan material berkualitas',
            ],
            [
                'name' => 'Kursi Gaming DXRacer',
                'sku' => 'CHAIR-GAM-001',
                'category_id' => $kursiCategory?->id,
                'price' => 3200000,
                'stock' => 4,
                'status' => 'Active',
                'description' => 'Kursi gaming ergonomis dengan sandaran kepala',
            ],
            [
                'name' => 'Kursi Kerja Executive',
                'sku' => 'CHAIR-EXE-002',
                'category_id' => $kursiCategory?->id,
                'price' => 1500000,
                'stock' => 8,
                'status' => 'Active',
                'description' => 'Kursi kantor premium dengan lumbar support',
            ],
            [
                'name' => 'Mousepad Extended Large',
                'sku' => 'PAD-EXT-001',
                'category_id' => $mousepadCategory?->id,
                'price' => 380000,
                'stock' => 20,
                'status' => 'Active',
                'description' => 'Mousepad berukuran besar 90x40cm dengan RGB',
            ],
            [
                'name' => 'Deskmat Kulit Premium',
                'sku' => 'DMAT-PRE-001',
                'category_id' => $deskmatCategory?->id,
                'price' => 520000,
                'stock' => 12,
                'status' => 'Active',
                'description' => 'Deskmat kulit asli melindungi meja kerja',
            ],
            [
                'name' => 'Deskmat Gaming RGB',
                'sku' => 'DMAT-RGB-002',
                'category_id' => $deskmatCategory?->id,
                'price' => 650000,
                'stock' => 9,
                'status' => 'Active',
                'description' => 'Deskmat dengan pencahayaan RGB 16 juta warna',
            ],
            [
                'name' => 'USB-C Docking Station 12-in-1',
                'sku' => 'DOCK-USB-001',
                'category_id' => $dockingCategory?->id,
                'price' => 1200000,
                'stock' => 11,
                'status' => 'Active',
                'description' => 'Docking station dengan 12 port USB dan HDMI',
            ],
            [
                'name' => 'USB 3.0 Hub 7-Port',
                'sku' => 'DOCK-HUB-002',
                'category_id' => $dockingCategory?->id,
                'price' => 420000,
                'stock' => 16,
                'status' => 'Active',
                'description' => 'Hub USB dengan 7 port dan fast charging',
            ],
            [
                'name' => 'Monitor Stand Adjustable',
                'sku' => 'HOLD-MON-001',
                'category_id' => $holderCategory?->id,
                'price' => 350000,
                'stock' => 14,
                'status' => 'Active',
                'description' => 'Stand monitor dapat disesuaikan tingginya',
            ],
            [
                'name' => 'Laptop Stand Aluminium',
                'sku' => 'HOLD-LAP-002',
                'category_id' => $holderCategory?->id,
                'price' => 420000,
                'stock' => 18,
                'status' => 'Active',
                'description' => 'Stand laptop aluminium dengan ventilasi baik',
            ],
            [
                'name' => 'Phone/Tablet Holder',
                'sku' => 'HOLD-PHO-003',
                'category_id' => $holderCategory?->id,
                'price' => 150000,
                'stock' => 25,
                'status' => 'Active',
                'description' => 'Holder universal untuk smartphone dan tablet',
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(['sku' => $product['sku']], $product);
        }
    }
}
