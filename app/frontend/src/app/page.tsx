import { mockUnit } from '@/lib/mock-data';
import DocumentLibrary from '@/components/passport/DocumentLibrary';
import ServiceHistory from '@/components/passport/ServiceHistory';
import styles from './page.module.css';

export default function UnitDetailPage() {
  const unit = mockUnit;

  return (
    <main className={styles.container}>
      <h1 className={styles.pageTitle}>Detail Unit</h1>

      <section className={styles.unitCard}>
        <div className={styles.cardHeader}>
          <div className={styles.titleInfo}>
            <div className={styles.mainId}>
              <h2 className={styles.serialNumber}>{unit.serial_number}</h2>
              <span className={styles.authorizedBadge}>ASET RESMI BOGA GROUP</span>
            </div>
            <p className={styles.modelSubtitle}>({unit.model_name})</p>
          </div>
        </div>

        <div className={styles.cardContent}>
          <div className={styles.specsSide}>
            <div className={styles.inlineSpec}>
              <span className={styles.specLabel}>Kompresor:</span>
              <span className={styles.specValue}>{unit.compressor}</span>
            </div>
            <div className={styles.inlineSpec}>
              <span className={styles.specLabel}>Refrigeran:</span>
              <span className={styles.specValue}>{unit.refrigerant}</span>
            </div>
            <div className={styles.inlineSpec}>
              <span className={styles.specLabel}>Lokasi:</span>
              <span className={styles.specValue}>{unit.outlet_name}</span>
            </div>

            <div className={styles.actionButtons}>
              <button className={styles.btnDownload}>UNDUH MANUAL</button>
              <button className={styles.btnEmergency}>PERMINTAAN SERVIS DARURAT</button>
            </div>
          </div>

          <div className={styles.imageSide}>
            <div className={styles.productFrame}>
              <img
                src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop"
                alt={unit.model_name}
              />
            </div>
            <div className={styles.pagination}>
              <span className={styles.dotActive}></span>
              <span className={styles.dot}></span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.bottomSections}>
        <div className={styles.historySection}>
          <ServiceHistory logs={unit.service_logs} />
        </div>
        <div className={styles.docsSection}>
          <DocumentLibrary documents={unit.documents} />
        </div>
      </div>
    </main>
  );
}
