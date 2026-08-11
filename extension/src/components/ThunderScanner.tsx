import React, { useState, useEffect, useRef } from 'react';
import { Camera, Copy, Download, Printer, Share2, AlertCircle, CheckCircle, HelpCircle, X, Check } from 'lucide-react';
import { detectInputType, formatBinLocation, formatBB, formatEmptyBin } from '../utils/formatter';
import { addHistoryItem } from '../utils/storage';

declare global {
  interface Window {
    BarcodeDetector: any;
  }
}

export const ThunderScanner: React.FC = () => {
  const [smartInput, setSmartInput] = useState('');
  const [detectedType, setDetectedType] = useState<string>('empty');
  const [validationError, setValidationError] = useState('');

  // Scanner states
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const detectorRef = useRef<any>(null);

  // Button Action states
  const [btnStates, setBtnStates] = useState({
    copy: 'idle',
    print: 'idle',
    share: 'idle',
    download: 'idle'
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
      } catch (e) {
        console.warn('BarcodeDetector initialization failed', e);
      }
    }
    return stopCamera;
  }, []);

  const stopCamera = () => {
    setScanning(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraError('');
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        scanFrame();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setScanning(false);
      setCameraError('CAMERA UNAVAILABLE. Please type code manually.');
    }
  };

  const scanFrame = async () => {
    if (!videoRef.current || !detectorRef.current || !scanning) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue;
          handleInputChange(value);
          stopCamera();
          if (navigator.vibrate) navigator.vibrate(200);
          return;
        }
      } catch (e) {
        // Ignore detection errors during frame processing
      }
    }
    if (scanning) {
      animationRef.current = requestAnimationFrame(scanFrame);
    }
  };

  const handleInputChange = (raw: string) => {
    setValidationError('');
    
    if (!raw.trim()) {
      setSmartInput('');
      setDetectedType('empty');
      return;
    }

    const type = detectInputType(raw);
    let processed = raw.trim();

    if (type === 'bin') processed = formatBinLocation(processed);
    if (type === 'bb') processed = formatBB(processed);
    if (type === 'empty_bin') processed = formatEmptyBin(processed);
    if (type === 'product' || type === 'empty') {
      processed = processed.toUpperCase();
    }

    setSmartInput(processed);
    setDetectedType(type);
  };

  const triggerBtnState = (actionKey: string, successDuration = 1500) => {
    setBtnStates(prev => ({ ...prev, [actionKey]: 'success' }));
    setTimeout(() => {
      setBtnStates(prev => ({ ...prev, [actionKey]: 'idle' }));
    }, successDuration);
  };

  const logCurrentToHistory = async () => {
    if (!smartInput) return;
    const historyType = (detectedType === 'product' || detectedType === 'empty') ? 'qr' : detectedType;
    await addHistoryItem({ type: historyType as any, value: smartInput });
  };

  const handleCopy = async () => {
    if (!smartInput) return;
    try {
      await navigator.clipboard.writeText(smartInput);
      triggerBtnState('copy');
      logCurrentToHistory();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    if (!smartInput) return;
    triggerBtnState('print');
    logCurrentToHistory();
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleShare = async () => {
    if (!smartInput) return;
    const title = detectedType === 'product' ? 'Product Barcode' : 'WMS Bin Location';
    logCurrentToHistory();
    if (navigator.share) {
      try {
        await navigator.share({ title, text: smartInput });
        triggerBtnState('share');
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(smartInput);
      triggerBtnState('share');
    }
  };

  const handleDownloadPng = () => {
    if (!smartInput) return;
    setBtnStates(prev => ({ ...prev, download: 'loading' }));
    logCurrentToHistory();
    setTimeout(() => {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(smartInput)}`;
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.setAttribute('download', `wms-label-${smartInput}.png`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerBtnState('download');
    }, 500);
  };

  const handleClear = () => {
    setSmartInput('');
    setDetectedType('empty');
    setValidationError('');
  };

  const qrCodeUrl = smartInput ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(smartInput)}` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* CAMERA SCANNER BUTTON / AREA */}
      <div className="glass-card">
        {!scanning ? (
          <>
            <button 
              className="btn btn-primary btn-block" 
              style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}
              onClick={startCamera}
            >
              <Camera size={18} /> OPEN SCANNER
            </button>
            {cameraError && (
               <div style={{ marginTop: '12px', textAlign: 'center', color: 'var(--error)', fontSize: '11px', fontWeight: 'bold' }}>
                 {cameraError}
               </div>
            )}
          </>
        ) : (
          <div style={{ padding: '0', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
            <div style={{ padding: '12px', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>LIVE CAMERA</span>
              <button className="btn btn-ghost" onClick={stopCamera} style={{ color: 'var(--error)' }} title="Close Scanner">
                <X size={16} />
              </button>
            </div>
            <div className="scanner-viewport" style={{ aspectRatio: '4/3' }}>
              <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
              <div className="scanner-overlay">
                <div className="scanner-corners"></div>
                <div className="scanner-corners scanner-corner-bl"></div>
                <div className="scanner-corners scanner-corner-br"></div>
                <div className="scan-line"></div>
                <div className="scan-hint">ALIGN BARCODE / QR</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAIN INPUT AREA */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <label className="form-label" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', display: 'block', marginBottom: '12px' }}>
          Scan Barcode or Type location string
        </label>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: '18px', fontWeight: 'bold', padding: '12px 16px', textAlign: 'center' }}
            placeholder="Enter Barcode or Bin Code"
            value={smartInput}
            onChange={(e) => handleInputChange(e.target.value)}
          />
          {smartInput && (
            <button 
              type="button"
              style={{ position: 'absolute', right: '12px', top: '14px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={handleClear}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* STATUS BADGE */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {detectedType === 'product' && (
            <span className="badge badge-info" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> PRODUCT BARCODE DETECTED
            </span>
          )}
          {detectedType === 'bin' && (
            <span className="badge badge-success" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> BIN LOCATION DETECTED
            </span>
          )}
          {detectedType === 'bb' && (
            <span className="badge badge-success" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> BB CODE DETECTED
            </span>
          )}
          {detectedType === 'empty_bin' && (
            <span className="badge badge-warning" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> EMPTY BIN DETECTED
            </span>
          )}
          {detectedType === 'empty' && (
            <span className="badge" style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HelpCircle size={12} /> Waiting for keyboard / scanner input...
            </span>
          )}
        </div>

        {validationError && (
          <div style={{ color: 'var(--error)', fontSize: '12px', marginTop: '12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> {validationError}
          </div>
        )}
      </div>

      {/* LABEL PREVIEW */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
        <div 
          className="print-area"
          style={{ 
            background: '#ffffff', 
            color: '#000000', 
            width: '100%',
            maxWidth: '300px',
            padding: '16px', 
            borderRadius: '6px', 
            border: '2px solid #000000',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 800, borderBottom: '2px solid #000', width: '100%', paddingBottom: '4px', marginBottom: '12px', letterSpacing: '0.05em' }}>
            THOR CREATIONS WMS
          </div>
          
          {smartInput ? (
            <>
              <img 
                src={qrCodeUrl} 
                alt="Dynamic QR" 
                style={{ width: '120px', height: '120px', marginBottom: '12px' }} 
              />
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', color: '#333' }}>
                {detectedType === 'product' ? 'PRODUCT SKU BARCODE' : detectedType === 'empty_bin' ? 'EMPTY STORAGE BIN' : 'STORAGE BIN CODE'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, marginTop: '4px', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                {smartInput}
              </div>
            </>
          ) : (
            <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888888', fontSize: '12px' }}>
              Ready to scan or enter a value
            </div>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button className="btn btn-outline" disabled={!smartInput} onClick={handlePrint} style={{ fontSize: '11px' }}>
          <Printer size={14} /> {btnStates.print === 'success' ? 'DONE' : 'PRINT'}
        </button>
        <button className="btn btn-outline" disabled={!smartInput} onClick={handleCopy} style={{ fontSize: '11px' }}>
          <Copy size={14} /> {btnStates.copy === 'success' ? 'COPIED' : 'COPY'}
        </button>
        <button className="btn btn-outline" disabled={!smartInput} onClick={handleShare} style={{ fontSize: '11px' }}>
          <Share2 size={14} /> {btnStates.share === 'success' ? 'SHARED' : 'SHARE'}
        </button>
        <button className="btn btn-outline" disabled={!smartInput} onClick={handleDownloadPng} style={{ fontSize: '11px' }}>
          <Download size={14} /> {btnStates.download === 'loading' ? 'WAIT' : 'DOWNLOAD PNG'}
        </button>
      </div>

    </div>
  );
};
