"use client";

import { useState, useEffect } from "react";

interface ShopItem {
  id: string;
  gameItemId: string;
  itemName: string;
  creditCost: number;
  quantity: number;
  description: string | null;
}

interface CartItem extends ShopItem {
  cartQty: number;
}

export default function CreatorShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/shop").then(r => r.json()),
      fetch("/api/wallet").then(r => r.json()),
    ]).then(([i, w]) => {
      setItems(i);
      setWalletBalance(w.balance || 0);
    }).finally(() => setLoading(false));
  }, []);

  function addToCart(item: ShopItem) {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (item.quantity !== -1 && existing.cartQty >= item.quantity) return prev;
        return prev.map(i => i.id === item.id ? { ...i, cartQty: i.cartQty + 1 } : i);
      }
      return [...prev, { ...item, cartQty: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.cartQty > 1) {
        return prev.map(i => i.id === itemId ? { ...i, cartQty: i.cartQty - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.creditCost * i.cartQty, 0);

  async function handleRedeem() {
    setRedeeming(true);
    setMessage("");
    const res = await fetch("/api/shop/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map(i => ({ shopItemId: i.id, quantity: i.cartQty })),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`✅ Order placed! Total: ${data.totalCreditCost} credits. Status: ${data.status}`);
      setCart([]);
      setWalletBalance(prev => prev - data.totalCreditCost);
    } else {
      setMessage(`❌ ${data.error}`);
    }
    setRedeeming(false);
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reward Shop</h2>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium">
          Balance: {walletBalance.toLocaleString()} credits
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.startsWith("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900">{item.itemName}</h3>
                {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-indigo-600">{item.creditCost.toLocaleString()} credits</span>
                  <span className="text-xs text-gray-400">{item.quantity === -1 ? "Unlimited" : `${item.quantity} left`}</span>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  disabled={item.quantity === 0}
                  className="w-full mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-fit">
          <h3 className="font-semibold text-gray-900 mb-3">🛒 Cart</h3>
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400">Your cart is empty.</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-xs text-gray-500">{item.creditCost} credits × {item.cartQty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.creditCost * item.cartQty}</span>
                      <button onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 text-xs">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold text-sm mb-3">
                  <span>Total</span>
                  <span>{cartTotal.toLocaleString()} credits</span>
                </div>
                <button
                  onClick={handleRedeem}
                  disabled={redeeming || cartTotal > walletBalance || cartTotal === 0}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cartTotal > walletBalance ? `Need ${(cartTotal - walletBalance).toLocaleString()} more credits` :
                   redeeming ? "Redeeming..." : "Redeem Now"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
