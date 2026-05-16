'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reportApi } from '@/lib/api';
import { Printer, FileDown, ArrowLeft, Loader2 } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import styles from './view.module.css';

import { REPORT_TEMPLATE_BYTES } from '@/assets/report-template';

/**
 * NEW APPROACH: ACROFORM / FILLABLE PDF
 * Kita tidak lagi menggunakan koordinat absolut di sini.
 * Kita akan menggunakan named fields.
 */

export default function ReportView() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const generateReportPdf = useCallback(async (reportData: any) => {
    if (!reportData) return null;
    try {
      const pdfDoc = await PDFDocument.load(REPORT_TEMPLATE_BYTES);
      const form = pdfDoc.getForm();
      const firstPage = pdfDoc.getPages()[0];
      const { data } = reportData;

      /**
       * HELPER: Fill or Create Field
       * Karena template asli belum punya field, kita akan CREATE field tersebut 
       * SATU KALI di posisi yang sudah kita kalibrasi sebelumnya.
       * 
       * Nanti, jika template PDF-nya sudah diganti dengan PDF yang sudah ada field-nya dari Acrobat,
       * fungsi ini tinggal memanggil 'form.getTextField(name)'.
       */
      const fillField = (name: string, value: any, x: number, y: number, width: number, height: number = 12) => {
        let field;
        try {
          field = form.getTextField(name);
        } catch (e) {
          // Jika field belum ada di PDF, kita buatkan (Hanya untuk masa transisi template)
          field = form.createTextField(name);
          field.addToPage(firstPage, { x, y, width, height, textColor: rgb(0,0,0) });
        }
        field.setText(String(value || ''));
        field.setFontSize(7);
      };

      // --- 1. HEADER FIELDS ---
      // Menggunakan koordinat terakhir Anda sebagai lokasi "Anchor" Field
      fillField('reportNo', reportData.id.toUpperCase(), 420, 831, 100);
      fillField('serialNumber', reportData.unit?.serial_number, 430, 828, 100);
      fillField('orderDocument', data.header?.order_document, 430, 825, 100);
      fillField('productionCode', data.header?.production_code, 430, 811, 100);

      // --- 2. CUSTOMER & INFO ---
      fillField('customer', reportData.unit?.current_client?.company_name || 'INTERNAL', 100, 804, 250);
      fillField('startDate', data.header?.starting_date, 360, 804, 80);
      fillField('finishDate', data.header?.finishing_date, 460, 804, 80);
      fillField('category', reportData.unit?.specs?.category, 100, 802, 150);
      fillField('model', reportData.unit?.model_name, 400, 802, 150);

      // --- 3. DIMENSIONS ---
      fillField('dimBodyPanjang', data.dimensions?.body?.panjang, 100, 690, 50);
      fillField('dimBodyLebar', data.dimensions?.body?.lebar, 200, 690, 50);
      fillField('dimBodyTinggi', data.dimensions?.body?.tinggi, 300, 690, 50);
      
      fillField('dimKacaDepan', data.dimensions?.kaca?.depan, 150, 640, 50);
      fillField('dimKacaSamping', data.dimensions?.kaca?.samping, 150, 620, 50);
      fillField('dimKacaAtas', data.dimensions?.kaca?.atas, 150, 600, 50);
      fillField('dimKacaPintu', data.dimensions?.kaca?.pintu, 150, 580, 50);
      fillField('dimKacaTingkatan', data.dimensions?.kaca?.tingkatan, 150, 560, 50);

      // --- FINALIZING ---
      // Flatten akan "membakar" isi field ke PDF sehingga tidak bisa diedit manual lagi
      form.flatten();

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([(pdfBytes as any)], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('PDF Form Fill Error:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await reportApi.findOne(id as string);
        setReport(data);
        const url = await generateReportPdf(data);
        setPdfUrl(url);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) init();
  }, [id, generateReportPdf]);

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-preview') as HTMLIFrameElement;
    if (iframe) iframe.contentWindow?.print();
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `Report-${id}.pdf`;
      link.click();
    }
  };

  if (loading) return <div className={styles.loadingState}><Loader2 className={styles.spinner} size={40} /><p>Menyiapkan Laporan...</p></div>;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button onClick={() => router.back()} className={styles.backBtn}><ArrowLeft size={16} /></button>
          <span className={styles.reportId}>INSPECTION REPORT - {report?.id}</span>
        </div>
        <div className={styles.toolbarActions}>
          <button onClick={handlePrint} className={styles.actionBtn}><Printer size={14} /> PRINT</button>
          <button onClick={handleDownload} className={`${styles.actionBtn} ${styles.primary}`}><FileDown size={14} /> DOWNLOAD PDF</button>
        </div>
      </header>

      <div className={styles.previewWrapper}>
        {pdfUrl && (
          <iframe 
            id="pdf-preview"
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
            className={styles.pdfFrame}
            title="PDF Preview"
          />
        )}
      </div>
    </div>
  );
}
