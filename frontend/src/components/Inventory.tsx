import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/inventory.css";
import CoinAnimation from "./CoinAnimation";
import MixColorPopup from "./MixColorPopup"; // путь поправь по своей структуре

const API = import.meta.env.VITE_API_URL;

export default function Inventory({updateAll}: any) {

  const [items,setItems] = useState<any[]>([]);
  const [selected,setSelected] = useState<any|null>(null);

  const [loot,setLoot] = useState<any[]>([]);
  const [lootIndex,setLootIndex] = useState(0);
  const [showLoot,setShowLoot] = useState(false);

  const [opening, setOpening] = useState(false);
  const [exploding, setExploding] = useState(false);
  const [coinAnimAmount, setCoinAnimAmount] = useState<number | null>(null);
  const [showMixPopup, setShowMixPopup] = useState(false);

  /* ---------- LOAD INVENTORY ---------- */

  const loadInventory = async () => {
    try {
      const res = await axios.get(API + "/inventory");
      const data = res.data;

      const merged = [
        ...(data.chests || []).map((i:any)=>({...i,itemType:"chest"})),
        ...(data.colorDrops || []).map((i:any)=>({...i,itemType:"colorDrop"})),
        ...(data.colors || []).map((i:any)=>({...i,itemType:"color"})),
      ];

      setItems(merged);

      // Выбираем первый элемент сразу после загрузки
      if (merged.length > 0) {
        setSelected(merged[0]);
      } else {
        setSelected(null);
      }

      return merged;

    } catch(err) {
      console.error("Inventory load failed",err);
      return [];
    }
  };

  useEffect(()=>{
    loadInventory();
  },[]);

  /* ---------- OPEN CHEST ---------- */

  const useItem = async (id:string)=>{

    setOpening(true);

    setTimeout(()=>{
      setExploding(true);
    },600);

    const res=await axios.post(API+"/inventory/chest/open/"+id);

    setTimeout(()=>{

      setLoot(res.data.rewards || []);
      setLootIndex(0);

      setShowLoot(true);

      setOpening(false);
      setExploding(false);

    },1000);

    setSelected(null);

    await loadInventory();
  };

  /* ---------- NEXT LOOT ---------- */

  const nextLoot = ()=>{

    setLootIndex(prev => prev + 1);

  };

  /* ---------- CLOSE LOOT ---------- */

  const closeLoot = async ()=>{

    setShowLoot(false);
    setLoot([]);
    setLootIndex(0);

    await loadInventory();

  };

  const sellItem = async (item: InventoryItemType) => {
    if (!item) return;

    const sellValue = Math.floor(item.cost * 0.5);

    try {
      const res = await axios.post(`${API}/inventory/sell-item/${item.id}`, { sellValue });
      console.log("Item sold:", res.data);

      setCoinAnimAmount(sellValue); // 🔥 показать +монеты

      updateAll(); // обновляем состояние приложения

      await loadInventory(); // обновляем инвентарь
    } catch (err: any) {
      console.error("Sell failed", err.response?.data || err.message);
    }
  };


  // Функция продажи всего
  const sellAllItems = async () => {
    if (!items || items.length === 0) return;

    let totalCoins = 0;

    // Перебираем каждый элемент и вызываем sellItem
    for (const item of items) {
      if (!item || item.cost <= 0) continue;

      const sellValue = Math.floor(item.cost * 0.5);
      try {
        await sellItem(item); // sellItem уже обновляет инвентарь и показывает анимацию
        totalCoins += sellValue;
      } catch (err: any) {
        console.error("Failed to sell item", item.id, err);
      }
    }

    // Показываем суммарную анимацию монет
    if (totalCoins > 0) {
      setCoinAnimAmount(totalCoins);
    }

    // Перезагружаем инвентарь
    await loadInventory();
  };

  /* ---------- ICON RENDER ---------- */

  const renderEmoji = (item:any)=>{

    if(item.itemType === "chest"){
      return <div className="inventoryEmoji">📦</div>;
    }

    if(item.itemType === "colorDrop"){

      const color = `rgb(${item.r||0},${item.g||0},${item.b||0})`;

      return(
        <svg className="dropIcon" viewBox="0 0 24 24">
          <path
            d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"
            fill={color}  
          />
        </svg>
      );
    }

    if(item.itemType === "color") {
      const color = `rgb(${item.r || 0}, ${item.g || 0}, ${item.b || 0})`;

      return (
        <div
          className="colorBlob"
          style={{
            backgroundColor: color,
            // width: "60px",
            // height: "60px",
            borderRadius: "8px", // сглаженные края
            // display: "inline-block"
          }}
        />
      );
    }

    return null;

  };

  /* ---------- RGB INFO ---------- */

  const renderRGB = (item:any)=>{

    const r=item.r||0;
    const g=item.g||0;
    const b=item.b||0;

    if(!r && !g && !b) return null;

    return(
      <p>
        {r>0 && ` R:${r}`}
        {g>0 && ` G:${g}`}
        {b>0 && ` B:${b}`}
      </p>
    );

  };

  return(

    <div className="inventoryContainer">

      {/* ---------- GRID ---------- */}

      <div className="inventoryGrid">

        {items.map(item=>(
          <div
            key={item.id}
            className={`inventoryItem ${item.rarity?.toLowerCase() || ""} ${
              selected?.id === item.id ? "selected" : ""
            }`}
            onClick={()=>setSelected(item)}
          >

            {renderEmoji(item)}

            <div className="inventoryName">
              {item.name}
            </div>

          </div>
        ))}

      </div>

      {/* ---------- RIGHT PANEL ---------- */}

      <div className="inventoryDetail">

        {!selected && (
          <div className="inventoryPlaceholder">
            Select item
          </div>
        )}

        {selected && (
          <>

            <div>

              <h3>{selected.name}</h3>

              <p>
                <strong>Rarity:</strong> {selected.rarity}
              </p>

              {selected.cost > 0 && (
                <p>
                  <strong>Cost:</strong> {selected.cost} 🪙
                </p>
              )}

              <p>{selected.description}</p>

              {renderRGB(selected)}

              {selected.itemType === "chest" && (
                <button
                  className="openChestBtn"
                  onClick={() => useItem(selected.id)}
                >
                  Open Chest
                </button>
              )}

              {selected.type === "COLOR" && (
                <div className="paintButtons">
                  {["progress", "text", "buttons", "background"].map((target) => (
                    <button
                      key={target}
                      onClick={async () => {
                        await axios.post(`${API}/user/paint`, {
                          colorId: selected.id,
                          target
                        });
                        updateAll(); // обновляем цвета после применения
                      }}
                    >
                      {`Paint ${target[0].toUpperCase() + target.slice(1)}`}
                    </button>
                  ))}
                </div>
              )}



              {selected.type === "COLOR_DROP" && (
                  <button
                    className="openChestBtn"
                    onClick={() => setShowMixPopup(true)}
                  >
                    Mix
                  </button>
              )}


              
              {/* ---------- SELL BUTTONS ---------- */}
                {/* Продажа выбранного предмета */}
                {selected && selected.cost >= 0 && (
                  <button className="sellItemBtn" onClick={() => sellItem(selected)}>
                    Sell: {Math.floor(selected.cost * 0.5)}🪙
                  </button>
                )}

                

                {/* Продать всё */}
                {items.length > 0 && (
                  <button
                    className="sellItemBtn"
                    onClick={sellAllItems}
                    style={{ marginLeft: "10px" }}
                  >
                    Sell All 🪙
                  </button>
                )}

                
            </div>

          </>
        )}

      </div>


      {/* ---------- COIN ANIMATION ---------- */}

      {coinAnimAmount !== null && (
        <CoinAnimation
          amount={coinAnimAmount}
          onFinish={() => setCoinAnimAmount(null)}
        />
      )}

      {showMixPopup && selected?.type === "COLOR_DROP" && (
      <MixColorPopup
        items={items}
        apiUrl={API} // вот здесь
        onClose={() => setShowMixPopup(false)}
        onCreateColor={(newColor, usedDrops) => {
          console.log("Created color:", newColor, "Used drops:", usedDrops);
          loadInventory(); // обновляем инвентарь
        }}
      />
    )}







      {/* ---------- LOOT POPUP ---------- */}

      {opening && (

        <div className="lootOverlay">

        <div className="lootCard">

        {!exploding && (

        <div className="chestShake">
        📦
        </div>

        )}

        {exploding && (

        <div className="explosion">
        💥
        </div>

        )}

        <h2>Opening chest...</h2>

        </div>

        </div>

        )}

      {showLoot && (

        <div
        className="lootOverlay"
        onClick={closeLoot}
        >

        <div
        className="lootClose"
        onClick={closeLoot}
        >
        {/*✖*/}
        </div>

        {lootIndex < loot.length ? (
          <div
            className={`lootCard ${loot[lootIndex].rarity?.toLowerCase()}`}
            onClick={(e) => {
              e.stopPropagation();
              nextLoot();
            }}
          >
            <div className="lootEmoji">{renderEmoji(loot[lootIndex])}</div>

            <h2>{loot[lootIndex].name}</h2>

            <div className="lootRarity">{loot[lootIndex].rarity}</div>

            {renderRGB(loot[lootIndex])}

            Cost: {loot[lootIndex].cost}🪙
          </div>
        ) : (
          <div className="lootCard" onClick={(e) => e.stopPropagation()}>
            <h2>Chest opened</h2>

            <div className="lootGrid">
              {loot.map((item: any) => (
                <div
                  key={item.id}
                  className={`inventoryItem ${item.rarity?.toLowerCase()}`}
                >
                  {renderEmoji(item)}

                  <div className="inventoryName">
                    {item.name}
                    <br />
                    {item.cost}🪙
                  </div>
                </div>
              ))}
            </div>

            {/* ---------- TOTAL COST ---------- */}
            <div className="lootTotalCost" style={{ marginTop: "12px", fontWeight: "bold" }}>
              Total: {loot.reduce((sum: number, item: any) => sum + (item.cost || 0), 0)}🪙
            </div>
          </div>
        )}






        </div>

        )}

    </div>

  );

}


