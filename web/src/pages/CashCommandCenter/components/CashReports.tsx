import React from 'react';
import { Download, FileText, Filter } from 'lucide-react';

export const CashReports: React.FC = () => {
  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <FileText size={18} color="var(--accent-primary)" /> CASH REPORTS
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <div className="cash-grid-person-date">
          <div>
            <label className="form-label">START DATE</label>
            <input type="date" className="form-input" />
          </div>
          <div>
            <label className="form-label">END DATE</label>
            <input type="date" className="form-input" />
          </div>
        </div>

        <div>
          <label className="form-label">ENTRY TYPE</label>
          <select className="form-input">
            <option>ALL ENTRIES</option>
            <option>CREDIT ONLY</option>
            <option>DEBIT ONLY</option>
          </select>
        </div>

        <div>
          <label className="form-label">REPORT TYPE</label>
          <select className="form-input">
            <option>ALL TRANSACTIONS SUMMARY</option>
            <option>DAY-WISE SUMMARY</option>
            <option>DENOMINATION BREAKDOWN</option>
          </select>
        </div>

        <button className="btn btn-primary btn-block" style={{ marginTop: '16px', padding: '16px' }} onClick={() => alert('PDF generation initiated...')}>
          <Download size={18} style={{ marginRight: '8px' }} /> DOWNLOAD PDF REPORT
        </button>

      </div>
    </div>
  );
};
