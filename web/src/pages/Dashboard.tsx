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

      <div className="dashboard-cards">
        
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

// --- Live Scanner Network Visualization ---
const LiveScannerNetwork: React.FC<{ activeScans: number }> = ({ activeScans }) => {
  return (
    <div style={{ position: 'relative', height: '150px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', overflow: 'hidden', padding: '16px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
        <div style={{ fontSize: '11px', color: 'var(--accent-secondary)', letterSpacing: '0.1em' }}>LIVE SCANNER NETWORK</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="holo-ring" style={{ width: '10px', height: '10px', position: 'relative' }}></div>
          <span style={{ fontSize: '10px', color: 'var(--success)' }}>ONLINE: 4</span>
        </div>
      </div>
      
      <div style={{ flex: 1, position: 'relative', marginTop: '10px' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="scan-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-secondary)" stopOpacity="0.2" />
              <stop offset="50%" stopColor="var(--accent-primary)" />
              <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          {/* Base lines */}
          <path d="M 20 50 L 100 50 L 140 80 L 220 80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
          <path d="M 280 20 L 240 50 L 100 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
          
          {/* Active energy lines (animated via CSS) */}
          <path d="M 20 50 L 100 50 L 140 80 L 220 80" fill="none" stroke="url(#scan-grad)" strokeWidth="2" strokeDasharray="100" className="scanner-line-anim" />
          <path d="M 280 20 L 240 50 L 100 50" fill="none" stroke="url(#scan-grad)" strokeWidth="2" strokeDasharray="100" className="scanner-line-anim-2" />
          
          {/* Nodes */}
          <circle cx="20" cy="50" r="4" fill="var(--accent-secondary)" className="scanner-node" />
          <circle cx="100" cy="50" r="6" fill="var(--accent-primary)" className="scanner-hub" />
          <circle cx="140" cy="80" r="4" fill="var(--accent-secondary)" className="scanner-node" />
          <circle cx="220" cy="80" r="4" fill="var(--accent-secondary)" className="scanner-node" />
          <circle cx="280" cy="20" r="4" fill="var(--accent-secondary)" className="scanner-node" />
        </svg>
      </div>
    </div>
  );
};

// --- Abstract Warehouse Visualization ---
const AbstractWarehouse: React.FC = () => {
  return (
    <div className="abstract-warehouse-container">
      <div className="iso-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={`iso-bin ${i === 4 ? 'active-bin' : i === 7 ? 'low-stock-bin' : ''}`}></div>
        ))}
      </div>
    </div>
  );
};
