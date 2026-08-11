import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import extVersionData from '../extension-version.json';
import { 
  Package, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Clock,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ExtensionPromoCard: React.FC = () => {
  const [showInstall, setShowInstall] = useState(false);
  const webStoreUrl = import.meta.env.VITE_CHROME_WEB_STORE_URL;
  const version = extVersionData.version || "1.0.0";
  const zipPath = `/downloads/Thor-WMS-Extension-v${version}.zip`;

  return (
    <div className="glass-card" style={{ 
      background: 'linear-gradient(145deg, #0d1520, #060b13)',
      border: '1px solid var(--accent-primary)',
      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }}></div>
      
      <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '0.05em', color: '#e2e8f0' }}>THOR WMS</h3>
            <span className="badge badge-info" style={{ fontSize: '10px' }}>EXTENSION v{version}</span>
          </div>
          <p style={{ color: 'var(--accent-secondary)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Warehouse Command Center
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px', lineHeight: 1.5 }}>
            Your warehouse tools, always beside your dashboard. Generate QR codes, format bin locations, and use your device camera as a real scanner without switching tabs.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={12} color="var(--success)" /> Smart QR</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={12} color="var(--success)" /> Barcode</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={12} color="var(--success)" /> Scanner</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={12} color="var(--success)" /> Bin Formatter</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={12} color="var(--success)" /> BB Formatter</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={12} color="var(--success)" /> Empty Bin</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {webStoreUrl ? (
          <a href={webStoreUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>
            <ExternalLink size={16} /> ADD TO CHROME
          </a>
        ) : (
          <a href={zipPath} download className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>
            <Download size={16} /> DOWNLOAD FOR TESTING
          </a>
        )}
        
        <button className="btn btn-ghost" onClick={() => setShowInstall(!showInstall)} style={{ fontSize: '12px' }}>
          {showInstall ? <ChevronUp size={16} /> : <ChevronDown size={16} />} How to install
        </button>
      </div>

      {showInstall && (
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', position: 'relative', zIndex: 1 }}>
          <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Installation Guide</h4>
          
          {webStoreUrl ? (
            <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.8 }}>
              <li>Click <strong>ADD TO CHROME</strong> to open the Chrome Web Store.</li>
              <li>Click <strong>Add to Chrome</strong> on the store page.</li>
              <li>Click the Extensions puzzle icon in Chrome and <strong>Pin</strong> Thor WMS.</li>
            </ol>
          ) : (
            <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.8 }}>
              <li><strong>Download</strong> the ZIP file and <strong>Extract</strong> it to a folder.</li>
              <li>Open Chrome and navigate to <code style={{ background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>chrome://extensions</code>.</li>
              <li>Enable <strong>Developer mode</strong> (toggle in top right).</li>
              <li>Click <strong>Load unpacked</strong> and select the extracted extension folder.</li>
              <li>Click the Extensions puzzle icon in Chrome and <strong>Pin</strong> Thor WMS.</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { apiCall } = useAuth();
  const { t } = useLocalization();

  const [products, setProducts] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const p = await apiCall('/products');
      const s = await apiCall('/scan/history');
      const a = await apiCall('/audits');

      setProducts(p);
      setScans(s);
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
        
        {/* Extension Promotional Card */}
        <ExtensionPromoCard />

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
