import React from 'react';
import { Settings, Eye } from 'lucide-react';

export const CashSettings: React.FC = () => {
  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Settings size={18} color="var(--accent-primary)" /> CASH SETTINGS
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <label className="form-label">CURRENCY DISPLAY</label>
          <select className="form-input">
            <option>₹ INR (Indian Rupee)</option>
          </select>
        </div>

        <div>
          <label className="form-label">CURRENCY VISUALS</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }}>ON</button>
            <button className="btn btn-outline" style={{ flex: 1 }}>OFF</button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <label className="form-label">DENOMINATION VISIBILITY</label>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Hide denominations you do not use to save space.</p>
          
          <div className="cash-grid-person-date">
            {[500, 200, 100, 50, 20, 10].map(val => (
              <div key={val} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{val} Note</span>
                <button className="btn btn-ghost" style={{ padding: '4px' }}><Eye size={16} color="var(--accent-primary)" /></button>
              </div>
            ))}
          </div>

          <label className="form-label" style={{ marginTop: '20px' }}>COIN VISIBILITY</label>
          <div className="cash-grid-person-date">
            {[20, 10, 5, 2, 1].map(val => (
              <div key={val} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{val} Coin</span>
                <button className="btn btn-ghost" style={{ padding: '4px' }}><Eye size={16} color="var(--accent-primary)" /></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
