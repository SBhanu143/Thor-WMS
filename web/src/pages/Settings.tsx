import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { useTheme } from '../context/ThemeContext';
import { Sliders, Languages, Palette, Volume2, Fingerprint } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useAuth();
  const { locale, setLocale, t } = useLocalization();
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ maxWidth: '640px' }}>
      <div className="flex-between" style={{ marginBottom: '32px' }}>
        <div>
          <h2>{t('settings')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your personal workspace preferences and scanning settings.</p>
        </div>
      </div>

      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Languages Switch */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: 'var(--accent-primary)' }}>
            <Languages size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: '6px' }}>{t('appLanguage')}</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Select your language interface. Changes apply immediately without reloading the system.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`btn ${locale === 'en' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 20px', fontSize: '13px' }}
                onClick={() => setLocale('en')}
              >
                English (US)
              </button>
              <button 
                className={`btn ${locale === 'te' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 20px', fontSize: '13px' }}
                onClick={() => setLocale('te')}
              >
                తెలుగు (Telugu)
              </button>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

        {/* Themes Select */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: 'var(--accent-secondary)' }}>
            <Palette size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: '6px' }}>{t('interfaceTheme')}</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Toggle custom appearance stylings, including light mode and high-contrast modes for accessibility.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setTheme('dark')}
              >
                {t('dark')}
              </button>
              <button 
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setTheme('light')}
              >
                {t('light')}
              </button>
              <button 
                className={`btn ${theme === 'high_contrast' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setTheme('high_contrast')}
              >
                {t('contrast')}
              </button>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

        {/* Scanner Preferences */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: 'var(--success)' }}>
            <Volume2 size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: '6px' }}>{t('scanAlertBeep')}</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Triggers a system confirmation sound upon successful QR scan validations.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings?.scanner_beep !== false}
                onChange={(e) => updateSettings({ scanner_beep: e.target.checked })}
              />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Play scan audio confirmations</span>
            </label>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

        {/* Biometrics Preferences */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', color: 'var(--info)' }}>
            <Fingerprint size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: '6px' }}>{t('biometricAccess')}</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Activate Face ID / fingerprint biometric options on linked mobile terminals.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={!!settings?.biometrics_enabled}
                onChange={(e) => updateSettings({ biometrics_enabled: e.target.checked })}
              />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Enable Biometric login lock on phone</span>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Settings;
