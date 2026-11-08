'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, X, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import styles from './BulkUploadModal.module.css';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [totalEstimatedRows, setTotalEstimatedRows] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Simple CSV line parser for preview
  const parsePreviewCsv = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      setError('File tidak memiliki data yang cukup.');
      return;
    }

    const sample = lines.slice(0, 3).join('\n');
    const delimiter = (sample.match(/\t/g) || []).length > (sample.match(/,/g) || []).length ? '\t' : ',';

    // Cari baris header
    let headerIdx = 0;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const lower = lines[i].toLowerCase();
      if (lower.includes('call id') || lower.includes('customer') || lower.includes('complain')) {
        headerIdx = i;
        break;
      }
    }

    const parsedHeaders = lines[headerIdx].split(delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());
    const dataLines = lines.slice(headerIdx + 1);
    setTotalEstimatedRows(dataLines.length);

    const rows: string[][] = [];
    for (let i = 0; i < Math.min(5, dataLines.length); i++) {
      const row = dataLines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
      rows.push(row);
    }

    setHeaders(parsedHeaders);
    setPreviewRows(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
    setUploadResult(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        parsePreviewCsv(content);
      }
    };
    reader.readAsText(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      setError(null);
      setUploadResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          parsePreviewCsv(content);
        }
      };
      reader.readAsText(dropped);
    }
  };

  const handleDownloadTemplate = () => {
    const templateContent =
      'Date\tCustomer\tProduct\tIssue\tHandling\tResult\tStatus\tCurrent Activity\tTechnician\tHistory\tWarranty\tSO#\tPO#\tRemarks\n' +
      'Call ID\tComplain\tExecution\tName\tBP Code\tBranch\tAddress\tItem Description\tItem Code\tSerial Number\t\t\t\t\t\t\t\t\t\t\n' +
      '18.001\t2018\tJan 3\tShigeru Deli Ika\tBP001\tBekasi\tGrand Galaxy Boulevard No. 1\tShowcase sushi\tITM-01\tSN-998811\tSuhu tidak dingin\tPengecekan unit showcase & kalibrasi suhu\tSuhu normal kembali\tCOMPLETED\tDone\tBudi Santoso\tKunjungan 1\tAktif\tSO-101\tPO-202\tPembersihan kondensor\n';

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_service_calls.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(15);
    setUploadStatusText('Menyiapkan file & membaca baris data CSV...');
    setError(null);

    // Animasi progress visual
    const timer1 = setTimeout(() => {
      setUploadProgress(45);
      setUploadStatusText(`Mengurai data ~${totalEstimatedRows.toLocaleString()} baris, menyinkronkan Klien & Unit...`);
    }, 600);

    const timer2 = setTimeout(() => {
      setUploadProgress(75);
      setUploadStatusText('Menyimpan tiket servis ke database dalam batch...');
    }, 1800);

    try {
      const { serviceLogApi } = await import('@/lib/api');
      const res = await serviceLogApi.bulkUpload(file);
      clearTimeout(timer1);
      clearTimeout(timer2);

      setUploadProgress(100);
      setUploadStatusText('Selesai!');
      setUploadResult(res.data);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error('Bulk upload error:', err);
      setError(err?.response?.data?.message || err.message || 'Terjadi kesalahan saat upload.');
      setIsUploading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <FileSpreadsheet className={styles.headerIcon} size={22} />
            <div>
              <h3>Import Data Servis (Bulk Upload)</h3>
              <p>Migrasikan data CSV / Spreadsheet servis langsung ke sistem</p>
            </div>
          </div>
          {!isUploading && (
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* UPLOAD FORM (Belum Selesai) */}
          {!uploadResult && !isUploading && (
            <>
              {/* Drag & Drop Area */}
              <div
                className={styles.dropZone}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileChange}
                />
                <UploadCloud size={40} className={styles.dropIcon} />
                <p className={styles.dropText}>
                  <strong>Klik untuk memilih file</strong> atau drag & drop file CSV di sini
                </p>
                <span className={styles.dropSub}>Mendukung format CSV / TSV spreadsheet (hingga 50.000 baris)</span>
              </div>

              {/* Download Template Link */}
              <div className={styles.templateSection}>
                <span>Butuh panduan kolom?</span>
                <button type="button" className={styles.templateBtn} onClick={handleDownloadTemplate}>
                  <Download size={14} /> Download Format Template CSV
                </button>
              </div>

              {/* File Info & Preview */}
              {file && (
                <div className={styles.fileInfoCard}>
                  <div className={styles.fileMeta}>
                    <FileSpreadsheet size={18} color="#2E5BFF" />
                    <div>
                      <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                      <span className={styles.rowEstimate}>
                        Estimasi data: <strong>~{totalEstimatedRows.toLocaleString()} baris</strong>
                      </span>
                    </div>
                  </div>

                  {/* Table Preview */}
                  {previewRows.length > 0 && (
                    <div className={styles.previewContainer}>
                      <span className={styles.previewTitle}>Preview 5 Baris Pertama:</span>
                      <div className={styles.previewTableWrap}>
                        <table className={styles.previewTable}>
                          <thead>
                            <tr>
                              {headers.slice(0, 8).map((h, i) => (
                                <th key={i}>{h || `Kolom ${i + 1}`}</th>
                              ))}
                              {headers.length > 8 && <th>+{headers.length - 8} kolom lain</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.slice(0, 8).map((val, cIdx) => (
                                  <td key={cIdx}>{val || '-'}</td>
                                ))}
                                {row.length > 8 && <td>...</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className={styles.errorBox}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}

          {/* LOADING STATE DENGAN PROGRESS BAR */}
          {isUploading && !uploadResult && (
            <div className={styles.loadingContainer}>
              <Loader2 size={44} className={styles.spinner} />
              <h4 className={styles.loadingTitle}>Mengimpor Data ke Database</h4>
              <p className={styles.loadingSub}>{uploadStatusText}</p>

              <div className={styles.progressBarWrapper}>
                <div className={styles.progressBarFill} style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className={styles.progressPercent}>{uploadProgress}%</span>
              <span className={styles.warningNote}>Harap tunggu, jangan menutup browser selama proses berlangsung...</span>
            </div>
          )}

          {/* RESULT SUMMARY (Sukses) */}
          {uploadResult && (
            <div className={styles.resultContainer}>
              <div className={styles.successIconWrapper}>
                <CheckCircle2 size={48} color="#10b981" />
              </div>
              <h4 className={styles.resultTitle}>Impor Data Berhasil Sempurna!</h4>
              <p className={styles.resultSub}>Seluruh data spreadsheet telah tersinkronisasi ke dalam sistem</p>

              <div className={styles.statsCardGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{uploadResult.insertedLogs?.toLocaleString() || 0}</span>
                  <span className={styles.statLabel}>Tiket Servis Disimpan</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{uploadResult.createdUnits?.toLocaleString() || 0}</span>
                  <span className={styles.statLabel}>Unit Baru Terdaftar</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNum} style={{ color: '#d97706' }}>
                    {uploadResult.skippedNoSerial?.toLocaleString() || 0}
                  </span>
                  <span className={styles.statLabel}>Dilewati (Tanpa SN)</span>
                </div>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className={styles.warningList}>
                  <strong>Catatan Baris Terlewati ({uploadResult.errors.length}):</strong>
                  <ul>
                    {uploadResult.errors.slice(0, 5).map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                    {uploadResult.errors.length > 5 && <li>...dan {uploadResult.errors.length - 5} lainnya</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {!uploadResult && !isUploading && (
            <>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Batal
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                disabled={!file}
                onClick={handleConfirmUpload}
              >
                Konfirmasi &amp; Upload (~{totalEstimatedRows} Baris)
              </button>
            </>
          )}

          {uploadResult && (
            <button type="button" className={styles.doneBtn} onClick={handleFinish}>
              Selesai &amp; Muat Data Baru
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

