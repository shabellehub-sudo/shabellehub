// components/admin/ImageUploader.js
// Drag-and-drop / click upload with preview and progress.
// Calls uploadMedia() from lib/cms/media.js — no new Firebase logic.

import { useState, useRef, useCallback } from 'react';
import { uploadMedia } from '../../lib/cms/media';
import { useAuth } from '../../lib/cms/useAuth';

export default function ImageUploader({
  onUploaded,      // (mediaDoc) => void  — called with full media record
  currentUrl = '',
  label = 'Upload Image',
  compact = false,
}) {
  const auth     = useAuth();
  const [dragging,  setDragging]  = useState(false);
  const [progress,  setProgress]  = useState(null); // 0–100 | null
  const [preview,   setPreview]   = useState(currentUrl || null);
  const [error,     setError]     = useState(null);
  const fileRef = useRef(null);

  const zone = {
    border: `2px dashed ${dragging ? '#14FFF4' : '#2a3d5c'}`,
    borderRadius: 10,
    padding: compact ? '16px' : '28px 20px',
    textAlign: 'center',
    background: dragging ? 'rgba(20,255,244,0.04)' : '#080d1a',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    position: 'relative',
  };

  async function process(file) {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please select an image file.'); return;
    }
    setError(null);
    // Local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setProgress(0);

    // Fake granular progress while uploadBytesResumable runs (media.js wraps
    // uploadBytesResumable but doesn't expose progress callback externally —
    // we simulate it so the UI feels responsive without modifying media.js).
    let tick = 0;
    const interval = setInterval(() => {
      tick = Math.min(tick + Math.random() * 15, 85);
      setProgress(Math.round(tick));
    }, 200);

    const { data, error: e } = await uploadMedia(file, { userId: auth.user?.uid });
    clearInterval(interval);

    if (e) {
      setError(e);
      setProgress(null);
      URL.revokeObjectURL(localUrl);
      return;
    }

    setProgress(100);
    setPreview(data.public_url);
    URL.revokeObjectURL(localUrl);
    setTimeout(() => setProgress(null), 600);
    if (onUploaded) onUploaded(data);
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) process(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (file) process(file);
    e.target.value = '';
  }

  return (
    <div>
      {/* Preview */}
      {preview && (
        <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Upload preview"
            style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block', objectFit: 'cover' }}
          />
          <button
            type="button"
            onClick={() => { setPreview(null); if (onUploaded) onUploaded(null); }}
            style={{
              position: 'absolute', top: 4, right: 4,
              background: 'rgba(8,13,26,0.85)', border: '1px solid #2a3d5c',
              borderRadius: '50%', width: 22, height: 22,
              color: '#e8f0ff', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
          >×</button>
        </div>
      )}

      {/* Drop zone */}
      <div
        style={zone}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />

        {progress !== null ? (
          <div>
            <div style={{ fontSize: 12, color: '#9fb3d4', marginBottom: 8 }}>
              {progress < 100 ? `Uploading… ${progress}%` : '✓ Done'}
            </div>
            <div style={{ background: '#1a2d4a', borderRadius: 4, height: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: progress < 100 ? '#14FFF4' : '#00d084',
                width: `${progress}%`, transition: 'width 0.2s',
              }} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: compact ? 22 : 32, marginBottom: 6 }}>🖼</div>
            <div style={{ fontSize: 13, color: '#9fb3d4', fontWeight: 600 }}>
              {dragging ? 'Drop to upload' : label}
            </div>
            {!compact && (
              <div style={{ fontSize: 11, color: '#3d5470', marginTop: 4 }}>
                Drag & drop or click to browse
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#ff8080', marginTop: 6 }}>{error}</p>
      )}
    </div>
  );
}
