import { useEffect, useState } from "react";
import "./loc.css";

/**
 * @param {Object} mapRef
 * @param {Function} setCursorInfo
 */
export function useCursorLocation(mapRef, setCursorInfo) {
  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 768px)").matches
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const listener = () => setIsMobile(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isMobile) {
      setCursorInfo({ lng: null, lat: null, elevM: null });
      return;
    }

    let rafId = null;

    const onMove = (e) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const { lng, lat } = e.lngLat;
        let elevM = null;

        try {
          elevM = map.queryTerrainElevation(e.lngLat, { exaggerated: false });
        } catch {}

        if (typeof elevM !== "number" || Number.isNaN(elevM)) {
          elevM = null;
        }

        setCursorInfo({ lng, lat, elevM });
      });
    };

    map.on("mousemove", onMove);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      map.off("mousemove", onMove);
    };
  }, [mapRef, setCursorInfo, isMobile]);
}
