'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from '../dashboard.module.css';
import { Package, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface QCStats {
  totalUnits: number;
  totalReports: number;
  pendingInspections: number;
  issuesFound: number;
}

interface RecentUnit {
  id: string;
  serial_number: string;
  model: string;
  client_name: string;
  status: string;
}

interface RecentReport {
  id: string;
  unit_serial: string;
  form_type: string;
  created_at: string;
  status: string;
}

export default function QCDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QCStats>({
    totalUnits: 0,
    totalReports: 0,
    pendingInspections: 0,
    issuesFound: 0,
  });
  const [recentUnits, setRecentUnits] = useState<RecentUnit[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  useEffect(() => {
    fetchQCDashboard();
  }, []);

  const fetchQCDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch units count
      const unitsRes = await axios.get('http://localhost:3001/units', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch reports count
      const reportsRes = await axios.get('http://localhost:3001/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Calculate stats
      const rawUnits = unitsRes.data;
      const rawReports = reportsRes.data;
      const unitList = Array.isArray(rawUnits) ? rawUnits : (rawUnits?.data || []);
      const reportList = Array.isArray(rawReports) ? rawReports : (rawReports?.data || []);

      setStats({
        totalUnits: rawUnits?.meta?.total ?? unitList.length ?? 0,
        totalReports: rawReports?.meta?.total ?? reportList.length ?? 0,
        pendingInspections: reportList.filter((r: any) => r.status === 'PENDING').length || 0,
        issuesFound: reportList.filter((r: any) => r.findings && r.findings.length > 0).length || 0,
      });

      // Get recent units (last 5)
      setRecentUnits(unitList.slice(0, 5) || []);

      // Get recent reports (last 5)
      setRecentReports(reportList.slice(0, 5) || []);

    } catch (error) {
      console.error('Failed to fetch QC dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Unit',
      value: stats.totalUnits,
      icon: <Package size={24} />,
      color: '#3b82f6',
      onClick: () => router.push('/units'),
    },
    {
      title: 'Total Laporan',
      value: stats.totalReports,
      icon: <FileText size={24} />,
      color: '#10b981',
      onClick: () => router.push('/reports'),
    },
    {
      title: 'Pending Inspeksi',
      value: stats.pendingInspections,
      icon: <AlertTriangle size={24} />,
      color: '#f59e0b',
      onClick: () => router.push('/reports'),
    },
    {
      title: 'Issue Ditemukan',
      value: stats.issuesFound,
      icon: <CheckCircle size={24} />,
      color: '#ef4444',
      onClick: () => router.push('/reports'),
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h1 className={styles.title}>Dashboard Quality Control</h1>
          <p className={styles.updateTime}>
            Monitoring Unit & Inspeksi Laporan
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '20px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                  {card.title}
                </p>
                <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b' }}>
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}25 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Units */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
            Unit Terbaru
          </h3>
          {loading ? (
            <p style={{ color: '#64748b' }}>Loading...</p>
          ) : recentUnits.length === 0 ? (
            <p style={{ color: '#64748b' }}>Belum ada data unit</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentUnits.map((unit) => (
                <div
                  key={unit.id}
                  onClick={() => router.push(`/units/${unit.id}`)}
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                        {unit.serial_number}
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        {unit.model} • {unit.client_name}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: unit.status === 'ACTIVE' ? '#10b98120' : '#94a3b820',
                        color: unit.status === 'ACTIVE' ? '#10b981' : '#64748b',
                      }}
                    >
                      {unit.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
            Laporan Terbaru
          </h3>
          {loading ? (
            <p style={{ color: '#64748b' }}>Loading...</p>
          ) : recentReports.length === 0 ? (
            <p style={{ color: '#64748b' }}>Belum ada laporan</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => router.push(`/reports/${report.id}`)}
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                        {report.unit_serial}
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        {report.form_type} • {new Date(report.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: report.status === 'COMPLETED' ? '#10b98120' : '#f59e0b20',
                        color: report.status === 'COMPLETED' ? '#10b981' : '#f59e0b',
                      }}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
