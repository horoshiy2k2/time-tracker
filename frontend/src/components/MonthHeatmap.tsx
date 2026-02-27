import React, { useState } from "react";

interface Props {
  sessions: any[];
}

interface HoverData {
  hours: number;
  day: number;
  x: number;
  y: number;
}

const MonthHeatmap: React.FC<Props> = ({ sessions }) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday

  const data: { day: number; hours: number }[] = [];

  for (let i = 0; i < firstDayWeekday; i++) {
    data.push({ day: 0, hours: 0 });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    data.push({ day: i, hours: 0 });
  }

  sessions.forEach((s) => {
    const date = new Date(s.startTime);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const dayIndex = firstDayWeekday + date.getDate() - 1;
      data[dayIndex].hours += s.durationSec / 3600;
    }
  });

  const max = Math.max(...data.map((d) => d.hours), 1);

  const [hover, setHover] = useState<HoverData | null>(null);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 75px)",
          gap: "10px",
          marginTop: "1em",
        }}
      >
        {data.map((d, index) => {
          if (d.day === 0) {
            return <div key={index} style={{ width: "65px", height: "65px" }} />;
          }

          const intensity = d.hours / max;
          const background =
            intensity === 0
              ? "#ebedf0"
              : `rgba(34,197,94,${0.2 + intensity * 0.8})`;

          return (
            <div
              key={index}
              style={{
                width: "70px",
                height: "70px",
                background,
                borderRadius: "6px",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: intensity > 0.6 ? "white" : "#374151",
                cursor: "pointer",
                transition: "all 0.25s ease", // плавный переход
              }}
              onMouseEnter={(e) =>
                setHover({
                  day: d.day,
                  hours: d.hours,
                  x: e.clientX,
                  y: e.clientY,
                })
              }
              onMouseMove={(e) =>
                setHover((prev) =>
                  prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                )
              }
              onMouseLeave={() => setHover(null)}
              // hover эффект через inline style с JS
              onMouseOver={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                target.style.transform = "scale(1.15)";
                target.style.boxShadow = "0 6px 15px rgba(34,197,94,0.5)";
              }}
              onMouseOut={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                target.style.transform = "scale(1)";
                target.style.boxShadow = "none";
              }}
            >
              {d.day}
            </div>
          );
        })}
      </div>

      {hover && (
        <div
          style={{
            position: "fixed",
            left: hover.x + 10,
            top: hover.y + 10,
            background: "#fff",
            border: "1px solid #ccc",
            padding: "0.5em",
            borderRadius: "6px",
            pointerEvents: "none",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 1000,
            whiteSpace: "nowrap",
          }}
        >
          <div>
            <strong>Day: {hover.day}</strong>
          </div>
          <div>{hover.hours.toFixed(2)}h</div>
        </div>
      )}
    </div>
  );
};

export default MonthHeatmap;