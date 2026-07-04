'use client';

import { Sun, Moon, QrCode } from 'lucide-react';
import styles from './PassportTopbar.module.css';

// ─── Holicindo Logo SVG ───────────────────────────────────────────────────────
function HolicLogo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <polygon points="60,5 10,95 20,110 60,110" />
      <line x1="70" y1="15" x2="70" y2="110" />
      <polyline points="70,15 110,90 100,110 70,110" />
      <polyline points="80,110 80,55 125,45" />
      <polyline points="90,110 90,85 135,75" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccessState {
  isGuest: boolean;
  isClient: boolean;
  isPartner: boolean;
  isAdmin: boolean;
  belongsToClient: boolean;
  hasClientRestriction: boolean;
}

export interface PassportTopbarProps extends AccessState {
  isDark: boolean;
  setIsDark: (fn: (v: boolean) => boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unit: any | null;
  token: string;
}

export type BadgeConfig = { text: string };
export function getBadgeConfig(access: AccessState): BadgeConfig {
  if (access.isAdmin)              return { text: 'LEVEL 4: ADMINISTRATOR' };
  if (access.isPartner)            return { text: 'LEVEL 3: TECHNICAL PARTNER' };
  if (access.hasClientRestriction) return { text: 'LEVEL 2: RESTRICTED' };
  if (access.isClient && access.belongsToClient) return { text: 'LEVEL 2: FLEET OWNER' };
  return { text: 'LEVEL 1: PUBLIC SCAN' }; // fallback / isGuest
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TopbarBadgeProps {
  text: string;
}

function TopbarBadge({ text }: TopbarBadgeProps) {
  return (
    <span className={styles.topbarBadge} aria-label={`Access level: ${text}`}>
      {text}
    </span>
  );
}

function DarkLightToggle({ isDark, setIsDark }: { isDark: boolean; setIsDark: (fn: (v: boolean) => boolean) => void }) {
  const handleClick = () => {
    setIsDark((v) => !v);
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  };

  return (
    <button
      className={styles.iconBtn}
      onClick={handleClick}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      type="button"
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}

interface QrPrintButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unit: any;
  token: string;
}

function QrPrintButton({ unit, token }: QrPrintButtonProps) {
  const handlePrint = () => {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      window.location.origin + '/id/' + token
    )}`;
    const pw = window.open('', '_blank');
    if (pw) {
      pw.document.write(
        `<html><head><title>Print QR</title><style>` +
        `@page{margin:0}html,body{margin:0;display:flex;flex-direction:column;` +
        `align-items:center;justify-content:center;height:100vh;font-family:sans-serif}` +
        `</style></head><body>` +
        `<h2>${unit?.serial_number ?? ''}</h2>` +
        `<img src="${qrApiUrl}" alt="QR" style="width:400px;height:400px" ` +
        `onload="window.print();window.close()"/>` +
        `<p>${unit?.model_name ?? ''}</p>` +
        `</body></html>`
      );
      pw.document.close();
    }
  };

  return (
    <button
      className={`${styles.iconBtn} ${styles.iconBtnAccent}`}
      onClick={handlePrint}
      aria-label="Print QR"
      type="button"
    >
      <QrCode size={14} /> QR
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PassportTopbar({
  isDark,
  setIsDark,
  isGuest,
  isClient,
  isPartner,
  isAdmin,
  belongsToClient,
  hasClientRestriction,
  unit,
  token,
}: PassportTopbarProps) {
  const badge = getBadgeConfig({
    isGuest,
    isClient,
    isPartner,
    isAdmin,
    belongsToClient,
    hasClientRestriction,
  });

  return (
    <header className={styles.topbar} role="banner">
      {/* Left: brand logo */}
      <div className={styles.topbarLogo} aria-label="Holicindo">
        <span className={styles.topbarLogoIcon}><HolicLogo size={26} /></span>
        <span className={styles.topbarLogoText}>HOLICINDO</span>
      </div>

      {/* Right: toggle → badge (QR sudah dipindah ke QrCard) */}
      <div className={styles.topbarRight}>
        <DarkLightToggle isDark={isDark} setIsDark={setIsDark} />
        <span className={styles.divider} aria-hidden="true" />
        <TopbarBadge text={badge.text} />
      </div>
    </header>
  );
}
