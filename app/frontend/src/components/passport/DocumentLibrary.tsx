import styles from './DocumentLibrary.module.css';
import { FileText, Zap, PlayCircle, ArrowRight } from 'lucide-react';
import type { Document } from '@/lib/mock-data';

interface DocumentLibraryProps {
  documents: Document[];
}

const docIcons: Record<string, React.ReactNode> = {
  Manual: <FileText size={20} />,
  Wiring: <Zap size={20} />,
  Video: <PlayCircle size={20} />,
};

const docColors: Record<string, string> = {
  Manual: '#2E5BFF',
  Wiring: '#FF6B00',
  Video: '#00C48C',
};

const typeLabels: Record<string, string> = {
  Manual: 'PANDUAN',
  Wiring: 'KELISTRIKAN',
  Video: 'VIDEO',
};

export default function DocumentLibrary({ documents }: DocumentLibraryProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Perpustakaan Dokumen</h2>
      <div className={styles.list}>
        {documents.map((doc) => (
          <a
            key={doc.id}
            href={doc.url}
            className={styles.docItem}
            target="_blank"
            rel="noopener noreferrer"
            style={{ '--accent': docColors[doc.type] ?? '#2E5BFF' } as React.CSSProperties}
          >
            <div className={styles.docIcon}>
              {docIcons[doc.type] ?? <FileText size={20} />}
            </div>
            <div className={styles.docInfo}>
              <span className={styles.docType}>{typeLabels[doc.type] ?? doc.type}</span>
              <span className={styles.docLabel}>{doc.label}</span>
            </div>
            <ArrowRight size={18} className={styles.docArrow} />
          </a>
        ))}
      </div>
    </div>
  );
}
