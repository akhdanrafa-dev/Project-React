"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/layouts/app/context/CartContext"

export default function KeranjangContent() {
  const { cartItems, removeFromCart, clearCart } = useCart()
  const totalHarga = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <div className="p-6 space-y-4">
      {cartItems.length === 0 ? (
        <div className="text-center text-muted-foreground">Keranjang masih kosong 🛒</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Keranjang Belanja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × Rp {item.price.toLocaleString()}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => removeFromCart(item.id)}>
                  Hapus
                </Button>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>Rp {totalHarga.toLocaleString()}</span>
            </div>
            <Button className="w-full" onClick={clearCart}>
              Checkout
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
