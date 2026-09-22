import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { type CashEntry, getCashHistory, deleteCashEntry } from '../utils/cashStorage';
import { formatIndianCurrency } from '../utils/cashEngine';

export const CashHistory: React.FC = () => {
  const [history, setHistory] = useState<CashEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setHistory(getCashHistory());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this entry permanently?')) {
      deleteCashEntry(id);
      setHistory(getCashHistory());
    }
  };

  const filtered = history.filter(h => {
    if (filter !== 'all' && h.type !== filter) return false;
    if (search && !h.personName.toLowerCase().includes(search.toLowerCase()) && !h.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalIn = history.filter(h => h.type === 'credit').reduce((a, b) => a + b.grandTotal, 0);
  const totalOut = history.filter(h => h.type === 'debit').reduce((a, b) => a + b.grandTotal, 0);
  const net = totalIn - totalOut;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Summary Banner */}
      <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>TOTAL CASH IN</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)' }}>{formatIndianCurrency(totalIn)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>TOTAL CASH OUT</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--error)' }}>{formatIndianCurrency(totalOut)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>NET AMOUNT</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)' }}>{formatIndianCurrency(net)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            style={{ paddingLeft: '36px' }} 
            placeholder="Search by name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input" style={{ width: '150px' }} value={filter} onChange={e => setFilter(e.target.value as any)}>
          <option value="all">ALL ENTRIES</option>
          <option value="credit">CREDIT ONLY</option>
          <option value="debit">DEBIT ONLY</option>
        </select>
      </div>

      {/* History Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filtered.map(entry => (
          <div key={entry.id} className="glass-card" style={{ position: 'relative', overflow: 'hidden', borderLeft: `4px solid ${entry.type === 'credit' ? 'var(--success)' : 'var(--error)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{entry.personName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{entry.date} • {entry.time}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, color: entry.type === 'credit' ? 'var(--success)' : 'var(--error)' }}>
                {entry.type === 'credit' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {entry.type.toUpperCase()}
              </div>
            </div>
            
            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cash:</span>
                <span>{formatIndianCurrency(entry.cashTotal)}</span>
              </div>
              {entry.onlineAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Online:</span>
                  <span>{formatIndianCurrency(entry.onlineAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span>Total:</span>
                <span>{formatIndianCurrency(entry.grandTotal)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" style={{ flex: 1, fontSize: '11px' }}><Eye size={14} /> VIEW</button>
              <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => handleDelete(entry.id)}><Trash2 size={14} /></button>
            </div>
            
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '80px', opacity: 0.02, pointerEvents: 'none' }}>
              {entry.type === 'credit' ? '+' : '-'}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No history entries found.
          </div>
        )}
      </div>

    </div>
  );
};
