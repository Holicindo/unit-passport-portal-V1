'use client';

const AirflowDiagram = () => (
  <div style={{ width: '100%', height: '100%', backgroundColor: '#001F3F', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(#2E5BFF 1px, transparent 1px), linear-gradient(90deg, #2E5BFF 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
    <svg viewBox="0 0 200 300" width="100%" height="100%" style={{ zIndex: 1, padding: '20px' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#00C48C" />
        </marker>
      </defs>
      <rect x="45" y="20" width="110" height="240" fill="rgba(0, 31, 63, 0.8)" stroke="#2E5BFF" strokeWidth="2.5" rx="4" />
      <rect x="52.5" y="28" width="95" height="175" fill="rgba(46, 91, 255, 0.05)" stroke="#2E5BFF" strokeWidth="1" strokeDasharray="2 2" />
      <rect x="45" y="215" width="110" height="45" fill="rgba(255,255,255,0.02)" stroke="#2E5BFF" strokeWidth="1.5" />
      <line x1="55" y1="225" x2="135" y2="225" stroke="#2E5BFF" strokeWidth="1" opacity="0.5" />
      <line x1="55" y1="235" x2="135" y2="235" stroke="#2E5BFF" strokeWidth="1" opacity="0.5" />
      <line x1="55" y1="245" x2="135" y2="245" stroke="#2E5BFF" strokeWidth="1" opacity="0.5" />
      <line x1="52.5" y1="65" x2="147.5" y2="65" stroke="#2E5BFF" strokeWidth="1.5" opacity="0.8" />
      <line x1="52.5" y1="105" x2="147.5" y2="105" stroke="#2E5BFF" strokeWidth="1.5" opacity="0.8" />
      <line x1="52.5" y1="145" x2="147.5" y2="145" stroke="#2E5BFF" strokeWidth="1.5" opacity="0.8" />
      <line x1="52.5" y1="185" x2="147.5" y2="185" stroke="#2E5BFF" strokeWidth="1.5" opacity="0.8" />
      <path d="M 100 205 L 100 45" stroke="#00C48C" strokeWidth="2.5" fill="none" markerEnd="url(#arrowhead)" opacity="0.9" />
      <path d="M 100 45 Q 135 45 135 70 L 135 190" stroke="#00C48C" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="4 3" opacity="0.8" />
      <path d="M 100 45 Q 65 45 65 70 L 65 190" stroke="#00C48C" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" strokeDasharray="4 3" opacity="0.8" />
      <line x1="25" y1="20" x2="25" y2="260" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
      <line x1="20" y1="20" x2="30" y2="20" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
      <line x1="20" y1="260" x2="30" y2="260" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
      <text x="15" y="140" fill="#F2F4F7" fontSize="10" transform="rotate(-90 15,140)" textAnchor="middle" opacity="0.9" style={{ fontFamily: 'sans-serif', fontWeight: 600 }}>Tinggi</text>
      <line x1="45" y1="280" x2="155" y2="280" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
      <line x1="45" y1="275" x2="45" y2="285" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
      <line x1="155" y1="275" x2="155" y2="285" stroke="#F2F4F7" strokeWidth="1" opacity="0.6" />
      <text x="100" y="295" fill="#F2F4F7" fontSize="10" textAnchor="middle" opacity="0.9" style={{ fontFamily: 'sans-serif', fontWeight: 600 }}>Lebar</text>
    </svg>
  </div>
);

export default AirflowDiagram;
