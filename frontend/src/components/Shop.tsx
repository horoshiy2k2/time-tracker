import { useState } from "react";
import axios from "axios";
import "../styles/shop.css";
import CoinAnimation from "./CoinAnimation";

const API = import.meta.env.VITE_API_URL;

const CHEST_COST: Record<string, number> = {
  COMMON: 10,
  UNCOMMON: 25,
  RARE: 50,
  EPIC: 100,
  LEGENDARY: 200,
};

export default function Shop({ coins, changeCoins, buyChest }: any) {

  const [notifications, setNotifications] = useState<any[]>([]);
  const [coinAnimAmount, setCoinAnimAmount] = useState<number | null>(null);

  const addNotification = (text: string) => {
    const id = Date.now() + Math.random();

    const newNotif = { id, text };

    setNotifications(prev => [...prev, newNotif]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const chests = [
    { rarity: "COMMON", name: "Common Chest", class: "common" },
    { rarity: "UNCOMMON", name: "Uncommon Chest", class: "uncommon" },
    { rarity: "RARE", name: "Rare Chest", class: "rare" },
    { rarity: "EPIC", name: "Epic Chest", class: "epic" },
    { rarity: "LEGENDARY", name: "Legendary Chest", class: "legendary" },
  ];

  const handleBuy = async (rarity: string) => {
    const result = await buyChest(rarity);

    if (result == 200) {
      // покупка прошла успешно
      const cost = CHEST_COST[rarity];
      setCoinAnimAmount(-cost);
      addNotification(`${rarity} chest purchased`);
     
     } else {
      // покупка не удалась
      // addNotification(result || `Failed to buy ${rarity} chest`);
      addNotification('Not enough 🪙');
    }
  };

  return (
    <div className="shopContainer">

      <div className="shopGrid">
        {chests.map((c) => (
          <div
            key={c.rarity}
            className={`shopItem ${c.class}`}
            onClick={() => handleBuy(c.rarity)}
          >
            <div className="shopEmoji">📦</div>
            <div className="shopName">{c.name}</div>
            <div className="shopCost">{CHEST_COST[c.rarity]} 🪙</div>
          </div>
        ))}
      </div>


      {/* ---------- COIN ANIMATION ---------- */}

      {coinAnimAmount !== null && (
        <CoinAnimation
          amount={coinAnimAmount}
          onFinish={() => setCoinAnimAmount(null)}
        />
      )}


      {/* уведомления */}
      <div className="notifContainer">
        {notifications.map(n => (
          <div key={n.id} className="notif">
            {n.text}
            <button
              className="notifClose"
              onClick={() =>
                setNotifications(prev => prev.filter(x => x.id !== n.id))
              }
            >
              ✕
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}