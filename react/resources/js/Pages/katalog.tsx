import { Search, ShoppingCart, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar-trigger';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/layouts/app/context/CartContext';
import { useCatalog } from '@/layouts/app/context/CatalogContext';
import RootLayout from '@/layouts/app/RootLayouts';
import { catalogCategories, type CatalogProduct } from '@/lib/catalog';

const categoryLabelById = catalogCategories.reduce<Record<string, string>>(
    (acc, category) => {
        acc[category.id] = category.name;
        return acc;
    },
    {},
);

export default function KatalogPage() {
    return (
        <RootLayout>
            <KatalogContent />
        </RootLayout>
    );
}

function KatalogContent() {
    const { products } = useCatalog();
    const { items, addToCart } = useCart();
    const { toast } = useToast();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState('');

    const getDiscountPercentage = (discount?: number) => {
        if (!Number.isFinite(discount)) return 0;
        return Math.min(100, Math.max(0, Number(discount)));
    };

    const getDiscountedPrice = (product: CatalogProduct) => {
        const discountPercentage = getDiscountPercentage(product.discount);
        const discountedPrice =
            product.price - (product.price * discountPercentage) / 100;
        return Math.max(0, Math.round(discountedPrice));
    };

    const formatDiscount = (discount?: number) => {
        const safeDiscount = getDiscountPercentage(discount);
        return `${safeDiscount.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;
    };

    const getCartQuantity = (productId: number) => {
        const existing = items.find((item) => item.id === productId);
        return existing?.quantity ?? 0;
    };

    const handleAddToCart = (product: CatalogProduct) => {
        if (product.stock <= 0) {
            toast({
                title: 'Stok habis',
                description: `${product.name} sedang tidak tersedia`,
                variant: 'destructive',
                duration: 1500,
            });
            return;
        }

        const currentQuantity = getCartQuantity(product.id);
        if (currentQuantity >= product.stock) {
            toast({
                title: 'Stok tidak cukup',
                description: `Maksimal ${product.stock} unit untuk ${product.name}`,
                variant: 'destructive',
                duration: 1500,
            });
            return;
        }

        addToCart({
            id: product.id,
            name: product.name,
            price: getDiscountedPrice(product),
            image: product.image,
            sku: product.sku,
        });

        toast({
            title: 'Berhasil',
            description: `${product.name} masuk ke keranjang`,
            duration: 1500,
        });
    };

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const searchedProducts = useMemo(() => {
        if (!normalizedSearchQuery) return products;

        return products.filter((product) => {
            const categoryName =
                categoryLabelById[product.category] ?? product.category;
            const searchableText =
                `${product.name} ${product.sku} ${categoryName}`.toLowerCase();
            return searchableText.includes(normalizedSearchQuery);
        });
    }, [products, normalizedSearchQuery]);

    const categoryCounts = useMemo(
        () =>
            searchedProducts.reduce<Record<string, number>>((acc, product) => {
                acc[product.category] = (acc[product.category] ?? 0) + 1;
                return acc;
            }, {}),
        [searchedProducts],
    );

    const filteredProducts = useMemo(() => {
        if (!selectedCategory) return searchedProducts;
        return searchedProducts.filter(
            (product) => product.category === selectedCategory,
        );
    }, [selectedCategory, searchedProducts]);

    const searchBaseCount = normalizedSearchQuery
        ? searchedProducts.length
        : products.length;

    return (
        <>
            <header className="flex h-16 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <Separator orientation="vertical" className="h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">
                                Dashboard
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/katalog">
                                Katalog
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="p-6">
                <h1 className="mb-8 text-3xl font-bold">Katalog Produk </h1>

                <div className="mb-8 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold">Cari Produk</h2>
                        <p className="text-sm text-muted-foreground">
                            Menampilkan {filteredProducts.length} dari{' '}
                            {searchBaseCount} produk
                        </p>
                    </div>

                    <div className="relative max-w-xl">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="Cari nama produk, SKU, atau kategori..."
                            className="pr-10 pl-10"
                        />
                        {searchQuery.trim() ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="absolute top-1/2 right-1 -translate-y-1/2"
                                onClick={() => setSearchQuery('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="mb-4 text-lg font-semibold">
                        Kategori Produk
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant={
                                selectedCategory === null
                                    ? 'default'
                                    : 'outline'
                            }
                            onClick={() => setSelectedCategory(null)}
                            className="gap-2"
                        >
                            Semua Produk ({searchedProducts.length})
                        </Button>

                        {catalogCategories.map((category) => {
                            const Icon = category.icon;
                            const count = categoryCounts[category.id] ?? 0;
                            return (
                                <Button
                                    key={category.id}
                                    variant={
                                        selectedCategory === category.id
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() =>
                                        setSelectedCategory(category.id)
                                    }
                                    className={`gap-2 ${selectedCategory === category.id ? '' : category.color}`}
                                >
                                    <Icon className="h-5 w-5" />
                                    {category.name} ({count})
                                </Button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProducts.map((product) => {
                        const cartQuantity = getCartQuantity(product.id);
                        const isOutOfStock = product.stock <= 0;
                        const isMaxInCart =
                            !isOutOfStock && cartQuantity >= product.stock;
                        const discountedPrice = getDiscountedPrice(product);
                        const hasDiscount =
                            getDiscountPercentage(product.discount) > 0;

                        return (
                            <Card
                                key={product.id}
                                className="overflow-hidden transition-shadow hover:shadow-lg"
                            >
                                <div className="relative aspect-square w-full overflow-hidden bg-gray-200">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>

                                <CardHeader>
                                    <CardTitle className="line-clamp-2">
                                        {product.name}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <p className="text-lg font-semibold text-green-600">
                                        Rp{' '}
                                        {discountedPrice.toLocaleString(
                                            'id-ID',
                                        )}
                                    </p>
                                    {hasDiscount && (
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground line-through">
                                                Rp{' '}
                                                {product.price.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </p>
                                            <p className="text-xs font-medium text-orange-600">
                                                Diskon{' '}
                                                {formatDiscount(
                                                    product.discount,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Stok: {product.stock} unit
                                    </p>

                                    <Button
                                        className="w-full"
                                        onClick={() => handleAddToCart(product)}
                                        disabled={isOutOfStock || isMaxInCart}
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        {isOutOfStock
                                            ? 'Stok Habis'
                                            : isMaxInCart
                                              ? 'Batas Stok di Keranjang'
                                              : 'Tambah ke Keranjang'}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-lg text-muted-foreground">
                            {searchQuery.trim()
                                ? `Tidak ditemukan produk untuk "${searchQuery.trim()}"`
                                : 'Tidak ada produk dalam kategori ini'}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
