// ─── ZEGOCLOUD + React hooks ─────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

const ParentDashboard = ({ navigate, user, onLogout }) => {

  // ─── ÉTATS PRINCIPAUX ────────────────────────────────────────────────────
  const [activeTab, setActiveTab]               = useState('planned');
  const [selectedCourse, setSelectedCourse]     = useState(null);
  const [currentTime]                           = useState(new Date());

  // Modals
  const [showEvaluation, setShowEvaluation]         = useState(false);
  const [showVideoConference, setShowVideoConference] = useState(false);
  const [showModifyModal, setShowModifyModal]       = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal]       = useState(false);

  // Données
  const [plannedCourses, setPlannedCourses]   = useState([]);
  const [loadingCourses, setLoadingCourses]   = useState(true);

  const [modifyData, setModifyData]           = useState({ subject: '', childName: '', notes: '' });
  const [rescheduleData, setRescheduleData]   = useState({ date: '', time: '', reason: '' });

  // ─── ZEGOCLOUD ref ────────────────────────────────────────────────────────
  const zegoContainerRef = useRef(null);

  // ─── useEffect : ZEGOCLOUD — lancer la visio ─────────────────────────────
  useEffect(() => {
    if (!showVideoConference || !selectedCourse || !zegoContainerRef.current) return;

    const appID        = parseInt(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
    const roomID       = `kh_course_${selectedCourse.id}`;
    const userID       = `parent_${user?.id || Date.now()}`;
    const userName     = user?.name || 'Parent';

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

  // ─── useEffect : CHARGER LES RENDEZ-VOUS du parent connecté ──────────────
  useEffect(() => {
    if (!user?.id) return;

    const fetchPlannedCourses = async () => {
      setLoadingCourses(true);
      try {
        const response = await fetch(`${API_URL}/appointments/`);
        const data = await response.json();

        if (data.success) {
          // Filtrer les rendez-vous du parent connecté avec enseignant assigné
          const mine = data.data.filter(
            (a) =>
              String(a.parentId) === String(user.id) &&
              (a.status === 'assigned' || a.status === 'confirmed') &&
              a.assignedTeacher
          );

          // Normaliser au format attendu par le composant
          const normalized = mine.map((a) => ({
            id:            a.id,
            subject:       a.subject,
            level:         a.level,
            teacher:       a.assignedTeacher,
            teacherAvatar: '👨‍🏫',
            date:          a.preferredDate,
            time:          a.preferredTime?.slice(0, 5) || '00:00',
            duration:      `${a.duration}h`,
            childName:     a.studentName,
            location:      a.location,
            status:        a.status,
          }));

          setPlannedCourses(normalized);
        }
      } catch (err) {
        console.error('❌ Erreur chargement rendez-vous:', err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchPlannedCourses();
  }, [user]);

  // ─── DONNÉES STATIQUES (cours terminés & messages) ───────────────────────
  const [completedCourses] = useState([
    {
      id: 4, subject: 'Mathématiques', teacher: 'Prof. Jean Martin', teacherAvatar: '👨‍🏫',
      date: '2025-12-01', time: '14:00', duration: '1h30', childName: 'Sophie',
      evaluation: {
        theme: 'LES DROITES PERPENDICULAIRES (maths) et les circuits électriques en physique',
        themeStatus: 'acquired',
        summary: "L'étudiant utilise avec détermination son énergie et ses ressources personnelles dans le but d'accroître son niveau.",
        criteria: [
          { name: 'Motivation',     value: 50, color: '#ef4444' },
          { name: 'Compréhension',  value: 50, color: '#3b82f6' },
          { name: 'Maîtrise',       value: 50, color: '#f59e0b' },
          { name: 'Autonomie',      value: 50, color: '#8b5cf6' },
        ]
      }
    },
    {
      id: 5, subject: 'Français', teacher: 'Prof. Sophie Dubois', teacherAvatar: '👩‍🏫',
      date: '2025-11-28', time: '16:00', duration: '1h', childName: 'Marc',
      evaluation: {
        theme: "L'analyse de texte et la rédaction",
        themeStatus: 'in-progress',
        summary: "L'étudiant progresse bien dans la compréhension des textes littéraires.",
        criteria: [
          { name: 'Motivation',     value: 70, color: '#ef4444' },
          { name: 'Compréhension',  value: 65, color: '#3b82f6' },
          { name: 'Maîtrise',       value: 60, color: '#f59e0b' },
          { name: 'Autonomie',      value: 55, color: '#8b5cf6' },
        ]
      }
    }
  ]);

  const [messages] = useState([
    { id: 1, sender: 'Prof. Jean Martin',   avatar: '👨‍🏫', message: "Bonjour, Sophie a fait d'excellents progrès cette semaine !", time: '14:30', date: '2025-12-10', unread: true },
    { id: 2, sender: 'Prof. Sophie Dubois', avatar: '👩‍🏫', message: 'Le prochain cours sera sur la poésie romantique.',              time: '10:15', date: '2025-12-09', unread: false }
  ]);

  // ─── LOGIQUE VISIO : actif 1h avant jusqu'à 2h après ────────────────────
  const canStartMeeting = (courseDate, courseTime) => {
    const courseDateTime = new Date(`${courseDate}T${courseTime}`);
    const timeDiff  = courseDateTime - currentTime;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return true;
  };

  // ─── HANDLERS ─────────────────────────────────────────────────────────────
  const handleJoinVideo       = (course) => { setSelectedCourse(course); setShowVideoConference(true); };
  const handleModifyCourse    = (course) => { setSelectedCourse(course); setModifyData({ subject: course.subject, childName: course.childName, notes: '' }); setShowModifyModal(true); };
  const handleRescheduleCourse = (course) => { setSelectedCourse(course); setRescheduleData({ date: course.date, time: course.time, reason: '' }); setShowRescheduleModal(true); };
  const handleCancelCourse    = (course) => { setSelectedCourse(course); setShowCancelModal(true); };

  const confirmModify    = () => { console.log('Modification:', selectedCourse.id, modifyData);    setShowModifyModal(false); };
  const confirmReschedule = () => { console.log('Report:',       selectedCourse.id, rescheduleData); setShowRescheduleModal(false); };
  const confirmCancel    = () => { setPlannedCourses(plannedCourses.filter(c => c.id !== selectedCourse.id)); setShowCancelModal(false); };

  // ─── HELPERS ÉVALUATION ──────────────────────────────────────────────────
  const getThemeStatusLabel = (status) => ({
    'not-acquired': 'Non acquise',
    'in-progress':  "En cours d'acquisition",
    'acquired':     'Acquis'
  }[status] || status);

  const getThemeStatusStyle = (status) => ({
    'not-acquired': { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
    'in-progress':  { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24' },
    'acquired':     { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e' },
  }[status] || { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' });

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
              <p style={styles.brandTagline}>Espace Parent</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button onClick={() => navigate('home')} style={styles.homeButton}>🏠 Accueil</button>
            <button onClick={onLogout}               style={styles.logoutButton}>🚪 Déconnexion</button>
          </div>
        </div>
      </header>

      {/* BANNIÈRE */}
      <section style={styles.welcomeBanner}>
        <div style={styles.welcomeContent}>
          <div>
            <h2 style={styles.welcomeTitle}>Bienvenue, {user?.name || 'Parent'} ! 👋</h2>
            <p style={styles.welcomeSubtitle}>Suivez la progression de vos enfants</p>
          </div>
          <button onClick={() => navigate('appointment')} style={styles.primaryCta}>
            <span style={styles.ctaIcon}>➕</span>
            <span>Réserver un cours</span>
          </button>
        </div>
      </section>

      {/* STATS */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          {[
            { icon: '📅', label: 'Cours planifiés',  value: plannedCourses.length },
            { icon: '✅', label: 'Cours terminés',   value: completedCourses.length },
            { icon: '💬', label: 'Messages',          value: messages.filter(m => m.unread).length },
            { icon: '👨‍🏫', label: 'Enseignants',      value: 4 }
          ].map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statIcon}>{s.icon}</div>
              <div>
                <p style={styles.statLabel}>{s.label}</p>
                <p style={styles.statValue}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ONGLETS */}
      <section style={styles.tabsContainer}>
        <div style={styles.tabs}>
          {[
            { key: 'planned',   icon: '📅', label: 'Cours planifiés', badge: plannedCourses.length },
            { key: 'completed', icon: '✅', label: 'Cours terminés',  badge: completedCourses.length },
            { key: 'chat',      icon: '💬', label: 'Messages',        notif: messages.filter(m => m.unread).length }
          ].map(({ key, icon, label, badge, notif }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{ ...styles.tab, ...(activeTab === key ? styles.tabActive : {}) }}
            >
              <span style={styles.tabIcon}>{icon}</span>
              <span>{label}</span>
              {badge !== undefined && <span style={styles.tabBadge}>{badge}</span>}
              {notif > 0 && <span style={styles.tabNotification}>{notif}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* CONTENU PRINCIPAL */}
      <section style={styles.mainContent}>

        {/* ── ONGLET : COURS PLANIFIÉS ── */}
        {activeTab === 'planned' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📅</span>Prochains cours
            </h3>

            {/* Chargement */}
            {loadingCourses && (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>
                ⏳ Chargement de vos cours...
              </p>
            )}

            {/* Aucun cours */}
            {!loadingCourses && plannedCourses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
                <p>Aucun cours planifié avec un enseignant assigné.</p>
                <button
                  onClick={() => navigate('appointment')}
                  style={{ ...styles.primaryCta, margin: '1rem auto' }}
                >
                  ➕ Réserver un cours
                </button>
              </div>
            )}

            {/* Liste des cours */}
            <div style={styles.coursesList}>
              {plannedCourses.map((course) => {
                const canStart = canStartMeeting(course.date, course.time);
                return (
                  <div key={course.id} style={styles.courseCard}>

                    {/* En-tête carte */}
                    <div style={styles.courseCardHeader}>
                      <div style={styles.teacherInfo}>
                        <div style={styles.teacherAvatar}>{course.teacherAvatar}</div>
                        <div>
                          <h4 style={styles.courseSubject}>{course.subject}</h4>
                          <p style={styles.courseTeacher}>👨‍🏫 {course.teacher}</p>
                        </div>
                      </div>
                      {canStart && (
                        <span style={styles.liveBadge}>
                          <span style={styles.livePulse}></span>
                          Bientôt disponible
                        </span>
                      )}
                    </div>

                    {/* Détails */}
                    <div style={styles.courseDetails}>
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>👶</span>
                        <span style={styles.detailText}>{course.childName}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>🎓</span>
                        <span style={styles.detailText}>{course.level}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>📅</span>
                        <span style={styles.detailText}>
                          {new Date(course.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>🕐</span>
                        <span style={styles.detailText}>{course.time} — Durée : {course.duration}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailIcon}>📍</span>
                        <span style={styles.detailText}>
                          {course.location === 'online' ? '💻 En ligne' : '🏠 À domicile'}
                        </span>
                      </div>
                    </div>

                    {/* Actions visio + contact */}
                    <div style={styles.courseActions}>
                      <button
                        onClick={() => handleJoinVideo(course)}
                        style={{ ...styles.videoButton, ...(canStart ? styles.videoButtonActive : styles.videoButtonDisabled) }}
                        disabled={!canStart}
                      >
                        <span style={styles.buttonIcon}>📹</span>
                        <span>{canStart ? 'Rejoindre la visio' : 'Visio indisponible'}</span>
                      </button>
                      <button
                        onClick={() => navigate('chat', { teacherId: course.teacher })}
                        style={styles.chatButton}
                      >
                        <span style={styles.buttonIcon}>💬</span>
                        <span>Contacter</span>
                      </button>
                    </div>

                    {!canStart && (
                      <p style={styles.videoHint}>
                        ⏰ La visioconférence sera disponible 1h avant le début du cours
                      </p>
                    )}

                    {/* Gestion cours */}
                    <div style={styles.courseManagement}>
                      <button onClick={() => handleModifyCourse(course)}     style={styles.manageButton}><span style={styles.manageIcon}>✏️</span><span>Modifier</span></button>
                      <button onClick={() => handleRescheduleCourse(course)} style={styles.manageButton}><span style={styles.manageIcon}>📆</span><span>Reporter</span></button>
                      <button onClick={() => handleCancelCourse(course)}     style={styles.cancelButton}><span style={styles.manageIcon}>❌</span><span>Annuler</span></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ONGLET : COURS TERMINÉS ── */}
        {activeTab === 'completed' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>✅</span>Historique des cours
            </h3>
            <div style={styles.coursesList}>
              {completedCourses.map((course) => (
                <div key={course.id} style={styles.courseCard}>
                  <div style={styles.courseCardHeader}>
                    <div style={styles.teacherInfo}>
                      <div style={styles.teacherAvatar}>{course.teacherAvatar}</div>
                      <div>
                        <h4 style={styles.courseSubject}>{course.subject}</h4>
                        <p style={styles.courseTeacher}>{course.teacher}</p>
                      </div>
                    </div>
                    <span style={styles.completedBadge}>✓ Terminé</span>
                  </div>
                  <div style={styles.courseDetails}>
                    <div style={styles.detailItem}><span style={styles.detailIcon}>👶</span><span style={styles.detailText}>{course.childName}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailIcon}>📅</span><span style={styles.detailText}>{new Date(course.date).toLocaleDateString('fr-FR')}</span></div>
                    <div style={styles.detailItem}><span style={styles.detailIcon}>🕐</span><span style={styles.detailText}>{course.time} - {course.duration}</span></div>
                  </div>
                  <button
                    onClick={() => { setSelectedCourse(course); setShowEvaluation(true); }}
                    style={styles.evaluationButton}
                  >
                    <span style={styles.buttonIcon}>📊</span>
                    <span>Voir l'appréciation du professeur</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ONGLET : MESSAGES ── */}
        {activeTab === 'chat' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>💬</span>Messages des enseignants
            </h3>
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
              <span style={styles.buttonIcon}>✉️</span>
              <span>Nouveau message</span>
            </button>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL VISIOCONFÉRENCE (ZegoCloud)
      ══════════════════════════════════════════════════════════════════════ */}
      {showVideoConference && selectedCourse && (
        <div style={styles.videoModal} onClick={() => setShowVideoConference(false)}>
          <div style={styles.videoContainer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.videoHeader}>
              <div style={styles.videoHeaderInfo}>
                <h3 style={styles.videoTitle}>{selectedCourse.subject} — {selectedCourse.teacher}</h3>
                <p style={styles.videoSubtitle}>Élève : {selectedCourse.childName} | Durée : {selectedCourse.duration}</p>
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
          MODAL MODIFICATION
      ══════════════════════════════════════════════════════════════════════ */}
      {showModifyModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowModifyModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><span style={styles.modalIcon}>✏️</span>Modifier le cours</h3>
              <button onClick={() => setShowModifyModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Matière</label>
                <input type="text" value={modifyData.subject} onChange={(e) => setModifyData({ ...modifyData, subject: e.target.value })} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Enfant concerné</label>
                <input type="text" value={modifyData.childName} onChange={(e) => setModifyData({ ...modifyData, childName: e.target.value })} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Notes / Demandes spéciales</label>
                <textarea value={modifyData.notes} onChange={(e) => setModifyData({ ...modifyData, notes: e.target.value })} style={styles.formTextarea} placeholder="Ex: Insister sur les fractions..." />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowModifyModal(false)} style={styles.cancelModalBtn}>Annuler</button>
              <button onClick={confirmModify} style={styles.confirmBtn}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL REPORT
      ══════════════════════════════════════════════════════════════════════ */}
      {showRescheduleModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowRescheduleModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><span style={styles.modalIcon}>📆</span>Reporter le cours</h3>
              <button onClick={() => setShowRescheduleModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.currentInfo}>
                <p style={styles.currentLabel}>Date actuelle :</p>
                <p style={styles.currentValue}>{new Date(selectedCourse.date).toLocaleDateString('fr-FR')} à {selectedCourse.time}</p>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nouvelle date</label>
                <input type="date" value={rescheduleData.date} onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nouvelle heure</label>
                <input type="time" value={rescheduleData.time} onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })} style={styles.formInput} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Raison du report (optionnel)</label>
                <textarea value={rescheduleData.reason} onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })} style={styles.formTextarea} placeholder="Ex: Empêchement de dernière minute..." />
              </div>
              <div style={styles.warningBox}>
                <span style={styles.warningIcon}>⚠️</span>
                <p style={styles.warningText}>Le professeur sera notifié de cette demande de report et devra la confirmer.</p>
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
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><span style={styles.modalIcon}>❌</span>Annuler le cours</h3>
              <button onClick={() => setShowCancelModal(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.cancelInfo}>
                <h4 style={styles.cancelCourseTitle}>{selectedCourse.subject}</h4>
                <p style={styles.cancelCourseDetails}>
                  {selectedCourse.teacher} — {selectedCourse.childName}<br />
                  {new Date(selectedCourse.date).toLocaleDateString('fr-FR')} à {selectedCourse.time}
                </p>
              </div>
              <div style={styles.dangerBox}>
                <span style={styles.dangerIcon}>⚠️</span>
                <div>
                  <p style={styles.dangerTitle}>Attention !</p>
                  <p style={styles.dangerText}>Cette action est irréversible. Le cours sera définitivement annulé et le professeur en sera notifié.</p>
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
          MODAL ÉVALUATION
      ══════════════════════════════════════════════════════════════════════ */}
      {showEvaluation && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowEvaluation(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}><span style={styles.modalIcon}>📊</span>Évaluation du cours</h3>
              <button onClick={() => setShowEvaluation(false)} style={styles.modalClose}>✕</button>
            </div>
            <div style={styles.evaluationContent}>
              <div style={styles.evaluationHeader}>
                <div style={styles.evaluationCourseInfo}>
                  <h4 style={styles.evaluationSubject}>{selectedCourse.subject}</h4>
                  <p style={styles.evaluationTeacher}>Par {selectedCourse.teacher}</p>
                  <p style={styles.evaluationDate}>{new Date(selectedCourse.date).toLocaleDateString('fr-FR')} — {selectedCourse.childName}</p>
                </div>
              </div>

              <div style={styles.themeSection}>
                <div style={styles.themeSectionHeader}>
                  <span style={styles.themeIcon}>📚</span>
                  <h4 style={styles.themeTitle}>Cours</h4>
                </div>
                <div style={styles.themeMainTopic}>
                  <p style={styles.themeLabel}>Thématique principale abordée</p>
                  <p style={styles.themeText}>{selectedCourse.evaluation.theme}</p>
                </div>
                <div style={styles.themeAcquisition}>
                  <p style={styles.acquisitionLabel}>Acquisition de la thématique</p>
                  <div style={styles.acquisitionOptions}>
                    {['not-acquired', 'in-progress', 'acquired'].map((s) => {
                      const isSelected  = selectedCourse.evaluation.themeStatus === s;
                      const statusStyle = getThemeStatusStyle(s);
                      return (
                        <div key={s} style={{ ...styles.acquisitionOption, ...(isSelected ? { background: statusStyle.bg, borderColor: statusStyle.color, color: statusStyle.color } : {}) }}>
                          {isSelected && <span style={styles.checkmark}>✓</span>}
                          <span>{getThemeStatusLabel(s)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={styles.summarySection}>
                <div style={styles.summarySectionHeader}>
                  <span style={styles.summaryIcon}>📝</span>
                  <h4 style={styles.summaryTitle}>Résumé de la séance</h4>
                </div>
                <div style={styles.motivationBox}>
                  <p style={styles.motivationLabel}>Motivation</p>
                  <p style={styles.motivationText}>{selectedCourse.evaluation.summary}</p>
                </div>
              </div>

              <div style={styles.criteriaSection}>
                {selectedCourse.evaluation.criteria.map((criterion, index) => (
                  <div key={index} style={styles.criterionItem}>
                    <div style={styles.criterionHeader}>
                      <p style={styles.criterionName}>{criterion.name}</p>
                      <p style={styles.criterionValue}>{criterion.value}%</p>
                    </div>
                    <div style={styles.progressBarContainer}>
                      <div style={{ ...styles.progressBar, width: `${criterion.value}%`, background: criterion.color }}>
                        <div style={styles.progressBarInner}></div>
                      </div>
                      <div style={styles.graduationMarks}>
                        {[...Array(11)].map((_, i) => (
                          <div key={i} style={{ ...styles.graduationDot, left: `${i * 10}%`, ...(i * 10 === criterion.value ? styles.graduationDotActive : {}) }}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowEvaluation(false)} style={styles.closeButton}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;

// ─── STYLES (inchangés) ───────────────────────────────────────────────────────
const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #2b1055 50%, #6d28d9 100%)', paddingBottom: '40px', position: 'relative', overflow: 'hidden' },
  bgDecor1: { position: 'absolute', top: '-120px', right: '-120px', width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(253,216,53,0.18) 0%, transparent 70%)', borderRadius: '50%' },
  bgDecor2: { position: 'absolute', bottom: '-160px', left: '-160px', width: '520px', height: '520px', background: 'radial-gradient(circle, rgba(147,51,234,0.25) 0%, transparent 70%)', borderRadius: '50%' },
  header: { background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(253,216,53,0.2)', position: 'sticky', top: 0, zIndex: 100 },
  headerContent: { maxWidth: '1400px', margin: '0 auto', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  logoSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoCircle: { width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #FDD835, #9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 'bold', color: '#fff', boxShadow: '0 6px 20px rgba(253,216,53,0.5)' },
  brandName: { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', margin: 0 },
  brandTagline: { fontSize: '12px', color: '#e5e7eb', margin: 0 },
  headerActions: { display: 'flex', gap: '10px' },
  homeButton: { padding: '10px 20px', background: 'rgba(253,216,53,0.1)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#FDD835', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  logoutButton: { padding: '10px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  welcomeBanner: { maxWidth: '1400px', margin: '30px auto', padding: '0 20px' },
  welcomeContent: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '40px', border: '1px solid rgba(253,216,53,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' },
  welcomeTitle: { fontSize: '32px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 10px 0' },
  welcomeSubtitle: { fontSize: '16px', color: '#d1d5db', margin: 0 },
  primaryCta: { padding: '14px 30px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 30px rgba(253,216,53,0.5)' },
  ctaIcon: { fontSize: '20px' },
  statsSection: { maxWidth: '1400px', margin: '0 auto 30px', padding: '0 20px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
  statCard: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(253,216,53,0.2)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
  statIcon: { fontSize: '40px', background: 'rgba(253,216,53,0.15)', width: '70px', height: '70px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '14px', color: '#9ca3af', margin: '0 0 5px 0' },
  statValue: { fontSize: '32px', fontWeight: 'bold', color: '#FDD835', margin: 0 },
  tabsContainer: { maxWidth: '1400px', margin: '0 auto 30px', padding: '0 20px' },
  tabs: { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '8px', display: 'flex', gap: '8px', border: '1px solid rgba(253,216,53,0.15)' },
  tab: { flex: 1, padding: '16px 24px', background: 'transparent', border: 'none', borderRadius: '12px', color: '#9ca3af', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', position: 'relative' },
  tabActive: { background: 'linear-gradient(135deg, rgba(253,216,53,0.25), rgba(147,51,234,0.25))', color: '#FDD835', boxShadow: '0 4px 15px rgba(253,216,53,0.3)' },
  tabIcon: { fontSize: '20px' },
  tabBadge: { background: 'rgba(253,216,53,0.2)', color: '#FDD835', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  tabNotification: { background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', position: 'absolute', top: '8px', right: '8px' },
  mainContent: { maxWidth: '1400px', margin: '0 auto', padding: '0 20px' },
  contentSection: { animation: 'fadeInUp 0.5s ease' },
  sectionTitle: { fontSize: '24px', fontWeight: '700', color: '#FDD835', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' },
  sectionIcon: { fontSize: '28px' },
  coursesList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '25px' },
  courseCard: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '25px', border: '1px solid rgba(253,216,53,0.2)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' },
  courseCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  teacherInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  teacherAvatar: { width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(253,216,53,0.3), rgba(147,51,234,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '2px solid rgba(253,216,53,0.4)' },
  courseSubject: { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 5px 0' },
  courseTeacher: { fontSize: '14px', color: '#9ca3af', margin: 0 },
  liveBadge: { padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', gap: '8px' },
  livePulse: { width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s ease-in-out infinite' },
  completedBadge: { padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: 'rgba(34,197,94,0.2)', color: '#22c55e' },
  courseDetails: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' },
  detailItem: { display: 'flex', alignItems: 'center', gap: '10px' },
  detailIcon: { fontSize: '18px' },
  detailText: { fontSize: '14px', color: '#d1d5db' },
  courseActions: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' },
  videoButton: { padding: '14px 20px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  videoButtonActive: { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 8px 30px rgba(34,197,94,0.4)' },
  videoButtonDisabled: { background: 'rgba(255,255,255,0.05)', color: '#6b7280', cursor: 'not-allowed', border: '1px solid rgba(255,255,255,0.1)' },
  chatButton: { padding: '14px 20px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '12px', color: '#60a5fa', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  evaluationButton: { width: '100%', padding: '14px 20px', background: 'linear-gradient(135deg, rgba(139,58,147,0.3), rgba(147,51,234,0.3))', border: '1px solid rgba(147,51,234,0.4)', borderRadius: '12px', color: '#a78bfa', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  buttonIcon: { fontSize: '18px' },
  videoHint: { fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' },
  courseManagement: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(253,216,53,0.15)' },
  manageButton: { padding: '10px 12px', background: 'rgba(253,216,53,0.1)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#FDD835', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  cancelButton: { padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  manageIcon: { fontSize: '20px' },
  videoModal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' },
  videoContainer: { background: '#1a1a2e', borderRadius: '20px', width: '100%', maxWidth: '1200px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(253,216,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' },
  videoHeader: { padding: '20px 30px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  videoHeaderInfo: { flex: 1 },
  videoTitle: { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 5px 0' },
  videoSubtitle: { fontSize: '14px', color: '#9ca3af', margin: 0 },
  videoCloseBtn: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  videoMain: { flex: 1, position: 'relative', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { background: 'rgba(26,26,46,0.95)', backdropFilter: 'blur(20px)', borderRadius: '24px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(253,216,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  modalHeader: { padding: '25px 30px', borderBottom: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139,58,147,0.15)' },
  modalTitle: { fontSize: '22px', fontWeight: '700', color: '#FDD835', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' },
  modalIcon: { fontSize: '26px' },
  modalClose: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: '30px' },
  modalFooter: { padding: '20px 30px', borderTop: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  formGroup: { marginBottom: '20px' },
  formLabel: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#FDD835', marginBottom: '8px' },
  formInput: { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  formTextarea: { width: '100%', minHeight: '100px', padding: '12px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  currentInfo: { marginBottom: '20px', padding: '15px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.3)' },
  currentLabel: { fontSize: '13px', color: '#60a5fa', marginBottom: '6px', fontWeight: '600' },
  currentValue: { fontSize: '16px', color: '#e5e7eb', margin: 0 },
  warningBox: { padding: '15px', background: 'rgba(251,191,36,0.1)', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '20px' },
  warningIcon: { fontSize: '20px' },
  warningText: { fontSize: '13px', color: '#fbbf24', margin: 0, lineHeight: '1.6' },
  dangerBox: { padding: '15px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '20px' },
  dangerIcon: { fontSize: '24px' },
  dangerTitle: { fontSize: '15px', fontWeight: 'bold', color: '#fca5a5', marginBottom: '8px' },
  dangerText: { fontSize: '13px', color: '#fca5a5', margin: 0, lineHeight: '1.6' },
  cancelInfo: { marginBottom: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center' },
  cancelCourseTitle: { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', marginBottom: '10px' },
  cancelCourseDetails: { fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', margin: 0 },
  cancelModalBtn: { padding: '12px 24px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '12px', color: '#FDD835', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  confirmBtn: { padding: '12px 24px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(253,216,53,0.4)' },
  dangerBtn: { padding: '12px 24px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' },
  closeButton: { padding: '12px 30px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(253,216,53,0.4)' },
  evaluationContent: { padding: '30px' },
  evaluationHeader: { marginBottom: '30px' },
  evaluationCourseInfo: { background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(253,216,53,0.2)' },
  evaluationSubject: { fontSize: '20px', fontWeight: '700', color: '#FDD835', margin: '0 0 8px 0' },
  evaluationTeacher: { fontSize: '15px', color: '#a78bfa', margin: '0 0 8px 0' },
  evaluationDate: { fontSize: '13px', color: '#9ca3af', margin: 0 },
  themeSection: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', marginBottom: '25px', border: '1px solid rgba(253,216,53,0.15)' },
  themeSectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  themeIcon: { fontSize: '24px' },
  themeTitle: { fontSize: '18px', fontWeight: '700', color: '#FDD835', margin: 0 },
  themeMainTopic: { marginBottom: '20px' },
  themeLabel: { fontSize: '13px', color: '#9ca3af', marginBottom: '8px' },
  themeText: { fontSize: '15px', color: '#e5e7eb', lineHeight: '1.6', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' },
  themeAcquisition: { marginTop: '20px' },
  acquisitionLabel: { fontSize: '13px', color: '#9ca3af', marginBottom: '12px' },
  acquisitionOptions: { display: 'flex', gap: '12px' },
  acquisitionOption: { flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', fontSize: '13px', fontWeight: '600', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  checkmark: { fontSize: '16px' },
  summarySection: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', marginBottom: '25px', border: '1px solid rgba(253,216,53,0.15)' },
  summarySectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  summaryIcon: { fontSize: '24px' },
  summaryTitle: { fontSize: '18px', fontWeight: '700', color: '#FDD835', margin: 0 },
  motivationBox: { background: 'rgba(59,130,246,0.1)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(59,130,246,0.3)' },
  motivationLabel: { fontSize: '13px', color: '#60a5fa', fontWeight: '600', marginBottom: '8px' },
  motivationText: { fontSize: '14px', color: '#d1d5db', lineHeight: '1.6', margin: 0 },
  criteriaSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  criterionItem: { background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '18px', border: '1px solid rgba(255,255,255,0.1)' },
  criterionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  criterionName: { fontSize: '15px', fontWeight: '600', color: '#e5e7eb', margin: 0 },
  criterionValue: { fontSize: '16px', fontWeight: '700', color: '#FDD835', margin: 0 },
  progressBarContainer: { position: 'relative', height: '28px' },
  progressBar: { height: '100%', borderRadius: '14px', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' },
  progressBarInner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shimmer 2s infinite' },
  graduationMarks: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' },
  graduationDot: { position: 'absolute', width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)', transform: 'translateX(-50%)' },
  graduationDotActive: { width: '12px', height: '12px', background: '#fff', boxShadow: '0 0 10px rgba(255,255,255,0.5)' },
  messagesList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  messageCard: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(253,216,53,0.15)' },
  messageCardUnread: { borderColor: 'rgba(253,216,53,0.4)', background: 'rgba(253,216,53,0.05)' },
  messageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  messageAuthor: { display: 'flex', alignItems: 'center', gap: '12px' },
  messageAvatar: { fontSize: '32px' },
  messageSender: { fontSize: '16px', fontWeight: '600', color: '#FDD835', margin: '0 0 4px 0' },
  messageTime: { fontSize: '12px', color: '#9ca3af', margin: 0 },
  unreadDot: { width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s ease-in-out infinite' },
  messageText: { fontSize: '14px', color: '#d1d5db', lineHeight: '1.6', marginBottom: '15px' },
  replyButton: { padding: '10px 20px', background: 'rgba(253,216,53,0.15)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#FDD835', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  newMessageButton: { width: '100%', padding: '16px', marginTop: '20px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 8px 30px rgba(253,216,53,0.5)' },
};