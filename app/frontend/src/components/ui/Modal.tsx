'use client';

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
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
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
    </div>
  );
}
