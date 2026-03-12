import { useState, useEffect, useRef, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────────
   GOOGLE FONTS  (injected once)
───────────────────────────────────────────────────────────────── */
const injectFonts = () => {
  if (document.getElementById('kh-fonts')) return;
  const link = document.createElement('link');
  link.id = 'kh-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(link);
};

/* ─────────────────────────────────────────────────────────────────
   THEME TOKENS
───────────────────────────────────────────────────────────────── */
const LIGHT = {
  bg:            '#F7F5FF',
  bgCard:        '#FFFFFF',
  bgSecondary:   '#F0ECFF',
  bgHover:       '#EDE8FF',
  bgAccentSoft:  'rgba(124,58,237,0.05)',
  border:        '#E4DEFF',
  borderStrong:  '#C4B5FD',
  text:          '#1E1340',
  textSub:       '#4B4580',
  textMuted:     '#9490B5',
  accent:        '#7C3AED',
  accentMid:     '#9B59F5',
  accentLight:   '#A78BFA',
  accentPale:    '#EDE9FE',
  gold:          '#B45309',
  success:       '#047857',
  successBg:     'rgba(4,120,87,0.08)',
  danger:        '#B91C1C',
  dangerBg:      'rgba(185,28,28,0.08)',
  warn:          '#B45309',
  warnBg:        'rgba(180,83,9,0.08)',
  shadow:        '0 8px 32px rgba(124,58,237,0.12)',
  shadowSm:      '0 2px 12px rgba(124,58,237,0.08)',
  headerBg:      'rgba(247,245,255,0.92)',
  glassBorder:   'rgba(124,58,237,0.15)',
  overlayBg:     'rgba(30,19,64,0.55)',
};

const DARK = {
  bg:            '#0C0A1A',
  bgCard:        '#15122A',
  bgSecondary:   '#1B1835',
  bgHover:       '#221E3E',
  bgAccentSoft:  'rgba(167,139,250,0.07)',
  border:        '#2A2450',
  borderStrong:  '#4C3D9E',
  text:          '#EDE9FF',
  textSub:       '#B8B0E8',
  textMuted:     '#6B6599',
  accent:        '#A78BFA',
  accentMid:     '#9B59F5',
  accentLight:   '#C4B5FD',
  accentPale:    '#221E3E',
  gold:          '#F59E0B',
  success:       '#34D399',
  successBg:     'rgba(52,211,153,0.10)',
  danger:        '#F87171',
  dangerBg:      'rgba(248,113,113,0.10)',
  warn:          '#FBBF24',
  warnBg:        'rgba(251,191,36,0.10)',
  shadow:        '0 8px 32px rgba(0,0,0,0.50)',
  shadowSm:      '0 2px 12px rgba(0,0,0,0.35)',
  headerBg:      'rgba(12,10,26,0.96)',
  glassBorder:   'rgba(167,139,250,0.20)',
  overlayBg:     'rgba(0,0,0,0.75)',
};

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
const API_URL = 'https://dollar5665.pythonanywhere.com/api';

const generateMeetLink = () => {
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (n) => Array.from({ length: n }, () => alpha[Math.floor(Math.random() * 26)]).join('');
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
};

/* Sparkline SVG */
const Sparkline = ({ data, color, width = 90, height = 36 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const fill = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const fillPath = `M ${fill[0]} ${fill.slice(1).map(p => `L ${p}`).join(' ')} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MOCK REVENUE DATA
───────────────────────────────────────────────────────────────── */
const TEACHER_REVENUE = [
  { id: 1, name: 'Prof. Jean Martin',     subject: 'Mathématiques', courses: 24, monthRevenue: 1080, totalRevenue: 6840, trend: [30,45,55,40,80,75,90,110], avatar: 'JM', color: '#7C3AED' },
  { id: 2, name: 'Prof. Sophie Dubois',   subject: 'Français',      courses: 18, monthRevenue:  810, totalRevenue: 4320, trend: [50,60,40,70,65,80,72,85],  avatar: 'SD', color: '#0891B2' },
  { id: 3, name: 'Prof. Marie Laurent',   subject: 'Anglais',       courses: 30, monthRevenue: 1350, totalRevenue: 8100, trend: [20,40,55,60,90,85,110,130], avatar: 'ML', color: '#059669' },
  { id: 4, name: 'Prof. Pierre Rousseau', subject: 'Physique',      courses: 15, monthRevenue:  675, totalRevenue: 3600, trend: [40,35,50,45,60,55,70,80],  avatar: 'PR', color: '#D97706' },
  { id: 5, name: 'Prof. Camille Moreau',  subject: 'Chimie',        courses: 12, monthRevenue:  540, totalRevenue: 2700, trend: [25,30,35,40,45,50,55,65],  avatar: 'CM', color: '#DB2777' },
];

/* ─────────────────────────────────────────────────────────────────
   GLOBAL CSS INJECTION (animations)
───────────────────────────────────────────────────────────────── */
const injectCSS = () => {
  if (document.getElementById('kh-admin-css')) return;
  const style = document.createElement('style');
  style.id = 'kh-admin-css';
  style.textContent = `
    @keyframes kh-spin   { to { transform: rotate(360deg); } }
    @keyframes kh-pulse  { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
    @keyframes kh-fadein { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
    @keyframes kh-modal  { from { opacity:0; transform:scale(0.94) translateY(16px); } to { opacity:1; transform:none; } }
    @keyframes kh-ping   { 0% { transform:scale(1); opacity:1; } 75%,100% { transform:scale(2); opacity:0; } }
    .kh-card:hover { transform: translateY(-2px); }
    .kh-tab-btn:hover { opacity:0.85; }
    .kh-action-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
    .kh-icon-btn:hover { transform: scale(1.08); }
    * { box-sizing: border-box; }
    ::-webkit-scrollbar { width:6px; height:6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius:3px; }
  `;
  document.head.appendChild(style);
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const AdminDashboard = ({ navigate, user, onLogout }) => {
  useEffect(() => { injectFonts(); injectCSS(); }, []);

  const [isDark, setIsDark] = useState(false);
  const T = isDark ? DARK : LIGHT;

  const [activeTab, setActiveTab] = useState('appointments');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  /* ── state ─────────────────────────────────────────────────── */
  const [parentRequests,       setParentRequests]       = useState([]);
  const [teacherRequests,      setTeacherRequests]      = useState([]);
  const [appointmentRequests,  setAppointmentRequests]  = useState([]);
  const [availableTeachers,    setAvailableTeachers]    = useState([]);

  /* ── modals ─────────────────────────────────────────────────── */
  const [interviewModal, setInterviewModal] = useState(null);
  // { teacher: obj, meetLink: string, sending: bool, sent: bool, error: string }

  const [completedCourses] = useState([
    { id:1, subject:'Mathématiques', teacher:'Prof. Jean Martin',     teacherId:1, student:'Lucas Dupont',  parent:'Marie Dupont',  date:'2025-11-25', time:'14:00', duration:'1h',   amount:45,  validated:{ parent:true,  teacher:true  }, status:'completed' },
    { id:2, subject:'Français',      teacher:'Prof. Sophie Dubois',   teacherId:2, student:'Emma Martin',   parent:'Jean Martin',   date:'2025-11-27', time:'16:00', duration:'1h30', amount:60,  validated:{ parent:true,  teacher:true  }, status:'completed' },
    { id:3, subject:'Anglais',       teacher:'Prof. Marie Laurent',   teacherId:3, student:'Thomas Petit',  parent:'Claire Petit',  date:'2025-11-28', time:'10:00', duration:'2h',   amount:90,  validated:{ parent:true,  teacher:true  }, status:'completed' },
    { id:4, subject:'Physique',      teacher:'Prof. Pierre Rousseau', teacherId:4, student:'Léa Bernard',   parent:'Sophie Bernard',date:'2025-11-29', time:'15:00', duration:'1h',   amount:45,  validated:{ parent:true,  teacher:false }, status:'pending_validation' },
    { id:5, subject:'Anglais',       teacher:'Prof. Marie Laurent',   teacherId:3, student:'Hugo Simon',    parent:'Marc Simon',    date:'2025-11-30', time:'11:00', duration:'1h30', amount:67,  validated:{ parent:false, teacher:true  }, status:'pending_validation' },
  ]);

  /* ── fetch ─────────────────────────────────────────────────── */
  useEffect(() => {
    fetchTeacherRequests();
    fetchParentRequests();
    fetchAppointments();
  }, []);

  const fetchTeacherRequests = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_URL}/teacher-requests/`);
      const d = await r.json();
      if (d.success) {
        const list = d.data || [];
        setTeacherRequests(list);
        setAvailableTeachers(
          list.filter(t => t.status === 'approved').map(t => ({
            id:           t.id,
            full_name:    t.full_name,
            email:        t.email || '',
            subjects:     Array.isArray(t.subjects) ? t.subjects : [],
            availability: t.availability || '',
          }))
        );
      } else setError('Erreur chargement candidatures');
    } catch { setError('Impossible de se connecter au serveur.'); }
    finally { setLoading(false); }
  };

  const fetchParentRequests = async () => {
    try {
      const r = await fetch(`${API_URL}/parent-requests/`);
      const d = await r.json();
      if (d.success) setParentRequests(d.data || []);
    } catch {}
  };

  const fetchAppointments = async () => {
    try {
      const r = await fetch(`${API_URL}/appointments/`);
      const d = await r.json();
      if (d.success) setAppointmentRequests(normalize(d.data || []));
    } catch {}
  };

  const normalize = (list) => list.map(a => ({
    ...a,
    assignedTeacher:   a.assigned_teacher   || a.assignedTeacher   || null,
    assignedTeacherId: a.assigned_teacher_id || a.assignedTeacherId || null,
    createdAt:         a.created_at          || a.createdAt,
  }));

  /* ── CV download ─────────────────────────────────────────── */
  const handleDownloadCV = async (id, name) => {
    try {
      const r = await fetch(`${API_URL}/teacher-requests/${id}/cv`);
      if (!r.ok) { alert('❌ Erreur téléchargement CV'); return; }
      const blob = await r.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `CV_${(name||'enseignant').replace(/\s/g,'_')}.pdf`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { alert('❌ Erreur téléchargement CV'); }
  };

  /* ── Parent handlers ─────────────────────────────────────── */
  const handleApproveParent = async (id) => {
    try {
      const r = await fetch(`${API_URL}/parent-requests/${id}/`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:'approved' }) });
      const d = await r.json();
      if (d.success) setParentRequests(p => p.map(x => x.id===id ? { ...x, status:'approved' } : x));
      else alert('❌ '+d.message);
    } catch { alert('❌ Erreur de connexion'); }
  };
  const handleRejectParent = async (id) => {
    if (!window.confirm('Rejeter cette demande parent ?')) return;
    try {
      const r = await fetch(`${API_URL}/parent-requests/${id}/`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:'rejected' }) });
      const d = await r.json();
      if (d.success) setParentRequests(p => p.map(x => x.id===id ? { ...x, status:'rejected' } : x));
    } catch { alert('❌ Erreur'); }
  };
  const handleDeleteParent = async (id) => {
    if (!window.confirm('Supprimer définitivement ?')) return;
    try {
      const r = await fetch(`${API_URL}/parent-requests/${id}/`, { method:'DELETE' });
      const d = await r.json();
      if (d.success) setParentRequests(p => p.filter(x => x.id!==id));
    } catch { alert('❌ Erreur'); }
  };

  /* ── Teacher handlers ────────────────────────────────────── */
  const handleApproveTeacher = async (id) => {
    try {
      const r = await fetch(`${API_URL}/teacher-requests/${id}/`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:'approved' }) });
      const d = await r.json();
      if (d.success) { await fetchTeacherRequests(); }
      else alert('❌ '+d.message);
    } catch { alert('❌ Erreur'); }
  };
  const handleRejectTeacher = async (id) => {
    if (!window.confirm('Rejeter cette candidature ?')) return;
    try {
      const r = await fetch(`${API_URL}/teacher-requests/${id}/`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status:'rejected' }) });
      const d = await r.json();
      if (d.success) setTeacherRequests(p => p.map(x => x.id===id ? { ...x, status:'rejected' } : x));
    } catch { alert('❌ Erreur'); }
  };
  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Supprimer définitivement ?')) return;
    try {
      const r = await fetch(`${API_URL}/teacher-requests/${id}/`, { method:'DELETE' });
      const d = await r.json();
      if (d.success) setTeacherRequests(p => p.filter(x => x.id!==id));
    } catch { alert('❌ Erreur'); }
  };

  /* ── Interview / Meet ────────────────────────────────────── */
  const openInterviewModal = (teacher) => {
    setInterviewModal({ teacher, meetLink: generateMeetLink(), sending: false, sent: false, error: '' });
  };

  const handleSendMeetLink = async () => {
    setInterviewModal(m => ({ ...m, sending: true, error: '' }));
    try {
      /* Real impl: POST /api/send-interview-email/ { teacherId, email, meetLink } */
      await new Promise(r => setTimeout(r, 1200)); // simulate API
      setInterviewModal(m => ({ ...m, sending: false, sent: true }));
    } catch {
      setInterviewModal(m => ({ ...m, sending: false, error: 'Échec de l\'envoi. Réessayez.' }));
    }
  };

  /* ── Assignment ──────────────────────────────────────────── */
  const handleAssignTeacher = async (appointmentId, teacher) => {
    try {
      const r = await fetch(`${API_URL}/appointments/${appointmentId}/assign/`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: teacher.id, teacherName: teacher.full_name })
      });
      const d = await r.json();
      if (d.success) {
        setAppointmentRequests(prev => prev.map(a =>
          a.id === appointmentId
            ? { ...a, assignedTeacher: teacher.full_name, assignedTeacherId: teacher.id, status: 'assigned' }
            : a
        ));
      } else alert('❌ '+d.message);
    } catch { alert('❌ Erreur serveur'); }
  };

  /* ── Computed ─────────────────────────────────────────────── */
  const getParentName     = (r) => r.parentFirstName && r.parentLastName ? `${r.parentFirstName} ${r.parentLastName}` : r.parentName || 'Parent';
  const getParentChildren = (r) => Array.isArray(r.children) ? r.children : [];

  const validatedRevenue = completedCourses.filter(c => c.validated.parent && c.validated.teacher).reduce((s,c)=>s+c.amount,0);
  const pendingRevenue   = completedCourses.filter(c => !c.validated.parent || !c.validated.teacher).reduce((s,c)=>s+c.amount,0);
  const pendingActions   =
    (parentRequests||[]).filter(r=>r.status==='pending').length +
    (teacherRequests||[]).filter(r=>r.status==='pending').length +
    (appointmentRequests||[]).filter(r=>r.status==='pending').length;

  const totalPlatRevenue = TEACHER_REVENUE.reduce((s,t)=>s+t.monthRevenue,0);

  /* ── Status chip factory ─────────────────────────────────── */
  const StatusChip = ({ status }) => {
    const MAP = {
      pending:            { label:'En attente',        color: T.warn,    bg: T.warnBg },
      approved:           { label:'Approuvé',          color: T.success, bg: T.successBg },
      rejected:           { label:'Rejeté',            color: T.danger,  bg: T.dangerBg },
      assigned:           { label:'Assigné',           color: T.accent,  bg: T.accentPale },
      confirmed:          { label:'Confirmé',          color: T.success, bg: T.successBg },
      pending_validation: { label:'Validation en att.',color: T.warn,    bg: T.warnBg },
      completed:          { label:'Terminé',           color: T.success, bg: T.successBg },
    };
    const cfg = MAP[status] || MAP.pending;
    return (
      <span style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700,
        background: cfg.bg, color: cfg.color, letterSpacing:0.4, flexShrink:0 }}>
        {cfg.label}
      </span>
    );
  };

  /* ─────────────────────── RENDER ─────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', background: T.bg, fontFamily:"'DM Sans', 'Segoe UI', sans-serif",
      color: T.text, transition:'background 0.35s, color 0.35s', position:'relative', overflowX:'hidden' }}>

      {/* Background decoration */}
      <div style={{ position:'fixed', top:-200, right:-150, width:600, height:600, borderRadius:'50%',
        background:`radial-gradient(circle, ${isDark?'rgba(124,58,237,0.12)':'rgba(124,58,237,0.07)'} 0%, transparent 70%)`,
        pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:-250, left:-150, width:700, height:700, borderRadius:'50%',
        background:`radial-gradient(circle, ${isDark?'rgba(167,139,250,0.08)':'rgba(167,139,250,0.06)'} 0%, transparent 70%)`,
        pointerEvents:'none', zIndex:0 }} />

      {/* ══════════ HEADER ══════════ */}
      <header style={{ position:'sticky', top:0, zIndex:200, background: T.headerBg,
        backdropFilter:'blur(20px)', borderBottom:`1px solid ${T.border}`, boxShadow: T.shadowSm }}>
        <div style={{ maxWidth:1440, margin:'0 auto', padding:'0 28px', height:68,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:14,
              background:`linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:"'Cormorant Garamond', serif", fontWeight:700, fontSize:18, color:'#fff',
              boxShadow:`0 4px 18px ${T.accent}44` }}>KH</div>
            <div>
              <p style={{ margin:0, fontFamily:"'Cormorant Garamond', serif", fontWeight:700,
                fontSize:20, color: T.text, letterSpacing:0.5 }}>KH Perfection</p>
              <p style={{ margin:0, fontSize:11, color: T.textMuted, fontWeight:500, letterSpacing:1.5,
                textTransform:'uppercase' }}>Administration</p>
            </div>
          </div>

          {/* Nav */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button className="kh-action-btn" onClick={()=>{ fetchTeacherRequests(); fetchParentRequests(); fetchAppointments(); }}
              style={{ padding:'8px 16px', borderRadius:10, border:`1px solid ${T.border}`,
                background:'transparent', color: T.textSub, fontSize:13, fontWeight:600, cursor:'pointer',
                display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}>
              ↻ Actualiser
            </button>
            {navigate && (
              <button className="kh-action-btn" onClick={()=>navigate('home')}
                style={{ padding:'8px 16px', borderRadius:10, border:`1px solid ${T.border}`,
                  background:'transparent', color: T.textSub, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}>
                🏠 Accueil
              </button>
            )}
            {/* Theme toggle */}
            <button className="kh-icon-btn" onClick={()=>setIsDark(d=>!d)}
              title="Changer le thème"
              style={{ width:42, height:42, borderRadius:12, border:`1px solid ${T.border}`,
                background: T.bgSecondary, fontSize:20, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s',
                boxShadow: T.shadowSm }}>
              {isDark ? '☀️' : '🌙'}
            </button>
            {onLogout && (
              <button className="kh-action-btn" onClick={onLogout}
                style={{ padding:'8px 18px', borderRadius:10, border:`1px solid ${T.dangerBg}`,
                  background: T.dangerBg, color: T.danger, fontSize:13, fontWeight:700,
                  cursor:'pointer', transition:'all 0.2s' }}>
                Déconnexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══════════ HERO ══════════ */}
      <section style={{ background: T.bgAccentSoft, borderBottom:`1px solid ${T.border}`,
        padding:'32px 28px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1440, margin:'0 auto', display:'flex',
          justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ margin:'0 0 6px 0', fontFamily:"'Cormorant Garamond', serif",
              fontWeight:700, fontSize:32, color: T.text, letterSpacing:0.3 }}>
              Tableau de bord
            </h1>
            <p style={{ margin:0, fontSize:15, color: T.textMuted }}>
              Gérez votre plateforme en temps réel · {new Date().toLocaleDateString('fr-FR',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          {pendingActions > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px',
              borderRadius:24, background: T.bgCard, border:`1px solid ${T.borderStrong}`,
              boxShadow: T.shadowSm }}>
              <div style={{ position:'relative', width:12, height:12 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background: T.accent,
                  animation:'kh-pulse 2s ease-in-out infinite' }} />
              </div>
              <span style={{ fontWeight:700, color: T.accent, fontSize:14 }}>
                {pendingActions} action{pendingActions>1?'s':''} en attente
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Error bar */}
      {error && (
        <div style={{ maxWidth:1440, margin:'16px auto 0', padding:'0 28px', zIndex:1, position:'relative' }}>
          <div style={{ padding:'14px 20px', borderRadius:12, background: T.dangerBg,
            border:`1px solid ${T.danger}44`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color: T.danger, fontWeight:600 }}>⚠️ {error}</span>
            <button onClick={()=>setError('')} style={{ background:'none', border:'none', cursor:'pointer',
              color: T.danger, fontSize:20 }}>✕</button>
          </div>
        </div>
      )}

      {/* ══════════ KPI CARDS ══════════ */}
      <section style={{ maxWidth:1440, margin:'28px auto', padding:'0 28px', position:'relative', zIndex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:16 }}>
          {[
            { label:'Parents inscrits',     value: parentRequests.length,                                 icon:'👥',  color: '#0891B2' },
            { label:'Enseignants actifs',   value: teacherRequests.filter(r=>r.status==='approved').length, icon:'🎓', color: T.success },
            { label:'Cours planifiés',      value: appointmentRequests.length,                            icon:'📅',  color: T.accent },
            { label:'Revenus validés',      value: `${validatedRevenue}€`,                                icon:'💰',  color: T.success },
            { label:'En attente de paiement', value: `${pendingRevenue}€`,                               icon:'⏳',  color: T.warn },
            { label:'Revenu plateforme/mois', value:`${totalPlatRevenue}€`,                              icon:'📈',  color: '#DB2777' },
          ].map((kpi, i) => (
            <div key={i} className="kh-card"
              style={{ background: T.bgCard, borderRadius:18, padding:'20px 22px', border:`1px solid ${T.border}`,
                boxShadow: T.shadowSm, display:'flex', alignItems:'center', gap:14,
                transition:'transform 0.25s, box-shadow 0.25s', animation:`kh-fadein 0.4s ease ${i*0.06}s both` }}>
              <div style={{ width:48, height:48, borderRadius:14, background:`${kpi.color}18`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                {kpi.icon}
              </div>
              <div>
                <p style={{ margin:'0 0 3px 0', fontSize:12, color: T.textMuted, fontWeight:600, letterSpacing:0.4 }}>{kpi.label}</p>
                <p style={{ margin:0, fontSize:24, fontWeight:800, color: kpi.color }}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ TABS ══════════ */}
      <section style={{ maxWidth:1440, margin:'0 auto 20px', padding:'0 28px', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            { key:'appointments', icon:'📆', label:'Rendez-vous',          count: appointmentRequests.filter(r=>r.status==='pending').length },
            { key:'teachers',     icon:'🎓', label:'Candidatures',         count: teacherRequests.filter(r=>r.status==='pending').length },
            { key:'pending',      icon:'👨‍👩‍👧', label:'Demandes parents',     count: parentRequests.filter(r=>r.status==='pending').length },
            { key:'revenue',      icon:'📊', label:'Revenus temps réel',    count: null },
            { key:'completed',    icon:'✅', label:'Cours terminés',        count: completedCourses.length },
          ].map(tab => {
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} className="kh-tab-btn" onClick={()=>setActiveTab(tab.key)}
                style={{ padding:'11px 20px', borderRadius:12, cursor:'pointer',
                  fontFamily:"'DM Sans', sans-serif", fontWeight:active?700:600, fontSize:14,
                  display:'flex', alignItems:'center', gap:8, transition:'all 0.2s',
                  border: active ? `1px solid ${T.borderStrong}` : `1px solid ${T.border}`,
                  background: active ? T.accentPale : T.bgCard,
                  color: active ? T.accent : T.textSub,
                  boxShadow: active ? `0 2px 16px ${T.accent}1A` : 'none' }}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span style={{ background: T.accent, color:'#fff', borderRadius:20,
                    padding:'1px 8px', fontSize:11, fontWeight:800 }}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════ CONTENT ══════════ */}
      <main style={{ maxWidth:1440, margin:'0 auto', padding:'0 28px 80px', position:'relative', zIndex:1 }}>

        {/* ─────────── TAB: RENDEZ-VOUS ─────────── */}
        {activeTab === 'appointments' && (
          <TabContent T={T}>
            <SectionHeader T={T}
              title="Demandes de rendez-vous"
              sub={`${appointmentRequests.length} total · ${appointmentRequests.filter(r=>r.status==='assigned').length} assigné(s)`} />

            {appointmentRequests.length === 0 && <EmptyState T={T} />}

            {appointmentRequests.map((req, idx) => {
              const suitable = availableTeachers.filter(t =>
                Array.isArray(t.subjects) && t.subjects.includes(req.subject)
              );
              return (
                <Card key={req.id} T={T} idx={idx}>
                  <CardHead T={T}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 6px 0', fontSize:19, fontWeight:800,
                        fontFamily:"'Cormorant Garamond', serif", color: T.text }}>
                        📚 {req.subject} — {req.level}
                      </p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 18px' }}>
                        <InfoLine T={T} icon="👤" text={`${req.parentName}`} />
                        <InfoLine T={T} icon="👦" text={req.studentName} />
                        <InfoLine T={T} icon="📅" text={`${req.preferredDate} à ${req.preferredTime} · ${req.duration}`} />
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                      <StatusChip status={req.status} />
                      <span style={{ padding:'4px 12px', borderRadius:16, fontSize:12, fontWeight:700,
                        background: req.location==='online' ? T.accentPale : T.successBg,
                        color: req.location==='online' ? T.accent : T.success }}>
                        {req.location==='online' ? '💻 En ligne' : '🏠 Domicile'}
                      </span>
                      {!req.isTrialCourse && (
                        <span style={{ fontSize:14, fontWeight:800, color: T.success }}>{req.totalAmount}€</span>
                      )}
                      {req.isTrialCourse && (
                        <span style={{ padding:'4px 12px', borderRadius:16, fontSize:12, fontWeight:700,
                          background: T.warnBg, color: T.warn }}>🎁 Essai gratuit</span>
                      )}
                    </div>
                  </CardHead>

                  <div style={{ padding:'20px 24px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12, marginBottom:16 }}>
                      <InfoBlock T={T} label="Contact parent" value={`${req.parentEmail} · ${req.parentPhone||'—'}`} />
                      <InfoBlock T={T} label="Tarif" value={req.isTrialCourse ? 'Cours d\'essai GRATUIT' : `${req.pricePerHour}€/h`} />
                      {req.notes && <InfoBlock T={T} label="Notes" value={req.notes} />}
                    </div>

                    {/* Assignment zone */}
                    {req.status === 'pending' && (
                      <div style={{ borderRadius:14, border:`1px solid ${T.border}`,
                        background: T.bgSecondary, overflow:'hidden' }}>
                        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.border}`,
                          display:'flex', justifyContent:'space-between', alignItems:'center',
                          background: T.bgAccentSoft }}>
                          <span style={{ fontWeight:700, color: T.textSub, fontSize:14 }}>
                            👨‍🏫 Assigner un enseignant
                          </span>
                          {suitable.length > 0 && (
                            <span style={{ padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700,
                              background: T.accentPale, color: T.accent }}>
                              {suitable.length} compatible{suitable.length>1?'s':''}
                            </span>
                          )}
                        </div>
                        <div style={{ padding:'14px 18px' }}>
                          {suitable.length === 0 ? (
                            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                              borderRadius:12, background: T.warnBg, border:`1px solid ${T.warn}33` }}>
                              <span style={{ fontSize:22 }}>⚠️</span>
                              <div>
                                <p style={{ margin:0, fontWeight:700, color: T.warn, fontSize:14 }}>
                                  Aucun enseignant disponible</p>
                                <p style={{ margin:'2px 0 0', color: T.textMuted, fontSize:13 }}>
                                  Aucun profil qualifié pour «{req.subject}»</p>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                              {suitable.map(teacher => (
                                <div key={teacher.id}
                                  style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                                    flexWrap:'wrap', gap:10, padding:'14px 16px', borderRadius:12,
                                    background: T.bgCard, border:`1px solid ${T.border}` }}>
                                  <div style={{ flex:1 }}>
                                    <p style={{ margin:'0 0 6px 0', fontWeight:700, color: T.text, fontSize:15 }}>
                                      {teacher.full_name}
                                    </p>
                                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                                      {(teacher.subjects||[]).map((s,i) => (
                                        <span key={i} style={{ padding:'3px 10px', borderRadius:10,
                                          fontSize:11, fontWeight:700,
                                          background: T.accentPale, color: T.accent }}>{s}</span>
                                      ))}
                                    </div>
                                    {teacher.availability && (
                                      <p style={{ margin:'6px 0 0', fontSize:12, color: T.textMuted }}>
                                        🗓️ {teacher.availability}</p>
                                    )}
                                  </div>
                                  <button className="kh-action-btn"
                                    onClick={()=>handleAssignTeacher(req.id, teacher)}
                                    style={{ padding:'9px 22px', borderRadius:10, border:'none',
                                      background:`linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
                                      color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
                                      boxShadow:`0 4px 16px ${T.accent}30`, transition:'all 0.2s' }}>
                                    ✓ Assigner
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {req.status === 'assigned' && (
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px',
                        borderRadius:12, background: T.successBg, border:`1px solid ${T.success}33` }}>
                        <span style={{ color: T.success, fontSize:20 }}>✓</span>
                        <span style={{ fontWeight:700, color: T.success }}>Assigné à </span>
                        <span style={{ color: T.text, fontWeight:600 }}>{req.assignedTeacher}</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </TabContent>
        )}

        {/* ─────────── TAB: CANDIDATURES ENSEIGNANTS ─────────── */}
        {activeTab === 'teachers' && (
          <TabContent T={T}>
            <SectionHeader T={T}
              title="Candidatures des enseignants"
              sub={`${teacherRequests.length} total · ${teacherRequests.filter(r=>r.status==='approved').length} approuvé(s) · ${teacherRequests.filter(r=>r.status==='pending').length} en attente`} />

            {loading && <Loader T={T} />}
            {!loading && teacherRequests.length === 0 && <EmptyState T={T} />}

            {!loading && teacherRequests.map((req, idx) => (
              <Card key={req.id} T={T} idx={idx}>
                <CardHead T={T}>
                  <div style={{ display:'flex', alignItems:'center', gap:16, flex:1 }}>
                    <Avatar T={T} name={req.full_name} />
                    <div>
                      <p style={{ margin:'0 0 4px 0', fontSize:19, fontWeight:800,
                        fontFamily:"'Cormorant Garamond', serif", color: T.text }}>{req.full_name}</p>
                      <p style={{ margin:'0 0 6px 0', fontSize:13, color: T.textMuted }}>
                        {req.email} · {req.phone}
                      </p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {(Array.isArray(req.subjects)?req.subjects:[]).map((s,i) => (
                          <span key={i} style={{ padding:'3px 10px', borderRadius:10,
                            fontSize:11, fontWeight:700, background: T.accentPale, color: T.accent }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <StatusChip status={req.status} />
                </CardHead>

                <div style={{ padding:'20px 24px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12, marginBottom:16 }}>
                    <InfoBlock T={T} label="Qualification"  value={req.qualification} />
                    <InfoBlock T={T} label="Expérience"     value={req.experience} />
                    {req.availability && <InfoBlock T={T} label="Disponibilités" value={req.availability} />}
                  </div>

                  {req.motivation && (
                    <div style={{ marginBottom:16, padding:'16px', borderRadius:12,
                      background: T.bgAccentSoft, border:`1px solid ${T.border}` }}>
                      <p style={{ margin:'0 0 8px 0', fontSize:11, fontWeight:700, color: T.textMuted,
                        textTransform:'uppercase', letterSpacing:1 }}>Lettre de motivation</p>
                      <p style={{ margin:0, fontSize:14, color: T.textSub, lineHeight:1.7 }}>{req.motivation}</p>
                    </div>
                  )}

                  {req.cv_filename && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      flexWrap:'wrap', gap:10, padding:'14px 18px', borderRadius:12,
                      background: T.successBg, border:`1px solid ${T.success}33` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ fontSize:32 }}>📄</span>
                        <div>
                          <p style={{ margin:0, fontSize:12, fontWeight:700, color: T.success, textTransform:'uppercase', letterSpacing:0.5 }}>CV disponible</p>
                          <p style={{ margin:'2px 0 0', fontSize:13, color: T.textSub }}>{req.cv_filename}</p>
                        </div>
                      </div>
                      <button className="kh-action-btn" onClick={()=>handleDownloadCV(req.id, req.full_name)}
                        style={{ padding:'9px 18px', borderRadius:10, border:'none',
                          background:`linear-gradient(135deg, ${T.success}, #047857)`,
                          color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>
                        ⬇️ Télécharger CV
                      </button>
                    </div>
                  )}
                </div>

                {/* Action bar */}
                <div style={{ padding:'16px 24px', background: T.bgSecondary,
                  borderTop:`1px solid ${T.border}`, display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
                  {req.status==='pending' && (
                    <>
                      <button className="kh-action-btn" onClick={()=>handleApproveTeacher(req.id)}
                        style={btnStyle('#059669','#047857')}>✓ Approuver</button>
                      <button className="kh-action-btn" onClick={()=>handleRejectTeacher(req.id)}
                        style={btnStyle('#DC2626','#B91C1C')}>✗ Rejeter</button>
                    </>
                  )}
                  {req.status==='approved' && (
                    <div style={{ padding:'9px 18px', borderRadius:10, background: T.successBg,
                      color: T.success, fontSize:13, fontWeight:700 }}>✓ Candidature approuvée</div>
                  )}
                  {req.status==='rejected' && (
                    <div style={{ padding:'9px 18px', borderRadius:10, background: T.dangerBg,
                      color: T.danger, fontSize:13, fontWeight:700 }}>✗ Candidature rejetée</div>
                  )}

                  {/* ── Interview button ── */}
                  <button className="kh-action-btn" onClick={()=>openInterviewModal(req)}
                    style={{ padding:'9px 20px', borderRadius:10,
                      border:`1px solid ${T.borderStrong}`,
                      background: T.accentPale, color: T.accent,
                      fontSize:13, fontWeight:700, cursor:'pointer',
                      display:'flex', alignItems:'center', gap:8, transition:'all 0.2s' }}>
                    📹 Entretien visio
                  </button>

                  <button className="kh-action-btn" onClick={()=>handleDeleteTeacher(req.id)}
                    style={{ marginLeft:'auto', padding:'9px 14px', borderRadius:10,
                      border:`1px solid ${T.danger}44`, background: T.dangerBg,
                      color: T.danger, fontSize:14, cursor:'pointer', transition:'all 0.2s' }}>
                    🗑️
                  </button>
                </div>
              </Card>
            ))}
          </TabContent>
        )}

        {/* ─────────── TAB: PARENTS ─────────── */}
        {activeTab === 'pending' && (
          <TabContent T={T}>
            <SectionHeader T={T}
              title="Demandes d'inscription parents"
              sub={`${parentRequests.length} total · ${parentRequests.filter(r=>r.status==='pending').length} en attente`} />

            {parentRequests.length === 0 && <EmptyState T={T} />}

            {parentRequests.map((req, idx) => {
              const children    = getParentChildren(req);
              const allSubjects = children.flatMap(c => Array.isArray(c.subjects)?c.subjects:[]);
              return (
                <Card key={req.id} T={T} idx={idx}>
                  <CardHead T={T}>
                    <div>
                      <p style={{ margin:'0 0 4px 0', fontSize:19, fontWeight:800,
                        fontFamily:"'Cormorant Garamond', serif", color: T.text }}>
                        {getParentName(req)}
                      </p>
                      <InfoLine T={T} icon="✉️" text={req.email} />
                      <InfoLine T={T} icon="📱" text={req.phone} />
                      {req.address && <InfoLine T={T} icon="📍" text={req.address} />}
                      <InfoLine T={T} icon="📅" text={req.createdAt ? new Date(req.createdAt).toLocaleDateString('fr-FR',{year:'numeric',month:'long',day:'numeric'}) : '—'} />
                    </div>
                    <StatusChip status={req.status} />
                  </CardHead>

                  <div style={{ padding:'20px 24px' }}>
                    <p style={{ margin:'0 0 10px 0', fontSize:12, fontWeight:700, color: T.textMuted,
                      textTransform:'uppercase', letterSpacing:1 }}>Enfant(s) — {children.length}</p>
                    {children.map((child, i) => (
                      <div key={i} style={{ padding:'12px 16px', borderRadius:12, marginBottom:8,
                        background: T.bgAccentSoft, border:`1px solid ${T.border}` }}>
                        <p style={{ margin:'0 0 4px 0', fontWeight:700, fontSize:14, color: T.text }}>
                          👶 {child.firstName} {child.lastName} — {child.level}
                        </p>
                        {child.preferredDays?.length>0 && (
                          <p style={{ margin:'2px 0', fontSize:13, color: T.textMuted }}>
                            📅 {child.preferredDays.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                    {allSubjects.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
                        {allSubjects.map((s,i) => (
                          <span key={i} style={{ padding:'4px 12px', borderRadius:20, fontSize:12,
                            fontWeight:700, background: T.accentPale, color: T.accent }}>{s}</span>
                        ))}
                      </div>
                    )}
                    {req.message && (
                      <div style={{ marginTop:12, padding:'14px 16px', borderRadius:12,
                        background: T.bgSecondary, border:`1px solid ${T.border}` }}>
                        <p style={{ margin:'0 0 6px 0', fontSize:11, fontWeight:700, color: T.textMuted,
                          textTransform:'uppercase', letterSpacing:1 }}>Message</p>
                        <p style={{ margin:0, fontSize:14, color: T.textSub, lineHeight:1.7 }}>{req.message}</p>
                      </div>
                    )}
                  </div>

                  <div style={{ padding:'16px 24px', background: T.bgSecondary,
                    borderTop:`1px solid ${T.border}`, display:'flex', flexWrap:'wrap', gap:10 }}>
                    {req.status==='pending' && (
                      <>
                        <button className="kh-action-btn" onClick={()=>handleApproveParent(req.id)} style={btnStyle('#059669','#047857')}>✓ Approuver</button>
                        <button className="kh-action-btn" onClick={()=>handleRejectParent(req.id)}  style={btnStyle('#DC2626','#B91C1C')}>✗ Rejeter</button>
                      </>
                    )}
                    {req.status==='approved' && <div style={{ padding:'9px 18px', borderRadius:10, background: T.successBg, color: T.success, fontSize:13, fontWeight:700 }}>✓ Approuvé</div>}
                    {req.status==='rejected' && <div style={{ padding:'9px 18px', borderRadius:10, background: T.dangerBg,  color: T.danger,  fontSize:13, fontWeight:700 }}>✗ Rejeté</div>}
                    <button className="kh-action-btn" onClick={()=>handleDeleteParent(req.id)}
                      style={{ marginLeft:'auto', padding:'9px 14px', borderRadius:10,
                        border:`1px solid ${T.danger}44`, background: T.dangerBg,
                        color: T.danger, fontSize:14, cursor:'pointer', transition:'all 0.2s' }}>🗑️</button>
                  </div>
                </Card>
              );
            })}
          </TabContent>
        )}

        {/* ─────────── TAB: REVENUS ─────────── */}
        {activeTab === 'revenue' && (
          <TabContent T={T}>
            <SectionHeader T={T}
              title="Revenus en temps réel"
              sub={`Plateforme complète · ${completedCourses.length} cours terminés · Mis à jour maintenant`} />

            {/* Global KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
              {[
                { label:'Revenus validés ce mois',   value:`${validatedRevenue}€`,  icon:'💚', color: T.success, trend:'+12%' },
                { label:'En attente de validation',  value:`${pendingRevenue}€`,    icon:'⏳', color: T.warn,    trend:'' },
                { label:'Revenu mensuel plateforme', value:`${totalPlatRevenue}€`,  icon:'📈', color: T.accent,  trend:'+8%' },
                { label:'Cours ce mois',             value: completedCourses.length,icon:'📚', color:'#0891B2',  trend:`${TEACHER_REVENUE.reduce((s,t)=>s+t.courses,0)} total` },
              ].map((item,i) => (
                <div key={i} className="kh-card"
                  style={{ background: T.bgCard, borderRadius:18, padding:'22px',
                    border:`1px solid ${T.border}`, boxShadow: T.shadowSm,
                    transition:'transform 0.25s', animation:`kh-fadein 0.4s ease ${i*0.07}s both` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <span style={{ fontSize:28 }}>{item.icon}</span>
                    {item.trend && (
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10,
                        background: item.color==='#B45309'||item.color===T.warn ? T.warnBg : T.successBg,
                        color: item.color==='#B45309'||item.color===T.warn ? T.warn : T.success }}>
                        {item.trend}
                      </span>
                    )}
                  </div>
                  <p style={{ margin:'0 0 4px 0', fontSize:28, fontWeight:800, color: item.color }}>{item.value}</p>
                  <p style={{ margin:0, fontSize:12, color: T.textMuted, fontWeight:600 }}>{item.label}</p>
                </div>
              ))}
            </div>

            {/* Per-teacher revenue */}
            <Card T={T}>
              <div style={{ padding:'20px 24px', borderBottom:`1px solid ${T.border}`,
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <p style={{ margin:0, fontFamily:"'Cormorant Garamond', serif",
                  fontSize:20, fontWeight:700, color: T.text }}>Revenus par enseignant</p>
                <span style={{ fontSize:12, color: T.textMuted, fontWeight:600 }}>Ce mois-ci</span>
              </div>
              {TEACHER_REVENUE.map((teacher, i) => {
                const pct = Math.round((teacher.monthRevenue / totalPlatRevenue) * 100);
                return (
                  <div key={i} style={{ padding:'18px 24px',
                    borderBottom: i<TEACHER_REVENUE.length-1 ? `1px solid ${T.border}` : 'none',
                    animation:`kh-fadein 0.4s ease ${i*0.08}s both` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                      {/* Avatar */}
                      <div style={{ width:46, height:46, borderRadius:14, flexShrink:0,
                        background:`${teacher.color}20`, border:`2px solid ${teacher.color}40`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:14, fontWeight:800, color: teacher.color }}>
                        {teacher.avatar}
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:160 }}>
                        <p style={{ margin:'0 0 3px 0', fontWeight:700, color: T.text, fontSize:15 }}>
                          {teacher.name}
                        </p>
                        <p style={{ margin:0, fontSize:12, color: T.textMuted }}>
                          {teacher.subject} · {teacher.courses} cours
                        </p>
                      </div>
                      {/* Sparkline */}
                      <Sparkline data={teacher.trend} color={teacher.color} />
                      {/* Revenue */}
                      <div style={{ textAlign:'right', minWidth:100 }}>
                        <p style={{ margin:'0 0 2px 0', fontSize:24, fontWeight:800, color: T.success }}>
                          {teacher.monthRevenue}€
                        </p>
                        <p style={{ margin:0, fontSize:11, color: T.textMuted }}>
                          Total: {teacher.totalRevenue}€
                        </p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop:12, height:4, borderRadius:4, background: T.border, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, borderRadius:4,
                        background:`linear-gradient(90deg, ${teacher.color}, ${teacher.color}99)`,
                        transition:'width 1s ease' }} />
                    </div>
                    <p style={{ margin:'4px 0 0', fontSize:11, color: T.textMuted }}>{pct}% du revenu mensuel</p>
                  </div>
                );
              })}
            </Card>

            {/* Course-level revenue */}
            <Card T={T}>
              <div style={{ padding:'20px 24px', borderBottom:`1px solid ${T.border}` }}>
                <p style={{ margin:0, fontFamily:"'Cormorant Garamond', serif",
                  fontSize:20, fontWeight:700, color: T.text }}>Historique des paiements</p>
              </div>
              {completedCourses.map((course, i) => (
                <div key={course.id} style={{ padding:'16px 24px',
                  borderBottom: i<completedCourses.length-1 ? `1px solid ${T.border}` : 'none',
                  display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <p style={{ margin:'0 0 3px 0', fontWeight:700, color: T.text, fontSize:15 }}>
                      {course.subject}
                    </p>
                    <p style={{ margin:0, fontSize:12, color: T.textMuted }}>
                      {course.teacher} · {course.date} · {course.student}
                    </p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {[{who:'Parent',ok:course.validated.parent},{who:'Enseignant',ok:course.validated.teacher}].map((v,vi) => (
                        <span key={vi} style={{ fontSize:12, padding:'3px 10px', borderRadius:12, fontWeight:700,
                          background: v.ok ? T.successBg : T.warnBg,
                          color: v.ok ? T.success : T.warn }}>
                          {v.ok?'✓':'⏳'} {v.who}
                        </span>
                      ))}
                    </div>
                    <p style={{ margin:0, fontSize:20, fontWeight:800, color: T.success, minWidth:56, textAlign:'right' }}>
                      {course.amount}€
                    </p>
                  </div>
                </div>
              ))}
              <div style={{ padding:'16px 24px', background: T.bgAccentSoft, display:'flex', justifyContent:'flex-end', alignItems:'center', gap:16 }}>
                <span style={{ color: T.textMuted, fontWeight:600, fontSize:14 }}>Total validé</span>
                <span style={{ fontSize:26, fontWeight:900, color: T.success }}>{validatedRevenue}€</span>
              </div>
            </Card>
          </TabContent>
        )}

        {/* ─────────── TAB: COURS TERMINÉS ─────────── */}
        {activeTab === 'completed' && (
          <TabContent T={T}>
            <SectionHeader T={T}
              title="Cours terminés & Facturation"
              sub={`${completedCourses.length} cours · ${validatedRevenue}€ validés · ${pendingRevenue}€ en attente`} />

            {completedCourses.map((course, idx) => (
              <Card key={course.id} T={T} idx={idx}>
                <CardHead T={T}>
                  <div>
                    <p style={{ margin:'0 0 6px 0', fontSize:19, fontWeight:800,
                      fontFamily:"'Cormorant Garamond', serif", color: T.text }}>
                      📚 {course.subject}
                    </p>
                    <InfoLine T={T} icon="📅" text={`${course.date} à ${course.time} · Durée: ${course.duration}`} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                    <StatusChip status={course.status} />
                    <span style={{ fontSize:26, fontWeight:900, color: T.success }}>{course.amount}€</span>
                  </div>
                </CardHead>
                <div style={{ padding:'20px 24px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12, marginBottom:14 }}>
                    <InfoBlock T={T} label="Enseignant" value={course.teacher} />
                    <InfoBlock T={T} label="Élève / Parent" value={`${course.student} / ${course.parent}`} />
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {[{who:'Parent',ok:course.validated.parent},{who:'Enseignant',ok:course.validated.teacher}].map((v,i) => (
                      <span key={i} style={{ padding:'6px 16px', borderRadius:20, fontSize:13, fontWeight:700,
                        background: v.ok ? T.successBg : T.warnBg,
                        color: v.ok ? T.success : T.warn }}>
                        {v.ok?'✓ ':'⏳ '}{v.who} {v.ok?'validé':'en attente'}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </TabContent>
        )}
      </main>

      {/* ══════════ INTERVIEW MODAL ══════════ */}
      {interviewModal && (
        <div style={{ position:'fixed', inset:0, background: T.overlayBg,
          backdropFilter:'blur(12px)', zIndex:999, display:'flex',
          alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={()=>setInterviewModal(null)}>
          <div style={{ background: T.bgCard, borderRadius:24, maxWidth:520, width:'100%',
            border:`1px solid ${T.border}`, boxShadow: T.shadow, overflow:'hidden',
            animation:'kh-modal 0.3s ease' }}
            onClick={e=>e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding:'22px 28px', background: T.bgAccentSoft,
              borderBottom:`1px solid ${T.border}`,
              display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <p style={{ margin:'0 0 4px 0', fontFamily:"'Cormorant Garamond', serif",
                  fontSize:24, fontWeight:700, color: T.text }}>Entretien vidéo</p>
                <p style={{ margin:0, fontSize:14, color: T.textMuted }}>{interviewModal.teacher.full_name}</p>
              </div>
              <button className="kh-icon-btn" onClick={()=>setInterviewModal(null)}
                style={{ width:36, height:36, borderRadius:10, border:`1px solid ${T.border}`,
                  background: T.bgHover, color: T.textSub, fontSize:18, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>✕</button>
            </div>

            <div style={{ padding:28 }}>
              {/* Meet link box */}
              <div style={{ padding:'18px', borderRadius:14, background: T.bgAccentSoft,
                border:`1px solid ${T.border}`, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ width:42, height:42, borderRadius:12,
                    background:`linear-gradient(135deg, #1565C0, #1E88E5)`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🎥</div>
                  <div>
                    <p style={{ margin:0, fontWeight:700, color: T.text, fontSize:15 }}>Lien Google Meet</p>
                    <p style={{ margin:0, fontSize:12, color: T.textMuted }}>Généré automatiquement</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
                  padding:'12px 14px', borderRadius:10, background: T.bgCard, border:`1px solid ${T.border}` }}>
                  <span style={{ flex:1, fontSize:13, color: T.accent, fontFamily:'monospace',
                    wordBreak:'break-all', fontWeight:600 }}>{interviewModal.meetLink}</span>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="kh-action-btn"
                      onClick={()=>navigator.clipboard?.writeText(interviewModal.meetLink)}
                      style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${T.border}`,
                        background: T.bgHover, color: T.textSub, fontSize:12, cursor:'pointer',
                        fontWeight:600, transition:'all 0.2s' }}>📋 Copier</button>
                    <a href={interviewModal.meetLink} target="_blank" rel="noreferrer"
                      style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${T.borderStrong}`,
                        background: T.accentPale, color: T.accent, fontSize:12, cursor:'pointer',
                        fontWeight:700, textDecoration:'none', display:'inline-block' }}>↗ Ouvrir</a>
                  </div>
                </div>
              </div>

              {/* Email destination */}
              <div style={{ padding:'16px 18px', borderRadius:14, background: T.bgSecondary,
                border:`1px solid ${T.border}`, marginBottom:20 }}>
                <p style={{ margin:'0 0 10px 0', fontSize:11, fontWeight:700, color: T.textMuted,
                  textTransform:'uppercase', letterSpacing:1 }}>Envoi par email à</p>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>✉️</span>
                  <span style={{ color: T.text, fontSize:15, fontWeight:600 }}>
                    {interviewModal.teacher.email || 'Email non renseigné'}
                  </span>
                </div>
                {interviewModal.teacher.email && (
                  <p style={{ margin:'8px 0 0', fontSize:12, color: T.textMuted, lineHeight:1.6 }}>
                    L'enseignant recevra le lien avec les instructions pour rejoindre l'entretien.
                  </p>
                )}
              </div>

              {/* Error */}
              {interviewModal.error && (
                <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:12,
                  background: T.dangerBg, border:`1px solid ${T.danger}44`, color: T.danger,
                  fontSize:14, fontWeight:600 }}>⚠️ {interviewModal.error}</div>
              )}

              {interviewModal.sent ? (
                <div style={{ padding:'18px 20px', borderRadius:14, background: T.successBg,
                  border:`1px solid ${T.success}44`, display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:28 }}>✅</span>
                  <div>
                    <p style={{ margin:0, fontWeight:800, color: T.success, fontSize:16 }}>Lien envoyé avec succès !</p>
                    <p style={{ margin:'3px 0 0', fontSize:13, color: T.textMuted }}>
                      {interviewModal.teacher.full_name} recevra le lien sur {interviewModal.teacher.email||'son email'}.
                    </p>
                  </div>
                </div>
              ) : (
                <button className="kh-action-btn"
                  onClick={handleSendMeetLink}
                  disabled={interviewModal.sending || !interviewModal.teacher.email}
                  style={{ width:'100%', padding:'14px', borderRadius:12, border:'none',
                    background: interviewModal.sending
                      ? T.border
                      : `linear-gradient(135deg, ${T.accent}, ${T.accentMid})`,
                    color: interviewModal.sending ? T.textMuted : '#fff',
                    fontSize:15, fontWeight:700, cursor: interviewModal.sending?'not-allowed':'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    boxShadow: interviewModal.sending ? 'none' : `0 6px 24px ${T.accent}33`,
                    transition:'all 0.2s' }}>
                  {interviewModal.sending ? (
                    <>
                      <div style={{ width:18, height:18, border:'3px solid rgba(255,255,255,0.3)',
                        borderTop:'3px solid #fff', borderRadius:'50%', animation:'kh-spin 1s linear infinite' }} />
                      Envoi en cours…
                    </>
                  ) : (
                    <>📧 Envoyer le lien par email</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/* ─── Utility style components ─────────────────────────────────────────── */
const TabContent = ({ T, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:18 }}>{children}</div>
);

const SectionHeader = ({ T, title, sub }) => (
  <div style={{ marginBottom:8 }}>
    <h2 style={{ margin:'0 0 4px 0', fontFamily:"'Cormorant Garamond', serif",
      fontSize:26, fontWeight:700, color: T.text }}>{title}</h2>
    {sub && <p style={{ margin:0, fontSize:14, color: T.textMuted }}>{sub}</p>}
  </div>
);

const Card = ({ T, children, idx=0 }) => (
  <div className="kh-card"
    style={{ background: T.bgCard, borderRadius:20, border:`1px solid ${T.border}`,
      boxShadow: T.shadowSm, overflow:'hidden',
      transition:'transform 0.25s, box-shadow 0.25s',
      animation:`kh-fadein 0.4s ease ${idx*0.07}s both` }}>
    {children}
  </div>
);

const CardHead = ({ T, children }) => (
  <div style={{ padding:'20px 24px', background: T.bgAccentSoft,
    borderBottom:`1px solid ${T.border}`,
    display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
    {children}
  </div>
);

const Avatar = ({ T, name }) => (
  <div style={{ width:52, height:52, borderRadius:16, flexShrink:0,
    background:`linear-gradient(135deg, ${T.accent}, ${T.accentLight})`,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:22, fontWeight:900, color:'#fff',
    boxShadow:`0 4px 18px ${T.accent}40` }}>
    {name?.[0] || '?'}
  </div>
);

const InfoBlock = ({ T, label, value }) => (
  <div style={{ padding:'12px 14px', borderRadius:12, background: T.bgSecondary, border:`1px solid ${T.border}` }}>
    <p style={{ margin:'0 0 4px 0', fontSize:11, fontWeight:700, color: T.textMuted,
      textTransform:'uppercase', letterSpacing:0.8 }}>{label}</p>
    <p style={{ margin:0, fontSize:14, color: T.textSub, lineHeight:1.5 }}>{value}</p>
  </div>
);

const InfoLine = ({ T, icon, text }) => (
  <p style={{ margin:'2px 0', fontSize:13, color: T.textMuted, display:'flex', alignItems:'center', gap:5 }}>
    <span>{icon}</span><span>{text}</span>
  </p>
);

const EmptyState = ({ T }) => (
  <div style={{ textAlign:'center', padding:'5rem 2rem', background: T.bgCard,
    borderRadius:20, border:`1px solid ${T.border}` }}>
    <p style={{ fontSize:52, margin:'0 0 14px 0' }}>📭</p>
    <p style={{ fontSize:17, color: T.textMuted, margin:0, fontWeight:600 }}>Aucun élément pour l'instant</p>
  </div>
);

const Loader = ({ T }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'5rem', gap:14 }}>
    <div style={{ width:44, height:44, border:`4px solid ${T.border}`,
      borderTop:`4px solid ${T.accent}`, borderRadius:'50%', animation:'kh-spin 1s linear infinite' }} />
    <p style={{ color: T.textMuted, margin:0, fontWeight:600 }}>Chargement…</p>
  </div>
);

const btnStyle = (c1, c2) => ({
  padding:'9px 20px', borderRadius:10, border:'none',
  background:`linear-gradient(135deg, ${c1}, ${c2})`,
  color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s',
});

export default AdminDashboard;
