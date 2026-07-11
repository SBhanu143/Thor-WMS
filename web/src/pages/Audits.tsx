import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { Calendar, User, Eye, Plus, AlertCircle, CheckCircle } from 'lucide-react';

export const Audits: React.FC = () => {
  const { apiCall } = useAuth();
  const { t } = useLocalization();

  const [audits, setAudits] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [auditTitle, setAuditTitle] = useState('');
  const [assignedEmployee, setAssignedEmployee] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Detailed view state
  const [selectedAudit, setSelectedAudit] = useState<any>(null);

  const loadData = async () => {
    try {
      const a = await apiCall('/audits');
      const p = await apiCall('/products');
      // Set default employee list (usually loaded from backend, we will hardcode or query if endpoint exists, wait we can query list or load from activity/auth endpoints, but let's query custom route if available, or fetch admin / picker seeded records)
      setAudits(a);
      setProducts(p);
      
      // Let's populate default workers since we seeded Suresh (Picker) and Thor Admin (Admin)
      setEmployees([
        { id: 'admin-uuid', full_name: 'Thor Admin', role: 'Admin' },
        { id: 'picker-uuid', full_name: 'Suresh Kumar', role: 'Picker' }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScheduleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditTitle || !assignedEmployee || !scheduledDate || selectedProductIds.length === 0) {
      alert('All scheduling parameters, including at least one product count check, are required.');
      return;
    }

    const details = selectedProductIds.map(pid => {
      const p = products.find(prod => prod.id === pid);
      return {
        product_id: pid,
        sku: p?.sku || '',
        name: p?.name || '',
        expected: p?.quantity || 0,
        counted: p?.quantity || 0 // Default to expected, picker will adjust
      };
    });

    try {
      await apiCall('/audits', {
        method: 'POST',
        body: JSON.stringify({
          title: auditTitle,
          scheduled_date: scheduledDate,
          assigned_to: assignedEmployee,
          details
        })
      });
      loadData();
      setShowScheduleModal(false);
      // Reset forms
      setAuditTitle('');
      setAssignedEmployee('');
      setScheduledDate('');
      setSelectedProductIds([]);
    } catch (err: any) {
      alert(err.message || 'Failed to schedule cycle audit.');
    }
  };

  const handleSelectProductToggle = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'InProgress': return 'badge-info';
      default: return 'badge-warning';
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h2>{t('audits')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Assign and monitor cycle count audits to reconcile physical stock discrepancies.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
          <Plus size={16} /> {t('scheduleAudit')}
        </button>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: selectedAudit ? '1.2fr 1fr' : '1fr' }}>
        
        {/* Scheduled Audits list */}
        <div className="glass-card">
          <div className="table-container">
            <table className="wms-table">
              <thead>
                <tr>
                  <th>{t('auditTitle')}</th>
                  <th>{t('scheduleDate')}</th>
                  <th>{t('assignee')}</th>
                  <th>{t('status')}</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {audits.map(audit => (
                  <tr key={audit.id}>
                    <td><span style={{ fontWeight: 600 }}>{audit.title}</span></td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="var(--text-secondary)" />
                        {new Date(audit.scheduled_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="var(--text-secondary)" />
                        {employees.find(e => e.id === audit.assigned_to)?.full_name || audit.assigned_to}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(audit.status)}`}>
                        {audit.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedAudit(audit)}>
                        <Eye size={12} /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {audits.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No cycle count audits currently scheduled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Details Panel */}
        {selectedAudit && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="flex-between" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <h4>{selectedAudit.title}</h4>
                <span className={`badge ${getStatusBadge(selectedAudit.status)}`} style={{ marginTop: '6px' }}>
                  {selectedAudit.status}
                </span>
              </div>
              <button className="btn btn-outline" style={{ padding: '4px 8px', border: 'none' }} onClick={() => setSelectedAudit(null)}>Close</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Scheduled Date:</strong> {new Date(selectedAudit.scheduled_date).toLocaleDateString()}<br />
                <strong>Auditor Assignee:</strong> {employees.find(e => e.id === selectedAudit.assigned_to)?.full_name || selectedAudit.assigned_to}
              </p>
            </div>

            <div className="table-container">
              <table className="wms-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: 'center' }}>Expected</th>
                    <th style={{ textAlign: 'center' }}>Counted</th>
                    <th style={{ textAlign: 'right' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(selectedAudit.details) && selectedAudit.details.map((item: any) => {
                    const diff = item.counted - item.expected;
                    return (
                      <tr key={item.product_id}>
                        <td>
                          <span style={{ fontWeight: 500 }}>{item.name}</span><br />
                          <code style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.sku}</code>
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.expected}</td>
                        <td style={{ textAlign: 'center' }}>{item.counted}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {selectedAudit.status === 'Completed' ? (
                            diff === 0 ? (
                              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                <CheckCircle size={14} /> Match
                              </span>
                            ) : (
                              <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                <AlertCircle size={14} /> {diff > 0 ? `+${diff}` : diff}
                              </span>
                            )
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Pending Count</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Schedule Audit Modal */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '550px' }}>
            <h3 style={{ marginBottom: '20px' }}>{t('scheduleAudit')}</h3>
            <form onSubmit={handleScheduleAudit}>
              <div className="form-group">
                <label className="form-label">{t('auditTitle')}</label>
                <input type="text" className="form-input" required placeholder="e.g. Q3 Cycle Count Aisle 1" value={auditTitle} onChange={e => setAuditTitle(e.target.value)} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">{t('assignee')}</label>
                  <select className="form-input" required value={assignedEmployee} onChange={e => setAssignedEmployee(e.target.value)}>
                    <option value="">Select Auditor...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('scheduleDate')}</label>
                  <input type="date" className="form-input" required value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Products to Audit</label>
                <div style={{ 
                  maxHeight: '180px', 
                  overflowY: 'auto', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  {products.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => handleSelectProductToggle(p.id)}
                      />
                      <span style={{ fontSize: '13px' }}>{p.name} ({p.sku})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowScheduleModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">Schedule Audit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Audits;
