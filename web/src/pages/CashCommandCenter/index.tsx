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
    <div style={{ paddingBottom: '40px' }}>
      
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Wallet size={24} color="var(--accent-primary)" /> CASH COMMAND CENTER
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Professional denomination and financial management.</p>
      </div>

      {/* Tabs */}
      <div style={{ 
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
              <Icon size={16} /> {tab.label}
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
