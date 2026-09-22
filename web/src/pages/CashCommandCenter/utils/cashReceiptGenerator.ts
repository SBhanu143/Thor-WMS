import { jsPDF } from 'jspdf';
import type { CashEntry } from './cashStorage';
import { formatIndianCurrency, denominations } from './cashEngine';

export const getReceiptStatus = (entry: CashEntry) => {
    if (entry.targetAmount === undefined) return { diff: 0, status: 'NO TARGET', color: '#000000' };
    const difference = entry.targetAmount - entry.cashTotal;
    if (difference > 0) return { diff: difference, status: 'LESS', color: '#dc2626' }; 
    if (difference < 0) return { diff: Math.abs(difference), status: 'EXTRA', color: '#d97706' };
    return { diff: 0, status: 'EXACT', color: '#16a34a' };
};

export const generatePdfBlob = (entry: CashEntry): Blob => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200]
    });

    let y = 10;
    const center = (text: string, currentY: number, size = 10, bold = false) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (80 - textWidth) / 2, currentY);
    };

    const leftRight = (left: string, right: string, currentY: number, size = 9, bold = false) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.text(left, 5, currentY);
        const rightWidth = doc.getTextWidth(right);
        doc.text(right, 75 - rightWidth, currentY);
    };

    const line = (currentY: number) => {
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(5, currentY, 75, currentY);
    };

    center('THOR WMS', y, 14, true); y += 6;
    center('CASH DENOMINATION RECEIPT', y, 10, true); y += 8;
    
    line(y); y += 6;
    
    leftRight('Transaction:', entry.id, y, 9); y += 5;
    leftRight('Date:', `${entry.date} ${entry.time}`, y, 9); y += 5;
    leftRight('User:', entry.personName || 'N/A', y, 9); y += 8;

    line(y); y += 6;

    const { diff, status } = getReceiptStatus(entry);
    
    if (entry.targetAmount !== undefined && entry.targetAmount !== 0) {
        leftRight('Target Amount:', formatIndianCurrency(entry.targetAmount), y, 10, true); y += 6;
    }
    leftRight('Cash Counted:', formatIndianCurrency(entry.cashTotal), y, 10, true); y += 6;
    
    if (entry.targetAmount !== undefined && entry.targetAmount !== 0) {
        leftRight('Difference:', `${formatIndianCurrency(diff)} ${status}`, y, 10, true); y += 8;
    }

    line(y); y += 6;
    
    center('DENOMINATION DETAILS', y, 10, true); y += 6;
    
    const printDenom = (val: number, count: number) => {
        if (!count || count <= 0) return;
        leftRight(`Rs.${val} x ${count}`, formatIndianCurrency(val * count), y, 9);
        y += 5;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Banknotes', 5, y); y += 5;
    denominations.notes.forEach(v => printDenom(v, entry.notes[v]));
    y += 2;

    doc.setFont('helvetica', 'bold');
    doc.text('Coins', 5, y); y += 5;
    denominations.coins.forEach(v => printDenom(v, entry.coins[v]));
    y += 5;

    line(y); y += 6;

    if (entry.onlineAmount > 0) { leftRight('Online Payment:', formatIndianCurrency(entry.onlineAmount), y, 9); y += 5; }
    if (entry.manualAddition > 0) { leftRight('Manual Addition:', formatIndianCurrency(entry.manualAddition), y, 9); y += 5; }
    if (entry.manualDeduction > 0) { leftRight('Manual Deduction:', `-${formatIndianCurrency(entry.manualDeduction)}`, y, 9); y += 5; }

    y += 2;
    leftRight('GRAND TOTAL:', formatIndianCurrency(entry.grandTotal), y, 12, true);

    return doc.output('blob');
};

export const generatePngBlob = async (entry: CashEntry): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        
        let activeDenoms = 0;
        denominations.notes.forEach(v => { if (entry.notes[v] > 0) activeDenoms++; });
        denominations.coins.forEach(v => { if (entry.coins[v] > 0) activeDenoms++; });
        
        canvas.height = 350 + (activeDenoms * 25);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        
        let y = 40;
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('THOR WMS', 200, y); y += 30;
        
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('CASH DENOMINATION RECEIPT', 200, y); y += 30;

        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        const line = (cy: number) => {
            ctx.beginPath();
            ctx.moveTo(30, cy);
            ctx.lineTo(370, cy);
            ctx.stroke();
        };

        line(y); y += 25;

        ctx.textAlign = 'left';
        ctx.font = '14px sans-serif';
        const leftRight = (left: string, right: string, currentY: number, bold = false) => {
            ctx.font = bold ? 'bold 14px sans-serif' : '14px sans-serif';
            ctx.fillText(left, 30, currentY);
            ctx.textAlign = 'right';
            ctx.fillText(right, 370, currentY);
            ctx.textAlign = 'left';
        };

        leftRight('Transaction:', entry.id, y); y += 25;
        leftRight('Date:', `${entry.date} ${entry.time}`, y); y += 25;
        leftRight('User:', entry.personName || 'N/A', y); y += 25;

        line(y); y += 25;

        const { diff, status, color } = getReceiptStatus(entry);
        
        if (entry.targetAmount !== undefined && entry.targetAmount !== 0) {
            leftRight('Target Amount:', formatIndianCurrency(entry.targetAmount), y, true); y += 25;
        }
        leftRight('Cash Counted:', formatIndianCurrency(entry.cashTotal), y, true); y += 25;
        
        if (entry.targetAmount !== undefined && entry.targetAmount !== 0) {
            ctx.fillStyle = color;
            leftRight('Difference:', `${formatIndianCurrency(diff)} ${status}`, y, true); y += 30;
            ctx.fillStyle = '#000000';
        }

        line(y); y += 30;

        ctx.textAlign = 'center';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('DENOMINATION DETAILS', 200, y); y += 30;
        ctx.textAlign = 'left';

        const printDenom = (val: number, count: number) => {
            if (!count || count <= 0) return;
            leftRight(`Rs.${val} x ${count}`, formatIndianCurrency(val * count), y);
            y += 25;
        };

        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Banknotes', 30, y); y += 25;
        denominations.notes.forEach(v => printDenom(v, entry.notes[v]));
        
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('Coins', 30, y); y += 25;
        denominations.coins.forEach(v => printDenom(v, entry.coins[v]));

        line(y); y += 25;

        if (entry.onlineAmount > 0) { leftRight('Online Payment:', formatIndianCurrency(entry.onlineAmount), y); y += 25; }
        if (entry.manualAddition > 0) { leftRight('Manual Addition:', formatIndianCurrency(entry.manualAddition), y); y += 25; }
        if (entry.manualDeduction > 0) { leftRight('Manual Deduction:', `-${formatIndianCurrency(entry.manualDeduction)}`, y); y += 25; }

        y += 40;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('GRAND TOTAL:', 30, y);
        ctx.textAlign = 'right';
        ctx.fillText(formatIndianCurrency(entry.grandTotal), 370, y);
        
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
        }, 'image/png');
    });
};

export const getReceiptSummaryText = (entry: CashEntry): string => {
    let text = `THOR WMS — CASH RECEIPT\n`;
    text += `Transaction: ${entry.id}\n`;
    text += `Date: ${entry.date} ${entry.time}\n`;
    text += `User: ${entry.personName || 'N/A'}\n\n`;
    
    if (entry.targetAmount !== undefined && entry.targetAmount !== 0) {
        text += `Target: ${formatIndianCurrency(entry.targetAmount)}\n`;
    }
    text += `Counted: ${formatIndianCurrency(entry.cashTotal)}\n`;
    
    if (entry.targetAmount !== undefined && entry.targetAmount !== 0) {
        const { diff, status } = getReceiptStatus(entry);
        text += `Difference: ${formatIndianCurrency(diff)} ${status}\n\n`;
    }

    text += `GRAND TOTAL: ${formatIndianCurrency(entry.grandTotal)}\n\n`;
    
    text += `Denominations:\n`;
    denominations.notes.forEach(v => {
        if (entry.notes[v]) text += `Rs.${v} x ${entry.notes[v]}\n`;
    });
    denominations.coins.forEach(v => {
        if (entry.coins[v]) text += `Rs.${v} x ${entry.coins[v]}\n`;
    });

    return text;
};

export const printReceipt = (entry: CashEntry) => {
    const summary = getReceiptSummaryText(entry).replace(/\n/g, '<br/>');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt ${entry.id}</title>
                <style>
                    body { font-family: monospace; padding: 20px; font-size: 14px; max-width: 400px; margin: 0 auto; }
                    .center { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px; }
                    .hr { border-bottom: 1px dashed #000; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="center">THOR WMS<br>CASH RECEIPT</div>
                <div>${summary}</div>
                <div class="hr"></div>
                <div class="center" style="font-size: 12px; margin-top: 20px;">END OF RECEIPT</div>
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
};

export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
};
