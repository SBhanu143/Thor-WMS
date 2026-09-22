import React, { useState } from 'react';
import { Calculator, ArrowRight, Delete } from 'lucide-react';
import { formatIndianCurrency } from '../utils/cashEngine';

interface CashCalculatorProps {
  onAddToCash: (amount: number) => void;
}

export const CashCalculator: React.FC<CashCalculatorProps> = ({ onAddToCash }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  
  // Advanced safe math eval function (avoiding raw eval)
  const calculateResult = (expr: string) => {
    try {
      // Basic sanitization
      const sanitized = expr.replace(/[^0-9+\-*/.]/g, '');
      if (!sanitized) return '0';
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + sanitized)();
      if (!isFinite(result)) return 'Error';
      return String(Math.round(result * 100) / 100);
    } catch {
      return 'Error';
    }
  };

  const handlePress = (val: string) => {
    if (val === 'AC') {
      setDisplay('0');
      setEquation('');
      return;
    }
    if (val === 'C') {
      setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
      return;
    }
    if (val === '=') {
      const res = calculateResult(display);
      setEquation(display + ' =');
      setDisplay(res);
      return;
    }
    
    // Replace visual operators with math ones for state
    let inputVal = val;
    if (val === '×') inputVal = '*';
    if (val === '÷') inputVal = '/';
    if (val === '−') inputVal = '-';
    
    setDisplay(prev => prev === '0' && !['+','-','*','/'].includes(inputVal) ? inputVal : prev + inputVal);
  };

  const handleGst = (percentage: number, add: boolean) => {
    const current = parseFloat(calculateResult(display)) || 0;
    const factor = add ? (1 + percentage / 100) : (1 - percentage / 100);
    const res = String(Math.round(current * factor * 100) / 100);
    setEquation(`${current} ${add ? '+' : '-'} ${percentage}% GST =`);
    setDisplay(res);
  };

  const handleTransfer = () => {
    const res = parseFloat(calculateResult(display));
    if (!isNaN(res) && res > 0) {
      onAddToCash(res);
    }
  };

  const btnStyle = { padding: '20px', fontSize: '20px', fontWeight: 600, borderRadius: '12px' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
      
      {/* Calculator Interface */}
      <div className="glass-card" style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'right', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', height: '20px', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{equation}</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em', overflowWrap: 'break-word', wordBreak: 'break-all' }}>{display}</div>
        </div>

        <div className="calculator-grid">
          <button className="btn btn-outline calculator-btn" style={{ color: 'var(--error)', fontSize: '18px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('AC')}>AC</button>
          <button className="btn btn-outline calculator-btn" style={{ color: 'var(--warning)', fontSize: '18px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('C')}><Delete size={20}/></button>
          <button className="btn btn-outline calculator-btn" style={{ color: 'var(--accent-primary)', fontSize: '18px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('%')}>%</button>
          <button className="btn btn-outline calculator-btn" style={{ color: 'var(--accent-primary)', fontSize: '18px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('÷')}>÷</button>

          {[7, 8, 9].map(n => <button key={n} className="btn calculator-btn" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '20px', fontWeight: 600, padding: 0 }} onClick={() => handlePress(n.toString())}>{n}</button>)}
          <button className="btn btn-outline calculator-btn" style={{ color: 'var(--accent-primary)', fontSize: '18px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('×')}>×</button>

          {[4, 5, 6].map(n => <button key={n} className="btn calculator-btn" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '20px', fontWeight: 600, padding: 0 }} onClick={() => handlePress(n.toString())}>{n}</button>)}
          <button className="btn btn-outline calculator-btn" style={{ color: 'var(--accent-primary)', fontSize: '18px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('−')}>−</button>

          {[1, 2, 3].map(n => <button key={n} className="btn calculator-btn" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '20px', fontWeight: 600, padding: 0 }} onClick={() => handlePress(n.toString())}>{n}</button>)}
          <button className="btn btn-outline calculator-btn" style={{ color: 'var(--accent-primary)', fontSize: '18px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('+')}>+</button>

          <button className="btn calculator-btn" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '18px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('00')}>00</button>
          <button className="btn calculator-btn" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '20px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('0')}>0</button>
          <button className="btn calculator-btn" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '20px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('.')}>.</button>
          <button className="btn btn-primary calculator-btn" style={{ fontSize: '20px', fontWeight: 600, padding: 0 }} onClick={() => handlePress('=')}>=</button>
        </div>

        <button className="btn btn-outline btn-block" style={{ marginTop: '20px', padding: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }} onClick={handleTransfer}>
          ADD TO CASH <ArrowRight size={18} />
        </button>

      </div>

      {/* GST Sidebar */}
      <div className="glass-card" style={{ alignSelf: 'start' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px', letterSpacing: '0.05em' }}><Calculator size={16} /> GST CALCULATOR</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Apply standard Indian GST rates instantly to your current calculation.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {[5, 8, 12, 18].map(gst => (
            <React.Fragment key={gst}>
              <button className="btn btn-outline" style={{ color: 'var(--success)' }} onClick={() => handleGst(gst, true)}>+ {gst}% GST</button>
              <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => handleGst(gst, false)}>− {gst}% GST</button>
            </React.Fragment>
          ))}
        </div>
        
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '3px solid var(--accent-secondary)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>CURRENT RESULT</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{formatIndianCurrency(parseFloat(calculateResult(display)) || 0)}</div>
        </div>
      </div>

    </div>
  );
};
