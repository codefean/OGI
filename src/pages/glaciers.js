import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "./glaciers.css";

export const GLACIER_DATASETS = {
  Oregon_25: {
    url: "mapbox://mapfean2.cdkif7n7",
    sourceLayer: "OGI_lines",
    sourceId: "glaciers_25",
    fillId: "glacier-fill-25",
    highlightId: "glacier-highlight-25",
  },
  Oregon_17: {
    url: "mapbox://mapfean2.347l0v4w",
    sourceLayer: "ogi_2017",
    sourceId: "ogi_2017",
    fillId: "ogi_2017",
    highlightId: "glacier-highlight-17",
  },
  Oregon_23: {
    url: "mapbox://mapfean2.6968qql8",
    sourceLayer: "ogi_2023",
    sourceId: "ogi_2023",
    fillId: "glacier-fill-23",
    highlightId: "glacier-highlight-23",
  },
};

const getGlacierLabel = (props = {}) => {
  if (props?.glacLabel?.trim()) return props.glacLabel.trim();
  if (props?.glac_name?.trim()) return props.glac_name.trim();
  if (props?.GLAC_NAME?.trim()) return props.GLAC_NAME.trim();
  if (props?.GLACNAME?.trim()) return props.GLACNAME.trim();
  if (props?.Name?.trim()) return props.Name.trim();
  return "Name not found";
};

const glacierNameExpr = [
  "coalesce",
  ["get", "glacLabel"],
  ["get", "glac_name"],
  ["get", "GLAC_NAME"],
  ["get", "GLACNAME"],
  ["get", "Name"],
];

const getPopupHTML = (props, datasetKey) => {
  const glacLabel = getGlacierLabel(props);
  const rawArea = props?.area_km2 ?? props?.AREA_KM2 ?? props?.AREA_km2;
  const area = rawArea !== undefined && !isNaN(rawArea) ? parseFloat(rawArea).toFixed(2) : "N/A";
  const slope = props?.slope_deg && !isNaN(props.slope_deg) ? parseFloat(props.slope_deg).toFixed(1) : "N/A";
  const zmax = props?.zmax_m && !isNaN(props.zmax_m) ? `${parseInt(props.zmax_m, 10)} m` : "N/A";
  const year = datasetKey === "Oregon_25" ? 2025 : datasetKey === "Oregon_23" ? 2023 : datasetKey === "Oregon_17" ? 2017 : "N/A";
  const ref = datasetKey === "Oregon_25" ? "OGI" : "Fountain";
  return `
    <div class="glacier-label">
      <h4>${glacLabel}</h4>
      <div class="stats">
        <div><strong>${area}</strong> km²</div>
        <div><strong>${year}</strong> year</div>
        <div><strong>${ref}</strong> data source</div>
      </div>
    </div>
  `;
};

export function useGlacierLayer({ mapRef, activeDataset }) {
  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !activeDataset) return;

    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    let clickPopup = null;

    const datasets = activeDataset === "ALL" ? ["Oregon_17", "Oregon_23", "Oregon_25"] : [activeDataset];

    const onLoad = () => {
      datasets.forEach((key) => {
        const ds = GLACIER_DATASETS[key];
        if (!map.getSource(ds.sourceId)) map.addSource(ds.sourceId, { type: "vector", url: ds.url });
        if (!map.getLayer(ds.fillId))
          map.addLayer({
            id: ds.fillId,
            type: "fill",
            source: ds.sourceId,
            "source-layer": ds.sourceLayer,
            paint: { "fill-color": "#2ba0ff", "fill-opacity": 0.4 },
          });
        if (!map.getLayer(ds.highlightId))
          map.addLayer({
            id: ds.highlightId,
            type: "fill",
            source: ds.sourceId,
            "source-layer": ds.sourceLayer,
            paint: { "fill-color": "#004d80", "fill-opacity": 0.7 },
            filter: ["==", glacierNameExpr, ""],
          });
      });

      Object.keys(GLACIER_DATASETS).forEach((key) => {
        const ds = GLACIER_DATASETS[key];
        const visible = datasets.includes(key) ? "visible" : "none";
        map.setLayoutProperty(ds.fillId, "visibility", visible);
        map.setLayoutProperty(ds.highlightId, "visibility", visible);
      });

      if (!isTouchDevice) {
        datasets.forEach((key) => {
          const ds = GLACIER_DATASETS[key];
          const hoverPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: "glacier-popup" });

          map.on("mousemove", (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: [ds.fillId] });
            if (!features.length) {
              map.setFilter(ds.highlightId, ["==", glacierNameExpr, ""]);
              hoverPopup.remove();
              return;
            }
            const feature = features[0];
            const props = feature.properties;
            const glacLabel = getGlacierLabel(props);
            map.setFilter(ds.highlightId, ["==", glacierNameExpr, glacLabel]);
            hoverPopup.setLngLat(e.lngLat).setHTML(getPopupHTML(props, key)).addTo(map);
          });

          map.on("mouseleave", ds.fillId, () => {
            map.setFilter(ds.highlightId, ["==", glacierNameExpr, ""]);
            hoverPopup.remove();
          });
        });
      }

      datasets.forEach((key) => {
        const ds = GLACIER_DATASETS[key];
        map.on("click", ds.fillId, (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [ds.fillId] });
          if (!features.length) return;
          const props = features[0].properties;
          if (clickPopup) clickPopup.remove();
          clickPopup = new mapboxgl.Popup({ className: "glacier-popup glacier-click-popup", closeButton: true, closeOnClick: false, anchor: "top", offset: [0, -10] })
            .setLngLat(e.lngLat)
            .setHTML(getPopupHTML(props, key))
            .addTo(map);
        });
      });

      map.on("click", (e) => {
        const features = datasets.flatMap((key) => map.queryRenderedFeatures(e.point, { layers: [GLACIER_DATASETS[key].fillId] }));
        if (!features.length && clickPopup) {
          clickPopup.remove();
          clickPopup = null;
        }
      });
    };

    if (map.isStyleLoaded()) onLoad();
    else map.on("load", onLoad);

    return () => map.off("load", onLoad);
  }, [mapRef, activeDataset]);
}
