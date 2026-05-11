'use client';
import { useState } from 'react';
import styles from './ActionButtons.module.css';

interface ActionButtonsProps {
  serialNumber: string;
  outletName: string;
  city: string;
}

export default function ActionButtons({ serialNumber, outletName, city }: ActionButtonsProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleServiceRequest = async () => {
    setLoading(true);
    // Simulate API call - will be replaced with real NestJS endpoint
    await new Promise((res) => setTimeout(res, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className={styles.wrapper}>
      {submitted ? (
        <div className={styles.successAlert}>
          <span className={styles.successIcon}>✓</span>
          <div>
            <strong>Request Sent Successfully</strong>
            <p>Our team has been notified. A technician will contact you shortly.</p>
          </div>
        </div>
      ) : (
        <>
          <a
            href="#documents"
            className={styles.btnPrimary}
            id="btn-download-manual"
          >
            <span>📄</span> Download Manual
          </a>
          <button
            className={styles.btnEmergency}
            onClick={handleServiceRequest}
            disabled={loading}
            id="btn-request-service"
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <><span>🚨</span> Emergency Service Request</>
            )}
          </button>
        </>
      )}

      <p className={styles.footerNote}>
        Unit: <strong>{serialNumber}</strong> · {outletName}, {city}
      </p>
    </div>
  );
}
