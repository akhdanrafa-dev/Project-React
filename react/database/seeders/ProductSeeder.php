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
        $chairCategory = Category::where('slug', 'kursi')->first();
        $accessoriesCategory = Category::where('slug', 'holder-stand')->first();
        $gamepadsCategory = Category::where('slug', 'docking-station')->first();

        $products = [
            [
                'name' => 'Vortex Mono Series Layout 65%/75%/83%/87%/100%',
                'sku' => 'PRD-0001',
                'category_id' => $keyboardCategory?->id,
                'price' => 369000,
                'stock' => 18,
                'status' => 'Active',
                'description' => 'Keyboard mekanis dengan layout yang dapat dikustomisasi',
                'image' => 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-143215499/vortex_series_vortexseries_mono_series_65_-_75_-_87_layout_flexcut_wired_gasket_mount_keyboard_full03_mgtq582o.jpg',
            ],
            [
                'name' => 'Ajazz Ak820 Monochrome 75% v2',
                'sku' => 'PRD-0002',
                'category_id' => $keyboardCategory?->id,
                'price' => 299000,
                'stock' => 21,
                'status' => 'Active',
                'description' => 'Keyboard mekanis 75% dengan desain monochrome',
                'image' => 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-143101682/ajazz_ajazz_ak820_monochrome_-_mechanical_keyboard_full03_rsbvkk6i.jpg',
            ],
            [
                'name' => 'Furycube G11 Mouse Wireless',
                'sku' => 'PRD-0003',
                'category_id' => $mouseCategory?->id,
                'price' => 265000,
                'stock' => 26,
                'status' => 'Active',
                'description' => 'Mouse wireless ultra ringan untuk gaming',
                'image' => 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/96/MTA-182618402/furycube_furycube_g11_-_g-11_ultra_lightweight_wireless_gaming_mouse_paw3311_full02_jbdwjvnv.jpg',
            ],
            [
                'name' => 'Mouse NYK Nemesis Riot mq10, Mouse + Docking',
                'sku' => 'PRD-0004',
                'category_id' => $mouseCategory?->id,
                'price' => 154000,
                'stock' => 29,
                'status' => 'Active',
                'description' => 'Mouse gaming dengan docking station',
                'image' => 'https://down-id.img.susercontent.com/file/id-11134207-7rasi-m5ds47okj4sm07.webp',
            ],
            [
                'name' => 'Fantech x Kobo Kanaeru Mousepad',
                'sku' => 'PRD-0005',
                'category_id' => $mousepadCategory?->id,
                'price' => 209000,
                'stock' => 22,
                'status' => 'Active',
                'description' => 'Mousepad kolaborasi dengan desain eksklusif',
                'image' => 'https://fantech.id/cdn/shop/files/MAINPIC-DESKMATKOBOFINAL.webp?v=1757398074&width=533',
            ],
            [
                'name' => 'Fantech x Kobo Kanaeru Mouse',
                'sku' => 'PRD-0006',
                'category_id' => $mouseCategory?->id,
                'price' => 249000,
                'stock' => 25,
                'status' => 'Active',
                'description' => 'Mouse eksklusif dari kolaborasi Fantech',
                'image' => 'https://fantech.id/cdn/shop/files/MAINPIC-WG9KOBOHOLOLIVEFINAL.webp?v=1757386512',
            ],
            [
                'name' => 'Fantech x Vestia Zeta Mousepad',
                'sku' => 'PRD-0007',
                'category_id' => $mousepadCategory?->id,
                'price' => 209000,
                'stock' => 28,
                'status' => 'Active',
                'description' => 'Mousepad limited edition kolaborasi Fantech',
                'image' => 'https://fantech.id/cdn/shop/files/MAINPIC-DESKMATZETAFINAL.webp?v=1757393609&width=533',
            ],
            [
                'name' => 'Fantech x Vestia Zeta Mouse',
                'sku' => 'PRD-0008',
                'category_id' => $mouseCategory?->id,
                'price' => 249000,
                'stock' => 31,
                'status' => 'Active',
                'description' => 'Mouse gaming premium dari kolaborasi eksklusif',
                'image' => 'https://fantech.id/cdn/shop/files/MAINPIC-WG9ZETAHOLOLIVEFINAL.webp?v=1757392944',
            ],
            [
                'name' => 'Monitor Xiaomi G24i 2026!, 200Hz FAST IPS FHD',
                'sku' => 'PRD-0009',
                'category_id' => $monitorCategory?->id,
                'price' => 1495000,
                'stock' => 8,
                'status' => 'Low Stock',
                'description' => 'Monitor gaming 200Hz dengan teknologi FAST IPS',
                'image' => 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full/catalog-image/MTA-178490843/xiaomi_monitor_led_xiaomi_g24i_24-_fast_ips_1080p_fhd_180hz_1ms_gtg_hdmi_2-0x1_dp_1-4x1_hdr_calibrated_individually_rapid_response_low_latency_freesync_silky_full02_e1enb7wz.webp',
            ],
            [
                'name' => 'Monitor Xiaomi A24i 2026!, 144Hz FAST IPS FHD',
                'sku' => 'PRD-0010',
                'category_id' => $monitorCategory?->id,
                'price' => 1346000,
                'stock' => 11,
                'status' => 'Active',
                'description' => 'Monitor profesional 144Hz dengan panel IPS',
                'image' => 'https://down-id.img.susercontent.com/file/id-11134207-8224w-mk0fl6pk2jnk94.webp',
            ],
            [
                'name' => 'Kursi Kantor Ergonomic, Nyaman Untuk Kerja Lama',
                'sku' => 'PRD-0011',
                'category_id' => $chairCategory?->id,
                'price' => 484000,
                'stock' => 6,
                'status' => 'Active',
                'description' => 'Kursi ergonomis untuk produktivitas maksimal',
                'image' => 'https://down-id.img.susercontent.com/file/id-11134207-81ztm-mdy3znad8r2df6.webp',
            ],
            [
                'name' => 'Stand Mouse Universal Murah',
                'sku' => 'PRD-0012',
                'category_id' => $accessoriesCategory?->id,
                'price' => 9000,
                'stock' => 30,
                'status' => 'Active',
                'description' => 'Stand mouse universal dengan harga terjangkau',
                'image' => 'https://down-id.img.susercontent.com/file/sg-11134201-7ravq-maz6ojp343tu0c.webp',
            ],
            [
                'name' => 'Stand Laptop Dapat Diputar 360 Derajat',
                'sku' => 'PRD-0013',
                'category_id' => $accessoriesCategory?->id,
                'price' => 129000,
                'stock' => 33,
                'status' => 'Active',
                'description' => 'Stand laptop dengan rotasi 360 derajat',
                'image' => 'https://down-id.img.susercontent.com/file/id-11134207-82251-mh5vdql5ua6l3a.webp',
            ],
            [
                'name' => 'NYK Nemesis Cronus GPX900 Gamepad',
                'sku' => 'PRD-0014',
                'category_id' => $gamepadsCategory?->id,
                'price' => 280000,
                'stock' => 14,
                'status' => 'Active',
                'description' => 'Gamepad gaming dengan fitur advanced',
                'image' => 'https://down-id.img.susercontent.com/file/id-11134207-81zto-me8xh4zhy96v26.webp',
            ],
            [
                'name' => 'FLYDIGI Apex 5 Wireless Gamepad For PC',
                'sku' => 'PRD-0015',
                'category_id' => $gamepadsCategory?->id,
                'price' => 2490000,
                'stock' => 17,
                'status' => 'Active',
                'description' => 'Gamepad wireless profesional untuk PC gaming',
                'image' => 'https://down-id.img.susercontent.com/file/id-11134207-81ztk-meo4vzhy3ymb79.webp',
            ],
            [
                'name' => 'Keycaps Topography Side Print Purple',
                'sku' => 'PRD-0016',
                'category_id' => $accessoriesCategory?->id,
                'price' => 199000,
                'stock' => 36,
                'status' => 'Active',
                'description' => 'Keycaps custom dengan desain topografi ungu',
                'image' => 'https://down-id.img.susercontent.com/file/id-11134207-81ztc-mf7qlksrkhe731.webp',
            ],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(['sku' => $product['sku']], $product);
        }
    }
}
