// CoinAnimation.tsx
import React, { useEffect, useState } from "react";

interface Props {
  amount: number;
  onFinish?: () => void;
}

export default function CoinAnimation({ amount, onFinish }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 1000); // анимация 1 секунда
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "10%",
        right: "10%",
        fontSize: "2em",
        color: amount >= 0 ? "#FFD700" : "#ff4d4f",
        fontWeight: "bold",
        animation: "coinFloat 1s ease-out forwards",
        pointerEvents: "none",
        zIndex: 2000,
      }}
    >
      
      {amount > 0 ? `+${amount}` : amount} 🪙
    </div>
  );
}