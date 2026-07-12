import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { 
  QrCode, 
  Printer, 
  Copy, 
  Share2, 
  Download, 
  Trash2, 
  Camera, 
  Check, 
  AlertCircle, 
  Star, 
  Zap, 
  Plus, 
  X,
  RefreshCw, 
  Search, 
  CheckCircle,
  FileText,
  HelpCircle,
  Mic
} from 'lucide-react';
import { formatBinLocation, formatSmartInput, detectInputType } from '../utils/formatter';
import type { WmsInputType } from '../utils/formatter';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

interface HistoryItem {
  id: string;
  type: WmsInputType;
  rawInput: string;
  formattedInput: string;
  timestamp: string;
}

export const QRGenerator: React.FC = () => {
  const { apiCall } = useAuth();
  const { t } = useLocalization();

  // Unified Smart input state
  const [smartInput, setSmartInput] = useState('');
  
  // Detected Type: 'product' | 'bin' | 'empty_bin' | 'empty'
  const [detectedType, setDetectedType] = useState<WmsInputType>('empty');
  
  // Validation error state
  const [validationError, setValidationError] = useState('');

  // References
  const inputRef = useRef<HTMLInputElement>(null);

  // Real Camera Barcode/QR Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannerError, setScannerError] = useState<string>('');
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // History & Favorites local state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['A-02-D-5', 'B-05-A-8', 'C-01-C-2', 'ABC-123']);

  // Button Action states: 'idle' | 'loading' | 'success'
  const [btnStates, setBtnStates] = useState({
    copy: 'idle',
    print: 'idle',
    share: 'idle',
    download: 'idle',
    generate: 'idle'
  });

  const [isListeningVoice, setIsListeningVoice] = useState(false);

  const startVoiceInput = () => {
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Speech) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }
    const rec = new Speech();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setIsListeningVoice(true);
    rec.onend = () => setIsListeningVoice(false);
    rec.onerror = () => setIsListeningVoice(false);

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      handleInputChange(text);
    };

    rec.start();
  };

  // Load history on boot
  useEffect(() => {
    const savedHistory = localStorage.getItem('thor_wms_qr_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    }

    const savedFavs = localStorage.getItem('thor_wms_qr_favs');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveHistoryToLocal = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('thor_wms_qr_history', JSON.stringify(newHistory));
  };

  const saveFavoritesToLocal = (newFavs: string[]) => {
    setFavorites(newFavs);
    localStorage.setItem('thor_wms_qr_favs', JSON.stringify(newFavs));
  };

  // formatBinLocation is now imported from ../utils/formatter

  // Live input change handler using shared formatter utility
  const handleInputChange = (val: string) => {
    setValidationError('');
    const { type, formatted } = formatSmartInput(val);
    setSmartInput(formatted);
    setDetectedType(type);
  };

  // General Input Validator
  const validateInput = (): boolean => {
    if (!smartInput) {
      setValidationError('Input cannot be empty.');
      return false;
    }

    if (detectedType === 'product') {
      if (smartInput.length < 5 || smartInput.length > 16) {
        setValidationError('Warning: Barcode length is non-standard (expect 5-16 digits).');
        return true; 
      }
    } else if (detectedType === 'bin') {
      const binRegex = /^[A-Z]+-\d+-[A-Z]+-\d+$/;
      if (!binRegex.test(smartInput)) {
        setValidationError('Format warning: Location code does not match standard pattern A-02-D-5.');
        return true; 
      }
    } else if (detectedType === 'empty_bin') {
      const emptyBinRegex = /^[A-Z]{3}-\d+$/;
      if (!emptyBinRegex.test(smartInput)) {
        setValidationError('Format warning: Empty bin code does not match standard pattern ABC-123.');
        return true;
      }
    }
    return true;
  };

  // Save generated item to history
  const logToHistory = (type: WmsInputType, data: string) => {
    if (type === 'empty') return;
    const exists = history.slice(0, 3).some(item => item.formattedInput === data && item.type === type);
    if (exists) return;

    const newItem: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      rawInput: data,
      formattedInput: data,
      timestamp: new Date().toLocaleTimeString()
    };

    const updated = [newItem, ...history].slice(0, 50);
    saveHistoryToLocal(updated);
  };

  const triggerBtnState = (actionKey: string, successDuration = 1500) => {
    setBtnStates(prev => ({ ...prev, [actionKey]: 'success' }));
    setTimeout(() => {
      setBtnStates(prev => ({ ...prev, [actionKey]: 'idle' }));
    }, successDuration);
  };

  // UNIFIED ACTIONS
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput()) return;

    setBtnStates(prev => ({ ...prev, generate: 'loading' }));
    setTimeout(() => {
      logToHistory(detectedType as any, smartInput);
      triggerBtnState('generate');
    }, 400);
  };

  const handleCopy = async () => {
    if (!smartInput) return;
    try {
      await navigator.clipboard.writeText(smartInput);
      triggerBtnState('copy');
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    triggerBtnState('print');
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleShare = async () => {
    if (!smartInput) return;
    const title = detectedType === 'product' ? 'Product Barcode' : 'WMS Bin Location';
    const text = smartInput;

    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        triggerBtnState('share');
      } catch (e) {
        console.error(e);
      }
    } else {
      await navigator.clipboard.writeText(text);
      triggerBtnState('share');
      alert(`Shared link copied: ${text}`);
    }
  };

  const handleDownloadPng = () => {
    if (!smartInput) return;
    setBtnStates(prev => ({ ...prev, download: 'loading' }));

    setTimeout(() => {
      const qrPayload = smartInput;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`;
      
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

  const handleToggleFavorite = (code: string) => {
    if (favorites.includes(code)) {
      saveFavoritesToLocal(favorites.filter(c => c !== code));
    } else {
      saveFavoritesToLocal([...favorites, code]);
    }
  };

  const handleLoadCode = (code: string, forceType?: WmsInputType) => {
    if (forceType) {
      setSmartInput(code);
      setDetectedType(forceType);
    } else {
      handleInputChange(code);
    }
    logToHistory(forceType || detectInputType(code), code);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClear = () => {
    setSmartInput('');
    setDetectedType('empty');
    setValidationError('');
    inputRef.current?.focus();
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    saveHistoryToLocal(updated);
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Clear all generated labels history?')) {
      saveHistoryToLocal([]);
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000Hz beep tone
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 150);
    } catch (e) {
      console.error('AudioContext beep failed:', e);
    }
  };

  const startScanning = async () => {
    setScannerError('');
    setTorchSupported(false);
    setTorchOn(false);

    try {
      await navigator.mediaDevices.getUserMedia({ video: true });

      const hints = new Map();
      const formats = [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_39
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      const reader = new BrowserMultiFormatReader(hints);
      codeReaderRef.current = reader;

      const devices = await reader.listVideoInputDevices();
      setCameras(devices);

      if (devices.length === 0) {
        setScannerError('No camera devices found.');
        return;
      }

      // Try selecting rear/back environment camera by default
      let initialCamera = devices[0];
      const rearCam = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') || 
        d.label.toLowerCase().includes('environment')
      );
      if (rearCam) {
        initialCamera = rearCam;
      }
      setSelectedCameraId(initialCamera.deviceId);

      decodeDevice(initialCamera.deviceId, reader);
    } catch (err: any) {
      console.error('Camera access failed:', err);
      setScannerError('Camera access denied. Please grant camera permissions to utilize the live scanner.');
    }
  };

  const decodeDevice = (deviceId: string, reader: BrowserMultiFormatReader) => {
    if (!videoRef.current) return;

    reader.reset();
    reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
      if (result) {
        const scannedText = result.getText();
        
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        
        playBeep();
        handleInputChange(scannedText);
        logToHistory(detectInputType(scannedText), scannedText);
        stopScanning();
      }
    });

    // Check flash / torch support after stream binding
    setTimeout(() => {
      try {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
          if (track) {
            const capabilities = track.getCapabilities() as any;
            if (capabilities && capabilities.torch) {
              setTorchSupported(true);
            }
          }
        }
      } catch (e) {
        console.warn('Torch check warning:', e);
      }
    }, 1000);
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setShowScanner(false);
    setTorchOn(false);
    setTorchSupported(false);
  };

  const switchCamera = (deviceId: string) => {
    setSelectedCameraId(deviceId);
    if (codeReaderRef.current) {
      decodeDevice(deviceId, codeReaderRef.current);
    }
  };

  const toggleTorch = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        if (track) {
          const nextTorch = !torchOn;
          await track.applyConstraints({
            advanced: [{ torch: nextTorch }]
          } as any);
          setTorchOn(nextTorch);
        }
      }
    } catch (e) {
      console.error('Failed to toggle torch:', e);
    }
  };

  useEffect(() => {
    if (showScanner) {
      startScanning();
    } else {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    }
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [showScanner]);

  const renderBtnText = (stateKey: string, label: string) => {
    const val = (btnStates as any)[stateKey];
    if (val === 'loading') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} className="loader" /> working
        </span>
      );
    }
    if (val === 'success') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
          <Check size={14} /> Done
        </span>
      );
    }
    return label;
  };

  const qrPayload = smartInput;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`;

  return (
    <div style={{ paddingBottom: '80px', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* QUICK FLOATING ACTIONS */}
      <div 
        className="glass-card" 
        style={{ 
          position: 'sticky', 
          top: '20px', 
          zIndex: 500, 
          padding: '12px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} color="var(--accent-secondary)" />
          <span style={{ fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Smart QR
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '13px', borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)' }}
            onClick={() => setShowScanner(prev => !prev)}
          >
            <Camera size={14} /> Open Scanner
          </button>
          <button 
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '13px' }}
            onClick={handlePrint}
            disabled={!smartInput}
          >
            <Printer size={14} /> Print Preview
          </button>
          <button 
            className="btn btn-outline"
            style={{ padding: '8px 14px', fontSize: '13px' }}
            onClick={handleClear}
          >
            Reset Form
          </button>
        </div>
      </div>

      {/* REAL CAMERA SCANNER */}
      {showScanner && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', border: '1px solid var(--accent-secondary)' }}>
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={16} color="var(--accent-secondary)" />
              Live Barcode & QR Scanner
            </h4>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--error)', color: 'var(--error)' }} onClick={stopScanning}>
              Close Scanner
            </button>
          </div>

          {scannerError ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ color: 'var(--error)', marginBottom: '14px', fontSize: '14px' }}>
                {scannerError}
              </div>
              <button className="btn btn-primary" onClick={startScanning}>
                Retry Permission / Open Camera
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              {/* VIDEO VIEWFINDER WITH TARGET BOX OVERLAY */}
              <div className="scanner-viewport">
                <video ref={videoRef} className="scanner-video" muted playsInline />
                <div className="scanner-overlay-box">
                  <div className="scanner-laser-line" />
                </div>
              </div>

              {/* CAMERA SWITCH AND FLASHLIGHT TOGGLE CONTROLS */}
              <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '480px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {cameras.length > 1 && (
                  <select 
                    className="form-input" 
                    style={{ flex: 1, maxWidth: '240px', padding: '8px 12px' }}
                    value={selectedCameraId}
                    onChange={e => switchCamera(e.target.value)}
                  >
                    {cameras.map((c, index) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                {torchSupported && (
                  <button 
                    className={`btn ${torchOn ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                    onClick={toggleTorch}
                  >
                    {torchOn ? 'Flashlight ON' : 'Flashlight OFF'}
                  </button>
                )}
              </div>
              
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Fit the barcode or QR code inside the box to scan automatically.
              </div>
            </div>
          )}
        </div>
      )}

      {/* CENTRAL SMART QR WORKFLOW CARD */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
        
        {/* LARGE CENTRAL SMART INPUT */}
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Scan Barcode or Type location string
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                ref={inputRef}
                type="text" 
                className="form-input" 
                style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  padding: '16px 20px', 
                  letterSpacing: '0.05em',
                  textAlign: 'center'
                }}
                placeholder="Enter Barcode or Bin Code (e.g. 21134161789 or a2d5)"
                value={smartInput}
                onChange={e => handleInputChange(e.target.value)}
              />
              {smartInput && (
                <button 
                  type="button"
                  style={{ 
                    position: 'absolute', 
                    right: '18px', 
                    top: '24px', 
                    border: 'none', 
                    background: 'transparent', 
                    color: 'var(--text-secondary)',
                    cursor: 'pointer' 
                  }}
                  onClick={handleClear}
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <button 
              type="button" 
              className={`voice-mic-btn ${isListeningVoice ? 'listening' : ''}`}
              style={{ width: '58px', height: '58px' }}
              onClick={startVoiceInput}
              title="Dictate code (Voice recognition)"
            >
              <Mic size={20} />
            </button>
          </div>

          {/* DYNAMIC DETECTOR STATUS BADGE */}
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
            {detectedType === 'product' && (
              <span className="badge badge-info" style={{ fontSize: '13px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> ✓ Product Barcode Detected
              </span>
            )}
            {detectedType === 'bin' && (
              <span className="badge badge-success" style={{ fontSize: '13px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> ✓ Bin Location Detected
              </span>
            )}
            {detectedType === 'empty_bin' && (
              <span className="badge badge-warning" style={{ fontSize: '13px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> ✓ Empty Bin Detected
              </span>
            )}
            {detectedType === 'empty' && (
              <span className="badge" style={{ fontSize: '13px', padding: '6px 14px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={14} /> Waiting for keyboard / scanner input...
              </span>
            )}
          </div>

          {validationError && (
            <div style={{ color: 'var(--error)', fontSize: '13px', marginTop: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <AlertCircle size={14} /> {validationError}
            </div>
          )}
        </div>

        {/* LIVE QR LABEL CARD PREVIEW */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div 
            id="printable-smart-label"
            style={{ 
              background: '#ffffff', 
              color: '#000000', 
              width: '300px',
              padding: '20px', 
              borderRadius: '8px', 
              border: '2px solid #000000',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 800, borderBottom: '2px solid #000', width: '100%', paddingBottom: '6px', marginBottom: '10px', letterSpacing: '0.05em' }}>
              THOR CREATIONS WMS
            </div>
            
            {smartInput ? (
              <>
                <img 
                  src={qrCodeUrl} 
                  alt="Dynamic QR" 
                  style={{ width: '140px', height: '140px', marginBottom: '10px' }} 
                />
                <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.05em' }}>
                  {detectedType === 'product' ? 'PRODUCT SKU BARCODE' : detectedType === 'empty_bin' ? 'EMPTY STORAGE BIN' : 'STORAGE BIN CODE'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, marginTop: '4px', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                  {smartInput}
                </div>
              </>
            ) : (
              <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888888', fontSize: '13px' }}>
                Barcode preview details
              </div>
            )}
          </div>
        </div>

        {/* UNIFIED HORIZONTAL ACTIONS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          <button 
            className="btn btn-primary" 
            style={{ gridColumn: 'span 5', padding: '12px' }}
            disabled={!smartInput}
            onClick={handleGenerate}
          >
            {renderBtnText('generate', 'Generate Label')}
          </button>
          
          <button 
            className="btn btn-outline" 
            disabled={!smartInput}
            onClick={handlePrint}
          >
            <Printer size={14} /> Print
          </button>

          <button 
            className="btn btn-outline" 
            disabled={!smartInput}
            onClick={handleCopy}
          >
            <Copy size={14} /> {renderBtnText('copy', 'Copy')}
          </button>

          <button 
            className="btn btn-outline" 
            disabled={!smartInput}
            onClick={handleShare}
          >
            <Share2 size={14} /> {renderBtnText('share', 'Share')}
          </button>

          <button 
            className="btn btn-outline" 
            style={{ gridColumn: 'span 2' }}
            disabled={!smartInput}
            onClick={handleDownloadPng}
          >
            <Download size={14} /> {renderBtnText('download', 'Download PNG')}
          </button>
        </div>

      </div>

      {/* DUAL FAVORITES AND HISTORY PANELS */}
      <div className="grid-2" style={{ gap: '24px' }}>
        
        {/* FAVORITES BOARD */}
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={16} color="var(--warning)" fill="var(--warning)" />
              Favorites Bin Pins
            </h4>
            {smartInput && (detectedType === 'bin' || detectedType === 'empty_bin') && (
              <button 
                className="btn btn-outline" 
                style={{ padding: '4px 8px', fontSize: '11px', border: 'none' }}
                onClick={() => handleToggleFavorite(smartInput)}
              >
                {favorites.includes(smartInput) ? 'Unpin' : '+ Pin Current'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {favorites.map(fav => (
              <div 
                key={fav}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '6px 10px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <span 
                  style={{ fontWeight: 700, fontSize: '12px', cursor: 'pointer', letterSpacing: '0.05em' }}
                  onClick={() => handleLoadCode(fav, detectInputType(fav))}
                >
                  {fav}
                </span>
                <button 
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px' }}
                  onClick={() => handleToggleFavorite(fav)}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {favorites.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No favorite bin pins saved.</div>
            )}
          </div>
        </div>

        {/* RECENT HISTORIES */}
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} color="var(--accent-primary)" />
              Recent History Log
            </h4>
            {history.length > 0 && (
              <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--error)', borderColor: 'var(--error)' }} onClick={handleClearAllHistory}>
                Clear
              </button>
            )}
          </div>

          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {history.slice(0, 5).map(item => (
              <div 
                key={item.id}
                className="flex-between"
                style={{ padding: '8px 0', borderBottom: '1px solid var(--border-glass)', gap: '10px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`badge ${item.type === 'product' ? 'badge-info' : item.type === 'empty_bin' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '8px', padding: '2px 4px' }}>
                    {item.type === 'empty_bin' ? 'EMPTY BIN' : item.type.toUpperCase()}
                  </span>
                  <span 
                    style={{ fontWeight: 600, fontSize: '13px', cursor: 'pointer', letterSpacing: '0.05em' }}
                    onClick={() => handleLoadCode(item.formattedInput, item.type)}
                  >
                    {item.formattedInput}
                  </span>
                </div>
                <button 
                  style={{ border: 'none', background: 'transparent', color: 'var(--error)', cursor: 'pointer', padding: '2px' }}
                  onClick={() => handleDeleteHistoryItem(item.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {history.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No recent items.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
export default QRGenerator;
