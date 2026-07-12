import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { Plus, Search, Edit2, Check, X, ShieldAlert, Mic, Trash2, ArrowUpDown } from 'lucide-react';
import { formatBinLocation } from '../utils/formatter';

export const Inventory: React.FC = () => {
  const { apiCall } = useAuth();
  const { t } = useLocalization();

  const [products, setProducts] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');

  // Sorting, Bulk Actions, Context Menus, and Voice states
  const [sortField, setSortField] = useState<'name' | 'sku' | 'barcode' | 'quantity' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, prodId: string } | null>(null);
  const [isListeningSearch, setIsListeningSearch] = useState(false);

  // Register Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdQty, setNewProdQty] = useState(0);
  const [newProdMin, setNewProdMin] = useState(10);
  const [newProdBin, setNewProdBin] = useState('');
  const [newProdWeight, setNewProdWeight] = useState(0);
  const [newProdDims, setNewProdDims] = useState('');

  // Register Bin Modal
  const [showBinModal, setShowBinModal] = useState(false);
  const [newBinCode, setNewBinCode] = useState('');
  const [newBinZone, setNewBinZone] = useState('Fast-Moving');
  const [newBinAisle, setNewBinAisle] = useState(1);
  const [newBinShelf, setNewBinShelf] = useState(1);
  const [newBinLevel, setNewBinLevel] = useState(1);
  const [newBinCap, setNewBinCap] = useState(10.0);

  // Inline adjustment state
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustVal, setAdjustVal] = useState<number>(0);

  const startSearchVoice = () => {
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Speech) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }
    const rec = new Speech();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setIsListeningSearch(true);
    rec.onend = () => setIsListeningSearch(false);
    rec.onerror = () => setIsListeningSearch(false);

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setSearch(text);
    };

    rec.start();
  };

  const handleSort = (field: 'name' | 'sku' | 'barcode' | 'quantity') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleBulkAdjust = async (offset: number) => {
    try {
      const queueItems = selectedIds.map((id, index) => {
        const prod = products.find(p => p.id === id);
        const newQty = Math.max(0, (prod?.quantity || 0) + offset);
        return {
          id: `sync-bulk-${Date.now()}-${index}`,
          table_name: 'products',
          action_type: 'UPDATE',
          record_id: id,
          payload: {
            id,
            quantity: newQty,
            updated_at: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        };
      });

      await apiCall('/sync', {
        method: 'POST',
        body: JSON.stringify({ queue: queueItems })
      });

      setSelectedIds([]);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed bulk adjust');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, prodId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      prodId
    });
  };

  useEffect(() => {
    const closeContext = () => setContextMenu(null);
    window.addEventListener('click', closeContext);
    return () => window.removeEventListener('click', closeContext);
  }, []);

  const loadData = async () => {
    try {
      const p = await apiCall('/products');
      const b = await apiCall('/bins');
      setProducts(p);
      setBins(b);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku || !newProdBarcode) return;

    try {
      // Mock generating a unique uuid
      const id = `prod-${Date.now()}`;
      await apiCall('/sync', {
        method: 'POST',
        body: JSON.stringify({
          queue: [
            {
              id: `sync-reg-${Date.now()}`,
              table_name: 'products',
              action_type: 'INSERT',
              record_id: id,
              payload: {
                id,
                name: newProdName,
                sku: newProdSku.toUpperCase(),
                barcode: newProdBarcode,
                quantity: Number(newProdQty),
                min_stock_level: Number(newProdMin),
                bin_id: newProdBin,
                weight: Number(newProdWeight),
                dimensions: newProdDims,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              created_at: new Date().toISOString()
            }
          ]
        })
      });
      loadData();
      setShowProductModal(false);
      // Reset forms
      setNewProdName('');
      setNewProdSku('');
      setNewProdBarcode('');
      setNewProdQty(0);
      setNewProdMin(10);
      setNewProdBin('');
    } catch (err: any) {
      alert(err.message || 'Failed to save product.');
    }
  };

  const handleRegisterBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBinCode) return;

    try {
      await apiCall('/bins', {
        method: 'POST',
        body: JSON.stringify({
          code: formatBinLocation(newBinCode),
          zone: newBinZone,
          aisle: Number(newBinAisle),
          shelf: Number(newBinShelf),
          level: Number(newBinLevel),
          capacity_m3: Number(newBinCap)
        })
      });
      loadData();
      setShowBinModal(false);
      setNewBinCode('');
    } catch (err: any) {
      alert(err.message || 'Failed to save bin.');
    }
  };

  const startAdjustQty = (prod: any) => {
    setAdjustingId(prod.id);
    setAdjustVal(prod.quantity);
  };

  const saveAdjustQty = async (id: string) => {
    try {
      await apiCall('/sync', {
        method: 'POST',
        body: JSON.stringify({
          queue: [
            {
              id: `sync-adj-${Date.now()}`,
              table_name: 'products',
              action_type: 'UPDATE',
              record_id: id,
              payload: {
                id,
                quantity: adjustVal,
                updated_at: new Date().toISOString()
              },
              created_at: new Date().toISOString()
            }
          ]
        })
      });
      setAdjustingId(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust quantity.');
    }
  };

  // Filter products by zone & search query
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase());

    if (selectedZone === 'All') return matchesSearch;

    // Find the bin zone for the product
    const productBin = bins.find(b => b.code === p.bin_id || b.id === p.bin_id);
    return matchesSearch && productBin && productBin.zone === selectedZone;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(sortedProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const renderSortIndicator = (field: 'name' | 'sku' | 'barcode' | 'quantity') => {
    if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity: 0.4, marginLeft: '6px' }} />;
    return sortDirection === 'asc' ? <span style={{ marginLeft: '6px' }}>▲</span> : <span style={{ marginLeft: '6px' }}>▼</span>;
  };

  const zones = ['All', 'Fast-Moving', 'Cold Storage', 'Bulky'];

  return (
    <div style={{ position: 'relative' }}>
      
      {/* HEADER SECTION */}
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h2>{t('inventory')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage SKUs, locations, and adjust stock counts with enterprise controls.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setShowBinModal(true)}>
            <Plus size={16} /> Register Bin
          </button>
          <button className="btn btn-primary" onClick={() => setShowProductModal(true)}>
            <Plus size={16} /> {t('addNewProduct')}
          </button>
        </div>
      </div>

      {/* FILTER & VOICE SEARCH BAR */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder={t('searchPlaceholder')}
              style={{ paddingLeft: '44px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            type="button" 
            className={`voice-mic-btn ${isListeningSearch ? 'listening' : ''}`}
            onClick={startSearchVoice}
            title="Search by Voice (e.g. Hammer, Bolt)"
          >
            <Mic size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {zones.map(z => (
            <button 
              key={z} 
              className={`btn ${selectedZone === z ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setSelectedZone(z)}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* CATALOG DATA GRID */}
      <div className="glass-card">
        <div className="table-container">
          <table className="wms-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={sortedProducts.length > 0 && selectedIds.length === sortedProducts.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  {t('name')} {renderSortIndicator('name')}
                </th>
                <th onClick={() => handleSort('sku')} style={{ cursor: 'pointer' }}>
                  {t('sku')} {renderSortIndicator('sku')}
                </th>
                <th onClick={() => handleSort('barcode')} style={{ cursor: 'pointer' }}>
                  {t('barcode')} {renderSortIndicator('barcode')}
                </th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer', width: '180px' }}>
                  {t('quantity')} {renderSortIndicator('quantity')}
                </th>
                <th>{t('binCode')}</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map(p => {
                const isLow = (p.quantity || 0) <= (p.min_stock_level || 10);
                const assignedBin = bins.find(b => b.id === p.bin_id || b.code === p.bin_id);

                return (
                  <tr 
                    key={p.id}
                    onContextMenu={e => handleContextMenu(e, p.id)}
                    style={{ background: selectedIds.includes(p.id) ? 'rgba(99, 102, 241, 0.05)' : '' }}
                  >
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleSelectRow(p.id)}
                      />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </td>
                    <td><code style={{ fontSize: '13px' }}>{p.sku}</code></td>
                    <td><code style={{ fontSize: '13px' }}>{p.barcode}</code></td>
                    <td>
                      {adjustingId === p.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="number" 
                            className="form-input" 
                            value={adjustVal}
                            onChange={(e) => setAdjustVal(Number(e.target.value))}
                            style={{ width: '80px', padding: '6px' }}
                          />
                          <button className="btn btn-primary" style={{ padding: '6px' }} onClick={() => saveAdjustQty(p.id)}>
                            <Check size={14} />
                          </button>
                          <button className="btn btn-outline" style={{ padding: '6px', borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => setAdjustingId(null)}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}>
                          {p.quantity}
                          <button className="btn btn-outline" style={{ padding: '4px 6px', border: 'none' }} onClick={() => startAdjustQty(p)}>
                            <Edit2 size={12} style={{ color: 'var(--text-secondary)' }} />
                          </button>
                        </span>
                      )}
                    </td>
                    <td>
                      {assignedBin ? (
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          background: 'rgba(99, 102, 241, 0.1)', 
                          color: 'var(--accent-primary)',
                          fontWeight: 600,
                          fontSize: '12px'
                        }}>
                          {assignedBin.code} ({assignedBin.zone})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${isLow ? 'badge-error' : 'badge-success'}`}>
                        {isLow ? 'Low Stock' : 'Optimal'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => startAdjustQty(p)}>
                        {t('addStock')}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedProducts.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No products matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="bulk-action-bar">
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            {selectedIds.length} items selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => handleBulkAdjust(10)}>
              Bulk Add (+10)
            </button>
            <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => handleBulkAdjust(-10)}>
              Bulk Deduct (-10)
            </button>
            <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '12px', borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => setSelectedIds([])}>
              Clear Choice
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM FLOATING CONTEXT MENU */}
      {contextMenu && (
        <div 
          className="context-menu-popover" 
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
        >
          <div className="context-menu-item" onClick={() => {
            const prod = products.find(p => p.id === contextMenu.prodId);
            if (prod) {
              setAdjustingId(prod.id);
              setAdjustVal(prod.quantity + 5);
              setTimeout(() => saveAdjustQty(prod.id), 100);
            }
          }}>
            Quick Adjust (+5 Stock)
          </div>
          <div className="context-menu-item" onClick={() => {
            const prod = products.find(p => p.id === contextMenu.prodId);
            if (prod) {
              navigator.clipboard.writeText(prod.barcode);
              alert(`Copied product barcode: ${prod.barcode}`);
            }
          }}>
            Copy Barcode Code
          </div>
          <div className="context-menu-item" style={{ color: 'var(--error)' }} onClick={async () => {
            if (window.confirm('Delete this product SKU?')) {
              try {
                await apiCall('/sync', {
                  method: 'POST',
                  body: JSON.stringify({
                    queue: [{
                      id: `sync-del-${Date.now()}`,
                      table_name: 'products',
                      action_type: 'DELETE',
                      record_id: contextMenu.prodId,
                      payload: { id: contextMenu.prodId },
                      created_at: new Date().toISOString()
                    }]
                  })
                });
                loadData();
              } catch (err: any) {
                alert(err.message || 'Delete failed.');
              }
            }
          }}>
            <Trash2 size={12} /> Delete SKU
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <h3 style={{ marginBottom: '20px' }}>{t('addNewProduct')}</h3>
            <form onSubmit={handleRegisterProduct}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('name')}</label>
                  <input type="text" className="form-input" required value={newProdName} onChange={e => setNewProdName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('sku')}</label>
                  <input type="text" className="form-input" required value={newProdSku} onChange={e => setNewProdSku(e.target.value)} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('barcode')}</label>
                  <input type="text" className="form-input" required value={newProdBarcode} onChange={e => setNewProdBarcode(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('binCode')}</label>
                  <select className="form-input" value={newProdBin} onChange={e => setNewProdBin(e.target.value)}>
                    <option value="">Select Bin...</option>
                    {bins.map(b => (
                      <option key={b.id} value={b.code}>{b.code} ({b.zone})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Initial Quantity</label>
                  <input type="number" className="form-input" value={newProdQty} onChange={e => setNewProdQty(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Level</label>
                  <input type="number" className="form-input" value={newProdMin} onChange={e => setNewProdMin(Number(e.target.value))} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input type="number" step="0.01" className="form-input" value={newProdWeight} onChange={e => setNewProdWeight(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Dimensions (L x W x H cm)</label>
                  <input type="text" className="form-input" placeholder="e.g. 30x20x10" value={newProdDims} onChange={e => setNewProdDims(e.target.value)} />
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowProductModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Bin Modal */}
      {showBinModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '20px' }}>Register New Bin Layout</h3>
            <form onSubmit={handleRegisterBin}>
              <div className="form-group">
                <label className="form-label">Bin Code Location (e.g. A-02-05)</label>
                <input type="text" className="form-input" required placeholder="A-02-05" value={newBinCode} onChange={e => setNewBinCode(formatBinLocation(e.target.value))} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Storage Zone</label>
                  <select className="form-input" value={newBinZone} onChange={e => setNewBinZone(e.target.value)}>
                    <option value="Fast-Moving">Fast-Moving</option>
                    <option value="Cold Storage">Cold Storage</option>
                    <option value="Bulky">Bulky</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (m³)</label>
                  <input type="number" step="0.1" className="form-input" value={newBinCap} onChange={e => setNewBinCap(Number(e.target.value))} />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Aisle</label>
                  <input type="number" className="form-input" value={newBinAisle} onChange={e => setNewBinAisle(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Shelf</label>
                  <input type="number" className="form-input" value={newBinShelf} onChange={e => setNewBinShelf(Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <input type="number" className="form-input" value={newBinLevel} onChange={e => setNewBinLevel(Number(e.target.value))} />
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowBinModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Inventory;
