'use client';

import { QrCode, Download, Printer } from 'lucide-react';
import styles from '../id.module.css';

interface QrCardProps {
  token: string;
  serialNumber: string;
  modelName: string;
}

export default function QrCard({ token, serialNumber, modelName }: QrCardProps) {
  const qrUrl = `https://portal.holicindo.com/id/${token}`;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(qrUrl)}`;
  const qrPrintUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(qrUrl)}`;

  const handleDownload = () => {
    // Buka URL download langsung di tab baru — paling reliable di semua browser
    window.open(
      `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=20&data=${encodeURIComponent(qrUrl)}`,
      '_blank'
    );
  };

  const handlePrint = () => {
    const pw = window.open('', '_blank', 'width=520,height=640');
    if (!pw) {
      alert('Popup diblokir browser. Izinkan popup untuk halaman ini lalu coba lagi.');
      return;
    }
    const printUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(qrUrl)}`;
    pw.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>QR — ${serialNumber}</title>
  <style>
    @page {
      margin: 0;
      size: A4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      font-family: Arial, sans-serif;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 40px;
    }
    .serial { font-size: 28px; font-weight: 800; color: #001F3F; letter-spacing: 0.04em; margin-bottom: 6px; }
    .model  { font-size: 14px; color: #717378; margin-bottom: 24px; }
    .qr     { width: 280px; height: 280px; display: block; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="serial">${serialNumber}</div>
  <img class="qr" src="${printUrl}" alt="QR"/>
  <div class="model">${modelName}</div>
  <script>
    var img = document.querySelector('.qr');
    function doPrint() { window.focus(); window.print(); }
    img.onload = doPrint;
    img.onerror = doPrint;
    if (img.complete) { setTimeout(doPrint, 300); }
    else { setTimeout(doPrint, 3000); }
  </script>
</body>
</html>`);
    pw.document.close();
  };

  return (
    <section
      className={styles.panel}
      style={{ background: '#E8EAEE', border: 'none', boxShadow: '-6px -6px 10px rgba(255,255,255,0.72), 6px 6px 12px rgba(0,31,63,0.14)', borderRadius: '18px', backdropFilter: 'none' }}
    >
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <QrCode size={14} color="var(--color-cobalt-blue)" />
          <h2 style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>QR Passport</h2>
        </div>
      </div>
      <div className={`${styles.panelContent} ${styles.qrCard}`}>
        {/* Serial Number */}
        <div className={styles.qrSerial}>{serialNumber}</div>

        {/* QR Code */}
        <img
          src={qrApiUrl}
          alt={`QR Code untuk ${serialNumber}`}
          className={styles.qrCodeImg}
        />

        {/* Model Name — di bawah QR */}
        <div className={styles.qrModel}>{modelName}</div>

        {/* Actions */}
        <div className={styles.qrActions}>
          <button className={styles.qrBtn} onClick={handleDownload} title="Download QR">
            <Download size={11} /> Download
          </button>
          <button className={`${styles.qrBtn} ${styles.qrBtnPrimary}`} onClick={handlePrint} title="Print QR">
            <Printer size={11} /> Print
          </button>
        </div>
      </div>
    </section>
  );
}
