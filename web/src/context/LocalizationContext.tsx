import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'te';

type TranslationDictionary = {
  [key: string]: string;
};

const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    // Nav Bar
    dashboard: 'Dashboard',
    inventory: 'Inventory Catalog',
    qrGenerator: 'QR & Barcode Generator',
    audits: 'Cycle Audits',
    reporting: 'Reports & Exports',
    settings: 'Settings & Config',
    logout: 'Log Out',

    // Dashboard
    welcome: 'Welcome back',
    systemOverview: 'Smart Warehouse Overview',
    stockAlert: 'Low Stock Alerts',
    activeAudits: 'Active Audits',
    reportedIssues: 'Reported Issues',
    recentScans: 'Recent Scanner History',
    viewAll: 'View All',
    kpiTotalProducts: 'Total SKUs',
    kpiTotalStock: 'Total Stock Volume',
    kpiScanAccuracy: 'Scanner Match Accuracy',
    kpiPendingCounts: 'Pending Audits',

    // Inventory
    searchPlaceholder: 'Search by Product Name, SKU, or Barcode...',
    sku: 'SKU',
    barcode: 'Barcode',
    quantity: 'Quantity',
    binCode: 'Bin Location',
    actions: 'Actions',
    addStock: 'Adjust Quantity',
    addNewProduct: 'Register New Product',
    name: 'Product Name',
    description: 'Description',
    zone: 'Zone',
    aisle: 'Aisle',
    shelf: 'Shelf',
    level: 'Level',
    capacity: 'Capacity (m³)',
    save: 'Save',
    cancel: 'Cancel',

    // QR Page
    generateQrTitle: 'Generate Product & Bin Labels',
    printSelected: 'Print Labels',
    downloadPdf: 'Export Label Sheet (PDF)',
    labelType: 'Label Type',
    selectProduct: 'Select Target Product',
    selectBin: 'Select Target Bin Location',

    // Audits
    scheduleAudit: 'Schedule Cycle Count',
    auditTitle: 'Audit Title',
    assignee: 'Assignee',
    scheduleDate: 'Schedule Date',
    status: 'Status',
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    discrepancy: 'Discrepancy',
    reconcile: 'Reconcile Count',

    // Reporting
    exportCenter: 'WMS Data Export Center',
    selectExportType: 'Select Report Focus',
    selectExportFormat: 'Select Output File Format',
    generateExport: 'Generate & Download Export',
    historyLogs: 'System Activity Logs',

    // Settings
    wmsConfiguration: 'WMS System Configurations',
    appLanguage: 'Application Language',
    interfaceTheme: 'Interface Design Theme',
    biometricAccess: 'Biometric Access Lock',
    scanAlertBeep: 'Scanner Audio Beep Alert',
    syncInterval: 'Device Auto Sync Interval',
    dark: 'Dark Glassmorphic',
    light: 'Standard Light',
    contrast: 'Accessible High Contrast',

    // Errors & Auth
    loginTitle: 'Thor WMS Portal',
    loginSubtitle: 'Warehouse Productivity Platform',
    username: 'Username',
    password: 'Password',
    rememberMe: 'Remember Session on this Device',
    loginBtn: 'Secure Login',
    loginPinBtn: 'Login via PIN Code',
    enterPin: 'Enter 4-Digit Security PIN',
    invalidCreds: 'Invalid username, password, or PIN.'
  },
  te: {
    // Nav Bar
    dashboard: 'డాష్‌బోర్డ్',
    inventory: 'వస్తువుల కేటలాగ్',
    qrGenerator: 'QR & బార్‌కోడ్ జెనరేటర్',
    audits: 'సైకిల్ ఆడిట్స్',
    reporting: 'నివేదికలు & ఎగుమతులు',
    settings: 'సిస్టమ్ సెట్టింగులు',
    logout: 'లాగ్ అవుట్',

    // Dashboard
    welcome: 'స్వాగతం',
    systemOverview: 'స్మార్ట్ గిడ్డంగి అవలోకనం',
    stockAlert: 'తక్కువ స్టాక్ హెచ్చరికలు',
    activeAudits: 'యాక్టివ్ ఆడిట్స్',
    reportedIssues: 'నివేదించబడిన సమస్యలు',
    recentScans: 'ఇటీవలి స్కానర్ చరిత్ర',
    viewAll: 'అన్నీ చూడండి',
    kpiTotalProducts: 'మొత్తం వస్తువులు',
    kpiTotalStock: 'మొత్తం స్టాక్ పరిమాణం',
    kpiScanAccuracy: 'స్కానర్ మ్యాచ్ ఖచ్చితత్వం',
    kpiPendingCounts: 'పెండింగ్ ఆడిట్స్',

    // Inventory
    searchPlaceholder: 'పేరు, SKU లేదా బార్‌కోడ్ ద్వారా శోధించండి...',
    sku: 'SKU కోడ్',
    barcode: 'బార్‌కోడ్',
    quantity: 'పరిమాణం',
    binCode: 'బిన్ స్థానం',
    actions: 'చర్యలు',
    addStock: 'పరిమాణాన్ని సవరించు',
    addNewProduct: 'కొత్త ఉత్పత్తిని నమోదు చేయి',
    name: 'ఉత్పత్తి పేరు',
    description: 'వివరణ',
    zone: 'జోన్',
    aisle: 'వరస (Aisle)',
    shelf: 'షెల్ఫ్',
    level: 'స్థాయి',
    capacity: 'సామర్థ్యం (m³)',
    save: 'సేవ్ చేయి',
    cancel: 'రద్దు చేయి',

    // QR Page
    generateQrTitle: 'ఉత్పత్తి & బిన్ లేబుల్‌లను సృష్టించండి',
    printSelected: 'లేబుళ్లను ముద్రించు',
    downloadPdf: 'లేబుల్ షీట్ డౌన్‌లోడ్ (PDF)',
    labelType: 'లేబుల్ రకం',
    selectProduct: 'లక్ష్య ఉత్పత్తిని ఎంచుకోండి',
    selectBin: 'లక్ష్య బిన్ స్థానాన్ని ఎంచుకోండి',

    // Audits
    scheduleAudit: 'సైకిల్ కౌంట్ షెడ్యూల్ చేయి',
    auditTitle: 'ఆడిట్ శీర్షిక',
    assignee: 'ఆడిటర్',
    scheduleDate: 'షెడ్యూల్ తేదీ',
    status: 'స్థితి',
    pending: 'పెండింగ్',
    inProgress: 'పురోగతిలో ఉంది',
    completed: 'పూర్తయింది',
    discrepancy: 'వ్యత్యాసం',
    reconcile: 'లెక్కింపును సరిచేయి',

    // Reporting
    exportCenter: 'డేటా ఎగుమతి కేంద్రం',
    selectExportType: 'నివేదిక రకం',
    selectExportFormat: 'ఫైల్ ఫార్మాట్',
    generateExport: 'డౌన్‌లోడ్ సిద్ధం చేయి',
    historyLogs: 'సిస్టమ్ కార్యాచరణ లాగ్‌లు',

    // Settings
    wmsConfiguration: 'సిస్టమ్ కాన్ఫిగరేషన్లు',
    appLanguage: 'అప్లికేషన్ భాష',
    interfaceTheme: 'ఇంటర్ఫేస్ థీమ్',
    biometricAccess: 'బయోమెట్రిక్ లాక్',
    scanAlertBeep: 'స్కానర్ ఆడియో బీప్',
    syncInterval: 'ఆటో సింక్ విరామం',
    dark: 'డార్క్ గ్లాస్మోర్ఫిక్',
    light: 'సాధారణ లైట్',
    contrast: 'హై కాంట్రాస్ట్',

    // Errors & Auth
    loginTitle: 'థోర్ WMS పోర్టల్',
    loginSubtitle: 'వేర్‌హౌస్ ఉత్పాదకత ప్లాట్‌ఫారమ్',
    username: 'వినియోగదారు పేరు',
    password: 'పాస్‌వర్డ్',
    rememberMe: 'ఈ పరికరంలో సెషన్ గుర్తుంచుకో',
    loginBtn: 'లాగిన్ అవ్వండి',
    loginPinBtn: 'PIN ద్వారా లాగిన్',
    enterPin: '4-అంకెల పిన్ నమోదు చేయండి',
    invalidCreds: 'వినియోగదారు పేరు, పాస్‌వర్డ్ లేదా పిన్ సరైనవి కావు.'
  }
};

interface LocalizationContextType {
  locale: LanguageCode;
  setLocale: (locale: LanguageCode) => void;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('thor_wms_locale') as LanguageCode;
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('thor_wms_locale', locale);
  }, [locale]);

  const setLocale = (code: LanguageCode) => {
    setLocaleState(code);
  };

  const t = (key: string): string => {
    const dict = translations[locale];
    return dict[key] || key;
  };

  return (
    <LocalizationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
