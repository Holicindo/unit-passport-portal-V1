'use client';

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e4e4e4 50%, #f0f0f0 75%)',
  backgroundSize: '400px 100%',
  animation: 'shimmer 1.4s infinite linear',
  borderRadius: '6px',
};

export default function Loading() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>

      <div style={{ padding: '0', animation: 'none' }}>
        {/* Page header skeleton */}
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ ...shimmerStyle, width: '220px', height: '28px', marginBottom: '10px' }} />
            <div style={{ ...shimmerStyle, width: '340px', height: '16px' }} />
          </div>
          <div style={{ ...shimmerStyle, width: '110px', height: '40px', borderRadius: '12px' }} />
        </div>

        {/* Table card skeleton */}
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,31,63,0.08)', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f4', display: 'flex', gap: '12px' }}>
            <div style={{ ...shimmerStyle, flex: 1, height: '40px', borderRadius: '8px' }} />
            <div style={{ ...shimmerStyle, width: '80px', height: '40px', borderRadius: '20px' }} />
          </div>

          {/* Table header */}
          <div style={{ background: '#f2f4f7', padding: '12px 16px', display: 'grid', gridTemplateColumns: '40px 130px 180px 1fr 80px 70px', gap: '16px', borderBottom: '2px solid #e8eaf0' }}>
            {[24, 90, 60, 100, 50, 40].map((w, i) => (
              <div key={i} style={{ ...shimmerStyle, width: `${w}px`, height: '12px' }} />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: '40px 130px 180px 1fr 80px 70px',
                gap: '16px',
                borderBottom: i < 9 ? '1px solid #f2f4f7' : 'none',
                alignItems: 'center',
              }}
            >
              <div style={{ ...shimmerStyle, width: '20px', height: '14px' }} />
              <div style={{ ...shimmerStyle, width: '110px', height: '22px', borderRadius: '6px' }} />
              <div style={{ ...shimmerStyle, width: '140px', height: '14px' }} />
              <div style={{ ...shimmerStyle, width: '120px', height: '14px' }} />
              <div style={{ ...shimmerStyle, width: '60px', height: '22px', borderRadius: '20px' }} />
              <div style={{ ...shimmerStyle, width: '50px', height: '14px' }} />
            </div>
          ))}

          {/* Pagination */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ ...shimmerStyle, width: '160px', height: '14px' }} />
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} style={{ ...shimmerStyle, width: '34px', height: '34px', borderRadius: '8px' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
