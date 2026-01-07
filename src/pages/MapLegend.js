import React, { useEffect, useRef, useState } from "react";
import "./MapLegend.css";

const MOUNTAINS = [
  { id: "hood", name: "Mt. Hood", center: [-121.69604, 45.37316], zoom: 12.5 },
  { id: "jefferson", name: "Mt Jefferson", center: [-121.80058, 44.67922], zoom: 12.3 },
  { id: "middle_sister", name: "Middle Sister", center: [-121.78424, 44.14838], zoom: 12.7 },
  { id: "south_sister", name: "South Sister", center: [-121.77073, 44.10229], zoom: 12.7 },
  { id: "broken_top", name: "Broken Top", center: [-121.69963, 44.08338], zoom: 12.7 },
];

const MapLegend = ({ selectedId = "hood", onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const legendRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (legendRef.current && !legendRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected =
    MOUNTAINS.find((m) => m.id === selectedId) ?? MOUNTAINS[0];

  return (
    <div
      className={`map-legend mountain-menu ${expanded ? "expanded" : ""}`}
      ref={legendRef}
      role="menu"
    >
      {!expanded && (
        <button
          type="button"
          className="mountain-menu-trigger"
          onClick={() => setExpanded(true)}
          aria-haspopup="true"
        >
          <div className="map-legend-item" style={{ width: "100%" }}>
<div className="mountain-menu-item">
  <strong>{selected.name}</strong>
</div>
          </div>
        </button>
      )}

      {expanded && (
        <div className="mountain-menu-list" role="menu">
          {MOUNTAINS.map((m) => {
            const active = m.id === selectedId;
            return (
              <button
                key={m.id}
                type="button"
                role="menuitem"
                className={`mountain-menu-item ${active ? "active" : ""}`}
                onClick={() => {
                  onSelect?.(m);
                  setExpanded(false);
                }}
              >
                <div className="map-legend-label menu-option-label">
                  <strong>{m.name}</strong>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MapLegend;
