import React, { useState } from "react";
import axios from "axios";
import "../styles/mixColorPopup.css";

export enum Rarity {
  COMMON = "COMMON",
  UNCOMMON = "UNCOMMON",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY"
}

export enum ItemType {
  CHEST = "CHEST",
  COLOR_DROP = "COLOR_DROP",
  COLOR = "COLOR"
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  rarity: Rarity;
  type: ItemType;
  r?: number;
  g?: number;
  b?: number;
  isInInventory: boolean;
}

interface Props {
  items: InventoryItem[];
  onClose: () => void;
  onCreateColor: (newColor: InventoryItem, usedDrops: InventoryItem[]) => void;
  apiUrl: string;
}

export default function MixColorPopup({
  items,
  apiUrl,
  onClose,
  onCreateColor
}: Props) {

  const [selectedDrops, setSelectedDrops] = useState<(InventoryItem | null)[]>([
    null,
    null,
    null
  ]);

  const [newColor, setNewColor] = useState<InventoryItem | null>(null);

  const colorDrops = items.filter(i => i.type === ItemType.COLOR_DROP);

  const isSelected = (drop: InventoryItem) =>
    selectedDrops.some(d => d?.id === drop.id);

  const toggleDrop = (drop: InventoryItem) => {

    const index = selectedDrops.findIndex(d => d?.id === drop.id);

    if (index !== -1) {
      const arr = [...selectedDrops];
      arr[index] = null;
      setSelectedDrops(arr);
      return;
    }

    const emptyIndex = selectedDrops.findIndex(d => !d);

    if (emptyIndex !== -1) {
      const arr = [...selectedDrops];
      arr[emptyIndex] = drop;
      setSelectedDrops(arr);
    }
  };

  const previewColor = selectedDrops.reduce(
    (acc, drop) => {

      if (!drop) return acc;

      acc.r = Math.min(acc.r + (drop.r || 0), 255);
      acc.g = Math.min(acc.g + (drop.g || 0), 255);
      acc.b = Math.min(acc.b + (drop.b || 0), 255);

      return acc;

    },
    { r: 0, g: 0, b: 0 }
  );

  const handleCreateColor = async () => {
    const drops = selectedDrops.filter(Boolean) as InventoryItem[];
    if (drops.length !== 3) {
      alert("Place 3 color drops first");
      return;
    }

    try {
      const res = await axios.post(`${apiUrl}/inventory/color/mix`, {
        dropIds: drops.map(d => d.id),
      });

      const created: InventoryItem = res.data;

      // приводим rarity к нижнему регистру для стилей
      const newColorWithStyle = { ...created, rarity: created.rarity.toLowerCase() };

      setNewColor(newColorWithStyle);
      onCreateColor(created, drops);

      setSelectedDrops([null, null, null]);
    } catch (err: any) {
      console.error("Mix failed", err.response?.data || err.message);
      alert("Mix failed");
    }
  };

  const renderEmoji = (item:any)=>{

    if(item.type === ItemType.CHEST){
      return <div className="mixEmoji">📦</div>;
    }

    if(item.type === ItemType.COLOR_DROP){

      const color = `rgb(${item.r||0},${item.g||0},${item.b||0})`;

      return(
        <svg className="mixDropIcon" viewBox="0 0 24 24">
          <path
            d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z"
            fill={color}
          />
        </svg>
      );
    }

    return null;

  };

  return (
    <>
      <div className="lootOverlay" onClick={onClose}>

        <div className="lootCard" onClick={e => e.stopPropagation()}>

          <h2>Available Color Drops</h2>

          <div className="mixLayout">

            {/* LEFT — drops */}

            <div className="mixGrid">

              {colorDrops.map(drop => (

                <div
                  key={drop.id}
                  className={`mixItem ${drop.rarity.toLowerCase()} ${
                    isSelected(drop) ? "mixDisabled" : ""
                  }`}
                  onClick={() => toggleDrop(drop)}
                >

                  {renderEmoji(drop)}

                </div>

              ))}

            </div>


            {/* RIGHT PANEL */}

            <div className="mixRightPanel">

              <div>

                <h3>Selected</h3>

                <div className="mixSlots">

                  {selectedDrops.map((drop, i) => (

                    <div
                      key={i}
                      className={`mixItem ${drop?.rarity?.toLowerCase() || ""}`}
                      onClick={() => drop && toggleDrop(drop)}
                    >

                      {drop ? renderEmoji(drop) : "+"}

                    </div>

                  ))}

                </div>

              </div>


              <div>

                <h3>Preview Color</h3>

                <div className="mixPreview">

                  <div
                    className="mixColorBlock"
                    style={{
                      backgroundColor:`rgb(${previewColor.r},${previewColor.g},${previewColor.b})`
                    }}
                  />

                </div>

              </div>


              <button
                className="mixButton"
                onClick={handleCreateColor}
              >
                Create Color
              </button>

            </div>

          </div>

        </div>

      </div>


      {/*{newColor && (
        <div
          className="lootOverlay"
          onClick={() => setNewColor(null)}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.25)",
            zIndex: 9999, // точно выше всех
          }}
        >
          <div
            className="lootCard"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "400px",
              textAlign: "center",
              padding: "30px",
            }}
          >
            <h2>New Color Created!</h2>

            <div
              className={`mixItem ${newColor.rarity.toLowerCase()}`}
              style={{ margin: "0 auto", width: 120, height: 120 }}
            >
              <div
                className="mixColorBlock"
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: `rgb(${newColor.r},${newColor.g},${newColor.b})`,
                }}
              />
            </div>

            <div
              className="lootRarity"
              style={{ marginTop: "8px", fontWeight: 700 }}
            >
              {newColor.rarity.toUpperCase()} - Cost: {newColor.cost}
            </div>
          </div>
        </div>
      )}*/}

    </>



    
  );
}