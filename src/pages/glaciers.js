import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "./glaciers.css";


export const GLACIER_DATASETS = {
  Oregon_23: {
    url: "mapbox://mapfean2.cdkif7n7",
    sourceLayer: "OGI_lines",
    sourceId: "glaciers_23",
    fillId: "glacier-fill-23",
    highlightId: "glacier-highlight-23",
  },
  Oregon_17: {
    url: "mapbox://mapfean.38aaq5bo",
    sourceLayer: "svallbard_glaciers2",
    sourceId: "glaciers_17",
    fillId: "glacier-fill-17",
    highlightId: "glacier-highlight-17",
  },
  Oregon_10: {
    url: "mapbox://mapfean.YOUR_TILESET_ID",
    sourceLayer: "oregon_10_layer",
    sourceId: "glaciers_10",
    fillId: "glacier-fill-10",
    highlightId: "glacier-highlight-10",
  },
};


const getGlacierLabel = (props = {}) => {
  if (props?.glac_name?.trim()) return props.glac_name.trim();
  if (props?.GLAC_NAME?.trim()) return props.GLAC_NAME.trim();
  if (props?.Name?.trim()) return props.Name.trim();
  return "Name not found";
};

const getPopupHTML = (props) => {
  const glacLabel = getGlacierLabel(props);
  const area =
    props?.area_km2 && !isNaN(props.area_km2)
      ? parseFloat(props.area_km2).toFixed(2)
      : "N/A";
  const slope =
    props?.slope_deg && !isNaN(props.slope_deg)
      ? parseFloat(props.slope_deg).toFixed(1)
      : "N/A";
  const zmax =
    props?.zmax_m && !isNaN(props.zmax_m)
      ? `${parseInt(props.zmax_m, 10)} m`
      : "N/A";

  return `
    <div class="glacier-label">
      <h4>${glacLabel}</h4>
      <div class="stats">
        <div><strong>${area}</strong> km²</div>
        <div><strong>${slope}°</strong> slope</div>
        <div><strong>${zmax}</strong> max elev</div>
      </div>
    </div>
  `;
};


export function useGlacierLayer({ mapRef, activeDataset }) {
  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !activeDataset) return;

    let clickPopup = null;
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const onLoad = () => {
      Object.values(GLACIER_DATASETS).forEach((ds) => {
        if (!map.getSource(ds.sourceId)) {
          map.addSource(ds.sourceId, { type: "vector", url: ds.url });
        }

        if (!map.getLayer(ds.fillId)) {
          map.addLayer({
            id: ds.fillId,
            type: "fill",
            source: ds.sourceId,
            "source-layer": ds.sourceLayer,
            paint: {
              "fill-color": "#2ba0ff",
              "fill-opacity": 0.4,
            },
          });
        }

        if (!map.getLayer(ds.highlightId)) {
          map.addLayer({
            id: ds.highlightId,
            type: "fill",
            source: ds.sourceId,
            "source-layer": ds.sourceLayer,
            paint: {
              "fill-color": "#004d80",
              "fill-opacity": 0.7,
            },
            filter: ["==", "Name", ""],
          });
        }
      });

      Object.entries(GLACIER_DATASETS).forEach(([key, ds]) => {
        const visible = key === activeDataset ? "visible" : "none";
        map.setLayoutProperty(ds.fillId, "visibility", visible);
        map.setLayoutProperty(ds.highlightId, "visibility", visible);
      });

      const active = GLACIER_DATASETS[activeDataset];

      if (!isTouchDevice) {
        const hoverPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
          className: "glacier-popup",
        });

        map.on("mousemove", (e) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: [active.fillId],
          });

          if (!features.length) {
            map.setFilter(active.highlightId, ["==", "Name", ""]);
            hoverPopup.remove();
            return;
          }

          const feature = features[0];
          const props = feature.properties;

          map.setFilter(active.highlightId, ["==", "Name", props.Name]);
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(getPopupHTML(props))
            .addTo(map);
        });

        map.on("mouseleave", active.fillId, () => {
          map.setFilter(active.highlightId, ["==", "Name", ""]);
          hoverPopup.remove();
        });
      }

      map.on("click", active.fillId, (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [active.fillId],
        });
        if (!features.length) return;

        const props = features[0].properties;

        if (clickPopup) clickPopup.remove();

        clickPopup = new mapboxgl.Popup({
          className: "glacier-popup glacier-click-popup",
          closeButton: true,
          closeOnClick: false,
          anchor: "top",
          offset: [0, -10],
        })
          .setLngLat(e.lngLat)
          .setHTML(getPopupHTML(props))
          .addTo(map);
      });

      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [active.fillId],
        });

        if (!features.length && clickPopup) {
          clickPopup.remove();
          clickPopup = null;
        }
      });
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.on("load", onLoad);
    }

    return () => {
      map.off("load", onLoad);
    };
  }, [mapRef, activeDataset]);
}
