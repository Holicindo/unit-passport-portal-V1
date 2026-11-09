'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'confirm' | 'success' | 'error';
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmText = 'Ya, Simpan',
  cancelText = 'Batal'
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        margin: 0,
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={styles.modal}
        style={{
          margin: 'auto',
          position: 'relative',
        }}
      >
        <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        
        <div className={styles.content}>
          <div className={`${styles.icon} ${styles[type]}`}>
            {type === 'confirm' && <AlertTriangle size={32} />}
            {type === 'success' && <CheckCircle2 size={32} />}
          </div>
          
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.message}>{message}</p>
          
          <div className={styles.actions}>
            {type === 'confirm' ? (
              <>
                <button className={styles.cancelBtn} onClick={onClose}>{cancelText}</button>
                <button className={styles.confirmBtn} onClick={onConfirm}>{confirmText}</button>
              </>
            ) : (
              <button className={styles.confirmBtn} onClick={onClose}>OK</button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
