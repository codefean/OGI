import React, { useEffect, useState } from "react";
import "./popup.css";
import "./loading.css";

const BetaPopup = ({ loading, progress, title }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show popup if still loading (skip if cached data loads instantly)
    if (loading) {
      setVisible(true);
    }
  }, [loading]);

  const handleClose = () => {
    if (loading) return; 
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="scandi-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scandi-popup-title"
    >
      <div className="scandi-popup-box">
        <h2 id="scandi-popup-title">Oregon Glacier Map</h2>
        <p className="popup-text">
          Currently, the Oregon and Federal government do not track glacial retreat aross Oregon. This map has been developed by
          the Oregon Glacier Institute to show the state of Oregon glaciers as of X date. This is the <strong>beta</strong> version - this tool is still
          under development. 
        </p>

        <p className="popup-text small">
          Oregon Glacier Institute is a 501(c)(3) nonprofit. Data sources include X, Y, Z and others. For more information, visit <a href="https://www.orglaciersinst.org/" target="_blank" rel="noopener noreferrer" style={{ color: "white" }}>www.orglaciersinst.org</a>
        </p>

        {loading ? (
          <>
            <h3 className="loading-title">{title}</h3>
            <div className="progress-percent">{progress}%</div>
            <div className="progress-container">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <button
            className="scandi-popup-close-button"
            onClick={handleClose}
          >
            <strong>OK</strong>
          </button>
        )}
      </div>
    </div>
  );
};

export default BetaPopup;
