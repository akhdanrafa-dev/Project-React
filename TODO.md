# TODO: Add Stock Quantity to Catalog Page

## Tasks
- [x] Add stock display to product cards in katalog.tsx, matching developer-integration.tsx format
- [x] Change CardContent className from space-y-4 to space-y-3 for consistency
- [x] Verify stock values match database (from catalog.ts)

## Files to Edit
- react/resources/js/Pages/katalog.tsx

## Notes
- Stock display format: `<p className="text-xs text-muted-foreground">Stok: {product.stock} unit</p>`
- Position the stock text between price and "Tambah ke Keranjang" button
- Stock values are correctly sourced from CatalogContext which uses initialCatalogProducts from catalog.ts
