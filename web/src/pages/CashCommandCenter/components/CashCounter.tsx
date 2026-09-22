import React, { useState, useEffect } from 'react';
import { User, Calendar, CreditCard, Banknote, Coins, Plus, Minus, RefreshCw, Save, Share2, Printer } from 'lucide-react';
import { denominations, calculateDenominationTotals, calculateGrandTotal, numberToWords, formatIndianCurrency } from '../utils/cashEngine';
import { saveCashEntry, CashEntry } from '../utils/cashStorage';
import { generatePdfBlob, generatePngBlob, getReceiptSummaryText, downloadBlob, printReceipt } from '../utils/cashReceiptGenerator';

interface CashCounterProps {
  onAddAmountToCalculator?: (amount: number) => void;
  calculatorAmount?: number;
}

export const CashCounter: React.FC<CashCounterProps> = ({ calculatorAmount }) => {


  // NEW STATE FOR SAVED ENTRY
  const [savedEntry, setSavedEntry] = useState<CashEntry | null>(null);

  // LOADING STATES FOR RECEIPT GENERATION
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingPng, setLoadingPng] = useState(false);

  const [personName, setPersonName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryType, setEntryType] = useState<'credit' | 'debit'>('credit');
  const [showMobileAdjust, setShowMobileAdjust] = useState(false);
  
  const [targetAmount, setTargetAmount] = useState<string>('');

  const [notes, setNotes] = useState<Record<number, string>>(
    denominations.notes.reduce((acc, val) => ({ ...acc, [val]: '' }), {})
  );
  const [coins, setCoins] = useState<Record<number, string>>(
    denominations.coins.reduce((acc, val) => ({ ...acc, [val]: '' }), {})
  );
  
  const [onlineAmount, setOnlineAmount] = useState<number>(0);
  const [manualAddition, setManualAddition] = useState<number>(0);
  const [manualDeduction, setManualDeduction] = useState<number>(0);

  // Live Calculations
  const { notesTotal, coinsTotal, cashTotal, totalPieces } = calculateDenominationTotals(notes, coins);
  const grandTotal = calculateGrandTotal(cashTotal, onlineAmount, manualAddition, manualDeduction);

  const parsedTarget = targetAmount === '' ? 0 : Number(targetAmount);
  const difference = parsedTarget - cashTotal;
  let statusColor = 'var(--accent-secondary)';
  let statusText = '';
  
  if (targetAmount !== '') {
    if (difference > 0) {
      statusText = `₹${Math.abs(difference).toLocaleString('en-IN')} LESS`;
      statusColor = 'var(--error)';
    } else if (difference < 0) {
      statusText = `₹${Math.abs(difference).toLocaleString('en-IN')} EXTRA`;
      statusColor = 'var(--warning)';
    } else {
      statusText = '✓ EXACT AMOUNT';
      statusColor = 'var(--success)';
    }
  }

  const handleNoteChange = (val: number, qty: string) => {
    const cleaned = qty.replace(/\D/g, '');
    setNotes(prev => ({ ...prev, [val]: cleaned }));
  };

  const handleCoinChange = (val: number, qty: string) => {
    const cleaned = qty.replace(/\D/g, '');
    setCoins(prev => ({ ...prev, [val]: cleaned }));
  };

  const handleSave = () => {
    if (!personName) {
      alert("Please enter a person's name"); // Fallback for toast
      return;
    }

    const numericNotes = Object.fromEntries(Object.entries(notes).map(([k, v]) => [k, v ? parseInt(v, 10) : 0]));
    const numericCoins = Object.fromEntries(Object.entries(coins).map(([k, v]) => [k, v ? parseInt(v, 10) : 0]));

    saveCashEntry({
      personName,
      type: entryType,
      notes: numericNotes,
      coins: numericCoins,
      cashTotal,
      onlineAmount,
      manualAddition,
      manualDeduction,
      grandTotal
    });
    alert("CASH ENTRY SAVED"); // Ideally replace with a toast
    handleClear();
  };

  const handleClear = () => {
    if (window.confirm("Clear all data?")) {
      setTargetAmount('');
      setNotes(denominations.notes.reduce((acc, val) => ({ ...acc, [val]: '' }), {}));
      setCoins(denominations.coins.reduce((acc, val) => ({ ...acc, [val]: '' }), {}));
      setOnlineAmount(0);
      setManualAddition(0);
      setManualDeduction(0);
      setPersonName('');
    }
  };

  // Add from Calculator if button was pressed on calculator tab (simulated via props)
  useEffect(() => {
    if (calculatorAmount) {
      setManualAddition(prev => prev + calculatorAmount);
    }
  }, [calculatorAmount]);


  return (
    <div className="cash-counter-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <style>{`
        .cc-mobile-only { display: none !important; }
        @media (max-width: 767px) {
          .cc-desktop-only { display: none !important; }
          .cc-mobile-only { display: flex !important; }
          .cc-mobile-block { display: block !important; }

          /* User Info */
          .cc-mobile-user-grid {
             grid-template-columns: 1fr 1fr !important;
             gap: 8px !important;
             padding: 12px !important;
          }
          
          /* Target Input */
          .cc-mobile-target-card {
             padding: 16px !important;
          }
          .cc-mobile-target-input {
             font-size: 20px !important;
             padding: 8px 8px 8px 32px !important;
          }

          /* Summary Cards */
          .cc-mobile-summary-grid {
             grid-template-columns: 1fr 1fr !important;
             gap: 8px !important;
          }
          .cc-mobile-summary-grid > div {
             padding: 12px !important;
          }
          .cc-mobile-summary-grid .cc-mobile-balance {
             grid-column: span 2 !important;
          }

          /* Denominations */
          .cc-mobile-denom-grid {
             grid-template-columns: 1fr !important;
             gap: 12px !important;
          }
          .cc-mobile-denom-card {
             padding: 12px !important;
          }
          .cc-mobile-denom-row {
             padding: 8px !important;
             margin-bottom: 4px !important;
          }
          .cc-mobile-denom-img {
             width: 50px !important;
             height: 36px !important;
             font-size: 11px !important;
          }
          .cc-mobile-denom-input {
             width: 60px !important;
             padding: 8px !important;
          }
          
          /* Adjustments (Expandable) */
          .cc-mobile-adjust-card {
             padding: 12px !important;
             cursor: pointer;
          }
          
          /* Final Summary Grid */
          .cc-mobile-final-grid {
             grid-template-columns: 1fr 1fr !important;
             gap: 12px !important;
             padding: 12px !important;
          }
          .cc-mobile-final-grand {
             grid-column: span 2 !important;
             border-left: none !important;
             border-top: 1px solid rgba(255,255,255,0.1);
             padding-left: 0 !important;
             padding-top: 12px !important;
          }

          /* Actions Grid */
          .cc-mobile-actions {
             display: grid !important;
             grid-template-columns: 1fr 1fr !important;
             gap: 8px !important;
          }
          .cc-mobile-actions > button {
             width: 100% !important;
             min-width: 0 !important;
             padding: 10px !important;
          }
          .cc-mobile-actions > .btn-primary {
             grid-column: span 2 !important;
          }
        }
      `}</style>

      {/* User / Entry Info */}
      <div className="glass-card cc-mobile-user-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> PERSON NAME</label>
          <input type="text" className="form-input" value={personName} onChange={e => setPersonName(e.target.value)} placeholder="Enter Name" />
        </div>
        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> DATE</label>
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {/* Credit / Debit Segment */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', padding: '4px' }}>
        <button 
          className="btn" 
          style={{ flex: 1, background: entryType === 'credit' ? 'var(--success)' : 'transparent', color: entryType === 'credit' ? '#fff' : 'var(--text-secondary)' }}
          onClick={() => setEntryType('credit')}
        >
          CREDIT
        </button>
        <button 
          className="btn" 
          style={{ flex: 1, background: entryType === 'debit' ? 'var(--error)' : 'transparent', color: entryType === 'debit' ? '#fff' : 'var(--text-secondary)' }}
          onClick={() => setEntryType('debit')}
        >
          DEBIT
        </button>
      </div>

      {/* Target Amount Input */}
      <div className="glass-card cc-mobile-target-card" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)' }}>
        <label className="form-label" style={{ fontSize: '12px', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>AMOUNT TO TALLY / TARGET AMOUNT</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '16px', top: '12px', fontSize: '24px', color: 'var(--text-muted)' }}>₹</span>
          <input 
            type="text" 
            inputMode="numeric"
            pattern="[0-9]*"
            className="form-input cc-mobile-target-input" 
            style={{ fontSize: '28px', paddingLeft: '44px', paddingBottom: '12px', paddingTop: '12px', fontWeight: 800, background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1)' }}
            value={targetAmount} 
            onChange={e => setTargetAmount(e.target.value.replace(/\D/g, ''))} 
            placeholder="0" 
          />
        </div>
      </div>

      {/* Live Summary Cards */}
      <div className="cc-mobile-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '16px', borderTop: '3px solid #fbbf24' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>TARGET AMOUNT</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>{formatIndianCurrency(parsedTarget)}</div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center', padding: '16px', borderTop: '3px solid var(--success)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>CASH COUNTED</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>{formatIndianCurrency(cashTotal)}</div>
        </div>
        <div className="glass-card cc-mobile-balance" style={{ textAlign: 'center', padding: '16px', borderTop: `3px solid ${statusColor}`, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: '11px', color: statusColor, marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>BALANCE</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: statusColor }}>{statusText || '₹0'}</div>
        </div>
      </div>

      {/* Denominations & Extras Grid */}
      <div className="cc-mobile-denom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Banknotes */}
        <div className="glass-card cc-mobile-denom-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', letterSpacing: '0.05em' }}><Banknote size={16} color="var(--accent-primary)" /> BANKNOTES</h3>
          {denominations.notes.map(val => (
            <div key={val} className="denomination-row cc-mobile-denom-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="cc-mobile-denom-img" style={{
                  width: '70px', height: '40px', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '14px', color: '#fff',
                  background: val === 500 ? 'linear-gradient(135deg, #4b5563, #374151)' : val === 200 ? 'linear-gradient(135deg, #ea580c, #9a3412)' : val === 100 ? 'linear-gradient(135deg, #4f46e5, #312e81)' : val === 50 ? 'linear-gradient(135deg, #0284c7, #075985)' : val === 20 ? 'linear-gradient(135deg, #16a34a, #14532d)' : 'linear-gradient(135deg, #9333ea, #581c87)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ lineHeight: 1 }}>₹{val}</div>
                  <div className="cc-desktop-only" style={{ fontSize: '9px', opacity: 0.8, letterSpacing: '0.05em', marginTop: '2px' }}>NOTE</div>
                </div>
                <span className="cc-desktop-only" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>×</span>
                <input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="form-input cc-mobile-denom-input" 
                  style={{ width: '70px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}
                  value={notes[val] || ''}
                  onChange={(e) => handleNoteChange(val, e.target.value)}
                  placeholder="0"
                />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatIndianCurrency(val * (notes[val] ? Number(notes[val]) : 0))}
              </div>
            </div>
          ))}
        </div>

        <div>
          {/* Coins */}
          <div className="glass-card cc-mobile-denom-card" style={{ marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', letterSpacing: '0.05em' }}><Coins size={16} color="#fbbf24" /> COINS</h3>
            {denominations.coins.map(val => (
              <div key={val} className="denomination-row cc-mobile-denom-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="cc-mobile-denom-img" style={{
                    width: '40px', height: '40px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: '12px', color: '#fff',
                    background: 'radial-gradient(circle at 30% 30%, #fcd34d, #b45309)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{ lineHeight: 1 }}>₹{val}</div>
                    <div className="cc-desktop-only" style={{ fontSize: '8px', opacity: 0.9, marginTop: '2px' }}>COIN</div>
                  </div>
                  <span className="cc-desktop-only" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>×</span>
                  <input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="form-input cc-mobile-denom-input" 
                    style={{ width: '70px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}
                    value={coins[val] || ''}
                    onChange={(e) => handleCoinChange(val, e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatIndianCurrency(val * (coins[val] ? Number(coins[val]) : 0))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional Adjustments */}
          <div className="glass-card cc-mobile-adjust-card" onClick={() => { if (window.innerWidth <= 767) setShowMobileAdjust(!showMobileAdjust); }}>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: !showMobileAdjust ? '0' : '16px', fontSize: '14px', letterSpacing: '0.05em' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={16} /> ADJUSTMENTS</span>
              <span className="cc-mobile-only" style={{ fontSize: '18px', fontWeight: 'bold' }}>{showMobileAdjust ? '−' : '+'}</span>
            </h3>
            
            <div className={!showMobileAdjust ? 'cc-desktop-only' : ''} onClick={e => e.stopPropagation()}>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>ONLINE PAYMENT</label>
                <input type="number" className="form-input" value={onlineAmount || ''} onChange={e => setOnlineAmount(parseFloat(e.target.value) || 0)} placeholder="₹ 0" />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--success)' }}><Plus size={12} style={{display:'inline'}}/> MANUAL ADDITION</label>
                <input type="number" className="form-input" value={manualAddition || ''} onChange={e => setManualAddition(parseFloat(e.target.value) || 0)} placeholder="₹ 0" />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '11px', color: 'var(--error)' }}><Minus size={12} style={{display:'inline'}}/> MANUAL DEDUCTION</label>
                <input type="number" className="form-input" value={manualDeduction || ''} onChange={e => setManualDeduction(parseFloat(e.target.value) || 0)} placeholder="₹ 0" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Final Summary & Actions */}
      <div className="glass-card" style={{ textAlign: 'center' }}>
        <div className="cc-mobile-final-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL PIECES</div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{totalPieces}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CASH TOTAL</div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{formatIndianCurrency(cashTotal)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ONLINE PAYMENT</div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{formatIndianCurrency(onlineAmount)}</div>
          </div>
          <div className="cc-mobile-final-grand" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--accent-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GRAND TOTAL</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>{formatIndianCurrency(grandTotal)}</div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amount in Words</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '20px' }}>
          {numberToWords(grandTotal)}
        </div>
        
        <div className="cc-mobile-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ flex: 1, minWidth: '150px' }} onClick={handleSave}><Save size={16} /> SAVE ENTRY</button>
          <button className="btn btn-outline" style={{ flex: 1, minWidth: '120px' }}><Share2 size={16} /> SHARE</button>
          <button className="btn btn-outline" style={{ flex: 1, minWidth: '120px' }}><Printer size={16} /> RECEIPT</button>
          <button className="btn btn-ghost" onClick={handleClear} style={{ color: 'var(--error)' }}><RefreshCw size={16} /> CLEAR</button>
        </div>
      </div>
      
    </div>
  );
};
