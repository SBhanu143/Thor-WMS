import React from 'react';
import { Header } from '../components/Header';
import { ThunderScanner } from '../components/ThunderScanner';

export const SidePanel: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <main style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        <ThunderScanner />
      </main>
    </div>
  );
};

