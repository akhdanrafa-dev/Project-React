<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Mouse',
                'slug' => 'mouse',
                'description' => 'Mouse dan aksesori mouse',
            ],
            [
                'name' => 'Keyboard',
                'slug' => 'keyboard',
                'description' => 'Keyboard dan aksesori keyboard',
            ],
            [
                'name' => 'Monitor',
                'slug' => 'monitor',
                'description' => 'Monitor dan aksesori monitor',
            ],
            [
                'name' => 'Meja',
                'slug' => 'meja',
                'description' => 'Meja kerja dan aksesori meja',
            ],
            [
                'name' => 'Kursi',
                'slug' => 'kursi',
                'description' => 'Kursi gaming dan kursi kerja',
            ],
            [
                'name' => 'Mousepad',
                'slug' => 'mousepad',
                'description' => 'Mousepad dengan berbagai ukuran',
            ],
            [
                'name' => 'Deskmat',
                'slug' => 'deskmat',
                'description' => 'Deskmat untuk melindungi meja kerja',
            ],
            [
                'name' => 'Docking Station',
                'slug' => 'docking-station',
                'description' => 'Docking station dan USB hub',
            ],
            [
                'name' => 'Holder & Stand',
                'slug' => 'holder-stand',
                'description' => 'Holder monitor, laptop, dan stand aksesori',
            ],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
