import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { 
  Package, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Maximize2, 
  Volume2, 
  Clock 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { apiCall } = useAuth();
  const { t } = useLocalization();

  const [products, setProducts] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  
  // Simulator states
  const [simBarcode, setSimBarcode] = useState('');
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  const loadData = async () => {
    try {
      const p = await apiCall('/products');
      const b = await apiCall('/bins');
      const s = await apiCall('/scan/history');
      const i = await apiCall('/issues');
      const a = await apiCall('/audits');

      setProducts(p);
      setBins(b);
      setScans(s);
      setIssues(i);
      setAudits(a);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleSimulateScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simBarcode) return;

    setSimLoading(true);
    setSimResult(null);
    try {
      const data = await apiCall('/scan', {
        method: 'POST',
        body: JSON.stringify({
          barcode: simBarcode,
          deviceInfo: 'Web Console Emulator'
        })
      });
      setSimResult(data);
      setSimBarcode('');
      loadData(); // reload scanner logs
    } catch (err: any) {
      setSimResult({ error: err.message || 'Scan error occurred.' });
    } finally {
      setSimLoading(false);
    }
  };

  // KPIs calculations
  const totalSku = products.length;
  const totalStock = products.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const lowStockCount = products.filter(p => (p.quantity || 0) <= (p.min_stock_level || 10)).length;
  const pendingAudits = audits.filter(a => a.status !== 'Completed').length;

  const matchScans = scans.filter(s => s.scan_status === 'Match').length;
  const accuracy = scans.length > 0 ? Math.round((matchScans / scans.length) * 100) : 100;

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h2>{t('systemOverview')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Real-time warehouse operational performance indicators.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={loadData}>Refresh</button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div>
            <span className="form-label" style={{ margin: 0 }}>{t('kpiTotalProducts')}</span>
            <div className="kpi-val">{totalSku}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Registered catalog SKUs</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-primary)' }}>
            <Package size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div>
            <span className="form-label" style={{ margin: 0 }}>{t('kpiTotalStock')}</span>
            <div className="kpi-val">{totalStock}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total items on floor</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ color: 'var(--accent-secondary)' }}>
            <MapPin size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div>
            <span className="form-label" style={{ margin: 0 }}>{t('kpiScanAccuracy')}</span>
            <div className="kpi-val">{accuracy}%</div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Correct barcode matching rate</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div>
            <span className="form-label" style={{ margin: 0 }}>{t('kpiPendingCounts')}</span>
            <div className="kpi-val">{pendingAudits}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Uncompleted cycle schedules</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ color: 'var(--warning)' }}>
            <Clock size={24} />
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '32px', gridTemplateColumns: '2fr 1fr 1fr' }}>
        
        {/* Recent scans */}
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--accent-primary)" />
              {t('recentScans')}
            </h3>
            <span className="badge badge-info">{scans.length} Scanned</span>
          </div>
          <div className="table-container">
            <table className="wms-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Barcode</th>
                  <th>Status</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {scans.slice(0, 5).map((scan) => (
                  <tr key={scan.id}>
                    <td>{new Date(scan.created_at).toLocaleTimeString()}</td>
                    <td><code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{scan.scanned_barcode}</code></td>
                    <td>
                      <span className={`badge ${scan.scan_status === 'Match' ? 'badge-success' : 'badge-error'}`}>
                        {scan.scan_status}
                      </span>
                    </td>
                    <td>{scan.device_info}</td>
                  </tr>
                ))}
                {scans.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No scanner activity registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scan emulator widget */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Maximize2 size={18} color="var(--accent-secondary)" />
            Scan Emulator
          </h3>
          <form onSubmit={handleSimulateScan}>
            <div className="form-group">
              <label className="form-label">Scan Barcode Code</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. TH-HAMMER-001"
                value={simBarcode} 
                onChange={(e) => setSimBarcode(e.target.value)} 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={simLoading}>
              {simLoading ? 'Simulating...' : 'Submit Scan'}
            </button>
          </form>

          {simResult && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${simResult.matched ? 'var(--success)' : 'var(--error)'}`
            }}>
              {simResult.error ? (
                <div style={{ color: 'var(--error)', fontSize: '13px' }}>{simResult.error}</div>
              ) : (
                <div>
                  <div className="flex-between" style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: simResult.matched ? 'var(--success)' : 'var(--error)' }}>
                      {simResult.matched ? 'MATCH FOUND' : 'MISMATCH WARNING'}
                    </span>
                    <Volume2 size={14} color={simResult.matched ? 'var(--success)' : 'var(--error)'} />
                  </div>
                  {simResult.matched ? (
                    <div style={{ fontSize: '13px' }}>
                      <p style={{ fontWeight: 600 }}>{simResult.product.name}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>SKU: {simResult.product.sku}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Qty: {simResult.product.quantity} units</p>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Barcode logged in alert history.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <AlertTriangle size={18} color="var(--error)" />
            {t('stockAlert')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {products
              .filter(p => (p.quantity || 0) <= (p.min_stock_level || 10))
              .slice(0, 4)
              .map(p => (
                <div key={p.id} style={{ 
                  padding: '12px', 
                  background: 'rgba(239, 68, 68, 0.05)', 
                  border: '1px solid rgba(239, 68, 68, 0.1)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600 }}>{p.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SKU: {p.sku}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--error)' }}>{p.quantity}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Min: {p.min_stock_level}</p>
                  </div>
                </div>
              ))}
            {products.filter(p => (p.quantity || 0) <= (p.min_stock_level || 10)).length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '10px' }}>
                All inventory quantities are above minimum stock levels.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
