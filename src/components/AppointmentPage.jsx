import { useState, useEffect, useMemo } from 'react';

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

// ─── DONNÉES ─────────────────────────────────────────────────────────────────

const LEVELS = [
  { value: 'CM1',   label: 'CM1',        group: 'Primaire'  },
  { value: 'CE2',   label: 'CE2',        group: 'Primaire'  },
  { value: 'CE1',   label: 'CE1',        group: 'Primaire'  },
  { value: 'CP',   label: 'CP',        group: 'Primaire'  },
  { value: '6ème',       label: '6ÈME',            group: 'Collège'   },
  { value: '5ème',       label: '5ÈME',            group: 'Collège'   },
  { value: '4ème',       label: '4ÈME',            group: 'Collège'   },
  { value: '3ème',       label: '3ÈME',            group: 'Collège'   },
  { value: '2nde',       label: '2NDE',            group: 'Lycée'     },
  { value: 'Première',   label: 'PREMIÈRE',        group: 'Lycée'     },
  { value: 'Terminale',  label: 'TERMINALE',       group: 'Lycée'     },
  { value: 'Prépa',      label: 'PRÉPA',           group: 'Supérieur' },
  { value: 'Supérieur',  label: 'SUPÉRIEUR BAC+',  group: 'Supérieur' },
  { value: 'Autre',      label: 'AUTRE',           group: 'Autre'     },
];

const SUBJECTS = [
  'Mathématiques','Anglais','Français','Aide aux devoirs',
  'Préparation aux examens','Physique-Chimie','Droit',
  'Histoire-Géographie','Espagnol','Allemand',
  'Accompagnement Orientation','SES — Sciences Économiques et Sociales',
  'Économie','Biologie','SVT — Sciences de la Vie et de la Terre',
  'Philosophie','Accompagnement Parcoursup','Chimie',
  'Informatique','Italien','Langues','Médecine','Orthographe',
];

const TIME_SLOTS = [
  '07:00','08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00',
];

// ─── TARIFICATION ─────────────────────────────────────────────────────────────
const PRICE_TABLE = {
  online: { Primaire:20, Collège:22.5, Lycée:25, Supérieur:30, Autre:30 },
  home:   { Primaire:20, Collège:45, Lycée:50, Supérieur:60, Autre:30 },
};
const TAX_CREDIT = 0.5;

const getLevelGroup = (v) => LEVELS.find(l => l.value === v)?.group ?? 'Autre';
const getPPH = (loc, level, trial) => {
  if (trial) return 0;
  return PRICE_TABLE[loc]?.[getLevelGroup(level)] ?? 30;
};

// ─── COMPOSANT FACTURE ────────────────────────────────────────────────────────
const Invoice = ({ data, onClose }) => {
  const num   = `KH-${Date.now().toString().slice(-8)}`;
  const today = new Date().toLocaleDateString('fr-FR');
  const brut  = data.pph * parseFloat(data.duration);
  const credit= data.location === 'home' ? brut * TAX_CREDIT : 0;
  const net   = brut - credit;

  return (
    <div style={I.overlay} onClick={onClose}>
      <div id="invoice-print" style={I.modal} onClick={e => e.stopPropagation()}>
        <div style={I.hdr}>
          <div style={I.hdrLeft}>
            <div style={I.logo}>KH</div>
            <div>
              <p style={I.co}>KH PERFECTION</p>
              <p style={I.coSub}>Soutien scolaire — Cours particuliers</p>
            </div>
          </div>
          <div style={I.hdrRight}>
            <p style={I.facLabel}>FACTURE</p>
            <p style={I.facNum}>N° {num}</p>
            <p style={I.facDate}>Émise le {today}</p>
          </div>
        </div>
        <div style={I.div} />
        <div style={I.twoCol}>
          <div>
            <p style={I.secLabel}>FACTURÉ À</p>
            <p style={I.clientName}>{data.parentName || '—'}</p>
            <p style={I.clientInfo}>{data.parentEmail}</p>
            {data.parentPhone && <p style={I.clientInfo}>{data.parentPhone}</p>}
          </div>
          <div>
            <p style={I.secLabel}>DÉTAIL DU COURS</p>
            <p style={I.clientInfo}>Élève : <strong>{data.studentName}</strong></p>
            <p style={I.clientInfo}>Matière : <strong>{data.subject}</strong></p>
            <p style={I.clientInfo}>Niveau : <strong>{data.level}</strong></p>
            <p style={I.clientInfo}>Date : <strong>{data.preferredDate ? new Date(data.preferredDate).toLocaleDateString('fr-FR') : '—'}</strong> à <strong>{data.preferredTime}</strong></p>
            <p style={I.clientInfo}>Modalité : <strong>{data.location === 'online' ? 'Visioconférence' : 'À domicile'}</strong></p>
          </div>
        </div>
        <div style={I.div} />
        <table style={I.table}>
          <thead>
            <tr style={I.thead}>
              <th style={I.th}>Désignation</th>
              <th style={I.thR}>Durée</th>
              <th style={I.thR}>Tarif/h</th>
              <th style={I.thR}>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={I.td}>Cours de {data.subject} — {data.location === 'online' ? 'En ligne' : 'À domicile'} — Niveau {data.level}</td>
              <td style={I.tdR}>{data.duration}h</td>
              <td style={I.tdR}>{data.pph.toFixed(2)} €</td>
              <td style={I.tdR}>{brut.toFixed(2)} €</td>
            </tr>
            {data.location === 'home' && (
              <tr style={{ background: '#f0fdf4' }}>
                <td style={{ ...I.td, color:'#166534' }}>✅ Crédit d'impôt immédiat 50% — Avance URSSAF (Art. 199 sexdecies CGI)</td>
                <td style={I.tdR}></td><td style={I.tdR}></td>
                <td style={{ ...I.tdR, color:'#166534', fontWeight:'800' }}>− {credit.toFixed(2)} €</td>
              </tr>
            )}
          </tbody>
        </table>
        <div style={I.div} />
        <div style={I.totals}>
          <div style={I.totRow}><span>Sous-total brut</span><span>{brut.toFixed(2)} €</span></div>
          {data.location === 'home' && (
            <div style={{ ...I.totRow, color:'#16a34a' }}>
              <span>Crédit d'impôt immédiat (50%)</span>
              <span>− {credit.toFixed(2)} €</span>
            </div>
          )}
          <div style={I.totRow}><span>TVA</span><span>Exonéré (art. 261-4-4° CGI)</span></div>
          <div style={I.grandRow}>
            <span style={{ fontWeight:'900', fontSize:'15px' }}>NET À PAYER</span>
            <span style={{ fontWeight:'900', fontSize:'22px', color:'#0a0f1e' }}>{net.toFixed(2)} €</span>
          </div>
          {data.location === 'home' && (
            <div style={I.taxNote}>
              💡 Votre coût réel après crédit d'impôt : <strong>{net.toFixed(2)} €</strong> au lieu de <strong>{brut.toFixed(2)} €</strong> — économie de {credit.toFixed(2)} €
            </div>
          )}
        </div>
        <div style={I.div} />
        <p style={I.legal}>KH PERFECTION • Organisme de soutien scolaire agréé • TVA non applicable (art. 261-4-4° CGI){data.location === 'home' ? ' • Éligible au crédit d\'impôt pour l\'emploi à domicile' : ''}</p>
        <div style={I.btns}>
          <button onClick={onClose} style={I.btnClose}>Fermer</button>
          <button onClick={() => window.print()} style={I.btnPrint}>🖨️ Imprimer / Enregistrer PDF</button>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
const AppointmentPage = ({ navigate, user, onLogout }) => {
  const [form, setForm] = useState({
    studentName:'', subject:'', level:'',
    preferredDate:'', preferredTime:'', duration:'1',
    location:'online', notes:'',
  });
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [hasUsedTrial,  setHasUsedTrial]  = useState(false);
  const [checkingTrial, setCheckingTrial] = useState(true);
  const [step,          setStep]          = useState(1);
  const [showInvoice,   setShowInvoice]   = useState(false);

  // ─── Vérif cours d'essai ────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API_URL}/appointments/check-trial/${user?.id}`);
        const d = await r.json();
        if (d.success) setHasUsedTrial(d.hasUsedTrial);
      } catch { setHasUsedTrial(false); }
      finally   { setCheckingTrial(false); }
    };
    user?.id ? check() : setCheckingTrial(false);
  }, [user?.id]);

  // ─── Calculs ────────────────────────────────────────────────────────────
  const isTrial  = !hasUsedTrial;
  const pph      = getPPH(form.location, form.level, isTrial);
  const dur      = parseFloat(form.duration) || 1;
  const brut     = pph * dur;
  const credit   = form.location === 'home' && !isTrial ? brut * TAX_CREDIT : 0;
  const net      = brut - credit;
  const grp      = getLevelGroup(form.level);

  const tariff = useMemo(() => {
    if (!form.level) return null;
    const g = getLevelGroup(form.level);
    const o = PRICE_TABLE.online[g] ?? 30;
    const h = PRICE_TABLE.home[g] ?? 30;
    return { online: o, home: h, homeNet: h * (1 - TAX_CREDIT) };
  }, [form.level]);

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.studentName.trim()) { setError("Nom de l'élève requis"); return false; }
    if (!form.subject)            { setError('Sélectionnez une matière'); return false; }
    if (!form.level)              { setError('Sélectionnez un niveau'); return false; }
    if (!form.preferredDate)      { setError('Sélectionnez une date'); return false; }
    if (!form.preferredTime)      { setError('Sélectionnez une heure'); return false; }
    return true;
  };

  const handleContinue = () => {
    if (validate()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ─── PAIEMENT STRIPE ────────────────────────────────────────────────────
  const handleStripePayment = async (appointmentId, amountCents) => {
    try {
      // ✅ ÉTAPE 1 : Sauvegarder la session utilisateur AVANT la redirection
      // Cela évite la déconnexion quand Stripe redirige vers le site
      sessionStorage.setItem('kh_user',        JSON.stringify(user));
      sessionStorage.setItem('kh_redirect_after_payment', 'parent-dashboard');

      // ✅ ÉTAPE 2 : Créer la Checkout Session Stripe via le backend
      const r = await fetch(`${API_URL}/payments/create-checkout-session/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          amount:       amountCents,
          currency:     'eur',
          description:  `Cours de ${form.subject} — ${form.level} — KH Perfection`,
          // ✅ On passe appointment_id dans l'URL de succès pour le retrouver au retour
          successUrl:   `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&appointment_id=${appointmentId}`,
          cancelUrl:    `${window.location.origin}/payment-cancel?appointment_id=${appointmentId}`,
          customerEmail: user?.email,
          metadata: {
            appointmentId: String(appointmentId),
            subject:       form.subject,
            level:         form.level,
            studentName:   form.studentName,
          },
        }),
      });

      const data = await r.json();

      if (data.success && data.checkoutUrl) {
        // ✅ ÉTAPE 3 : Redirection vers Stripe (la session est sauvegardée)
        window.location.href = data.checkoutUrl;
      } else {
        // Fallback si le backend ne retourne pas d'URL Stripe
        setError(data.message || 'Impossible de créer la session de paiement.');
        setLoading(false);
      }
    } catch (err) {
      setError('Erreur de connexion au service de paiement. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // ─── SOUMISSION ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        parentId:      user?.id,
        parentName:    user?.parentName || user?.name,
        parentEmail:   user?.email,
        parentPhone:   user?.phone || '',
        studentName:   form.studentName.trim(),
        subject:       form.subject,
        level:         form.level,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        duration:      form.duration,
        location:      form.location,
        notes:         form.notes.trim(),
        pricePerHour:  pph,
        brutAmount:    brut,
        taxCredit:     credit,
        totalAmount:   net,
        isTrialCourse: isTrial,
        // ✅ IMPORTANT : cours payant = "pending_payment" jusqu'à confirmation Stripe
        // Le webhook Stripe changera ce statut en "confirmed" après paiement réussi
        status: isTrial ? 'pending' : 'pending',
      };

      const r = await fetch(`${API_URL}/appointments/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const d = await r.json();

      if (d.success) {
        if (isTrial) {
          // Cours gratuit → confirmation immédiate, pas de paiement
          alert('🎉 Votre cours d\'essai GRATUIT a été réservé ! Notre équipe vous contactera bientôt.');
          navigate('parent-dashboard');
        } else {
          // ✅ Cours payant → Stripe UNIQUEMENT
          // Le RDV est créé avec status "pending_payment"
          // Il sera confirmé automatiquement par le webhook après paiement
          await handleStripePayment(d.data.id, Math.round(net * 100));
          // ⚠️ Ne pas appeler navigate() ici : Stripe va rediriger la page entière
        }
      } else {
        setError(d.message || 'Erreur lors de la réservation. Veuillez réessayer.');
        setLoading(false);
      }
    } catch {
      setError('Impossible de se connecter au serveur.');
      setLoading(false);
    }
  };

  const invData = {
    parentName:    user?.parentName || user?.name,
    parentEmail:   user?.email,
    parentPhone:   user?.phone,
    studentName:   form.studentName || '—',
    subject:       form.subject || '—',
    level:         form.level || '—',
    preferredDate: form.preferredDate,
    preferredTime: form.preferredTime || '—',
    location:      form.location,
    duration:      form.duration,
    pph,
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{css}</style>

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.headerIn}>
          <div style={S.brand}>
            <div style={S.logoBadge}>KH</div>
            <div>
              <h1 style={S.brandName}>KH PERFECTION</h1>
              <p style={S.brandSub}>Réservation de cours</p>
            </div>
          </div>
          <div style={S.navBtns}>
            <button onClick={() => navigate('parent-dashboard')} style={S.btnGhost}>← Retour</button>
            <button onClick={() => navigate('home')}             style={S.btnGold}>🏠 Accueil</button>
            <button onClick={onLogout}                           style={S.btnRed}>🚪 Déconnexion</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={S.hero}>
        <div style={S.heroIn}>
          <span style={S.heroPill}>{isTrial ? '🎁 COURS D\'ESSAI GRATUIT' : '📅 RÉSERVATION EN LIGNE'}</span>
          <h2 style={S.heroTitle}>
            {isTrial ? 'Votre 1er cours offert' : 'Réservez votre cours'}
          </h2>
          <p style={S.heroSub}>
            {isTrial
              ? 'Découvrez nos enseignants diplômés sans engagement ni frais'
              : 'Tarifs transparents · Crédit d\'impôt immédiat · Paiement sécurisé Stripe'}
          </p>
          <div style={S.steps}>
            {[['1','Informations'],['2','Récapitulatif'],['3','Paiement']].map(([n,lbl],i) => (
              <div key={n} style={S.stepItem}>
                <div style={{ ...S.stepBubble, ...(step > i ? S.stepDone : step === i+1 ? S.stepActive : S.stepIdle) }}>
                  {step > i ? '✓' : n}
                </div>
                <span style={{ ...S.stepLbl, ...(step === i+1 && { color:'#FDD835', fontWeight:'700' }) }}>{lbl}</span>
                {i < 2 && <div style={{ ...S.stepLine, ...(step > i+1 && { background:'#FDD835' }) }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN */}
      <main style={S.main}>

        {/* ═══ STEP 1 ═══ */}
        {step === 1 && (
          <div className="fade-in">
            {!checkingTrial && isTrial && (
              <div style={S.bannerGreen}>
                <span style={{ fontSize:'2.5rem' }}>🎉</span>
                <div>
                  <h3 style={{ margin:'0 0 5px', color:'#22c55e', fontWeight:'800' }}>Votre 1er cours est GRATUIT !</h3>
                  <p style={{ margin:0, color:'#86efac', fontSize:'13px', lineHeight:'1.6' }}>
                    Premier cours offert pour découvrir nos services. Les tarifs normaux s'appliqueront à partir du 2ème cours.
                  </p>
                </div>
              </div>
            )}
            {!checkingTrial && !isTrial && (
              <div style={S.bannerBlue}>
                <span style={{ fontSize:'2rem' }}>ℹ️</span>
                <div>
                  <h3 style={{ margin:'0 0 4px', color:'#60a5fa', fontWeight:'700', fontSize:'1rem' }}>Cours d'essai déjà utilisé</h3>
                  <p style={{ margin:0, color:'#93c5fd', fontSize:'13px' }}>
                    Sélectionnez votre niveau pour voir le tarif applicable. Les cours à domicile bénéficient du crédit d'impôt immédiat 50%.
                  </p>
                </div>
              </div>
            )}
            {error && <div style={S.errBox}><span>⚠️</span>{error}</div>}

            {/* Carte 1 : Élève */}
            <div style={S.card}>
              <div style={S.cardHdr}><span style={S.cardIco}>👤</span><h3 style={S.cardTtl}>Informations sur l'élève</h3></div>
              <div style={S.cardBdy}>
                <div style={S.iWrap}>
                  <label style={S.lbl}>Nom complet de l'élève *</label>
                  <input className="kh-inp" type="text" name="studentName"
                    value={form.studentName} onChange={handleChange}
                    placeholder="Prénom et nom" style={S.inp} disabled={loading} />
                </div>
                <div style={S.g2}>
                  <div style={S.iWrap}>
                    <label style={S.lbl}>Niveau scolaire *</label>
                    <select className="kh-sel" name="level" value={form.level}
                      onChange={handleChange} style={S.sel} disabled={loading}>
                      <option value="" style={optStyle}>— Sélectionner un niveau —</option>
                      {LEVELS.map(l => <option key={l.value} value={l.value} style={optStyle}>{l.label}</option>)}
                    </select>
                  </div>
                  <div style={S.iWrap}>
                    <label style={S.lbl}>Matière *</label>
                    <select className="kh-sel" name="subject" value={form.subject}
                      onChange={handleChange} style={S.sel} disabled={loading}>
                      <option value="" style={optStyle}>— Sélectionner une matière —</option>
                      {SUBJECTS.map(s => <option key={s} value={s} style={optStyle}>{s}</option>)}
                    </select>
                  </div>
                </div>
                {tariff && !isTrial && (
                  <div style={S.tariffBox}>
                    <p style={S.tariffTitle}>📌 Tarifs pour le niveau <strong>{grp}</strong></p>
                    <div style={S.tariffGrid}>
                      <div style={S.tariffCell}>
                        <span style={S.tariffLbl}>💻 En ligne</span>
                        <span style={S.tariffVal}>{tariff.online} €/h</span>
                      </div>
                      <div style={S.tariffCell}>
                        <span style={S.tariffLbl}>🏠 Domicile (brut)</span>
                        <span style={S.tariffVal}>{tariff.home} €/h</span>
                      </div>
                      <div style={{ ...S.tariffCell, background:'rgba(34,197,94,.1)', border:'1px solid rgba(34,197,94,.3)' }}>
                        <span style={S.tariffLbl}>🏠 Domicile après crédit d'impôt 50%</span>
                        <span style={{ ...S.tariffVal, color:'#22c55e' }}>{tariff.homeNet} €/h net</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Carte 2 : Date */}
            <div style={S.card}>
              <div style={S.cardHdr}><span style={S.cardIco}>📅</span><h3 style={S.cardTtl}>Date et horaire souhaités</h3></div>
              <div style={S.cardBdy}>
                <div style={S.g3}>
                  <div style={S.iWrap}>
                    <label style={S.lbl}>Date préférée *</label>
                    <input className="kh-inp" type="date" name="preferredDate"
                      value={form.preferredDate} onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      style={S.inp} disabled={loading} />
                  </div>
                  <div style={S.iWrap}>
                    <label style={S.lbl}>Heure préférée *</label>
                    <select className="kh-sel" name="preferredTime" value={form.preferredTime}
                      onChange={handleChange} style={S.sel} disabled={loading}>
                      <option value="" style={optStyle}>— Sélectionner —</option>
                      {TIME_SLOTS.map(t => <option key={t} value={t} style={optStyle}>{t}</option>)}
                    </select>
                  </div>
                  <div style={S.iWrap}>
                    <label style={S.lbl}>Durée *</label>
                    <select className="kh-sel" name="duration" value={form.duration}
                      onChange={handleChange} style={S.sel} disabled={loading}>
                      {[['1','1 heure'],['1.5','1h30'],['2','2 heures'],['2.5','2h30'],['3','3 heures']].map(([v,l]) => (
                        <option key={v} value={v} style={optStyle}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte 3 : Lieu */}
            <div style={S.card}>
              <div style={S.cardHdr}><span style={S.cardIco}>📍</span><h3 style={S.cardTtl}>Lieu du cours</h3></div>
              <div style={S.cardBdy}>
                <div style={S.g2}>
                  <label className="kh-radio" style={{ ...S.radioCard, ...(form.location==='online' ? S.radioOn : {}) }}>
                    <input type="radio" name="location" value="online"
                      checked={form.location==='online'} onChange={handleChange}
                      style={{display:'none'}} disabled={loading} />
                    <div style={S.radioCircle}>{form.location==='online' && <div style={S.radioDot}/>}</div>
                    <div style={{flex:1}}>
                      <p style={S.radioTtl}>💻 En ligne</p>
                      <p style={S.radioDesc}>Via visioconférence</p>
                      {!isTrial && tariff && <p style={S.radioPrice}>{tariff.online} €/h</p>}
                    </div>
                  </label>
                  <label className="kh-radio" style={{ ...S.radioCard, ...(form.location==='home' ? S.radioOn : {}) }}>
                    <input type="radio" name="location" value="home"
                      checked={form.location==='home'} onChange={handleChange}
                      style={{display:'none'}} disabled={loading} />
                    <div style={S.radioCircle}>{form.location==='home' && <div style={S.radioDot}/>}</div>
                    <div style={{flex:1}}>
                      <p style={S.radioTtl}>🏠 À domicile</p>
                      <p style={S.radioDesc}>Chez l'élève</p>
                      {!isTrial && tariff && (
                        <>
                          <p style={{ ...S.radioPrice, textDecoration:'line-through', opacity:.5 }}>{tariff.home} €/h</p>
                          <p style={{ ...S.radioPrice, color:'#22c55e' }}>{tariff.homeNet} €/h net ✅</p>
                          <p style={{ fontSize:'11px', color:'#86efac', margin:'2px 0 0' }}>Crédit d'impôt 50% appliqué</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Carte 4 : Notes */}
            <div style={S.card}>
              <div style={S.cardHdr}><span style={S.cardIco}>📝</span><h3 style={S.cardTtl}>Notes additionnelles</h3></div>
              <div style={S.cardBdy}>
                <label style={S.lbl}>Informations complémentaires (optionnel)</label>
                <textarea className="kh-inp" name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Objectifs spécifiques, difficultés particulières, préférences pédagogiques..."
                  rows={4} style={{ ...S.inp, resize:'vertical', minHeight:'90px' }} disabled={loading} />
              </div>
            </div>

            {/* Récap prix */}
            <div style={S.priceCard}>
              <div style={S.priceHdr}>
                <span style={{fontSize:'22px'}}>💰</span>
                <h4 style={{ margin:0, color:'#FDD835', fontWeight:'800' }}>Récapitulatif tarifaire</h4>
                {!isTrial && form.level && (
                  <button onClick={() => setShowInvoice(true)} style={S.invBtn}>📄 Aperçu facture</button>
                )}
              </div>
              <div style={S.priceBdy}>
                {isTrial ? (
                  <div style={S.freeRow}>
                    <span style={{fontSize:'2.8rem'}}>🎁</span>
                    <div style={{flex:1}}>
                      <p style={{ margin:'0 0 4px', fontWeight:'800', color:'#22c55e', fontSize:'1.1rem' }}>Cours d'essai GRATUIT</p>
                      <p style={{ margin:0, color:'#86efac', fontSize:'13px' }}>Aucun paiement requis pour votre 1er cours</p>
                    </div>
                    <span style={{ fontSize:'2rem', fontWeight:'900', color:'#22c55e' }}>0 €</span>
                  </div>
                ) : (
                  <>
                    {[
                      ['Tarif horaire', `${pph} €/h`],
                      ['Durée', `${form.duration}h`],
                      ['Sous-total brut', `${brut.toFixed(2)} €`],
                    ].map(([k,v]) => (
                      <div key={k} style={S.priceRow}>
                        <span style={S.priceK}>{k}</span>
                        <span style={S.priceV}>{v}</span>
                      </div>
                    ))}
                    {form.location === 'home' && (
                      <div style={{ ...S.priceRow, color:'#22c55e' }}>
                        <span>✅ Crédit d'impôt immédiat (50%)</span>
                        <span>− {credit.toFixed(2)} €</span>
                      </div>
                    )}
                    <div style={S.priceTotal}>
                      <div>
                        <p style={{ margin:0, fontWeight:'800', color:'#fff', fontSize:'15px' }}>NET À PAYER</p>
                        <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#64748b' }}>TVA non applicable — Exonéré art. 261-4-4° CGI</p>
                      </div>
                      <span style={{ fontSize:'2.2rem', fontWeight:'900', color:'#FDD835' }}>{net.toFixed(2)} €</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={S.btnRow}>
              <button onClick={() => navigate('parent-dashboard')} style={S.btnCancel} disabled={loading}>← Annuler</button>
              <button className="kh-submit" onClick={handleContinue}
                style={{ ...S.btnSubmit, ...(loading && { opacity:.6, cursor:'not-allowed' }) }} disabled={loading}>
                {isTrial ? '🎁 Réserver mon cours gratuit →' : 'Voir le récapitulatif →'}
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 : RÉCAPITULATIF ═══ */}
        {step === 2 && (
          <div className="fade-in">
            <div style={S.card}>
              <div style={S.cardHdr}><span style={S.cardIco}>✅</span><h3 style={S.cardTtl}>Récapitulatif de votre réservation</h3></div>
              <div style={S.cardBdy}>
                <div style={S.recapGrid}>
                  {[
                    ['Élève',   form.studentName],
                    ['Niveau',  form.level],
                    ['Matière', form.subject],
                    ['Date',    form.preferredDate ? new Date(form.preferredDate).toLocaleDateString('fr-FR') : '—'],
                    ['Heure',   form.preferredTime],
                    ['Durée',   `${form.duration}h`],
                    ['Lieu',    form.location === 'online' ? '💻 En ligne' : '🏠 À domicile'],
                    ['Tarif/h', isTrial ? 'GRATUIT' : `${pph} €`],
                  ].map(([k,v]) => (
                    <div key={k} style={S.recapCell}>
                      <span style={S.recapK}>{k}</span>
                      <span style={S.recapV}>{v || '—'}</span>
                    </div>
                  ))}
                </div>
                {form.notes && (
                  <div style={{ marginTop:'14px', padding:'12px 14px', background:'rgba(255,255,255,.04)', borderRadius:'10px', border:'1px solid rgba(255,255,255,.07)' }}>
                    <p style={{ fontSize:'11px', color:'#64748b', margin:'0 0 4px', textTransform:'uppercase', fontWeight:'700' }}>Notes</p>
                    <p style={{ fontSize:'14px', color:'#e2e8f0', margin:0 }}>{form.notes}</p>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'22px', paddingTop:'18px', borderTop:'2px solid rgba(253,216,53,.25)' }}>
                  <div>
                    <p style={{ margin:0, fontWeight:'700', color:'#fff', fontSize:'1rem' }}>{isTrial ? 'Cours d\'essai — Total' : 'NET À PAYER'}</p>
                    {form.location==='home' && !isTrial && (
                      <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#86efac' }}>
                        Crédit d'impôt 50% appliqué (−{credit.toFixed(2)} €)
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize:'2.4rem', fontWeight:'900', color: isTrial ? '#22c55e' : '#FDD835' }}>
                    {isTrial ? '0 €' : `${net.toFixed(2)} €`}
                  </span>
                </div>
              </div>
            </div>

            {/* ✅ Badge paiement sécurisé Stripe — affiché UNIQUEMENT pour les cours payants */}
            {!isTrial && (
              <div style={S.stripeBadge}>
                <span style={{fontSize:'1.3rem'}}>🔒</span>
                <div>
                  <p style={{ margin:'0 0 2px', fontWeight:'700', color:'#e2e8f0', fontSize:'14px' }}>Paiement 100% sécurisé via Stripe</p>
                  <p style={{ margin:0, color:'#64748b', fontSize:'12px' }}>
                    Vos données bancaires sont chiffrées et jamais stockées sur nos serveurs.
                    <strong style={{ color:'#94a3b8' }}> Le cours sera confirmé uniquement après paiement réussi.</strong>
                  </p>
                </div>
                <div style={S.stripeLogos}>
                  {['VISA','MC','CB','AMEX'].map(b => (
                    <span key={b} style={S.stripeLogo}>{b}</span>
                  ))}
                </div>
              </div>
            )}

            {error && <div style={{ ...S.errBox, marginBottom:'1rem' }}><span>⚠️</span>{error}</div>}

            <div style={S.btnRow}>
              <button onClick={() => { setStep(1); setError(''); }} style={S.btnCancel} disabled={loading}>← Modifier</button>
              <button className="kh-submit" onClick={handleSubmit}
                style={{ ...S.btnSubmit, ...(loading && { opacity:.6, cursor:'not-allowed' }) }} disabled={loading}>
                {loading
                  ? <span style={{display:'flex',alignItems:'center',gap:'10px'}}><span style={S.spinner}/>
                      {isTrial ? 'Réservation...' : 'Redirection vers Stripe...'}
                    </span>
                  : isTrial
                    ? '🎁 Confirmer mon cours gratuit'
                    : '💳 Payer maintenant via Stripe'
                }
              </button>
            </div>
          </div>
        )}
      </main>

      {showInvoice && <Invoice data={invData} onClose={() => setShowInvoice(false)} />}
    </div>
  );
};

export default AppointmentPage;

// ─── CSS GLOBAL ──────────────────────────────────────────────────────────────
const optStyle = { color:'#111', background:'#fff' };

const css = `
  @keyframes fadeInUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform:rotate(360deg); } }
  .fade-in { animation: fadeInUp .35s ease; }
  .kh-inp, .kh-sel { transition: border-color .2s, box-shadow .2s; }
  .kh-inp:focus, .kh-sel:focus {
    outline: none !important;
    border-color: rgba(253,216,53,.65) !important;
    box-shadow: 0 0 0 3px rgba(253,216,53,.13) !important;
  }
  .kh-inp::placeholder { color: rgba(148,163,184,.55); }
  .kh-radio { transition: border-color .2s, background .2s, box-shadow .2s; cursor: pointer; }
  .kh-radio:hover { border-color: rgba(253,216,53,.45) !important; background: rgba(253,216,53,.05) !important; }
  .kh-submit { transition: transform .2s, box-shadow .2s; }
  .kh-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(253,216,53,.45) !important; }
  @media print {
    body * { visibility: hidden; }
    #invoice-print, #invoice-print * { visibility: visible; }
    #invoice-print { position: fixed; inset: 0; background: #fff; }
  }
`;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  page:       { minHeight:'100vh', background:'linear-gradient(160deg,#080d18 0%,#0f1624 55%,#0a1120 100%)', color:'#fff', fontFamily:"'Segoe UI',system-ui,sans-serif" },
  header:     { background:'rgba(8,13,24,.97)', borderBottom:'1px solid rgba(253,216,53,.15)', padding:'1rem 2rem', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(14px)' },
  headerIn:   { maxWidth:'1100px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' },
  brand:      { display:'flex', alignItems:'center', gap:'14px' },
  logoBadge:  { width:'46px', height:'46px', borderRadius:'12px', background:'linear-gradient(135deg,#FDD835,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'17px', color:'#080d18', boxShadow:'0 4px 14px rgba(253,216,53,.35)' },
  brandName:  { fontSize:'17px', fontWeight:'900', margin:0, background:'linear-gradient(135deg,#FDD835,#FFC107)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  brandSub:   { fontSize:'11px', color:'#475569', margin:0 },
  navBtns:    { display:'flex', gap:'8px', flexWrap:'wrap' },
  btnGhost:   { padding:'8px 16px', background:'rgba(100,116,139,.12)', border:'1px solid rgba(100,116,139,.28)', color:'#94a3b8', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'600' },
  btnGold:    { padding:'8px 16px', background:'rgba(253,216,53,.1)', border:'1px solid rgba(253,216,53,.3)', color:'#FDD835', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'600' },
  btnRed:     { padding:'8px 16px', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.28)', color:'#ef4444', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'600' },
  hero:       { background:'linear-gradient(135deg,rgba(253,216,53,.07),rgba(139,58,147,.07))', borderBottom:'1px solid rgba(253,216,53,.1)', padding:'3rem 2rem 2.5rem' },
  heroIn:     { maxWidth:'1100px', margin:'0 auto', textAlign:'center' },
  heroPill:   { display:'inline-block', padding:'5px 20px', background:'rgba(253,216,53,.1)', border:'1px solid rgba(253,216,53,.28)', borderRadius:'999px', fontSize:'11px', fontWeight:'800', letterSpacing:'.12em', color:'#FDD835', marginBottom:'16px' },
  heroTitle:  { fontSize:'clamp(1.9rem,4vw,2.9rem)', fontWeight:'900', margin:'0 0 12px', background:'linear-gradient(135deg,#fff 30%,#FDD835)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  heroSub:    { color:'#64748b', fontSize:'15px', margin:'0 0 2.2rem' },
  steps:      { display:'flex', alignItems:'center', justifyContent:'center', flexWrap:'wrap', gap:'0' },
  stepItem:   { display:'flex', alignItems:'center', gap:'8px' },
  stepBubble: { width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'800', flexShrink:0, transition:'all .3s' },
  stepActive: { background:'#FDD835', color:'#080d18', boxShadow:'0 0 18px rgba(253,216,53,.55)' },
  stepDone:   { background:'rgba(34,197,94,.15)', border:'2px solid #22c55e', color:'#22c55e' },
  stepIdle:   { background:'rgba(255,255,255,.05)', border:'2px solid rgba(255,255,255,.12)', color:'#475569' },
  stepLbl:    { fontSize:'13px', fontWeight:'600', color:'#475569', whiteSpace:'nowrap' },
  stepLine:   { width:'44px', height:'2px', background:'rgba(255,255,255,.08)', margin:'0 8px', borderRadius:'2px', transition:'background .3s' },
  main:       { maxWidth:'800px', margin:'0 auto', padding:'2rem 1.5rem 5rem' },
  bannerGreen:{ background:'linear-gradient(135deg,rgba(34,197,94,.13),rgba(16,185,129,.08))', border:'2px solid rgba(34,197,94,.32)', borderRadius:'16px', padding:'1.4rem', display:'flex', alignItems:'center', gap:'1.2rem', marginBottom:'1.5rem' },
  bannerBlue: { background:'rgba(59,130,246,.07)', border:'1px solid rgba(59,130,246,.22)', borderRadius:'14px', padding:'1.2rem 1.4rem', display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' },
  errBox:     { background:'rgba(239,68,68,.09)', border:'1px solid rgba(239,68,68,.28)', borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', color:'#f87171', fontSize:'14px', marginBottom:'1.5rem' },
  card:       { background:'rgba(255,255,255,.038)', border:'1px solid rgba(255,255,255,.075)', borderRadius:'18px', overflow:'hidden', marginBottom:'1.4rem', backdropFilter:'blur(4px)' },
  cardHdr:    { background:'rgba(253,216,53,.045)', borderBottom:'1px solid rgba(255,255,255,.065)', padding:'14px 22px', display:'flex', alignItems:'center', gap:'10px' },
  cardIco:    { fontSize:'20px' },
  cardTtl:    { margin:0, fontSize:'15px', fontWeight:'800', color:'#FDD835' },
  cardBdy:    { padding:'1.4rem 1.5rem' },
  lbl:        { display:'block', fontSize:'12px', color:'#94a3b8', marginBottom:'6px', fontWeight:'700', letterSpacing:'.04em', textTransform:'uppercase' },
  iWrap:      { marginBottom:'14px' },
  inp:        { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,.055)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', color:'#f1f5f9', fontSize:'14px', boxSizing:'border-box' },
  sel:        { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,.055)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', color:'#f1f5f9', fontSize:'14px', boxSizing:'border-box', cursor:'pointer' },
  g2:         { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:'14px' },
  g3:         { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))', gap:'14px' },
  tariffBox:  { background:'rgba(253,216,53,.055)', border:'1px solid rgba(253,216,53,.18)', borderRadius:'12px', padding:'14px 16px', marginTop:'6px' },
  tariffTitle:{ margin:'0 0 10px', fontSize:'13px', color:'#FDD835', fontWeight:'700' },
  tariffGrid: { display:'flex', flexWrap:'wrap', gap:'8px' },
  tariffCell: { flex:'1 1 150px', background:'rgba(255,255,255,.04)', borderRadius:'8px', padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(255,255,255,.065)' },
  tariffLbl:  { fontSize:'12px', color:'#94a3b8' },
  tariffVal:  { fontSize:'13px', fontWeight:'800', color:'#FDD835' },
  radioCard:  { background:'rgba(255,255,255,.03)', border:'2px solid rgba(255,255,255,.09)', borderRadius:'14px', padding:'1.2rem', display:'flex', alignItems:'flex-start', gap:'12px' },
  radioOn:    { background:'rgba(253,216,53,.07)', border:'2px solid rgba(253,216,53,.42)', boxShadow:'0 0 22px rgba(253,216,53,.12)' },
  radioCircle:{ width:'20px', height:'20px', borderRadius:'50%', border:'2px solid rgba(253,216,53,.45)', flexShrink:0, marginTop:'3px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,.2)' },
  radioDot:   { width:'10px', height:'10px', borderRadius:'50%', background:'#FDD835' },
  radioTtl:   { margin:'0 0 3px', fontWeight:'800', color:'#f1f5f9', fontSize:'15px' },
  radioDesc:  { margin:'0 0 5px', fontSize:'12px', color:'#475569' },
  radioPrice: { margin:'3px 0 0', fontSize:'14px', fontWeight:'800', color:'#FDD835' },
  priceCard:  { background:'linear-gradient(135deg,rgba(253,216,53,.075),rgba(249,115,22,.05))', border:'2px solid rgba(253,216,53,.22)', borderRadius:'18px', overflow:'hidden', marginBottom:'1.8rem' },
  priceHdr:   { background:'rgba(253,216,53,.06)', borderBottom:'1px solid rgba(253,216,53,.13)', padding:'14px 20px', display:'flex', alignItems:'center', gap:'12px' },
  priceBdy:   { padding:'1.4rem 1.5rem' },
  freeRow:    { display:'flex', alignItems:'center', gap:'18px', background:'rgba(34,197,94,.09)', border:'2px solid rgba(34,197,94,.22)', borderRadius:'12px', padding:'1.1rem' },
  priceRow:   { display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,.055)' },
  priceK:     { fontSize:'14px', color:'#94a3b8' },
  priceV:     { fontSize:'14px', fontWeight:'700', color:'#e2e8f0' },
  priceTotal: { display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'14px', marginTop:'8px' },
  invBtn:     { marginLeft:'auto', padding:'6px 14px', background:'rgba(255,255,255,.065)', border:'1px solid rgba(255,255,255,.13)', borderRadius:'8px', color:'#e2e8f0', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
  stripeBadge:{ display:'flex', alignItems:'center', gap:'16px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'14px', padding:'14px 18px', marginBottom:'1.4rem', flexWrap:'wrap' },
  stripeLogos:{ display:'flex', gap:'6px', marginLeft:'auto', flexWrap:'wrap' },
  stripeLogo: { padding:'4px 10px', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:'6px', fontSize:'11px', fontWeight:'800', color:'#94a3b8', letterSpacing:'.04em' },
  recapGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:'10px' },
  recapCell:  { background:'rgba(255,255,255,.04)', borderRadius:'10px', padding:'11px 14px', border:'1px solid rgba(255,255,255,.065)' },
  recapK:     { display:'block', fontSize:'10px', color:'#475569', fontWeight:'800', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'4px' },
  recapV:     { display:'block', fontSize:'14px', fontWeight:'700', color:'#f1f5f9' },
  btnRow:     { display:'flex', gap:'12px', marginTop:'6px' },
  btnCancel:  { flex:1, padding:'13px 18px', background:'rgba(100,116,139,.13)', border:'1px solid rgba(100,116,139,.22)', borderRadius:'12px', color:'#94a3b8', fontSize:'14px', fontWeight:'700', cursor:'pointer' },
  btnSubmit:  { flex:2, padding:'13px 18px', background:'linear-gradient(135deg,#FDD835,#F59E0B)', border:'none', borderRadius:'12px', color:'#080d18', fontSize:'15px', fontWeight:'900', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', boxShadow:'0 6px 22px rgba(253,216,53,.28)' },
  spinner:    { width:'16px', height:'16px', border:'3px solid rgba(8,13,24,.2)', borderTop:'3px solid #080d18', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 },
};

// ─── STYLES FACTURE ───────────────────────────────────────────────────────────
const I = {
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,.8)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'20px' },
  modal:     { background:'#fff', borderRadius:'16px', maxWidth:'700px', width:'100%', maxHeight:'90vh', overflowY:'auto', padding:'36px 40px', color:'#111', boxShadow:'0 30px 80px rgba(0,0,0,.7)' },
  hdr:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px', marginBottom:'20px' },
  hdrLeft:   { display:'flex', alignItems:'center', gap:'14px' },
  logo:      { width:'48px', height:'48px', borderRadius:'10px', background:'linear-gradient(135deg,#FDD835,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'18px', color:'#080d18' },
  co:        { margin:'0 0 2px', fontSize:'18px', fontWeight:'900', color:'#080d18' },
  coSub:     { margin:0, fontSize:'11px', color:'#6b7280' },
  hdrRight:  { textAlign:'right' },
  facLabel:  { margin:0, fontSize:'22px', fontWeight:'900', color:'#F59E0B', letterSpacing:'.05em' },
  facNum:    { margin:'3px 0', fontSize:'14px', fontWeight:'700', color:'#111' },
  facDate:   { margin:0, fontSize:'12px', color:'#6b7280' },
  div:       { height:'1px', background:'#e5e7eb', margin:'18px 0' },
  twoCol:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', flexWrap:'wrap' },
  secLabel:  { margin:'0 0 8px', fontSize:'10px', fontWeight:'800', letterSpacing:'.1em', color:'#9ca3af', textTransform:'uppercase' },
  clientName:{ margin:'0 0 3px', fontSize:'15px', fontWeight:'700', color:'#111' },
  clientInfo:{ margin:'0 0 3px', fontSize:'13px', color:'#374151' },
  table:     { width:'100%', borderCollapse:'collapse' },
  thead:     { background:'#f9fafb' },
  th:        { padding:'10px 12px', textAlign:'left', fontSize:'10px', fontWeight:'800', letterSpacing:'.08em', color:'#6b7280', textTransform:'uppercase', borderBottom:'2px solid #e5e7eb' },
  thR:       { padding:'10px 12px', textAlign:'right', fontSize:'10px', fontWeight:'800', letterSpacing:'.08em', color:'#6b7280', textTransform:'uppercase', borderBottom:'2px solid #e5e7eb' },
  td:        { padding:'12px', fontSize:'13px', color:'#374151', borderBottom:'1px solid #f3f4f6' },
  tdR:       { padding:'12px', fontSize:'13px', color:'#374151', textAlign:'right', borderBottom:'1px solid #f3f4f6' },
  totals:    { maxWidth:'320px', marginLeft:'auto', display:'flex', flexDirection:'column', gap:'8px' },
  totRow:    { display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#374151', padding:'4px 0', borderBottom:'1px solid #f3f4f6' },
  grandRow:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0 4px', borderTop:'2px solid #111', marginTop:'4px' },
  taxNote:   { background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'8px', padding:'10px 12px', fontSize:'12px', color:'#166534', marginTop:'10px' },
  legal:     { fontSize:'10px', color:'#9ca3af', lineHeight:'1.6', textAlign:'center' },
  btns:      { display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px', paddingTop:'16px', borderTop:'1px solid #e5e7eb' },
  btnClose:  { padding:'10px 22px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'600', color:'#374151' },
  btnPrint:  { padding:'10px 22px', background:'linear-gradient(135deg,#FDD835,#F59E0B)', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'700', color:'#080d18' },
};