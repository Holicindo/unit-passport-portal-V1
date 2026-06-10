'use client';

import { useRef, DragEvent } from 'react';
import { Upload, ImageIcon, X } from 'lucide-react';
import styles from '../new.module.css';

interface Props {
  testRunFile: File | null;
  testRunPreview: string | null;
  diagramFile: File | null;
  diagramPreview: string | null;
  dragActiveTestRun: boolean;
  dragActiveDiagram: boolean;
  onFileSelect: (file: File, type: 'testRun' | 'diagram') => void;
  onRemove: (type: 'testRun' | 'diagram') => void;
  onDragOver: (e: DragEvent<HTMLDivElement>, type: 'testRun' | 'diagram') => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>, type: 'testRun' | 'diagram') => void;
  onDrop: (e: DragEvent<HTMLDivElement>, type: 'testRun' | 'diagram') => void;
}

export default function MediaUploader({
  testRunPreview, diagramPreview, dragActiveTestRun, dragActiveDiagram,
  onFileSelect, onRemove, onDragOver, onDragLeave, onDrop,
}: Props) {
  const testRunInputRef = useRef<HTMLInputElement>(null);
  const diagramInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.dropZoneGrid}>
      {/* Test Run Photo */}
      <div className={styles.dropZoneWrapper}>
        <label>Foto Test Run & Quality Control</label>
        <div
          className={`${styles.dropZone} ${dragActiveTestRun ? styles.dropZoneActive : ''}`}
          onClick={() => testRunInputRef.current?.click()}
          onDrop={(e) => onDrop(e, 'testRun')}
          onDragOver={(e) => onDragOver(e, 'testRun')}
          onDragLeave={(e) => onDragLeave(e, 'testRun')}
        >
          {testRunPreview ? (
            <div className={styles.dropZonePreview}>
              <img src={testRunPreview} alt="Test Run Preview" />
              <button type="button" className={styles.dropZoneRemove} onClick={(e) => { e.stopPropagation(); onRemove('testRun'); }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={32} className={styles.dropZoneIcon} />
              <p className={styles.dropZoneText}>
                <strong>Klik atau seret foto</strong> ke area ini<br/>
                JPG, PNG, WEBP — Maks 10MB
              </p>
            </>
          )}
          <input
            ref={testRunInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files?.[0]) onFileSelect(e.target.files[0], 'testRun'); }}
          />
        </div>
      </div>

      {/* Diagram / Blueprint */}
      <div className={styles.dropZoneWrapper}>
        <label>Diagram Sirkulasi / Cetak Biru Digital</label>
        <div
          className={`${styles.dropZone} ${dragActiveDiagram ? styles.dropZoneActive : ''}`}
          onClick={() => diagramInputRef.current?.click()}
          onDrop={(e) => onDrop(e, 'diagram')}
          onDragOver={(e) => onDragOver(e, 'diagram')}
          onDragLeave={(e) => onDragLeave(e, 'diagram')}
        >
          {diagramPreview ? (
            <div className={styles.dropZonePreview}>
              <img src={diagramPreview} alt="Diagram Preview" />
              <button type="button" className={styles.dropZoneRemove} onClick={(e) => { e.stopPropagation(); onRemove('diagram'); }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <ImageIcon size={32} className={styles.dropZoneIcon} />
              <p className={styles.dropZoneText}>
                <strong>Klik atau seret diagram</strong> ke area ini<br/>
                JPG, PNG, WEBP — Maks 10MB
              </p>
            </>
          )}
          <input
            ref={diagramInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files?.[0]) onFileSelect(e.target.files[0], 'diagram'); }}
          />
        </div>
      </div>
    </div>
  );
}
