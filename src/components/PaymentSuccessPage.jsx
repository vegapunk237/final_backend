/**
 * PaymentSuccessPage.jsx — KH PERFECTION
 *
 * Page affichée après retour de Stripe (paiement réussi).
 * - Vérifie le paiement côté backend
 * - Restaure la session utilisateur depuis sessionStorage
 * - Redirige automatiquement vers le dashboard SANS déconnecter
 */

import { useEffect, useState } from 'react';

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

const PaymentSuccessPage = ({ navigate, setUser }) => {
  const [status,      setStatus]      = useState('loading'); // loading | success | error
  const [courseData,  setCourseData]  = useState(null);
  const [countdown,   setCountdown]   = useState(5);

  useEffect(() => {
    const init = async () => {
      // ✅ ÉTAPE 1 : Restaurer la session utilisateur sauvegardée avant la redirection Stripe
      // Sans ça, l'utilisateur serait déconnecté car window.location.href recharge tout
      const savedUser = sessionStorage.getItem('kh_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setUser(user);             // Remettre l'utilisateur dans le state global
          sessionStorage.removeItem('kh_user'); // Nettoyer après usage
        } catch (e) {
          console.error('Erreur restauration session:', e);
        }
      }

      // ✅ ÉTAPE 2 : Récupérer session_id depuis l'URL retournée par Stripe
      const params    = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setStatus('error');
        return;
      }

      // ✅ ÉTAPE 3 : Vérifier le paiement côté backend (sécurité)
      try {
        const r = await fetch(`${API_URL}/payments/verify-session/${sessionId}/`);
        const d = await r.json();

        if (d.success && d.isPaid) {
          setCourseData(d.courseDetails);
          setStatus('success');

          // ✅ ÉTAPE 4 : Redirection automatique vers le dashboard après 5 secondes
          // On utilise navigate() et non window.location pour ne PAS perdre le state React
          let timer = 5;
          const interval = setInterval(() => {
            timer -= 1;
            setCountdown(timer);
            if (timer <= 0) {
              clearInterval(interval);
              navigate('parent-dashboard');
            }
          }, 1000);

        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('Erreur vérification paiement:', err);
        setStatus('error');
      }
    };

    init();
  }, []);

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={S.page}>
        <style>{css}</style>
        <div style={S.card}>
          <div style={S.spinner} />
          <h2 style={S.title}>Vérification du paiement...</h2>
          <p style={S.sub}>Merci de patienter, nous confirmons votre réservation.</p>
        </div>
      </div>
    );
  }

  // ── ERREUR ───────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div style={S.page}>
        <style>{css}</style>
        <div style={S.card}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ ...S.title, color: '#ef4444' }}>Paiement non confirmé</h2>
          <p style={S.sub}>
            Le paiement n'a pas pu être vérifié. Si vous avez été débité,
            contactez notre support.
          </p>
          <div style={S.btnRow}>
            <button onClick={() => navigate('appointment')} style={S.btnSecondary}>
              Réessayer la réservation
            </button>
            <button onClick={() => navigate('parent-dashboard')} style={S.btnPrimary}>
              Aller au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SUCCÈS ───────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{css}</style>
      <div style={S.card} className="success-fade">
        {/* Icône animée */}
        <div style={S.checkCircle} className="check-pop">
          <span style={{ fontSize: '3rem' }}>✓</span>
        </div>

        <h2 style={{ ...S.title, color: '#22c55e' }}>Paiement confirmé !</h2>
        <p style={S.sub}>Votre cours a été réservé avec succès.</p>

        {/* Détails du cours */}
        {courseData && (
          <div style={S.detailsBox}>
            {[
              ['👤 Élève',    courseData.studentName],
              ['📚 Matière',  courseData.subject],
              ['🎓 Niveau',   courseData.level],
              ['📅 Date',     courseData.preferredDate ? new Date(courseData.preferredDate).toLocaleDateString('fr-FR') : '—'],
              ['🕐 Heure',    courseData.preferredTime],
              ['📍 Lieu',     courseData.location === 'online' ? 'En ligne (Visio)' : 'À domicile'],
              ['💰 Montant',  `${Number(courseData.totalAmount).toFixed(2)} €`],
            ].map(([k, v]) => (
              <div key={k} style={S.detailRow}>
                <span style={S.detailKey}>{k}</span>
                <span style={S.detailVal}>{v || '—'}</span>
              </div>
            ))}
          </div>
        )}

        <p style={S.confirmNote}>
          📧 Un email de confirmation a été envoyé à votre adresse.
        </p>

        {/* Compte à rebours */}
        <div style={S.countdownBox}>
          <div style={S.countdownCircle}>{countdown}</div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Redirection automatique vers votre tableau de bord...
          </p>
        </div>

        <button onClick={() => navigate('parent-dashboard')} style={S.btnPrimary}>
          → Aller au tableau de bord maintenant
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @keyframes fadeInUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes popIn      { 0% { transform:scale(0); } 70% { transform:scale(1.15); } 100% { transform:scale(1); } }
  @keyframes spin       { to { transform:rotate(360deg); } }
  .success-fade         { animation: fadeInUp .5s ease; }
  .check-pop            { animation: popIn .6s cubic-bezier(.175,.885,.32,1.275) .2s both; }
`;

const S = {
  page:          { minHeight:'100vh', background:'linear-gradient(160deg,#080d18,#0f1624 60%,#0a1120)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', fontFamily:"'Segoe UI',system-ui,sans-serif" },
  card:          { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'24px', padding:'3rem 2.5rem', maxWidth:'520px', width:'100%', textAlign:'center', backdropFilter:'blur(12px)', boxShadow:'0 30px 80px rgba(0,0,0,.5)' },
  spinner:       { width:'48px', height:'48px', border:'4px solid rgba(253,216,53,.2)', borderTop:'4px solid #FDD835', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 1.5rem' },
  checkCircle:   { width:'90px', height:'90px', borderRadius:'50%', background:'rgba(34,197,94,.12)', border:'3px solid rgba(34,197,94,.4)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', color:'#22c55e', boxShadow:'0 0 40px rgba(34,197,94,.2)' },
  title:         { fontSize:'1.8rem', fontWeight:'900', color:'#fff', margin:'0 0 8px' },
  sub:           { color:'#64748b', fontSize:'15px', margin:'0 0 1.5rem', lineHeight:'1.6' },
  detailsBox:    { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'14px', padding:'1rem 1.2rem', marginBottom:'1.2rem', textAlign:'left' },
  detailRow:     { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.05)' },
  detailKey:     { fontSize:'13px', color:'#64748b', fontWeight:'600' },
  detailVal:     { fontSize:'14px', color:'#e2e8f0', fontWeight:'700' },
  confirmNote:   { fontSize:'13px', color:'#86efac', background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.18)', borderRadius:'8px', padding:'8px 14px', marginBottom:'1.5rem' },
  countdownBox:  { display:'flex', alignItems:'center', justifyContent:'center', gap:'14px', marginBottom:'1.5rem' },
  countdownCircle:{ width:'44px', height:'44px', borderRadius:'50%', background:'rgba(253,216,53,.1)', border:'2px solid rgba(253,216,53,.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'900', color:'#FDD835', flexShrink:0 },
  btnRow:        { display:'flex', gap:'10px', flexWrap:'wrap' },
  btnPrimary:    { width:'100%', padding:'13px 20px', background:'linear-gradient(135deg,#FDD835,#F59E0B)', border:'none', borderRadius:'12px', color:'#080d18', fontSize:'15px', fontWeight:'900', cursor:'pointer', boxShadow:'0 6px 20px rgba(253,216,53,.3)' },
  btnSecondary:  { flex:1, padding:'12px 16px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:'12px', color:'#e2e8f0', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
};


// =============================================================================
// PaymentCancelPage.jsx — à mettre dans un fichier séparé si besoin
// =============================================================================
export const PaymentCancelPage = ({ navigate }) => {
  useEffect(() => {
    // Annuler le RDV côté backend quand l'utilisateur revient de Stripe
    const params        = new URLSearchParams(window.location.search);
    const appointmentId = params.get('appointment_id');

    if (appointmentId) {
      fetch(`${API_URL}/appointments/${appointmentId}/cancel/`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => console.error('Erreur annulation RDV:', err));
    }

    // ✅ Restaurer la session si présente
    const savedUser = sessionStorage.getItem('kh_user');
    // Note : setUser n'est pas disponible ici sans prop — le passer en prop si nécessaire
    if (savedUser) {
      sessionStorage.removeItem('kh_user');
    }
  }, []);

  return (
    <div style={SC.page}>
      <style>{cssc}</style>
      <div style={SC.card} className="cancel-fade">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>↩️</div>
        <h2 style={SC.title}>Paiement annulé</h2>
        <p style={SC.sub}>
          Vous avez quitté la page de paiement. Votre cours n'a pas été confirmé.
        </p>

        <div style={SC.infoBox}>
          <p style={{ margin: 0, fontSize: '13px', color: '#fbbf24', lineHeight: '1.6' }}>
            💡 Votre réservation a été annulée. Vous pouvez recommencer à tout moment.
          </p>
        </div>

        <div style={SC.btnRow}>
          <button onClick={() => navigate('appointment')} style={SC.btnPrimary}>
            🔄 Réessayer la réservation
          </button>
          <button onClick={() => navigate('parent-dashboard')} style={SC.btnSecondary}>
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
};

const cssc = `
  @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .cancel-fade { animation: fadeInUp .4s ease; }
`;

const SC = {
  page:       { minHeight:'100vh', background:'linear-gradient(160deg,#080d18,#0f1624 60%,#0a1120)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', fontFamily:"'Segoe UI',system-ui,sans-serif" },
  card:       { background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'24px', padding:'3rem 2.5rem', maxWidth:'480px', width:'100%', textAlign:'center', backdropFilter:'blur(12px)', boxShadow:'0 30px 80px rgba(0,0,0,.5)' },
  title:      { fontSize:'1.8rem', fontWeight:'900', color:'#FDD835', margin:'0 0 8px' },
  sub:        { color:'#64748b', fontSize:'15px', margin:'0 0 1.5rem', lineHeight:'1.6' },
  infoBox:    { background:'rgba(251,191,36,.07)', border:'1px solid rgba(251,191,36,.22)', borderRadius:'10px', padding:'12px 16px', marginBottom:'1.8rem' },
  btnRow:     { display:'flex', flexDirection:'column', gap:'10px' },
  btnPrimary: { padding:'13px 20px', background:'linear-gradient(135deg,#FDD835,#F59E0B)', border:'none', borderRadius:'12px', color:'#080d18', fontSize:'15px', fontWeight:'900', cursor:'pointer', boxShadow:'0 6px 20px rgba(253,216,53,.3)' },
  btnSecondary:{ padding:'12px 20px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:'12px', color:'#94a3b8', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
};
