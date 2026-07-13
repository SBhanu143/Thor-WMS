import React, { useState, useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeWriter, BarcodeFormat } from '@zxing/library';
import { jsPDF } from 'jspdf';
import { useLocalization } from '../context/LocalizationContext';
import { Download, Trash2, Printer, UploadCloud, RefreshCw, FileText } from 'lucide-react';

// LOCAL BARCODE CANVAS COMPONENT
const PreviewBarcode: React.FC<{ value: string }> = ({ value }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          displayValue: false,
          width: 1.5,
          height: 40,
          margin: 0
        });
      } catch (e) {
        console.error('Local barcode draw error:', e);
      }
    }
  }, [value]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '36px' }} />;
};

// LOCAL QR CANVAS COMPONENT
const PreviewQR: React.FC<{ value: string }> = ({ value }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      try {
        const qrWriter = new QRCodeWriter();
        const matrix = qrWriter.encode(value, BarcodeFormat.QR_CODE, 100, 100, new Map());
        const canvas = canvasRef.current;
        const width = matrix.getWidth();
        const height = matrix.getHeight();
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = '#000000';
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              if (matrix.get(x, y)) {
                ctx.fillRect(x, y, 1, 1);
              }
            }
          }
        }
      } catch (e) {
        console.error('Local QR draw error:', e);
      }
    }
  }, [value]);

  return <canvas ref={canvasRef} style={{ width: '44px', height: '44px' }} />;
};

export const BarcodeSheet: React.FC = () => {
  const { t } = useLocalization();
  const [inputText, setInputText] = useState<string>('');
  const [labelMode, setLabelMode] = useState<'barcode' | 'qr' | 'both'>('barcode');
  const [labels, setLabels] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse lines, trim, filter empty, and remove duplicates
  const processInput = () => {
    // Split by newlines, spaces, or tabs (Excel column pastes)
    const rawLines = inputText.split(/[\n\r\t,]+/);
    const cleaned = rawLines
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // De-duplicate
    const unique = Array.from(new Set(cleaned));
    setLabels(unique);
  };

  useEffect(() => {
    processInput();
  }, [inputText]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      parseFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      parseFile(files[0]);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setInputText('');
    setLabels([]);
  };

  // Helper to generate base64 barcode image offscreen
  const getBarcodeBase64 = (val: string): string => {
    const canvas = document.createElement('canvas');
    try {
      JsBarcode(canvas, val, {
        format: 'CODE128',
        displayValue: false,
        width: 2,
        height: 60,
        margin: 0
      });
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  const getQrBase64 = (val: string): string => {
    const qrWriter = new QRCodeWriter();
    try {
      const matrix = qrWriter.encode(val, BarcodeFormat.QR_CODE, 150, 150, new Map());
      const canvas = document.createElement('canvas');
      canvas.width = matrix.getWidth();
      canvas.height = matrix.getHeight();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if (matrix.get(x, y)) {
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      }
      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  // Generate Professional A4 PDF
  const handleDownloadPdf = () => {
    if (labels.length === 0) return;

    // A4 layout dimensions in mm
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const labelsPerPage = 30;
    const totalPages = Math.ceil(labels.length / labelsPerPage);

    // Margins and Grid gaps
    const marginLeft = 10;
    const marginTop = 12;
    const gapX = 4;
    const gapY = 3;
    const labelWidth = 61;
    const labelHeight = 25;

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) doc.addPage();

      const start = p * labelsPerPage;
      const end = Math.min(start + labelsPerPage, labels.length);

      for (let i = start; i < end; i++) {
        const idxOnPage = i - start;
        const col = idxOnPage % 3;
        const row = Math.floor(idxOnPage / 3);

        const x = marginLeft + col * (labelWidth + gapX);
        const y = marginTop + row * (labelHeight + gapY);

        const val = labels[i];

        // Draw boundary layout guide borders
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.1);
        doc.rect(x, y, labelWidth, labelHeight);

        // Center human-readable value at the bottom
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);

        if (labelMode === 'qr') {
          const qrData = getQrBase64(val);
          if (qrData) {
            doc.addImage(qrData, 'PNG', x + 21.5, y + 2, 18, 18);
          }
          doc.text(val, x + 30.5, y + 23, { align: 'center' });
        } else if (labelMode === 'barcode') {
          const barcodeData = getBarcodeBase64(val);
          if (barcodeData) {
            doc.addImage(barcodeData, 'PNG', x + 3.5, y + 2.5, 54, 15);
          }
          doc.text(val, x + 30.5, y + 22.5, { align: 'center' });
        } else if (labelMode === 'both') {
          const qrData = getQrBase64(val);
          const barcodeData = getBarcodeBase64(val);
          if (qrData) {
            doc.addImage(qrData, 'PNG', x + 2.5, y + 3.5, 14, 14);
          }
          if (barcodeData) {
            doc.addImage(barcodeData, 'PNG', x + 18.5, y + 3.5, 40, 14);
          }
          doc.text(val, x + 30.5, y + 22.5, { align: 'center' });
        }
      }
    }
    doc.save(`wms-barcodesheet-${Date.now()}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPages = Math.ceil(labels.length / 30);

  return (
    <div style={{ paddingBottom: '80px' }}>
      
      {/* HEADER BAR */}
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h2>Barcode Sheet Generator</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Batch generate printable A4 labels (3 columns x 10 rows layout).</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={handleClear}>
            <Trash2 size={16} /> Clear All
          </button>
          <button className="btn btn-outline" onClick={handlePrint} disabled={labels.length === 0}>
            <Printer size={16} /> Print Sheet
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={labels.length === 0}>
            <Download size={16} /> Download A4 PDF
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '320px 1fr', alignItems: 'start', gap: '24px' }}>
        
        {/* INPUT SETTINGS CARD */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* DRAG AND DROP AREA */}
          <div 
            className={`dropzone ${dragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.01)',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <UploadCloud size={24} color="var(--accent-secondary)" />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Drop CSV / TXT or Click to upload</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".csv,.txt"
              onChange={handleFileChange}
            />
          </div>

          {/* TEXT AREA */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Barcode list (one per line, splits Excel pastes)</label>
            <textarea 
              className="form-input"
              rows={12}
              style={{ fontFamily: 'monospace', resize: 'vertical', fontSize: '13px', lineHeight: 1.6 }}
              placeholder="Paste barcode values (one per line) or upload a CSV/TXT file."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />
          </div>

          {/* OPTIONS */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Render Layout Mode</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="radio" checked={labelMode === 'barcode'} onChange={() => setLabelMode('barcode')} />
                <span>Barcode Only (Code 128)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="radio" checked={labelMode === 'qr'} onChange={() => setLabelMode('qr')} />
                <span>QR Code Only</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="radio" checked={labelMode === 'both'} onChange={() => setLabelMode('both')} />
                <span>Both Barcode + QR Code</span>
              </label>
            </div>
          </div>

          {/* STATS PANEL */}
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            padding: '14px', 
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-glass)',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Labels:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{labels.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Pages (A4):</span>
              <span style={{ fontWeight: 700 }}>{totalPages}</span>
            </div>
          </div>

        </div>

        {/* PREVIEW CONTAINER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="flex-between">
            <h4 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>A4 Sheets Preview</h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Guides reflect print margins</span>
          </div>

          {labels.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Paste barcode values (one per line) or upload a CSV/TXT file.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              {Array.from({ length: totalPages }).map((_, pIdx) => {
                const pageLabels = labels.slice(pIdx * 30, (pIdx + 1) * 30);
                
                return (
                  <div key={pIdx} style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                      Page {pIdx + 1} of {totalPages}
                    </div>

                    {/* PRINT PAGE DUMMY FRAME */}
                    <div 
                      style={{
                        background: '#ffffff',
                        color: '#000000',
                        width: '210mm',
                        height: '297mm',
                        padding: '12mm 10mm',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        margin: '0 auto',
                        boxSizing: 'border-box',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gridTemplateRows: 'repeat(10, 1fr)',
                        gap: '3mm 4mm'
                      }}
                    >
                      {pageLabels.map((val, idx) => (
                        <div 
                          key={idx}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px',
                            boxSizing: 'border-box',
                            position: 'relative',
                            height: '25mm'
                          }}
                        >
                          {/* RENDER QR ONLY */}
                          {labelMode === 'qr' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <PreviewQR value={val} />
                            </div>
                          )}

                          {/* RENDER BARCODE ONLY */}
                          {labelMode === 'barcode' && (
                            <div style={{ width: '100%' }}>
                              <PreviewBarcode value={val} />
                            </div>
                          )}

                          {/* RENDER BOTH */}
                          {labelMode === 'both' && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '4px' }}>
                              <PreviewQR value={val} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <PreviewBarcode value={val} />
                              </div>
                            </div>
                          )}

                          {/* LABEL VALUE */}
                          <div 
                            style={{ 
                              fontSize: '8px', 
                              fontWeight: 'bold', 
                              fontFamily: 'monospace', 
                              marginTop: '4px',
                              letterSpacing: '0.05em',
                              wordBreak: 'break-all',
                              textAlign: 'center',
                              lineHeight: 1.1
                            }}
                          >
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* PRINT-ONLY CSS CONTAINER INJECTED IN DOM */}
      <div id="printable-barcode-sheet" className="print-only">
        {labels.map((val, idx) => (
          <div key={idx} className="print-label-item">
            {labelMode === 'qr' && <PreviewQR value={val} />}
            {labelMode === 'barcode' && <PreviewBarcode value={val} />}
            {labelMode === 'both' && (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <PreviewQR value={val} />
                <PreviewBarcode value={val} />
              </div>
            )}
            <div className="print-label-text">{val}</div>
          </div>
        ))}
      </div>

    </div>
  );
};
export default BarcodeSheet;
