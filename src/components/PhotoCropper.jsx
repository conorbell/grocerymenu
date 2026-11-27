import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';

// ---------- photo crop step: drag to reposition, slider/pinch to zoom ----------
// Profile photos use a 4:5 oval; Meal photos a square (the menu thumbnail).
export const PhotoCropper = ({ src, initial, onCancel, onDone, aspect = 4 / 5, cropShape = 'round' }) => {
  const [crop, setCrop] = useState(initial?.crop || { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initial?.zoom || 1);
  const [area, setArea] = useState(null);
  const onCropComplete = useCallback((_percent, pixels) => setArea(pixels), []);

  return (
    <div className="cell cell--full cell--cropper">
      <span className="cell__label">Drag to reposition · pinch or slide to zoom</span>
      <div className="cropper">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          minZoom={1}
          maxZoom={4}
          aspect={aspect}
          cropShape={cropShape}
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="cropper__controls">
        <span className="cropper__zoom-label" aria-hidden="true">−</span>
        <input
          type="range"
          min="1"
          max="4"
          step="0.01"
          value={zoom}
          aria-label="Zoom"
          onChange={(e) => setZoom(Number(e.target.value))}
        />
        <span className="cropper__zoom-label" aria-hidden="true">+</span>
      </div>
      <div className="cropper__actions">
        <button type="button" className="text-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="pill"
          disabled={!area}
          onClick={() => onDone({ area, crop, zoom })}
        >
          Use photo
        </button>
      </div>
    </div>
  );
};
