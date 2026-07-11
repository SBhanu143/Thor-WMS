import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { Download, FileText, ClipboardList, Shield, Loader } from 'lucide-react';

export const Reporting: React.FC = () => {
  const { apiCall, token } = useAuth();
  const { t } = useLocalization();

  const [reports, setReports] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  const [reportType, setReportType] = useState('inventory'); // 'inventory' | 'activity' | 'audits'
  const [reportFormat, setReportFormat] = useState('pdf'); // 'pdf' | 'excel' | 'csv' | 'json'
  const [exportLoading, setExportLoading] = useState(false);

  const loadData = async () => {
    try {
      const r = await apiCall('/reports');
      const a = await apiCall('/activity-logs');
      setReports(r);
      setActivities(a);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportLoading(true);

    try {
      const url = `${API_BASE}/reports/export?type=${reportType}&format=${reportFormat}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Export generation failed.');

      // Download trigger
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Filename resolver
      const fileExtensions: Record<string, string> = { pdf: 'pdf', excel: 'xlsx', csv: 'csv', json: 'json' };
      link.setAttribute('download', `${reportType}-report.${fileExtensions[reportFormat]}`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Reload reports audit logs
      loadData();
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h2>{t('reporting')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Generate certified WMS report data sheets and download audit logs.</p>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        
        {/* Export configurations */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <FileText size={18} color="var(--accent-primary)" />
            {t('exportCenter')}
          </h3>

          <form onSubmit={handleExport}>
            <div className="form-group">
              <label className="form-label">{t('selectExportType')}</label>
              <select className="form-input" value={reportType} onChange={e => setReportType(e.target.value)}>
                <option value="inventory">Warehouse Inventory Status Sheet</option>
                <option value="audits">Reconciliation Cycle Audits List</option>
                <option value="activity">Employee Audit Trails History</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('selectExportFormat')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  type="button" 
                  className={`btn ${reportFormat === 'pdf' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '13px' }}
                  onClick={() => setReportFormat('pdf')}
                >
                  Adobe PDF (.pdf)
                </button>
                <button 
                  type="button" 
                  className={`btn ${reportFormat === 'excel' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '13px' }}
                  onClick={() => setReportFormat('excel')}
                >
                  Microsoft Excel (.xlsx)
                </button>
                <button 
                  type="button" 
                  className={`btn ${reportFormat === 'csv' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '13px' }}
                  onClick={() => setReportFormat('csv')}
                >
                  Comma Separated (.csv)
                </button>
                <button 
                  type="button" 
                  className={`btn ${reportFormat === 'json' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '13px' }}
                  onClick={() => setReportFormat('json')}
                >
                  JavaScript JSON (.json)
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={exportLoading}>
              {exportLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader size={16} className="loader" /> Generating Download...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={16} /> {t('generateExport')}
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Activity audit trails display */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Shield size={18} color="var(--accent-secondary)" />
            {t('historyLogs')}
          </h3>
          
          <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="wms-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Employee</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{log.full_name}</span><br />
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>@{log.username}</span>
                    </td>
                    <td>
                      <span className={`badge ${log.action.includes('SUCCESS') ? 'badge-success' : log.action.includes('FAIL') || log.action.includes('CONFLICT') ? 'badge-error' : 'badge-info'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{log.details}</td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No activity logs recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Reporting;
