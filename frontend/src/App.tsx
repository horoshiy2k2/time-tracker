import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import HourProgressCircle from "./components/HourProgressCircle";
import CoinAnimation from "./components/CoinAnimation";
import MonthHeatmap from "./components/MonthHeatmap";
import Inventory from "./components/Inventory";
import Shop from "./components/Shop";

import "./styles/buttons.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import "./styles/shop.css";






const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [editingMinutes, setEditingMinutes] = useState<number>(0);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [page, setPage] = useState<"timer" | "statistic" | "settings" | "shop" | "inventory">("timer");
  const [categories, setCategories] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [running, setRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [statView, setStatView] = useState<"day" | "week" | "month">("day");
  const [editingStartTime, setEditingStartTime] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingTime, setEditingTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [coinAnimations, setCoinAnimations] = useState<{ id: number; amount: number }[]>([]);
  const [nightMode, setNightMode] = useState(false);


  const [theme, setTheme] = useState({
    progressColor: "#646cff",
    textColor: "#333",
    buttonColor: "#646cff",
    backgroundColor: "#fff"
  });

  const CATEGORY_COLORS = [
    "#2563eb", // blue
    "#16a34a", // green
    "#f97316", // orange
    "#e11d48", // pink-red
    "#9333ea", // purple
    "#14b8a6", // teal
    "#f59e0b", // amber
    "#3b82f6", // light blue
    "#84cc16", // lime
    "#ef4444", // red
  ];

  const CHEST_COST: Record<string, number> = {
    COMMON: 2,
    UNCOMMON: 4,
    RARE: 8,
    EPIC: 16,
    LEGENDARY: 32,
  };

 const load = async () => {
    try {
      setLoading(true);

      const [c, s, st, cs, u] = await Promise.all([
        axios.get(API + "/categories"),
        axios.get(API + "/sessions"),
        axios.get(API + "/stats"),
        axios.get(API + "/current-session"),
        axios.get(API + "/user")
      ]);

      setCategories(c.data);
      setSessions(s.data);
      setStats(st.data);
      setCurrentSession(cs.data);
      setCoins(u.data.coins);
      loadTheme();

    } catch (err) {
      console.error("Load failed:", err);
    } finally {
      setLoading(false);
    }
  };


  const loadTheme = async () => {
  try {
    const res = await axios.get(`${API}/user/theme`);
    const themeData = res.data; // берём данные темы из ответа
    setTheme(themeData);

    // Устанавливаем переменную CSS для кнопок
    if (themeData.buttonColor) {
      document.documentElement.style.setProperty(
        "--button-color",
        themeData.buttonColor
      );
    }
  } catch (err) {
    console.error("Failed to load theme:", err);
  }
};


  const deleteCategory = async (id: string) => {
    await axios.delete(API + "/categories/" + id);
    load();
  };


  const updateCategory = async (id: string) => {
    if (!editingName.trim()) return;

    await axios.put(API + "/categories/" + id, {
      name: editingName,
    });

    setEditingId(null);
    setEditingName("");
    load();
  };


  const updateSession = async (id: number) => {
    // создаём дату в GMT+3
    const localDateTime = new Date(`${editingDate}T${editingTime}:00`);

    // переводим обратно в UTC для сохранения
    const utcDate = new Date(localDateTime.getTime() - 3 * 60 * 60 * 1000);

    await axios.put(API + "/sessions/" + id, {
      durationMin: editingMinutes,
      categoryId: editingCategoryId,
      startTime: utcDate.toISOString(),
    });

    setEditingSessionId(null);
    load();
  };


useEffect(() => {
  if (currentSession) {
    // Если идёт текущая сессия, берём её категорию
    setSelectedCategory(currentSession.categoryId || "no-category");
  } else if (sessions.length > 0) {
    // Находим последнюю сессию по startTime
    const lastSession = sessions.reduce((latest, session) => {
      return new Date(session.startTime) > new Date(latest.startTime)
        ? session
        : latest;
    }, sessions[0]);

    setSelectedCategory(lastSession.categoryId || "no-category");
  } else if (categories.length > 0) {
    // Если сессий нет, берём первую категорию
    setSelectedCategory(categories[0].id);
  } else {
    setSelectedCategory("no-category");
  }
}, [categories, sessions, currentSession]);


  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(currentSession.startTime).getTime();

      const diff = Math.floor((now - start) / 1000);
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);


  const start = async () => {
    await axios.post(API + "/current-session/start", {
      categoryId: selectedCategory,
    });

    const cs = await axios.get(API + "/current-session");
    setCurrentSession(cs.data);
  };


  const stop = async () => {
  try {
    const res = await axios.post(API + "/current-session/stop");

    const coinsEarned = res.data.coinsEarned;

    if (coinsEarned > 0) {
      // добавляем анимацию монет
      setCoinAnimations(prev => [...prev, { id: Date.now(), amount: coinsEarned }]);
    }

    setCurrentSession(null);
    setElapsedSeconds(0);

    // обновляем состояние с сервера
    load();
  } catch (err) {
    console.error("Failed to stop session", err);
  }
};


  const createCategory = async () => {
    if (!newCategory.trim()) return;
    await axios.post(API + "/categories", { name: newCategory });
    setNewCategory("");
    load();
  };


  const getCategoryData = (filterFn: (date: Date) => boolean) => {
    const map: Record<string, number> = {};

    sessions.forEach((s) => {
      const date = new Date(s.startTime);
      if (!filterFn(date)) return;

      const name = s.category?.name || "No category";

      if (!map[name]) map[name] = 0;
      map[name] += s.durationSec / 60;
    });

    return Object.keys(map).map((key) => ({
      name: key,
      value: map[key],
    }));
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const categoryColorMap = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        sessions.map((s) => s.category?.name || "No category")
      ),
    ];

    const map: Record<string, string> = {};

    uniqueCategories.slice(0, 10).forEach((name, index) => {
      map[name] = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
    });

    return map;
  }, [sessions]);

  const getCategoryColor = (name: string) => {
    return categoryColorMap[name] || "#9ca3af";
  };

  const getDayHourStackedData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const obj: any = { hour: i };
      Object.keys(categoryColorMap).forEach((cat) => {
        obj[cat] = 0;
      });
      return obj;
    });

    const today = new Date();

    sessions.forEach((s) => {
      const date = new Date(s.startTime);

      if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        const hour = date.getHours();
        const cat = s.category?.name || "No category";

        hours[hour][cat] += Math.round((s.durationSec / 3600) * 100) / 100;
      }
    });

    return hours;
  };

  const getWeekStackedData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const result = days.map((d) => {
      const obj: any = { day: d };
      Object.keys(categoryColorMap).forEach((cat) => {
        obj[cat] = 0;
      });
      return obj;
    });

    const now = new Date();
    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - now.getDay());

    sessions.forEach((s) => {
      const date = new Date(s.startTime);

      if (date >= firstDay) {
        const index = date.getDay();
        const cat = s.category?.name || "No category";

        result[index][cat] += Math.round((s.durationSec / 3600) * 100) / 100;
      }
    });

    return result;
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      // фильтруем только категории с value > 0
      const filtered = payload.filter((p) => p.value && p.value > 0);

      if (filtered.length === 0) return null;

      return (
        <div style={{
          background: "#fff",
          border: "1px solid #ccc",
          padding: "0.5em",
          borderRadius: "6px",
        }}>
          <div><strong>{label}</strong></div>
          {filtered.map((p, idx) => (
            <div key={idx} style={{ color: p.color }}>{p.name}: {p.value.toFixed(2)}h</div>
          ))}
        </div>
      );
    }

    return null;
  };


  const handleSaveSession = async (sessionId: string) => {
    // date: '2026-02-27', time: '23:00' в строках
    const [year, month, day] = editingDate.split("-").map(Number);
    const [hours, minutes] = editingTime.split(":").map(Number);

    // создаём Date в GMT+3
    const moscowDate = new Date(Date.UTC(year, month - 1, day, hours - 3, minutes));

    await axios.put(API + "/sessions/" + sessionId, {
      durationMin: editingMinutes,
      categoryId: editingCategoryId,
      startTime: moscowDate.toISOString(), // в UTC
    });

    load(); // обновляем список
    setEditingSessionId(null);
  };

  const buyChest = async (rarity: string) => {
    try {
      await axios.post(API + "/shop/buy-chest", {
        rarity
      });

      //alert("Chest purchased!");
      load(); // чтобы обновились coins и inventory
      return (200);
    } catch (err: any) {
      return (err.message);
      //alert(err.response?.data?.error || "Purchase failed");
    }
  };


  const updateAll = async (rarity: string) => {
      load(); // чтобы обновились coins и inventory
  };

  const changeCoins = async (amount: number) => {
    try {
      const res = await axios.post(API + "/user/change-coins", { amount });
      setCoins(res.data.coins);
    } catch (err) {
      console.error("Failed to change coins:", err);
    }
  };

  const toggleNightMode = async () => {
    const root = document.documentElement;

    const currentBg = getComputedStyle(root).getPropertyValue("--bg-color").trim();

    if (currentBg === "#ffffff") {
      root.style.setProperty("--bg-color", "#0f1115");
      root.style.setProperty("--text-color", "#e6e6e6");

      await axios.post(API + "/user/paint", {
        target: "night"
      });

    } else {
      root.style.setProperty("--bg-color", "#ffffff");
      root.style.setProperty("--text-color", "#000000");

      await axios.post(API + "/user/paint", {
        target: "reset"
      });
    }

    await loadTheme();

    document.body.classList.toggle("night");
  };

  


useEffect(() => {
  load();
}, []);


useEffect(() => {
  document.documentElement.style.setProperty("--timer-bg", theme.backgroundColor);
  document.documentElement.style.setProperty("--timer-text", theme.textColor);
  document.documentElement.style.setProperty("--timer-button", theme.buttonColor);
}, [theme]);









  return (
    <div style={{ maxWidth: "800px", margin: "2em auto", padding: "2em", background: "var(--bg-color)", borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          marginBottom: "2em",
          paddingBottom: "1em",
          borderBottom: "1px solid #eee"
        }}>
          <NavButton active={page === "timer"} onClick={() => setPage("timer")}>Timer</NavButton>
          <NavButton active={page === "statistic"} onClick={() => setPage("statistic")}>Statistic</NavButton>
          <NavButton active={page === "settings"} onClick={() => setPage("settings")}>Settings</NavButton>
          <NavButton active={page === "shop"} onClick={() => setPage("shop")}>Shop</NavButton>
          <NavButton active={page === "inventory"} onClick={() => setPage("inventory")}>Inventory</NavButton>
        </div>

        {page === "timer" && (
        <>
          <div className="timer-page" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <HourProgressCircle seconds={elapsedSeconds} progressColor={theme.progressColor}/>

              {coinAnimations.map(ca => (
                <CoinAnimation
                  key={ca.id}
                  amount={ca.amount}
                  onFinish={() =>
                    setCoinAnimations(prev => prev.filter(a => a.id !== ca.id))
                  }
                />
              ))}

             <button
                onClick={!currentSession ? start : stop}
                disabled={!currentSession && categories.length === 0}
                className="primary-button"
              >
                {!currentSession ? "Start" : "Stop"}
              </button>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!!currentSession} // блокируем, если есть currentSession
                style={{
                  padding: "0.6em 1em",
                  borderRadius: "12px",
                  border: "1px solid #ccc",
                  fontSize: "1em",
                  marginBottom: "1em",
                  minWidth: "200px",
                  cursor: currentSession ? "not-allowed" : "pointer",
                }}
              >
                {categories.length === 0 && <option value="no-category">No category</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

            </div>
          </>
        )}

        {page === "statistic" && (
          <>
          <div style={{ marginTop: "1em", marginBottom: "2em", display: "flex", justifyContent: "center" }}>
            <button
              className={`stat-button ${statView === "day" ? "active" : ""}`}
              onClick={() => setStatView("day")}
            >
              Day
            </button>

            <button
              className={`stat-button ${statView === "week" ? "active" : ""}`}
              style={{ marginLeft: 8 }}
              onClick={() => setStatView("week")}
            >
              Week
            </button>

            <button
              className={`stat-button ${statView === "month" ? "active" : ""}`}
              style={{ marginLeft: 8 }}
              onClick={() => setStatView("month")}
            >
              Month
            </button>
          </div>

           {statView === "day" && (
              <>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getDayHourStackedData()}>
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                    {Object.keys(categoryColorMap).map((cat) => (
                      <Bar key={cat} dataKey={cat} stackId="a" fill={categoryColorMap[cat]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}

           {statView === "week" && (
              <>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getWeekStackedData()}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                    {Object.keys(categoryColorMap).map((cat) => (
                      <Bar key={cat} dataKey={cat} stackId="a" fill={categoryColorMap[cat]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}

            {statView === "month" && (
              <>
                <div style={{ display: "flex", justifyContent: "center", marginTop: "1em" }}>
                  <MonthHeatmap sessions={sessions} />
                </div>
              </>
            )}


            <h3 style={{ marginTop: "2em" }}>Sessions</h3>

            {sessions.map((s) => (
              <div key={s.id} className="sessionItem">
                {editingSessionId === s.id ? (
                  <>
                    {/* Длительность */}
                    <div style={{ marginBottom: "0.5em" }}>Duration (minutes):</div>
                    <input
                      type="number"
                      min="1"
                      value={editingMinutes}
                      onChange={(e) => setEditingMinutes(Number(e.target.value))}
                      className="sessionInputSmall"                    />

                    {/* Категория */}
                    <div style={{ marginTop: "0.8em", marginBottom: "0.5em" }}>Category:</div>
                    <select
                      value={editingCategoryId || ""}
                      onChange={(e) =>
                        setEditingCategoryId(e.target.value ? e.target.value : null)
                      }
                      className="sessionSelect"
                    >
                      <option value="">No category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    {/* Дата */}
                    <div style={{ marginTop: "0.8em", marginBottom: "0.5em" }}>Date:</div>
                    <input
                      type="date"
                      value={editingDate}
                      onChange={(e) => setEditingDate(e.target.value)}
                      className="sessionInputMedium"
                    />

                    {/* Время */}
                    <div style={{ marginTop: "0.8em", marginBottom: "0.5em" }}>Start Time:</div>
                    <input
                      type="time"
                      value={editingTime}
                      onChange={(e) => setEditingTime(e.target.value)}
                      className="sessionInputSmall"
                    />

                    {/* Сохранение */}
                    <div style={{ marginTop: "0.8em" }}>
                      <button
                        onClick={async () => {
                          // Формируем дату-время GMT+3
                          const [year, month, day] = editingDate.split("-").map(Number);
                          const [hours, minutes] = editingTime.split(":").map(Number);

                          // Переводим в UTC (GMT+3 → UTC)
                          const startTimeUTC = new Date(Date.UTC(year, month - 1, day, hours - 3, minutes));

                          await axios.put(API + "/sessions/" + s.id, {
                            durationMin: editingMinutes,
                            categoryId: editingCategoryId,
                            startTime: startTimeUTC.toISOString(),
                          });

                          load();
                          setEditingSessionId(null);
                        }}
                      >
                        Save
                      </button>

                      <button
                        onClick={() => setEditingSessionId(null)}
                        style={{ marginLeft: "0.5em" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Просмотр сессии */}
                    <div className="sessionHeader">
                      <div>
                        {s.category?.name || "No category"} — {(s.durationSec / 3600).toFixed(2)}h
                      </div>
                      <div className="sessionDate">
                        {/* Выводим в GMT+3 в 24-часовом формате */}
                        {new Date(s.startTime).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                          timeZone: "Europe/Moscow",
                        })}
                      </div>
                    </div>

                    {/* Кнопки */}
                    <div className="sessionButtons">
                      <button
                        onClick={() => {
                          setEditingSessionId(s.id);
                          setEditingMinutes(Math.round(s.durationSec / 60));
                          setEditingCategoryId(s.categoryId || null);

                          const moscowDate = new Date(s.startTime);
                          const moscowIso = moscowDate.toLocaleString("sv-SE", { timeZone: "Europe/Moscow" });
                          const [datePart, timePart] = moscowIso.split(" ");

                          setEditingDate(datePart);
                          setEditingTime(timePart.slice(0, 5)); // hh:mm
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={async () => {
                          await axios.delete(API + "/sessions/" + s.id);
                          load();
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}


        {page === "settings" && (
          <>
            <h2>Manage Categories</h2>
            <input
              className="categoryInput"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button onClick={createCategory}>Add</button>



            <div style={{ marginTop: "1.5em" }}>
              {categories.map((c) => (
                <div key={c.id} className="categoryItem">
                  {editingId === c.id ? (
                    <>
                      <input
                        className="categoryEditInput"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                      <button onClick={() => updateCategory(c.id)}>Save</button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span>{c.name}</span>
                      <div>
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setEditingName(c.name);
                          }}
                          style={{ marginRight: "0.5em" }}
                        >
                          Edit
                        </button>
                        <button onClick={() => deleteCategory(c.id)}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/*<button
              className="shopTestBtn"
              onClick={() => changeCoins(100)}
            >
              +100 coins
            </button>*/}

            <button
              className="shopTestBtn"
              style={{ marginTop: "20px" }}
              onClick={async () => {
                if (!confirm("Are you sure? This will delete all items not in users' inventory!")) return;

                try {
                  const res = await axios.delete(`${API}/inventory/clear-db`);
                  console.log(res.data);
                  alert(res.data.message);
                } catch (err: any) {
                  console.error(err);
                  alert(err.response?.data?.error || "Failed to clear DB");
                }
              }}
            >
              Clear Inventory DB
            </button>

           <button
            style={{ marginLeft: "1em" }}
            onClick={() => toggleNightMode()}
          >
            🌑 Toggle Night Mode 
          </button>

            <button
              style={{ marginLeft: "1em" }}
              onClick={async () => {

                await axios.post(`${API}/user/paint`, {
                  target: "reset"
                });

                await loadTheme();

              }}
            >
              🎨 Reset Theme
            </button>

          </>
        )}


        {page === "shop" && (
          <Shop
            coins={coins}
            changeCoins={changeCoins}
            buyChest={buyChest}
          />
        )}



        {/* ---------- Coins Display ---------- */}
        <div className="coinsDisplay">
          {coins}🪙
        </div>

        {page === "inventory" && <Inventory updateAll={updateAll}/>}


      </div>
  </div>
    );
}




function NavButton({ children, onClick, active }: any) {
  return (
    <button
      onClick={onClick}
      className="menu-button"
      style={{
        background: active ? "#646cff" : "#f3f3f3",
        color: active ? "#fff" : "#333",
        boxShadow: active
          ? "0 8px 20px rgba(100,108,255,0.35)"
          : "0 4px 10px rgba(0,0,0,0.05)",
      }}
    >
      {children}
    </button>
  );
}

