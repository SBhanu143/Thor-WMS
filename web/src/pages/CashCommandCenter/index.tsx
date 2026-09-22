import React, { useState } from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import { History, Calculator, Wallet, FileText, Settings } from 'lucide-react';

import './CashMobile.css';

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
    <div className="cash-command-center">
      
      <div className="cash-header">
        <h2>
          <Wallet size={24} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} /> 
          <span>CASH COMMAND<br/>CENTER</span>
        </h2>
        <p>Professional cash management</p>
      </div>

      {/* Tabs */}
      <div className="cash-tabs-container">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="cash-tab-btn"
              style={{
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                boxShadow: isActive ? '0 4px 12px rgba(34,211,238,0.3)' : 'none'
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} /> <span>{tab.label}</span>
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
