import React, { useState } from 'react';
import { Copy, Printer, Download, Share2, Check } from 'lucide-react';

interface ResultCardProps {
  value: string;
  type: string; // 'QR CODE', 'BARCODE', 'BIN LOCATION', 'BB CODE', 'EMPTY BIN'
  children?: React.ReactNode; // Optional canvas/image
}

export const ResultCard: React.FC<ResultCardProps> = ({ value, type, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {}
      document.body.removeChild(textArea);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let mediaHtml = '';
    if (children) {
      // Find canvas inside children if possible
      const canvas = document.querySelector('.qr-preview canvas') as HTMLCanvasElement;
      if (canvas) {
        mediaHtml = `<img src="${canvas.toDataURL('image/png')}" style="max-width: 100%; display: block; margin: 0 auto 10px;" />`;
      }
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${value}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              text-align: center;
              background: #fff;
              color: #000;
            }
            .label {
              border: 2px solid #000;
              padding: 20px;
              display: inline-block;
              border-radius: 8px;
            }
            .header {
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 15px;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
            }
            .value {
              font-family: 'Courier New', monospace;
              font-size: 24px;
              font-weight: bold;
              margin-top: 10px;
            }
            .type {
              font-size: 10px;
              margin-top: 5px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label">
            <div class="header">THOR CREATIONS WMS</div>
            ${mediaHtml}
            <div class="value">${value}</div>
            <div class="type">${type}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const canvas = document.querySelector('.qr-preview canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `thor-${type.toLowerCase().replace(' ', '-')}-${value}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Thor WMS: ${type}`,
          text: value,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="glass-card" style={{ marginTop: '16px' }}>
      {children && (
        <div className="qr-preview" style={{ marginBottom: '16px' }}>
          <div className="qr-preview-header">{type}</div>
          {children}
          <div className="qr-preview-value">{value}</div>
        </div>
      )}

      {!children && (
        <div style={{ marginBottom: '16px' }}>
          <div className="form-label">{type}</div>
          <div className="result-value">{value}</div>
        </div>
      )}

      <button 
        className={`copy-btn ${copied ? 'copy-btn-success' : 'copy-btn-default'}`} 
        onClick={handleCopy}
        style={{ marginBottom: '12px' }}
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
        {copied ? 'COPIED' : 'COPY'}
      </button>

      <div className="action-row">
        {children && (
          <button className="btn btn-outline" onClick={handleDownload} title="Download PNG">
            <Download size={14} /> Download
          </button>
        )}
        <button className="btn btn-outline" onClick={handlePrint} title="Print Label">
          <Printer size={14} /> Print
        </button>
        <button className="btn btn-outline" onClick={handleShare} title="Share">
          <Share2 size={14} /> Share
        </button>
      </div>
    </div>
  );
};
