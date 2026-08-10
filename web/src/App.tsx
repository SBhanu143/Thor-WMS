import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useLocalization } from './context/LocalizationContext';
import { useTheme } from './context/ThemeContext';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { QRGenerator } from './pages/QRGenerator';
import { Audits } from './pages/Audits';
import { Reporting } from './pages/Reporting';
import { Settings } from './pages/Settings';
import { BarcodeSheet } from './pages/BarcodeSheet';
import { 
  Warehouse, 
  LayoutDashboard, 
  Package, 
  QrCode, 
  ClipboardList, 
  FileText, 
  Settings as SettingsIcon, 
  LogOut,
  User,
  Fingerprint,
  Search,
  Command,
  Barcode
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ThunderHammer } from './components/ThunderHammer';
import { AlertTriangle } from 'lucide-react';

const AppContent: React.FC = () => {
  const { token, user, login, pinLogin, logout, isLoading } = useAuth();
  const { locale, setLocale, t } = useLocalization();
  const { theme, setTheme } = useTheme();

  const [currentPage, setCurrentPage] = useState<'dashboard' | 'inventory' | 'qr' | 'barcode-sheet' | 'audits' | 'reporting' | 'settings'>('dashboard');

  // Command Palette states
  const [showPalette, setShowPalette] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0);

  // Login form states
  const [authMode, setAuthMode] = useState<'credentials' | 'pin'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const commands = [
    { name: 'Navigate to Dashboard', action: () => setCurrentPage('dashboard'), shortcut: 'Alt+D' },
    { name: 'Navigate to Inventory Catalog', action: () => setCurrentPage('inventory'), shortcut: 'Alt+I' },
    { name: 'Navigate to Smart QR Generator', action: () => setCurrentPage('qr'), shortcut: 'Alt+Q' },
    { name: 'Navigate to Barcode Sheet Generator', action: () => setCurrentPage('barcode-sheet'), shortcut: 'Alt+B' },
    ...(user && ['Admin', 'WarehouseManager', 'TeamLeader'].includes(user.role) ? [
      { name: 'Navigate to Cycle Audits', action: () => setCurrentPage('audits'), shortcut: 'Alt+A' }
    ] : []),
    ...(user && ['Admin', 'WarehouseManager'].includes(user.role) ? [
      { name: 'Navigate to Reporting & Logs', action: () => setCurrentPage('reporting'), shortcut: 'Alt+R' }
    ] : []),
    { name: 'Navigate to Settings & Configuration', action: () => setCurrentPage('settings'), shortcut: 'Alt+S' },
    { name: 'Toggle Theme to Dark Mode', action: () => setTheme('dark'), shortcut: '' },
    { name: 'Toggle Theme to Light Mode', action: () => setTheme('light'), shortcut: '' },
    { name: 'Toggle Theme to High Contrast', action: () => setTheme('high_contrast'), shortcut: '' },
    { name: 'Toggle Language (English / తెలుగు)', action: () => setLocale(locale === 'en' ? 'te' : 'en'), shortcut: '' },
    { name: 'Sign Out Session', action: () => logout(), shortcut: '' }
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K to toggle palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowPalette(prev => !prev);
        setPaletteQuery('');
        setSelectedPaletteIndex(0);
        return;
      }

      // Escape to close palette
      if (e.key === 'Escape') {
        setShowPalette(false);
        return;
      }

      // Alt shortcuts for navigation
      if (e.altKey && user) {
        const key = e.key.toLowerCase();
        if (key === 'd') { e.preventDefault(); setCurrentPage('dashboard'); }
        if (key === 'i') { e.preventDefault(); setCurrentPage('inventory'); }
        if (key === 'q') { e.preventDefault(); setCurrentPage('qr'); }
        if (key === 'b') { e.preventDefault(); setCurrentPage('barcode-sheet'); }
        if (key === 'a' && ['Admin', 'WarehouseManager', 'TeamLeader'].includes(user.role)) { e.preventDefault(); setCurrentPage('audits'); }
        if (key === 'r' && ['Admin', 'WarehouseManager'].includes(user.role)) { e.preventDefault(); setCurrentPage('reporting'); }
        if (key === 's') { e.preventDefault(); setCurrentPage('settings'); }
      }

      // Command palette navigation
      if (showPalette) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedPaletteIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedPaletteIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedPaletteIndex]) {
            filteredCommands[selectedPaletteIndex].action();
            setShowPalette(false);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPalette, filteredCommands, selectedPaletteIndex, token, user]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setAuthError('');

    let success = false;
    if (authMode === 'credentials') {
      success = await login(username, password);
    } else {
      success = await pinLogin(username, pin);
    }

    setLoginLoading(false);
    if (!success) {
      setAuthError(t('invalidCreds'));
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen" data-theme={theme}>
        <div className="loading-content">
          <ThunderHammer size={160} className="loading-hammer" />
          <h2 className="loading-title">THOR WMS</h2>
          <div className="loading-bar"><div className="loading-progress"></div></div>
        </div>
      </div>
    );
  }


  // Sidebar Layout
  return (
    <div className="app-container" data-theme={theme}>
      
      {/* Sidebar navigation */}
      <aside className="sidebar premium-sidebar">
        <div className="logo-container">
          <ThunderHammer size={40} />
          <div>
            <div className="logo-text">THOR WMS</div>
            <div className="logo-tagline">COMMAND CENTER</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div className="sidebar-section-title">COMMAND CENTER</div>
          <div 
            className={`menu-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </div>

          <div className="sidebar-section-title">INVENTORY</div>
          <div 
            className={`menu-item ${currentPage === 'inventory' ? 'active' : ''}`}
            onClick={() => setCurrentPage('inventory')}
          >
            <Package size={18} />
            Inventory Catalog
          </div>

          <div className="sidebar-section-title">SMART OPERATIONS</div>
          <div 
            className={`menu-item ${currentPage === 'qr' ? 'active' : ''}`}
            onClick={() => setCurrentPage('qr')}
          >
            <QrCode size={18} />
            Thunder Scanner
          </div>

          <div 
            className={`menu-item ${currentPage === 'barcode-sheet' ? 'active' : ''}`}
            onClick={() => setCurrentPage('barcode-sheet')}
          >
            <Barcode size={18} />
            Barcode Generator
          </div>

          {user && ['Admin', 'WarehouseManager', 'TeamLeader'].includes(user.role) && (
            <div 
              className={`menu-item ${currentPage === 'audits' ? 'active' : ''}`}
              onClick={() => setCurrentPage('audits')}
            >
              <ClipboardList size={18} />
              Cycle Audits
            </div>
          )}

          {user && ['Admin', 'WarehouseManager'].includes(user.role) && (
            <div 
              className={`menu-item ${currentPage === 'reporting' ? 'active' : ''}`}
              onClick={() => setCurrentPage('reporting')}
            >
              <FileText size={18} />
              Reports & Exports
            </div>
          )}

          <div className="sidebar-section-title">SYSTEM</div>
          <div 
            className={`menu-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            <SettingsIcon size={18} />
            Settings & Config
          </div>
        </nav>

        {/* Sidebar user footer */}
        <div className="menu-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', padding: '0 8px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--accent-secondary)'
            }}>
              <User size={16} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {user.role}
              </div>
            </div>
          </div>
          <button className="btn btn-outline" style={{ width: '100%', gap: '6px', justifyContent: 'center' }} onClick={logout}>
            <LogOut size={14} /> {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Pages panel */}
      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'inventory' && <Inventory />}
        {currentPage === 'qr' && <QRGenerator />}
        {currentPage === 'barcode-sheet' && <BarcodeSheet />}
        {currentPage === 'audits' && <Audits />}
        {currentPage === 'reporting' && <Reporting />}
        {currentPage === 'settings' && <Settings />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <div className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </div>
        <div className={`nav-item ${currentPage === 'inventory' ? 'active' : ''}`} onClick={() => setCurrentPage('inventory')}>
          <Package size={20} />
          <span>Inventory</span>
        </div>
        <div className={`nav-item ${currentPage === 'qr' ? 'active' : ''}`} onClick={() => setCurrentPage('qr')}>
          <QrCode size={20} />
          <span>Smart QR</span>
        </div>
        <div className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => setCurrentPage('settings')}>
          <SettingsIcon size={20} />
          <span>Settings</span>
        </div>
      </nav>

      {/* Global Command Palette (Ctrl+K) */}
      {showPalette && (
        <div className="command-palette-overlay" onClick={() => setShowPalette(false)}>
          <div className="command-palette" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', padding: '0 16px' }}>
              <Command size={18} color="var(--accent-secondary)" />
              <input 
                autoFocus
                type="text" 
                className="command-palette-input" 
                style={{ borderBottom: 'none' }}
                placeholder="Search command actions (e.g. settings, light, dark...)" 
                value={paletteQuery}
                onChange={e => {
                  setPaletteQuery(e.target.value);
                  setSelectedPaletteIndex(0);
                }}
              />
            </div>
            <div className="command-palette-results">
              {filteredCommands.map((cmd, idx) => (
                <div 
                  key={cmd.name}
                  className={`command-palette-item ${idx === selectedPaletteIndex ? 'selected' : ''}`}
                  onClick={() => {
                    cmd.action();
                    setShowPalette(false);
                  }}
                  onMouseEnter={() => setSelectedPaletteIndex(idx)}
                >
                  <span>{cmd.name}</span>
                  {cmd.shortcut && (
                    <span className="command-palette-shortcut">{cmd.shortcut}</span>
                  )}
                </div>
              ))}
              {filteredCommands.length === 0 && (
                <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                  No commands match search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppContent />
  );
};
export default App;
