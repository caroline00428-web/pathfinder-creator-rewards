"use client";

import { formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n/LanguageContext";
import { useState, useEffect } from "react";

interface Order {
  id: string;
  totalCreditCost: number;
  status: string;
  playerId: string;
  createdAt: string;
  items: Array<{ gameItemId: string; itemName: string; quantity: number; creditCost: number }>;
}

export default function CreatorOrdersPage() {
  const { t } = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then(r => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("orders.title")}</h2>
      {loading ? <p className="text-gray-500">{t("general.loading")}</p> : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">{t("orders.empty")}</p>
          <a href="/creator/shop" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">{t("shop.browseShop")} →</a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-gray-400">Order #{o.id.slice(-8)}</span>
                  <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${
                    o.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    o.status === "EXPORTED" ? "bg-purple-100 text-purple-800" :
                    o.status === "SENT" ? "bg-blue-100 text-blue-800" :
                    "bg-green-100 text-gray-800"
                  }`}>{t(`order.${o.status.toLowerCase()}`)}</span>
                </div>
                <span className="font-medium text-gray-900">{o.totalCreditCost.toLocaleString()} credits</span>
              </div>
              <div className="space-y-1">
                {o.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{item.itemName} x {item.quantity}</span>
                    <span className="text-gray-500">{item.creditCost} credits each</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {t("orders.playerId")}: <span className="font-mono">{o.playerId}</span> · {formatDate(o.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
