import React from 'react';

export default function DropZone({ folderPath, onSelect, onDrop }) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'open';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const item = e.dataTransfer.items[0];
    if (item && item.kind === 'file') {
      const file = item.getAsFile();
      const filePath = file && window.api.getPathForFile(file);
      if (filePath) {
        onDrop(filePath);
      }
    }
  };

  return (
    <div className="dropzone" onDragOver={handleDragOver} onDrop={handleDrop} onClick={onSelect}>
      {folderPath ? (
        <div className="dropzone-selected">
          <span className="dropzone-icon">📁</span>
          <span className="dropzone-path">{folderPath}</span>
          <span className="dropzone-hint">Klicken oder neuen Ordner ablegen</span>
        </div>
      ) : (
        <div className="dropzone-empty">
          <span className="dropzone-icon">📂</span>
          <span className="dropzone-label">Ordner hierher ziehen</span>
          <span className="dropzone-hint">oder klicken zum Auswählen</span>
        </div>
      )}
    </div>
  );
}
