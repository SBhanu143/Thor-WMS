import React, { useState } from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import { History, Calculator, Wallet, FileText, Settings } from 'lucide-react';

import { CashCounter } from './components/CashCounter';
import { CashCalculator } from './components/CashCalculator';
import { CashHistory } from './components/CashHistory';
import { CashReports } from './components/CashReports';
import { CashSettings } from './components/CashSettings';

export const CashCommandCenter: React.FC = () => {
  const { t } = useLocalization();
  const [activeTab, setActiveTab] = useState<'counter' | 'history' | 'calculator' | 'reports' | 'settings'>('counter');
  const [calculatorAmount, setCalculatorAmount] = useState<number>(0);

  const handleAddFromCalculator = (amount: number) => {
    setCalculatorAmount(amount);
    setActiveTab('counter');
  };

  const tabs = [
    { id: 'history', label: 'HISTORY', icon: History },
    { id: 'counter', label: 'CASH COUNTER', icon: Wallet },
    { id: 'calculator', label: 'CALCULATOR', icon: Calculator },
    { id: 'reports', label: 'REPORTS', icon: FileText },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ] as const;

  return (
    <div className="cash-mobile-container" style={{ paddingBottom: '40px' }}>
      
      <style>{`
        .cash-mobile-only { display: none !important; }
        @media (max-width: 767px) {
          .cash-desktop-only { display: none !important; }
          .cash-mobile-only { display: flex !important; }
          .cash-mobile-only-block { display: block !important; }
          
          .cash-mobile-container {
             padding-bottom: 120px !important;
          }

          .cash-mobile-header {
             margin-bottom: 16px !important;
          }
          .cash-mobile-header h2 {
             font-size: 18px !important;
          }
          .cash-mobile-header p {
             font-size: 11px !important;
          }

          .cash-mobile-tabs {
             gap: 4px !important;
             padding: 4px !important;
             margin-bottom: 16px !important;
             flex-wrap: wrap !important;
          }
          .cash-mobile-tabs button {
             padding: 8px 6px !important;
             font-size: 10px !important;
             flex: 1 1 30% !important;
             min-width: 0 !important;
          }
        }
      `}</style>
      
      <div className="cash-mobile-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Wallet size={24} color="var(--accent-primary)" /> CASH <span className="cash-desktop-only">COMMAND CENTER</span>
          <span className="cash-mobile-only-block" style={{ display: 'none', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Command Center</span>
        </h2>
        <p className="cash-desktop-only" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Professional denomination and financial management.</p>
      </div>

      {/* Tabs */}
      <div className="cash-mobile-tabs" style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px', 
        overflowX: 'auto', 
        background: 'rgba(0,0,0,0.3)', 
        padding: '8px', 
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                minWidth: 'max-content',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 600,
                fontSize: '12px',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isActive ? '0 4px 12px rgba(34,211,238,0.3)' : 'none'
              }}
            >
              <Icon size={16} /> <span className="cash-desktop-only">{tab.label}</span>
              <span className="cash-mobile-only-block" style={{ display: 'none' }}>
                {tab.id === 'counter' ? 'COUNTER' : tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content Area */}
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {activeTab === 'counter' && <CashCounter calculatorAmount={calculatorAmount} />}
        {activeTab === 'history' && <CashHistory />}
        {activeTab === 'calculator' && <CashCalculator onAddToCash={handleAddFromCalculator} />}
        {activeTab === 'reports' && <CashReports />}
        {activeTab === 'settings' && <CashSettings />}
      </div>

    </div>
  );
};
