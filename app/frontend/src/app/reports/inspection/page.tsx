'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { unitApi, reportApi } from '@/lib/api';
import { Save, Camera, ArrowLeft, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './inspection.module.css';

/**
 * InspectionForm - Detailed QC Report matching the paper form reference.
 */
export default function InspectionForm() {
  const router = useRouter();
  const [serialSearch, setSerialSearch] = useState('');
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Large form state to capture all fields from Image 1
  const [formData, setFormData] = useState<any>({
    header: {
      order_document: '',
      production_code: '',
      starting_date: '',
      finishing_date: '',
    },
    dimensions: {
      body: { panjang: '', lebar: '', tinggi: '' },
      kaca: { depan: '', samping: '', atas: '', pintu: '', tingkatan: '' }
    },
    visual_checks: {
      external: Array(13).fill('V'), // Default all to V (OK)
      internal: Array(6).fill('V'),
    },
    performance: {
      grounding: { value: '', result: 'V', remarks: '' },
      insulation: { value: '', result: 'V', remarks: '' },
      leakage: { value: '', result: 'V', remarks: '' },
      voltage_test: { value: '', result: 'V', remarks: '' },
      exterior_temp: { value: '', result: 'V', remarks: '' },
      cooling_time: { value: '', result: 'V', remarks: '' },
      cabinet_temp_range: { value: '', result: 'V', remarks: '' },
      temp_variation: { value: '', result: 'V', remarks: '' },
      noise: { value: '', result: 'V', remarks: '' },
      power_rating: { value: '', result: 'V', remarks: '' },
      temp_report: { value: '', result: 'V', remarks: '' },
    },
    works: [
      { item: 'Pemasangan Lampu', name: '', time: '' },
      { item: 'Pemasangan Kelistrikan', name: '', time: '' },
      { item: 'Pemasangan Heater', name: '', time: '' },
      { item: 'Pemasangan Unit System', name: '', time: '' },
      { item: 'Pengelasan Unit System', name: '', time: '' },
      { item: 'Pengelasan Body', name: '', time: '' },
      { item: 'Perakitan Rangka Body', name: '', time: '' },
      { item: 'Pemasangan Mechanical', name: '', time: '' },
    ],
    footer: {
      color: '',
      length: '',
      remarks: '',
      notes: '',
    }
  });

  const handleSearchUnit = async () => {
    if (!serialSearch) return;
    setLoading(true);
    try {
      const { data } = await unitApi.findOne(serialSearch);
      setUnit(data);
    } catch (err) {
      alert('Unit tidak ditemukan. Pastikan No Seri benar.');
      setUnit(null);
    } finally {
      setLoading(false);
    }
  };

  const updateHeader = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      header: { ...prev.header, [field]: value }
    }));
  };

  const updateDimension = (type: 'body' | 'kaca', field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [type]: { ...prev.dimensions[type], [field]: value }
      }
    }));
  };

  const updateVisualCheck = (section: 'external' | 'internal', index: number, value: 'V' | 'X') => {
    const newList = [...formData.visual_checks[section]];
    newList[index] = value;
    setFormData((prev: any) => ({
      ...prev,
      visual_checks: { ...prev.visual_checks, [section]: newList }
    }));
  };

  const updatePerformance = (item: string, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      performance: {
        ...prev.performance,
        [item]: { ...prev.performance[item], [field]: value }
      }
    }));
  };

  const updateWork = (index: number, field: 'name' | 'time', value: string) => {
    const newWorks = [...formData.works];
    newWorks[index][field] = value;
    setFormData((prev: any) => ({ ...prev, works: newWorks }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return alert('Silahkan pilih unit terlebih dahulu');
    
    setLoading(true);
    try {
      await reportApi.create({
        unitId: unit.id,
        form_type: 'INSPECTION',
        data: formData,
        revision_note: 'QC Report Digitization'
      });
      alert('Inspection Report berhasil disimpan!');
      router.push('/reports');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan report.');
    } finally {
      setLoading(false);
    }
  };

  const visualItemsExternal = [
    "Bagian las (luar) harus dipoles dan menyerupai pola aslinya",
    "Permukaan luar harus halus dan rata, tanpa penyok, goresan, atau kerutan",
    "Tepi luar (yang bersentuhan dengan tangan) harus bebas dari gerinda tajam dan sudut tajam",
    "Kaca harus bening, tanpa goresan, retakan, atau kabut",
    "Pegangan terpasang dengan benar dan tidak longgar",
    "Semua sekrup dan paku keling harus terpasang dengan tepat dan kuat",
    "Pintu kaca harus dapat digeser dengan ringan dan lancar",
    "Pintu tidak boleh mengalami deformasi atau terdapat bekas goresan",
    "Panel atas harus terpasang dengan aman, dan celah harus merata",
    "Pelat nama, label unit, dan label kabel harus ditempel di posisi yang ditentukan",
    "Rel geser pintu harus terpasang dengan kuat",
    "Lampu LED harus terpasang",
    "Celah antara panel penutup geser dan panel atas harus merata dan tidak lebih dari 2 mm"
  ];

  const visualItemsInternal = [
    "Sensor suhu harus terpasang dengan kuat",
    "Sekrup atau paku keling harus terpasang dengan kuat dan tegak lurus",
    "Rak kabin harus rata dan tidak bongkok",
    "Karet gasket harus bebas dari sobekan atau luka",
    "Perakitan lampu dan penutupnya harus terpasang dengan kuat",
    "Filter condensing harus terpasang dengan benar dan dapat dilepas maupun dipasang kembali dengan mudah"
  ];

  return (
    <div className={styles.formContainer}>
      <header className={styles.formHeader}>
        <button onClick={() => router.back()} className={styles.backBtn}><ArrowLeft size={20} /></button>
        <h1 className={styles.title}>Detailed Inspection Report (QC)</h1>
      </header>

      {/* --- Section 1: Identification --- */}
      <section className={styles.unitSelector}>
        <div className={styles.sectionHeader}>
          <h3>1. Identifikasi Unit</h3>
        </div>
        <div className={styles.searchBox}>
          <input 
            type="text" 
            placeholder="Ketik Serial Number..." 
            value={serialSearch}
            onChange={(e) => setSerialSearch(e.target.value)}
          />
          <button type="button" onClick={handleSearchUnit} disabled={loading}>
            <Search size={18} /> {loading ? 'Mencari...' : 'Cari'}
          </button>
        </div>
        
        {unit && (
          <div className={styles.unitInfoCard}>
            <p><strong>Model:</strong> {unit.model_name}</p>
            <p><strong>Serial Number:</strong> {unit.serial_number}</p>
            <p><strong>Customer:</strong> {unit.current_client?.company_name || 'Internal'}</p>
            <p><strong>Category:</strong> {unit.specs?.category || '—'}</p>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit}>
        {/* --- Section 2: Header Info --- */}
        <section className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3>2. Informasi Dokumen & Waktu</h3>
          </div>
          <div className={styles.gridInputs}>
            <div className={styles.inputField}>
              <label>Order Document (ITR)</label>
              <input 
                type="text" placeholder="Contoh: ITR-2024-..." 
                value={formData.header.order_document}
                onChange={(e) => updateHeader('order_document', e.target.value)}
              />
            </div>
            <div className={styles.inputField}>
              <label>Production Code (PRO)</label>
              <input 
                type="text" placeholder="Contoh: PRO-..." 
                value={formData.header.production_code}
                onChange={(e) => updateHeader('production_code', e.target.value)}
              />
            </div>
            <div className={styles.inputField}>
              <label>Starting Date</label>
              <input 
                type="date" 
                value={formData.header.starting_date}
                onChange={(e) => updateHeader('starting_date', e.target.value)}
              />
            </div>
            <div className={styles.inputField}>
              <label>Finishing Date</label>
              <input 
                type="date" 
                value={formData.header.finishing_date}
                onChange={(e) => updateHeader('finishing_date', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* --- Section 3: Dimensions --- */}
        <section className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3>3. Dimensi & Ukuran</h3>
          </div>
          <div className={styles.gridInputs}>
            <div className={styles.inputField}>
              <label>Body - Panjang (mm)</label>
              <input type="number" value={formData.dimensions.body.panjang} onChange={(e) => updateDimension('body', 'panjang', e.target.value)} />
            </div>
            <div className={styles.inputField}>
              <label>Body - Lebar (mm)</label>
              <input type="number" value={formData.dimensions.body.lebar} onChange={(e) => updateDimension('body', 'lebar', e.target.value)} />
            </div>
            <div className={styles.inputField}>
              <label>Body - Tinggi (mm)</label>
              <input type="number" value={formData.dimensions.body.tinggi} onChange={(e) => updateDimension('body', 'tinggi', e.target.value)} />
            </div>
          </div>
          <div className={styles.gridInputs} style={{ marginTop: '20px' }}>
            <div className={styles.inputField}><label>Kaca - Depan</label><input type="text" value={formData.dimensions.kaca.depan} onChange={(e) => updateDimension('kaca', 'depan', e.target.value)} /></div>
            <div className={styles.inputField}><label>Kaca - Samping</label><input type="text" value={formData.dimensions.kaca.samping} onChange={(e) => updateDimension('kaca', 'samping', e.target.value)} /></div>
            <div className={styles.inputField}><label>Kaca - Atas</label><input type="text" value={formData.dimensions.kaca.atas} onChange={(e) => updateDimension('kaca', 'atas', e.target.value)} /></div>
            <div className={styles.inputField}><label>Kaca - Pintu</label><input type="text" value={formData.dimensions.kaca.pintu} onChange={(e) => updateDimension('kaca', 'pintu', e.target.value)} /></div>
          </div>
        </section>

        {/* --- Section 4: Visual Check External --- */}
        <section className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3>4. Visual Check (Bagian Luar)</h3>
          </div>
          <table className={styles.checkTable}>
            <thead>
              <tr>
                <th>No</th>
                <th>Deskripsi Inspeksi</th>
                <th>Instrumen</th>
                <th>Hasil (V/X)</th>
              </tr>
            </thead>
            <tbody>
              {visualItemsExternal.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className={styles.checkLabel}>{item}</td>
                  <td>Visual / Sentuhan</td>
                  <td>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}><input type="radio" checked={formData.visual_checks.external[i] === 'V'} onChange={() => updateVisualCheck('external', i, 'V')} /> V</label>
                      <label className={styles.radioLabel}><input type="radio" checked={formData.visual_checks.external[i] === 'X'} onChange={() => updateVisualCheck('external', i, 'X')} /> X</label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* --- Section 5: Visual Check Internal --- */}
        <section className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3>5. Visual Check (Bagian Dalam Kabinet)</h3>
          </div>
          <table className={styles.checkTable}>
            <thead>
              <tr>
                <th>No</th>
                <th>Deskripsi Inspeksi</th>
                <th>Instrumen</th>
                <th>Hasil (V/X)</th>
              </tr>
            </thead>
            <tbody>
              {visualItemsInternal.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className={styles.checkLabel}>{item}</td>
                  <td>Visual / Sentuhan</td>
                  <td>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}><input type="radio" checked={formData.visual_checks.internal[i] === 'V'} onChange={() => updateVisualCheck('internal', i, 'V')} /> V</label>
                      <label className={styles.radioLabel}><input type="radio" checked={formData.visual_checks.internal[i] === 'X'} onChange={() => updateVisualCheck('internal', i, 'X')} /> X</label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* --- Section 6: Performance --- */}
        <section className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3>6. Performance Requirements (Sistem)</h3>
          </div>
          <table className={styles.perfTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Requirements</th>
                <th>Test Value</th>
                <th>Result (V/X)</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Tahanan Pembumian</td><td>&lt; 0.1 Ω</td>
                <td><input className={styles.perfInput} value={formData.performance.grounding.value} onChange={(e) => updatePerformance('grounding', 'value', e.target.value)} /></td>
                <td><select value={formData.performance.grounding.result} onChange={(e) => updatePerformance('grounding', 'result', e.target.value)}><option value="V">V</option><option value="X">X</option></select></td>
                <td><input className={styles.perfInput} value={formData.performance.grounding.remarks} onChange={(e) => updatePerformance('grounding', 'remarks', e.target.value)} /></td>
              </tr>
              <tr>
                <td>Tahanan Uji Isolasi</td><td>&gt; 7 MΩ</td>
                <td><input className={styles.perfInput} value={formData.performance.insulation.value} onChange={(e) => updatePerformance('insulation', 'value', e.target.value)} /></td>
                <td><select value={formData.performance.insulation.result} onChange={(e) => updatePerformance('insulation', 'result', e.target.value)}><option value="V">V</option><option value="X">X</option></select></td>
                <td><input className={styles.perfInput} value={formData.performance.insulation.remarks} onChange={(e) => updatePerformance('insulation', 'remarks', e.target.value)} /></td>
              </tr>
              <tr>
                <td>Waktu Pendinginan</td><td>&le; 60 menit</td>
                <td><input className={styles.perfInput} value={formData.performance.cooling_time.value} onChange={(e) => updatePerformance('cooling_time', 'value', e.target.value)} /></td>
                <td><select value={formData.performance.cooling_time.result} onChange={(e) => updatePerformance('cooling_time', 'result', e.target.value)}><option value="V">V</option><option value="X">X</option></select></td>
                <td><input className={styles.perfInput} value={formData.performance.cooling_time.remarks} onChange={(e) => updatePerformance('cooling_time', 'remarks', e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* --- Section 7: Works Involved --- */}
        <section className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3>7. Works Involved</h3>
          </div>
          <table className={styles.checkTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Name / PIC</th>
                <th>Total Time (days)</th>
              </tr>
            </thead>
            <tbody>
              {formData.works.map((work: any, i: number) => (
                <tr key={i}>
                  <td>{work.item}</td>
                  <td><input className={styles.perfInput} placeholder="Nama teknisi..." value={work.name} onChange={(e) => updateWork(i, 'name', e.target.value)} /></td>
                  <td><input className={styles.perfInput} placeholder="0" type="number" value={work.time} onChange={(e) => updateWork(i, 'time', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3>8. Keterangan & Catatan</h3>
          </div>
          <div className={styles.gridInputs}>
            <div className={styles.inputField}><label>Color</label><input type="text" value={formData.footer.color} onChange={(e) => setFormData({...formData, footer: {...formData.footer, color: e.target.value}})} /></div>
            <div className={styles.inputField}><label>Length</label><input type="text" value={formData.footer.length} onChange={(e) => setFormData({...formData, footer: {...formData.footer, length: e.target.value}})} /></div>
          </div>
          <div className={styles.inputField} style={{ marginTop: '20px' }}>
            <label>Keterangan Tambahan</label>
            <textarea rows={4} value={formData.footer.notes} onChange={(e) => setFormData({...formData, footer: {...formData.footer, notes: e.target.value}})} />
          </div>
        </section>

        <section className={styles.photoSection}>
          <div className={styles.sectionHeader}>
            <h3>9. Dokumentasi Foto</h3>
          </div>
          <button type="button" className={styles.photoBtn}>
            <Camera size={24} />
            <strong>Unggah Foto Unit</strong>
            <small>Klik untuk memilih file foto QC</small>
          </button>
        </section>

        <footer className={styles.formFooter}>
          <button type="submit" className={styles.saveBtn} disabled={loading || !unit}>
            <Save size={22} />
            <span>{loading ? 'Menyimpan...' : 'Submit Report & Selesai'}</span>
          </button>
        </footer>
      </form>
    </div>
  );
}
