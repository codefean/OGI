import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ResetButton from "./Reset";
import { useGlacierLayer } from "./glaciers";
import "./glaciermap.css";
import PitchControl from "./PitchControl";
import ZoomControls from "./Zoom";
import MapLegend from "./MapLegend";
import BetaPopup from "./popup";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const GlacierMap = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.matchMedia("(max-width: 768px)").matches);
  const [pitch, setPitch] = useState(isMobile ? 40 : 50);
  const [bearing, setBearing] = useState(0);
  const [selectedMountain, setSelectedMountain] = useState("hood");
  const [activeDataset, setActiveDataset] = useState("Oregon_23");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const listener = () => setIsMobile(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    setPitch(isMobile ? 40 : 50);
  }, [isMobile]);

  const DEFAULT_PITCH = pitch;
  const DEFAULT_BEARING = 0;
  const DEFAULT_ZOOM = isMobile ? 13 : 14;

  const updateProgress = (msg, step, totalSteps) => {
    setProgress(Math.round((step / totalSteps) * 100));
  };

const flyToDefault = useCallback((center, zoom = DEFAULT_ZOOM, speed = 1.8) => {
  const map = mapRef.current;
  if (!map) return;
  map.flyTo({ center, zoom, pitch: DEFAULT_PITCH, bearing: DEFAULT_BEARING, speed });
  setPitch(DEFAULT_PITCH);
  setBearing(DEFAULT_BEARING);
}, [DEFAULT_PITCH, DEFAULT_BEARING, DEFAULT_ZOOM]);

const resetZoom = useCallback(() => {
  flyToDefault([-121.69604, 45.365], DEFAULT_ZOOM, 2.2);
}, [flyToDefault, DEFAULT_ZOOM]);

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key.toLowerCase() === "r") resetZoom();
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [resetZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sync = () => setPitch(map.getPitch());
    map.on("pitch", sync);
    map.on("pitchend", sync);
    return () => {
      map.off("pitch", sync);
      map.off("pitchend", sync);
    };
  }, []);

  useEffect(() => {
    const initMap = async () => {
      if (mapRef.current) return;
      const totalSteps = 4;
      let step = 1;

      updateProgress("Initializing Mapbox map...", step++, totalSteps);

      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [-121.69604, 45.365],
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
      });

      await new Promise((resolve) => mapRef.current.on("load", resolve));
      updateProgress("Mapbox map fully loaded", step++, totalSteps);

      if (!mapRef.current.getSource("mapbox-dem")) {
        mapRef.current.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
        mapRef.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.0 });
      }

      setLoading(false);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isMobile, DEFAULT_PITCH, DEFAULT_ZOOM]);

  useGlacierLayer({ mapRef, activeDataset });

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapContainer}
        style={{ width: "100%", height: "calc(100vh - 43px)", overflow: "hidden", zIndex: 1 }}
      />

      <div className="dataset-selector">
        <label>Glacier Dataset:</label>
        <select value={activeDataset} onChange={(e) => setActiveDataset(e.target.value)}>
          <option value="Oregon_23">2023</option>
          <option value="Oregon_17">2017</option>
          <option value="Oregon_10">2010</option>
        </select>
      </div>

      {!isMobile && (
        <PitchControl
          mapRef={mapRef}
          value={pitch}
          onChange={setPitch}
          bearing={bearing}
          onBearingChange={setBearing}
        />
      )}

      <ResetButton onReset={resetZoom} />
      <ZoomControls mapRef={mapRef} />

      <BetaPopup loading={loading} progress={progress} title="Loading Data..." />

      <MapLegend
        selectedId={selectedMountain}
        onSelect={(m) => {
          setSelectedMountain(m.id);
          flyToDefault(m.center, m.zoom ?? (isMobile ? 12.5 : 13.5));
        }}
      />
    </div>
  );
};

export default GlacierMap;
