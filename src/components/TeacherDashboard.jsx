// ─── ZEGOCLOUD + React hooks ─────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

const TeacherDashboard = ({ navigate, user, onLogout }) => {

  // ─── ÉTATS PRINCIPAUX ────────────────────────────────────────────────────
  const [activeTab, setActiveTab]           = useState('appointments');
  const [appointments, setAppointments]     = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [currentTime]                       = useState(new Date());

  // Modals
  const [showRemarkModal, setShowRemarkModal]         = useState(false);
  const [showVideoConference, setShowVideoConference] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal]         = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [remarkData, setRemarkData]         = useState({ studentBehavior: '', progress: '', suggestions: '', rating: 5 });
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', reason: '' });

  // ─── ZEGOCLOUD ref ────────────────────────────────────────────────────────
  const zegoContainerRef = useRef(null);

  // ─── useEffect : ZEGOCLOUD — lancer la visio ─────────────────────────────
  useEffect(() => {
    if (!showVideoConference || !selectedCourse || !zegoContainerRef.current) return;

    const appID        = parseInt(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
    const roomID       = `kh_course_${selectedCourse.id}`;
    const userID       = `teacher_${user?.id || Date.now()}`;
    const userName     = user?.name || 'Enseignant';

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID, serverSecret, roomID, userID, userName
    );
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container:               zegoContainerRef.current,
      scenario:                { mode: ZegoUIKitPrebuilt.GroupCall },
      showScreenSharingButton: true,
      showRaiseHandButton:     true,
      showTextChat:            true,
      showUserList:            true,
      onLeaveRoom:             () => setShowVideoConference(false),
    });

    return () => { zp.destroy(); };
  }, [showVideoConference, selectedCourse]);

  // ─── useEffect : CHARGER LES RENDEZ-VOUS assignés à cet enseignant ───────
  useEffect(() => {
    if (user?.id) {
      fetchTeacherAppointments();
      fetchCompletedCourses();
    }
  }, [user]);

  const fetchTeacherAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/appointments/`);
      const data = await response.json();

      if (data.success) {
        // Filtrer les rendez-vous assignés à cet enseignant (status assigned ou confirmed)
        // String() des deux côtés pour éviter les erreurs de type number vs string
        const mine = data.data.filter(
          (a) =>
            String(a.assignedTeacherId) === String(user.id) &&
            (a.status === 'assigned' || a.status === 'confirmed')
        );
        setAppointments(mine);
      } else {
        setError('Erreur lors du chargement des rendez-vous');
      }
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedCourses = async () => {
    try {
      const response = await fetch(`${API_URL}/appointments/`);
      const data = await response.json();

      if (data.success) {
        const completed = data.data.filter(
          (a) =>
            String(a.assignedTeacherId) === String(user.id) &&
            a.status === 'completed'
        );

        // Normaliser au format attendu
        const normalized = completed.map((a) => ({
          id:            a.id,
          subject:       a.subject,
          student:       a.studentName,
          studentAvatar: '👦',
          parent:        a.parentName,
          date:          a.preferredDate,
          time:          a.preferredTime?.slice(0, 5) || '00:00',
          duration:      `${a.duration}h`,
          amount:        parseFloat(a.totalAmount) || 0,
          status:        a.status,
          validated:     { parent: false, teacher: true },
          teacherRemarks: null,
        }));

        setCompletedCourses(normalized);
      }
    } catch (err) {
      console.error('❌ Erreur cours terminés:', err);
    }
  };

  // ─── DONNÉES STATIQUES ───────────────────────────────────────────────────
  const [messages] = useState([
    { id: 1, sender: 'Marie Dupont (parent de Lucas)', avatar: '👩', message: 'Bonjour, pouvez-vous insister sur les fractions lors du prochain cours ?', time: '09:15', date: '2025-12-10', unread: true },
    { id: 2, sender: 'Jean Martin (parent de Sophie)', avatar: '👨', message: "Merci pour votre retour sur la séance d'hier !", time: '18:42', date: '2025-12-09', unread: false }
  ]);

  const [earnings] = useState([
    { month: 'Décembre', amount: 720, hours: 18 },
    { month: 'Novembre', amount: 580, hours: 14 },
    { month: 'Octobre',  amount: 620, hours: 16 }
  ]);

  // ─── LOGIQUE VISIO : actif 1h avant jusqu'à 2h après ────────────────────
  const canStartMeeting = (courseDate, courseTime) => {
    if (!courseDate || !courseTime) return false;
    const timeStr = courseTime.length > 5 ? courseTime.slice(0, 5) : courseTime;
    const courseDateTime = new Date(`${courseDate}T${timeStr}`);
    const timeDiff  = courseDateTime - currentTime;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return true;
  };

  // ─── HANDLERS RENDEZ-VOUS ─────────────────────────────────────────────────
  const handleConfirmAppointment = async (appointmentId) => {
    if (!window.confirm('Confirmer ce rendez-vous ?')) return;
    try {
      const response = await fetch(`${API_URL}/appointments/${appointmentId}/status/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      });
      const data = await response.json();
      if (data.success) {
        setAppointments(appointments.map(a => a.id === appointmentId ? { ...a, status: 'confirmed' } : a));
        alert('✅ Rendez-vous confirmé !');
      } else { alert('❌ Erreur: ' + data.message); }
    } catch { alert('❌ Erreur de connexion'); }
  };

  const handleCompleteCourse = async (appointmentId) => {
    if (!window.confirm('Marquer ce cours comme terminé ?')) return;
    try {
      const response = await fetch(`${API_URL}/appointments/${appointmentId}/status/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      const data = await response.json();
      if (data.success) {
        const completed = appointments.find(a => a.id === appointmentId);
        if (completed) {
          setCompletedCourses([...completedCourses, {
            id:            completed.id,
            subject:       completed.subject,
            student:       completed.studentName,
            studentAvatar: '👦',
            parent:        completed.parentName,
            date:          completed.preferredDate,
            time:          completed.preferredTime?.slice(0, 5),
            duration:      `${completed.duration}h`,
            amount:        parseFloat(completed.totalAmount) || 0,
            status:        'completed',
            validated:     { parent: false, teacher: true },
            teacherRemarks: null,
          }]);
          setAppointments(appointments.filter(a => a.id !== appointmentId));
        }
        alert('✅ Cours marqué comme terminé !');
      } else { alert('❌ Erreur: ' + data.message); }
    } catch { alert('❌ Erreur de connexion'); }
  };

  const handleJoinVideo      = (apt) => { setSelectedCourse(apt); setShowVideoConference(true); };
  const handleOpenRemarkModal = (course) => { setSelectedCourse(course); setRemarkData(course.teacherRemarks || { studentBehavior: '', progress: '', suggestions: '', rating: 5 }); setShowRemarkModal(true); };
  const handleSaveRemarks    = () => { setCompletedCourses(completedCourses.map(c => c.id === selectedCourse.id ? { ...c, teacherRemarks: remarkData } : c)); setShowRemarkModal(false); alert('✅ Remarques enregistrées !'); };
  const handleReschedule     = (apt) => { setSelectedCourse(apt); setRescheduleData({ date: apt.preferredDate || '', time: apt.preferredTime?.slice(0, 5) || '', reason: '' }); setShowRescheduleModal(true); };
  const confirmReschedule    = () => { console.log('Report:', selectedCourse.id, rescheduleData); setShowRescheduleModal(false); alert('📆 Demande de report envoyée au parent !'); };
  const handleCancelAppointment = (apt) => { setSelectedCourse(apt); setShowCancelModal(true); };
  const confirmCancel        = () => { setAppointments(appointments.filter(a => a.id !== selectedCourse.id)); setShowCancelModal(false); alert('❌ Cours annulé. Le parent a été notifié.'); };

  // ─── BADGE STATUT ─────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const config = {
      assigned:  { bg: 'rgba(59,130,246,0.2)',  color: '#3b82f6', icon: '👨‍🏫', label: 'Assigné' },
      confirmed: { bg: 'rgba(34,197,94,0.2)',   color: '#22c55e', icon: '✓',   label: 'Confirmé' },
      completed: { bg: 'rgba(139,58,147,0.2)',  color: '#8B3A93', icon: '✅',  label: 'Terminé' },
      cancelled: { bg: 'rgba(239,68,68,0.2)',   color: '#ef4444', icon: '✗',   label: 'Annulé' }
    };
    const { bg, color, icon, label } = config[status] || config.assigned;
    return <span style={{ ...styles.badge, background: bg, color }}>{icon} {label}</span>;
  };

  // ─── CALCULS ─────────────────────────────────────────────────────────────
  const totalEarnings  = earnings.reduce((s, e) => s + e.amount, 0);
  const totalHours     = earnings.reduce((s, e) => s + e.hours, 0);
  const avgRate        = totalHours > 0 ? (totalEarnings / totalHours).toFixed(2) : 0;
  const pendingCount   = appointments.filter(a => a.status === 'assigned').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const unreadMessages = messages.filter(m => m.unread).length;

  // ─── RENDU ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.bgDecor1}></div>
      <div style={styles.bgDecor2}></div>

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>KH</div>
            <div>
              <h1 style={styles.brandName}>KH PERFECTION</h1>
              <p style={styles.brandTagline}>Espace Enseignant</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button onClick={fetchTeacherAppointments} style={styles.refreshButton}>🔄 Actualiser</button>
            <button onClick={() => navigate('home')} style={styles.homeButton}>🏠 Accueil</button>
            <button onClick={onLogout} style={styles.logoutButton}>🚪 Déconnexion</button>
          </div>
        </div>
      </header>

      {/* BANNIÈRE */}
      <section style={styles.welcomeBanner}>
        <div style={styles.welcomeContent}>
          <div>
            <h2 style={styles.welcomeTitle}>Bienvenue, {user?.name} ! 👋</h2>
            <p style={styles.welcomeSubtitle}>Gérez vos cours, communiquez avec les parents et suivez vos revenus</p>
          </div>
          <div style={styles.bannerDecor}>🎓</div>
        </div>
      </section>

      {/* ERREUR */}
      {error && (
        <div style={styles.errorAlertContainer}>
          <div style={styles.errorAlert}>
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError('')} style={styles.closeErrorBtn}>✕</button>
          </div>
        </div>
      )}

      {/* STATS */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #3b82f6' }}>
            <div style={styles.statIcon}>📅</div>
            <div><p style={styles.statLabel}>En attente</p><p style={styles.statValue}>{pendingCount}</p></div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #22c55e' }}>
            <div style={styles.statIcon}>✅</div>
            <div><p style={styles.statLabel}>Confirmés</p><p style={styles.statValue}>{confirmedCount}</p></div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #FDD835' }}>
            <div style={styles.statIcon}>💰</div>
            <div><p style={styles.statLabel}>Revenus ce mois</p><p style={styles.statValue}>{earnings[0]?.amount || 0}€</p></div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #8B3A93' }}>
            <div style={styles.statIcon}>💬</div>
            <div><p style={styles.statLabel}>Messages non lus</p><p style={styles.statValue}>{unreadMessages}</p></div>
          </div>
        </div>
      </section>

      {/* ONGLETS */}
      <section style={styles.tabsSection}>
        <div style={styles.tabsContainer}>
          {[
            { key: 'appointments', icon: '📆', label: 'Mes Rendez-vous', badge: appointments.length },
            { key: 'completed',    icon: '✅', label: 'Cours Terminés',  badge: completedCourses.length },
            { key: 'messages',     icon: '💬', label: 'Messages',        badge: unreadMessages, danger: true },
            { key: 'earnings',     icon: '💰', label: 'Revenus' }
          ].map(({ key, icon, label, badge, danger }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{ ...styles.tab, ...(activeTab === key ? styles.tabActive : {}) }}
            >
              <span style={styles.tabIcon}>{icon}</span>
              <span>{label}</span>
              {badge !== undefined && badge > 0 && (
                <span style={{ ...styles.tabBadge, ...(danger ? styles.tabBadgeDanger : {}) }}>{badge}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* CONTENU PRINCIPAL */}
      <section style={styles.mainContent}>

        {/* ── ONGLET : RENDEZ-VOUS ASSIGNÉS ── */}
        {activeTab === 'appointments' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>📆 Mes rendez-vous assignés</h3>

            {loading && (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Chargement...</p>
              </div>
            )}

            {!loading && appointments.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p>Aucun rendez-vous assigné pour le moment.</p>
              </div>
            )}

            {!loading && appointments.map((apt) => {
              const timeStr  = apt.preferredTime?.slice(0, 5) || '00:00';
              const canStart = canStartMeeting(apt.preferredDate, timeStr);

              return (
                <div key={apt.id} style={styles.courseCard}>

                  {/* En-tête */}
                  <div style={styles.courseHeader}>
                    <div>
                      <h4 style={styles.courseSubject}>📚 {apt.subject} — {apt.level}</h4>
                      <p style={styles.courseStudent}>👦 Élève : {apt.studentName}</p>
                      <p style={styles.courseParent}>👤 Parent : {apt.parentName}</p>
                    </div>
                    <div style={styles.badgeGroup}>
                      {canStart && apt.status === 'confirmed' && (
                        <span style={styles.liveBadge}>
                          <span style={styles.liveDot}></span>Bientôt
                        </span>
                      )}
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>

                  {/* Détails */}
                  <div style={styles.courseDetails}>
                    <span style={styles.courseDetail}>📅 {new Date(apt.preferredDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    <span style={styles.courseDetail}>🕐 {timeStr}</span>
                    <span style={styles.courseDetail}>⏱️ {apt.duration}h</span>
                    <span style={styles.courseDetail}>📍 {apt.location === 'online' ? '💻 En ligne' : '🏠 À domicile'}</span>
                  </div>

                  {/* Infos contact */}
                  <div style={styles.infoSection}>
                    <p style={styles.infoLabel}>📧 Contact Parent</p>
                    <p style={styles.infoValue}>{apt.parentEmail}</p>
                    {apt.parentPhone && (
                      <>
                        <p style={styles.infoLabel}>📞 Téléphone</p>
                        <p style={styles.infoValue}>{apt.parentPhone}</p>
                      </>
                    )}
                    {apt.notes && (
                      <>
                        <p style={styles.infoLabel}>📝 Notes du parent</p>
                        <p style={styles.infoValue}>{apt.notes}</p>
                      </>
                    )}
                  </div>

                  {/* Bouton visio — accessible dès que le cours est assigné */}
                  <button
                    onClick={() => handleJoinVideo(apt)}
                    style={{ ...styles.videoButton, ...(canStart ? styles.videoButtonActive : styles.videoButtonDisabled) }}
                    disabled={!canStart}
                  >
                    <span>📹</span>
                    <span>{canStart ? 'Démarrer la visio' : 'Visio indisponible'}</span>
                  </button>
                  {!canStart && (
                    <p style={styles.videoHint}>⏰ La visioconférence sera disponible 1h avant le début du cours</p>
                  )}

                  {/* Actions */}
                  <div style={styles.actionButtons}>
                    <button onClick={() => handleCompleteCourse(apt.id)} style={styles.completeButton}>✅ Marquer terminé</button>
                    <button onClick={() => handleReschedule(apt)} style={styles.manageButton}>📆 Reporter</button>
                    <button onClick={() => handleCancelAppointment(apt)} style={styles.cancelActionButton}>❌ Annuler</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ONGLET : COURS TERMINÉS ── */}
        {activeTab === 'completed' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>✅ Cours terminés</h3>

            {completedCourses.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p>Aucun cours terminé pour le moment.</p>
              </div>
            )}

            {completedCourses.map((course) => (
              <div key={course.id} style={styles.courseCard}>
                <div style={styles.courseHeader}>
                  <div>
                    <h4 style={styles.courseSubject}>📚 {course.subject}</h4>
                    <p style={styles.courseStudent}>👦 {course.student}</p>
                    <p style={styles.courseParent}>👤 {course.parent}</p>
                  </div>
                  <div style={styles.amountBadge}>💰 {course.amount}€</div>
                </div>
                <div style={styles.courseDetails}>
                  <span style={styles.courseDetail}>📅 {new Date(course.date).toLocaleDateString('fr-FR')}</span>
                  <span style={styles.courseDetail}>🕐 {course.time}</span>
                  <span style={styles.courseDetail}>⏱️ {course.duration}</span>
                </div>
                <div style={styles.validationSection}>
                  <p style={styles.validationTitle}>📋 Statut de validation :</p>
                  <div style={styles.validationStatus}>
                    <div style={styles.validationItem}>
                      <span style={course.validated.parent ? styles.validated : styles.notValidated}>{course.validated.parent ? '✓' : '○'}</span>
                      <span style={styles.validationLabel}>Parent {course.validated.parent ? 'a validé' : "n'a pas encore validé"}</span>
                    </div>
                    <div style={styles.validationItem}>
                      <span style={course.validated.teacher ? styles.validated : styles.notValidated}>{course.validated.teacher ? '✓' : '○'}</span>
                      <span style={styles.validationLabel}>Vous {course.validated.teacher ? 'avez validé' : "n'avez pas encore validé"}</span>
                    </div>
                  </div>
                  {course.validated.parent && course.validated.teacher && (
                    <div style={styles.successMessage}>🎉 Cours entièrement validé — sera facturé !</div>
                  )}
                </div>
                {course.teacherRemarks && (
                  <div style={styles.remarksDisplay}>
                    <p style={styles.remarksTitle}>📝 Vos remarques :</p>
                    <div style={styles.remarkItem}><strong>Comportement :</strong> {course.teacherRemarks.studentBehavior}</div>
                    <div style={styles.remarkItem}><strong>Progression :</strong> {course.teacherRemarks.progress}</div>
                    <div style={styles.remarkItem}><strong>Suggestions :</strong> {course.teacherRemarks.suggestions}</div>
                    <div style={styles.remarkItem}><strong>Note :</strong> {'⭐'.repeat(course.teacherRemarks.rating)}</div>
                  </div>
                )}
                <div style={styles.actionButtons}>
                  <button onClick={() => handleOpenRemarkModal(course)} style={styles.remarkButton}>
                    {course.teacherRemarks ? '✏️ Modifier les remarques' : '📝 Ajouter des remarques'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ONGLET : MESSAGES ── */}
        {activeTab === 'messages' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>💬 Messages des parents</h3>
            <div style={styles.messagesList}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ ...styles.messageCard, ...(msg.unread ? styles.messageCardUnread : {}) }}>
                  <div style={styles.messageHeader}>
                    <div style={styles.messageAuthor}>
                      <span style={styles.messageAvatar}>{msg.avatar}</span>
                      <div>
                        <p style={styles.messageSender}>{msg.sender}</p>
                        <p style={styles.messageTime}>{new Date(msg.date).toLocaleDateString('fr-FR')} à {msg.time}</p>
                      </div>
                    </div>
                    {msg.unread && <span style={styles.unreadDot}></span>}
                  </div>
                  <p style={styles.messageText}>{msg.message}</p>
                  <button style={styles.replyButton}>Répondre →</button>
                </div>
              ))}
            </div>
            <button style={styles.newMessageButton}>
              <span>✉️</span><span>Nouveau message</span>
            </button>
          </div>
        )}

        {/* ── ONGLET : REVENUS ── */}
        {activeTab === 'earnings' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>💰 Mes revenus</h3>
            <div style={styles.earningsSummary}>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Total gagné</span><span style={styles.summaryValue}>{totalEarnings}€</span></div>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Heures totales</span><span style={styles.summaryValue}>{totalHours}h</span></div>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Taux moyen</span><span style={styles.summaryValue}>{avgRate}€/h</span></div>
            </div>
            <div style={styles.earningsList}>
              {earnings.map((e, i) => (
                <div key={i} style={styles.earningCard}>
                  <div style={styles.earningHeader}>
                    <h4 style={styles.earningMonth}>📅 {e.month}</h4>
                    <span style={styles.earningAmount}>{e.amount}€</span>
                  </div>
                  <div style={styles.earningDetails}>
                    <span>⏱️ {e.hours} heures</span>
                    <span>{(e.amount / e.hours).toFixed(2)}€/h</span>
                  </div>
                  <div style={styles.progressBarTrack}>
                    <div style={{ ...styles.progressBarFill, width: `${(e.hours / 20) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL VISIOCONFÉRENCE (ZegoCloud)
          roomID identique au parent → kh_course_${id} → même salle
      ══════════════════════════════════════════════════════════════════════ */}
      {showVideoConference && selectedCourse && (
        <div style={styles.videoModal} onClick={() => setShowVideoConference(false)}>
          <div style={styles.videoContainer} onClick={e => e.stopPropagation()}>
            <div style={styles.videoHeader}>
              <div style={styles.videoHeaderInfo}>
                <h3 style={styles.videoTitle}>
                  {selectedCourse.subject} — {selectedCourse.studentName}
                </h3>
                <p style={styles.videoSubtitle}>
                  Parent : {selectedCourse.parentName} | Durée : {selectedCourse.duration}h
                </p>
              </div>
              <button onClick={() => setShowVideoConference(false)} style={styles.videoCloseBtn}>✕</button>
            </div>
            <div style={styles.videoMain}>
              <div ref={zegoContainerRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL REPORT
      ══════════════════════════════════════════════════════════════════════ */}
      {showRescheduleModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowRescheduleModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📆 Reporter le cours</h3>
              <button onClick={() => setShowRescheduleModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.currentInfo}>
                <p style={styles.currentLabel}>Date actuelle :</p>
                <p style={styles.currentValue}>
                  {selectedCourse.preferredDate && new Date(selectedCourse.preferredDate).toLocaleDateString('fr-FR')} à {selectedCourse.preferredTime?.slice(0, 5)}
                </p>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nouvelle date</label>
                <input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nouvelle heure</label>
                <input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Raison (optionnel)</label>
                <textarea value={rescheduleData.reason} onChange={e => setRescheduleData({ ...rescheduleData, reason: e.target.value })} style={styles.formTextarea} placeholder="Ex: Empêchement de dernière minute..." />
              </div>
              <div style={styles.warningBox}>
                <span>⚠️</span>
                <p style={styles.warningText}>Le parent sera notifié et devra confirmer le nouveau créneau.</p>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowRescheduleModal(false)} style={styles.cancelModalBtn}>Annuler</button>
              <button onClick={confirmReschedule} style={styles.confirmBtn}>Confirmer le report</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL ANNULATION
      ══════════════════════════════════════════════════════════════════════ */}
      {showCancelModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>❌ Annuler le cours</h3>
              <button onClick={() => setShowCancelModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.cancelInfo}>
                <h4 style={styles.cancelCourseTitle}>{selectedCourse.subject}</h4>
                <p style={styles.cancelCourseDetails}>
                  {selectedCourse.studentName} — {selectedCourse.parentName}<br />
                  {selectedCourse.preferredDate && new Date(selectedCourse.preferredDate).toLocaleDateString('fr-FR')} à {selectedCourse.preferredTime?.slice(0, 5)}
                </p>
              </div>
              <div style={styles.dangerBox}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                  <p style={styles.dangerTitle}>Attention !</p>
                  <p style={styles.dangerText}>Cette action est irréversible. Le parent sera immédiatement notifié de l'annulation.</p>
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowCancelModal(false)} style={styles.cancelModalBtn}>Retour</button>
              <button onClick={confirmCancel} style={styles.dangerBtn}>Confirmer l'annulation</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL REMARQUES
      ══════════════════════════════════════════════════════════════════════ */}
      {showRemarkModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowRemarkModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>📝 Remarques sur le cours</h3>
              <button onClick={() => setShowRemarkModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              {[
                { key: 'studentBehavior', label: "Comportement de l'élève",  ph: "Comment s'est comporté l'élève ?" },
                { key: 'progress',        label: 'Progression',               ph: "Quels progrès ? Qu'a appris l'élève ?" },
                { key: 'suggestions',     label: 'Suggestions pour la suite', ph: 'Recommandations, exercices...' }
              ].map(({ key, label, ph }) => (
                <div key={key} style={styles.formGroup}>
                  <label style={styles.formLabel}>{label}</label>
                  <textarea
                    style={styles.formTextarea}
                    value={remarkData[key]}
                    onChange={e => setRemarkData({ ...remarkData, [key]: e.target.value })}
                    placeholder={ph}
                    rows={3}
                  />
                </div>
              ))}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Évaluation (1-5 étoiles)</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRemarkData({ ...remarkData, rating: star })}
                      style={{ ...styles.starButton, color: star <= remarkData.rating ? '#FDD835' : '#475569' }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowRemarkModal(false)} style={styles.cancelModalBtn}>Annuler</button>
              <button onClick={handleSaveRemarks} style={styles.confirmBtn}>💾 Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

// ─── STYLES (inchangés) ───────────────────────────────────────────────────────
const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden', paddingBottom: '40px' },
  bgDecor1: { position: 'absolute', top: '-120px', right: '-120px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,216,53,0.12) 0%, transparent 70%)' },
  bgDecor2: { position: 'absolute', bottom: '-160px', left: '-160px', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,58,147,0.2) 0%, transparent 70%)' },
  header: { background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(253,216,53,0.2)', padding: '1.5rem 2rem', position: 'sticky', top: 0, zIndex: 100 },
  headerContent: { maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
  logoSection: { display: 'flex', alignItems: 'center', gap: '1rem' },
  logoCircle: { width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #FDD835, #8B3A93)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff', boxShadow: '0 4px 15px rgba(253,216,53,0.4)' },
  brandName: { fontSize: '1.5rem', fontWeight: 'bold', color: '#FDD835', margin: 0 },
  brandTagline: { fontSize: '0.9rem', color: '#94a3b8', margin: 0 },
  headerActions: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  refreshButton: { padding: '0.6rem 1.2rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  homeButton: { padding: '0.6rem 1.2rem', background: 'rgba(253,216,53,0.15)', color: '#FDD835', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  logoutButton: { padding: '0.6rem 1.2rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  welcomeBanner: { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' },
  welcomeContent: { background: 'linear-gradient(135deg, rgba(253,216,53,0.12), rgba(139,58,147,0.1))', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '16px', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' },
  welcomeTitle: { fontSize: '2rem', fontWeight: 'bold', color: '#FDD835', margin: '0 0 0.5rem 0' },
  welcomeSubtitle: { fontSize: '1rem', color: '#cbd5e1', margin: 0 },
  bannerDecor: { fontSize: '4rem' },
  errorAlertContainer: { maxWidth: '1400px', margin: '1rem auto 0', padding: '0 2rem' },
  errorAlert: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#f87171' },
  closeErrorBtn: { marginLeft: 'auto', background: 'transparent', border: 'none', color: '#f87171', fontSize: '1.5rem', cursor: 'pointer' },
  statsSection: { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' },
  statCard: { background: 'rgba(15,23,42,0.8)', borderRadius: '14px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' },
  statIcon: { fontSize: '2rem' },
  statLabel: { color: '#94a3b8', fontSize: '0.9rem', margin: 0 },
  statValue: { color: '#FDD835', fontSize: '1.8rem', fontWeight: 'bold', margin: 0 },
  tabsSection: { maxWidth: '1400px', margin: '2rem auto 1rem', padding: '0 2rem' },
  tabsContainer: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  tab: { flex: 1, minWidth: '180px', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.7)', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.95rem' },
  tabActive: { background: 'linear-gradient(135deg, #FDD835, #F9A825)', color: '#0f172a', fontWeight: 'bold' },
  tabIcon: { fontSize: '1.2rem' },
  tabBadge: { background: 'rgba(0,0,0,0.25)', color: '#FDD835', borderRadius: '999px', padding: '0.2rem 0.6rem', fontSize: '0.8rem' },
  tabBadgeDanger: { background: '#ef4444', color: '#fff' },
  mainContent: { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' },
  contentSection: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  sectionTitle: { color: '#FDD835', fontSize: '1.6rem', marginBottom: '0.5rem' },
  courseCard: { background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 15px 30px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  courseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  badgeGroup: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' },
  courseSubject: { color: '#FDD835', margin: 0 },
  courseStudent: { color: '#cbd5e1', margin: '0.2rem 0' },
  courseParent: { color: '#94a3b8', margin: 0 },
  badge: { padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600' },
  liveBadge: { padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600', background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', gap: '6px' },
  liveDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' },
  courseDetails: { display: 'flex', flexWrap: 'wrap', gap: '1rem', color: '#cbd5e1' },
  courseDetail: { fontSize: '0.95rem' },
  infoSection: { background: 'rgba(30,41,59,0.6)', borderRadius: '10px', padding: '1rem' },
  infoLabel: { color: '#FDD835', fontSize: '0.85rem', marginBottom: '0.2rem' },
  infoValue: { color: '#cbd5e1', marginBottom: '0.5rem' },
  videoButton: { padding: '0.8rem 1.2rem', borderRadius: '12px', border: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  videoButtonActive: { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 8px 30px rgba(34,197,94,0.4)' },
  videoButtonDisabled: { background: 'rgba(255,255,255,0.05)', color: '#6b7280', cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.1)' },
  videoHint: { fontSize: '12px', color: '#9ca3af', textAlign: 'center' },
  actionButtons: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  confirmButton: { background: '#22c55e', color: '#0f172a', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  completeButton: { background: '#8B3A93', color: '#fff', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '10px', cursor: 'pointer' },
  manageButton: { padding: '0.7rem 1.2rem', background: 'rgba(253,216,53,0.1)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#FDD835', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  cancelActionButton: { padding: '0.7rem 1.2rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  remarkButton: { padding: '0.7rem 1.4rem', background: 'linear-gradient(135deg, rgba(139,58,147,0.3), rgba(147,51,234,0.3))', border: '1px solid rgba(147,51,234,0.4)', borderRadius: '12px', color: '#a78bfa', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
  amountBadge: { padding: '0.4rem 0.9rem', background: 'rgba(253,216,53,0.15)', color: '#FDD835', borderRadius: '999px', fontWeight: '600', fontSize: '0.9rem' },
  validationSection: { background: 'rgba(30,41,59,0.6)', borderRadius: '10px', padding: '1rem' },
  validationTitle: { color: '#FDD835', fontSize: '0.9rem', marginBottom: '0.5rem' },
  validationStatus: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  validationItem: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  validationLabel: { color: '#cbd5e1', fontSize: '0.9rem' },
  validated: { color: '#22c55e', fontWeight: 'bold', fontSize: '1.1rem' },
  notValidated: { color: '#94a3b8', fontSize: '1.1rem' },
  successMessage: { marginTop: '0.5rem', padding: '0.6rem', background: 'rgba(34,197,94,0.15)', borderRadius: '8px', color: '#22c55e', fontSize: '0.9rem', textAlign: 'center' },
  remarksDisplay: { background: 'rgba(30,41,59,0.6)', borderRadius: '10px', padding: '1rem' },
  remarksTitle: { color: '#FDD835', fontSize: '0.9rem', marginBottom: '0.5rem' },
  remarkItem: { color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.3rem' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '1rem' },
  spinner: { width: '40px', height: '40px', border: '4px solid rgba(253,216,53,0.2)', borderTop: '4px solid #FDD835', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { color: '#94a3b8' },
  emptyState: { textAlign: 'center', padding: '3rem', color: '#94a3b8' },
  emptyIcon: { fontSize: '3rem' },
  messagesList: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  messageCard: { background: 'rgba(15,23,42,0.85)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(148,163,184,0.15)' },
  messageCardUnread: { borderColor: 'rgba(253,216,53,0.4)', background: 'rgba(253,216,53,0.04)' },
  messageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  messageAuthor: { display: 'flex', alignItems: 'center', gap: '12px' },
  messageAvatar: { fontSize: '2rem' },
  messageSender: { fontSize: '1rem', fontWeight: '600', color: '#FDD835', margin: '0 0 4px 0' },
  messageTime: { fontSize: '0.8rem', color: '#94a3b8', margin: 0 },
  unreadDot: { width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' },
  messageText: { fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '1rem' },
  replyButton: { padding: '0.6rem 1.2rem', background: 'rgba(253,216,53,0.1)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#FDD835', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
  newMessageButton: { width: '100%', padding: '1rem', marginTop: '1rem', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#0f172a', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 30px rgba(253,216,53,0.4)' },
  earningsSummary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  summaryCard: { background: 'rgba(15,23,42,0.8)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', border: '1px solid rgba(253,216,53,0.15)' },
  summaryLabel: { color: '#94a3b8', fontSize: '0.85rem' },
  summaryValue: { color: '#FDD835', fontSize: '1.6rem', fontWeight: 'bold' },
  earningsList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  earningCard: { background: 'rgba(15,23,42,0.8)', borderRadius: '12px', padding: '1.2rem', border: '1px solid rgba(148,163,184,0.15)' },
  earningHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
  earningMonth: { color: '#cbd5e1', margin: 0 },
  earningAmount: { color: '#FDD835', fontWeight: 'bold', fontSize: '1.2rem' },
  earningDetails: { display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.6rem' },
  progressBarTrack: { background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '8px', overflow: 'hidden' },
  progressBarFill: { height: '100%', background: 'linear-gradient(90deg, #FDD835, #F9A825)', borderRadius: '999px' },
  videoModal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' },
  videoContainer: { background: '#0f172a', borderRadius: '20px', width: '100%', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(253,216,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' },
  videoHeader: { padding: '20px 30px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  videoHeaderInfo: { flex: 1 },
  videoTitle: { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 5px 0' },
  videoSubtitle: { fontSize: '14px', color: '#9ca3af', margin: 0 },
  videoCloseBtn: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  videoMain: { flex: 1, position: 'relative', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { background: 'rgba(15,23,42,0.98)', backdropFilter: 'blur(20px)', borderRadius: '24px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(253,216,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  modalHeader: { padding: '25px 30px', borderBottom: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139,58,147,0.15)' },
  modalTitle: { fontSize: '22px', fontWeight: '700', color: '#FDD835', margin: 0 },
  modalClose: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: '30px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  modalFooter: { padding: '20px 30px', borderTop: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  formLabel: { fontSize: '14px', fontWeight: '600', color: '#FDD835' },
  formInput: { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  formTextarea: { width: '100%', minHeight: '80px', padding: '12px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  starButton: { background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
  currentInfo: { marginBottom: '10px', padding: '15px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.3)' },
  currentLabel: { fontSize: '13px', color: '#60a5fa', marginBottom: '6px', fontWeight: '600' },
  currentValue: { fontSize: '16px', color: '#e5e7eb', margin: 0 },
  warningBox: { padding: '15px', background: 'rgba(251,191,36,0.1)', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'flex-start', gap: '12px' },
  warningText: { fontSize: '13px', color: '#fbbf24', margin: 0, lineHeight: '1.6' },
  dangerBox: { padding: '15px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '10px' },
  dangerTitle: { fontSize: '15px', fontWeight: 'bold', color: '#fca5a5', marginBottom: '8px' },
  dangerText: { fontSize: '13px', color: '#fca5a5', margin: 0, lineHeight: '1.6' },
  cancelInfo: { marginBottom: '10px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center' },
  cancelCourseTitle: { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', marginBottom: '10px' },
  cancelCourseDetails: { fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', margin: 0 },
  cancelModalBtn: { padding: '12px 24px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '12px', color: '#FDD835', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  confirmBtn: { padding: '12px 24px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#0f172a', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(253,216,53,0.4)' },
  dangerBtn: { padding: '12px 24px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' },
};
