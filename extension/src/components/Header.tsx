import React from 'react';
import { ThunderHammer } from './ThunderHammer';

export const Header: React.FC = () => {
  return (
    <header className="ext-header">
      <ThunderHammer size={24} />
      <div className="ext-header-info">
        <h1 className="ext-header-title">THOR WMS</h1>
        <div className="ext-header-subtitle" style={{ color: 'var(--accent-secondary)' }}>THUNDER SCANNER</div>
        <div className="status-dot">READY</div>
      </div>
    </header>
  );
};
