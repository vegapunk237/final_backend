import { useState, useEffect, useRef, useMemo } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

const TeacherDashboard = ({ navigate, user, onLogout }) => {
  const [activeTab, setActiveTab]         = useState('appointments');
  const [appointments, setAppointments]   = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  const [showRemarkModal, setShowRemarkModal]         = useState(false);
  const [showVideoConference, setShowVideoConference] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal]         = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [remarkData, setRemarkData]         = useState({ studentBehavior: '', progress: '', suggestions: '', rating: 5 });
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', reason: '' });

  const zegoContainerRef = useRef(null);

  // ── Fichiers de cours ─────────────────────────────────────────────────────
  const [courseFiles, setCourseFiles]     = useState({});
  const [filesLoading, setFilesLoading]   = useState({});
  const [uploadingFile, setUploadingFile] = useState({});
  const [uploadDesc, setUploadDesc]       = useState('');
  const [expandedFiles, setExpandedFiles] = useState({});

  // ── Messages ──────────────────────────────────────────────────────────────
  const [messages, setMessages]             = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // FIX 1 : un état de réponse PAR message (clé = id du message)
  // Avant : replyContent était une seule string partagée → problème quand plusieurs
  // messages sont affichés ou quand l'API est lente (état rassis / mélange de contenu)
  const [replyingTo, setReplyingTo]         = useState(null);
  const [replyContents, setReplyContents]   = useState({});   // { [msgId]: string }
  const [sendingReply, setSendingReply]     = useState({});   // { [msgId]: bool }

  // FIX 2 : les revenus sont CALCULÉS depuis completedCourses (plus de useState hardcodé)
  const earnings = useMemo(() => {
    const byMonth = {};
    completedCourses.forEach(course => {
      const d = new Date(course.date);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!byMonth[key]) byMonth[key] = { month: key, amount: 0, hours: 0, _ts: d.getTime() };
      byMonth[key].amount += Number(course.amount) || 0;
      byMonth[key].hours  += parseFloat(String(course.duration).replace('h', '')) || 0;
    });
    // Tri du plus récent au plus ancien, 6 derniers mois maximum
    return Object.values(byMonth)
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 6);
  }, [completedCourses]);

  const totalEarnings  = earnings.reduce((s, e) => s + e.amount, 0);
  const totalHours     = earnings.reduce((s, e) => s + e.hours, 0);
  const avgRate        = totalHours > 0 ? (totalEarnings / totalHours).toFixed(2) : '0.00';
  const maxHours       = Math.max(...earnings.map(e => e.hours), 1);

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const res  = await fetch(`${API_URL}/messages/?user_type=teacher`);
      const data = await res.json();
      if (data.success) setMessages(data.data);
      else setMessages([]);
    } catch(e) { console.error('Erreur messages:', e); setMessages([]); }
    finally { setMessagesLoading(false); }
  };

  // Envoyer une réponse pour un message précis
  const handleSendReply = async (msgId) => {
    const content = (replyContents[msgId] || '').trim();
    if (!content) return;

    setSendingReply(prev => ({ ...prev, [msgId]: true }));
    try {
      const res = await fetch(`${API_URL}/messages/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType:      'teacher',
          senderId:        String(user?.id || ''),
          senderName:      user?.name || 'Enseignant',
          content,
          parentMessageId: msgId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Mise à jour locale immédiate sans re-fetch complet
        setMessages(prev => prev.map(m =>
          m.id !== msgId ? m : { ...m, replies: [...(m.replies || []), data.data] }
        ));
        // Nettoyer l'état de ce message uniquement
        setReplyContents(prev => ({ ...prev, [msgId]: '' }));
        setReplyingTo(null);
      } else {
        alert('❌ ' + (data.message || "Erreur lors de l'envoi"));
      }
    } catch(e) {
      alert('❌ Erreur de connexion');
    } finally {
      setSendingReply(prev => ({ ...prev, [msgId]: false }));
    }
  };

  // ── Fichiers helpers ──────────────────────────────────────────────────────
  const fetchCourseFiles = async (courseId) => {
    setFilesLoading(prev => ({ ...prev, [courseId]: true }));
    try {
      const res  = await fetch(`${API_URL}/appointments/${courseId}/files/`);
      const data = await res.json();
      if (data.success) setCourseFiles(prev => ({ ...prev, [courseId]: data.data }));
    } catch(e) { console.error('Erreur fichiers:', e); }
    finally { setFilesLoading(prev => ({ ...prev, [courseId]: false })); }
  };

  const toggleFiles = (courseId) => {
    setExpandedFiles(prev => {
      const next = !prev[courseId];
      if (next && !courseFiles[courseId]) fetchCourseFiles(courseId);
      return { ...prev, [courseId]: next };
    });
  };

  const handleFileUpload = async (courseId, file) => {
    if (!file) return;
    const ALLOWED_EXT = ['pdf','jpg','jpeg','png','gif','webp','doc','docx','xls','xlsx'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) { alert('❌ Type non autorisé. Formats : PDF, images, Word, Excel'); return; }
    if (file.size > 20 * 1024 * 1024) { alert('❌ Fichier trop lourd (max 20 MB)'); return; }
    setUploadingFile(prev => ({ ...prev, [courseId]: true }));
    try {
      const formData = new FormData();
      formData.append('file',          file);
      formData.append('uploaded_by',   'teacher');
      formData.append('uploader_name', user?.name || 'Enseignant');
      formData.append('description',   uploadDesc);
      const res  = await fetch(`${API_URL}/appointments/${courseId}/files/`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setCourseFiles(prev => ({ ...prev, [courseId]: [data.data, ...(prev[courseId] || [])] }));
        setUploadDesc('');
      } else { alert('❌ ' + data.message); }
    } catch(e) { alert('❌ Erreur de connexion'); }
    finally { setUploadingFile(prev => ({ ...prev, [courseId]: false })); }
  };

  const handleDeleteFile = async (courseId, fileId) => {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    try {
      const res  = await fetch(`${API_URL}/files/${fileId}/`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setCourseFiles(prev => ({ ...prev, [courseId]: prev[courseId].filter(f => f.id !== fileId) }));
    } catch(e) { alert('❌ Erreur'); }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024)        return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  // ── ZegoCloud ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showVideoConference || !selectedCourse || !zegoContainerRef.current) return;
    const appID        = parseInt(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
    const roomID       = `kh_course_${selectedCourse.id}`;
    const userID       = `teacher_${user?.id || Date.now()}`;
    const userName     = user?.name || 'Enseignant';
    const kitToken     = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID, userID, userName);
    const zp           = ZegoUIKitPrebuilt.create(kitToken);
    zp.joinRoom({
      container: zegoContainerRef.current,
      scenario:  { mode: ZegoUIKitPrebuilt.GroupCall },
      showScreenSharingButton: true,
      showTextChat:  true,
      showUserList:  true,
      onLeaveRoom:   () => setShowVideoConference(false),
    });
    return () => zp.destroy();
  }, [showVideoConference, selectedCourse]);

  // ── Chargement données ────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.id) {
      fetchTeacherAppointments();
      fetchCompletedCourses();
      fetchMessages();
    }
  }, [user]);

  const fetchTeacherAppointments = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_URL}/appointments/`);
      const data = await res.json();
      if (data.success) {
        setAppointments((data.data || []).filter(a =>
          String(a.assignedTeacherId) === String(user.id) &&
          (a.status === 'assigned' || a.status === 'confirmed')
        ));
      } else { setError('Erreur lors du chargement des rendez-vous'); }
    } catch { setError('Impossible de se connecter au serveur.'); }
    finally  { setLoading(false); }
  };

  const fetchCompletedCourses = async () => {
    try {
      const res  = await fetch(`${API_URL}/appointments/`);
      const data = await res.json();
      if (data.success) {
        setCompletedCourses((data.data || [])
          .filter(a => String(a.assignedTeacherId) === String(user.id) && a.status === 'completed')
          .map(a => ({
            id: a.id, subject: a.subject, student: a.studentName, studentAvatar: '👦',
            parent: a.parentName, date: a.preferredDate, time: a.preferredTime?.slice(0, 5) || '00:00',
            duration: `${a.duration}h`, amount: parseFloat(a.totalAmount) || 0,
            status: a.status, validated: { parent: false, teacher: true }, teacherRemarks: null,
          }))
        );
      }
    } catch(err) { console.error('❌ Erreur cours terminés:', err); }
  };

  // ── Handlers cours ────────────────────────────────────────────────────────
  const handleJoinVideo = (apt) => { setSelectedCourse(apt); setShowVideoConference(true); };

  const handleConfirmAppointment = async (id) => {
    if (!window.confirm('Confirmer ce rendez-vous ?')) return;
    try {
      const res  = await fetch(`${API_URL}/appointments/${id}/status/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmed' }) });
      const data = await res.json();
      if (data.success) { setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a)); alert('✅ Rendez-vous confirmé !'); }
      else { alert('❌ Erreur: ' + data.message); }
    } catch { alert('❌ Erreur de connexion'); }
  };

  const handleCompleteCourse = async (id) => {
    if (!window.confirm('Marquer ce cours comme terminé ?')) return;
    try {
      const res  = await fetch(`${API_URL}/appointments/${id}/status/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) });
      const data = await res.json();
      if (data.success) {
        const done = appointments.find(a => a.id === id);
        if (done) {
          setCompletedCourses(prev => [...prev, {
            id: done.id, subject: done.subject, student: done.studentName, studentAvatar: '👦',
            parent: done.parentName, date: done.preferredDate, time: done.preferredTime?.slice(0, 5),
            duration: `${done.duration}h`, amount: parseFloat(done.totalAmount) || 0,
            status: 'completed', validated: { parent: false, teacher: true }, teacherRemarks: null,
          }]);
          setAppointments(prev => prev.filter(a => a.id !== id));
        }
        alert('✅ Cours marqué comme terminé !');
      } else { alert('❌ Erreur: ' + data.message); }
    } catch { alert('❌ Erreur de connexion'); }
  };

  const handleOpenRemarkModal   = (course) => { setSelectedCourse(course); setRemarkData(course.teacherRemarks || { studentBehavior: '', progress: '', suggestions: '', rating: 5 }); setShowRemarkModal(true); };
  const handleSaveRemarks       = () => { setCompletedCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, teacherRemarks: remarkData } : c)); setShowRemarkModal(false); alert('✅ Remarques enregistrées !'); };
  const handleReschedule        = (apt) => { setSelectedCourse(apt); setRescheduleData({ date: apt.preferredDate || '', time: apt.preferredTime?.slice(0, 5) || '', reason: '' }); setShowRescheduleModal(true); };
  const confirmReschedule       = () => { setShowRescheduleModal(false); alert('📆 Demande de report envoyée au parent !'); };
  const handleCancelAppointment = (apt) => { setSelectedCourse(apt); setShowCancelModal(true); };
  const confirmCancel           = () => { setAppointments(prev => prev.filter(a => a.id !== selectedCourse.id)); setShowCancelModal(false); alert('❌ Cours annulé.'); };

  const getStatusBadge = (status) => {
    const config = {
      assigned:  { bg: 'rgba(59,130,246,0.2)',  color: '#3b82f6',  icon: '👨‍🏫', label: 'Assigné' },
      confirmed: { bg: 'rgba(34,197,94,0.2)',   color: '#22c55e',  icon: '✓',    label: 'Confirmé' },
      completed: { bg: 'rgba(139,58,147,0.2)',  color: '#8B3A93',  icon: '✅',   label: 'Terminé' },
      cancelled: { bg: 'rgba(239,68,68,0.2)',   color: '#ef4444',  icon: '✗',    label: 'Annulé' },
    };
    const { bg, color, icon, label } = config[status] || config.assigned;
    return <span style={{ ...styles.badge, background: bg, color }}>{icon} {label}</span>;
  };

  const pendingCount   = appointments.filter(a => a.status === 'assigned').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const unreadMessages = messages.filter(m => !m.is_read && m.sender_type === 'parent').length;

  const openWhiteboardTab = (course) => {
    const name = encodeURIComponent(`${course.subject} — ${course.studentName || ''}`);
    window.open(`/whiteboard.html?course=${name}`, '_blank', 'width=1200,height=750,toolbar=0,menubar=0');
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgDecor1} /><div style={styles.bgDecor2} />

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>KH</div>
            <div><h1 style={styles.brandName}>KH PERFECTION</h1><p style={styles.brandTagline}>Espace Enseignant</p></div>
          </div>
          <div style={styles.headerActions}>
            <button onClick={fetchTeacherAppointments} style={styles.refreshButton}>🔄 Actualiser</button>
            <button onClick={() => navigate('home')}   style={styles.homeButton}>🏠 Accueil</button>
            <button onClick={onLogout}                 style={styles.logoutButton}>🚪 Déconnexion</button>
          </div>
        </div>
      </header>

      {/* BANNIÈRE */}
      <section style={styles.welcomeBanner}>
        <div style={styles.welcomeContent}>
          <div><h2 style={styles.welcomeTitle}>Bienvenue, {user?.name} ! 👋</h2><p style={styles.welcomeSubtitle}>Gérez vos cours, communiquez avec les parents et suivez vos revenus</p></div>
          <div style={styles.bannerDecor}>🎓</div>
        </div>
      </section>

      {error && (
        <div style={styles.errorAlertContainer}>
          <div style={styles.errorAlert}><span>⚠️</span><span>{error}</span><button onClick={() => setError('')} style={styles.closeErrorBtn}>✕</button></div>
        </div>
      )}

      {/* STATS */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #3b82f6' }}><div style={styles.statIcon}>📅</div><div><p style={styles.statLabel}>En attente</p><p style={styles.statValue}>{pendingCount}</p></div></div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #22c55e' }}><div style={styles.statIcon}>✅</div><div><p style={styles.statLabel}>Confirmés</p><p style={styles.statValue}>{confirmedCount}</p></div></div>
          {/* FIX 2 : totalEarnings calculé dynamiquement depuis completedCourses */}
          <div style={{ ...styles.statCard, borderLeft: '4px solid #FDD835' }}><div style={styles.statIcon}>💰</div><div><p style={styles.statLabel}>Total gagné</p><p style={styles.statValue}>{totalEarnings.toFixed(0)}€</p></div></div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #8B3A93' }}><div style={styles.statIcon}>💬</div><div><p style={styles.statLabel}>Messages non lus</p><p style={styles.statValue}>{unreadMessages}</p></div></div>
        </div>
      </section>

      {/* ONGLETS */}
      <section style={styles.tabsSection}>
        <div style={styles.tabsContainer}>
          {[
            { key: 'appointments', icon: '📆', label: 'Mes Rendez-vous', badge: appointments.length },
            { key: 'completed',    icon: '✅', label: 'Cours Terminés',  badge: completedCourses.length },
            { key: 'messages',     icon: '💬', label: 'Messages',        badge: unreadMessages, danger: true },
            { key: 'earnings',     icon: '💰', label: 'Revenus' },
          ].map(({ key, icon, label, badge, danger }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ ...styles.tab, ...(activeTab === key ? styles.tabActive : {}) }}>
              <span style={styles.tabIcon}>{icon}</span><span>{label}</span>
              {badge !== undefined && badge > 0 && <span style={{ ...styles.tabBadge, ...(danger ? styles.tabBadgeDanger : {}) }}>{badge}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* CONTENU */}
      <section style={styles.mainContent}>

        {/* ── ONGLET RENDEZ-VOUS ── */}
        {activeTab === 'appointments' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>📆 Mes rendez-vous assignés</h3>
            {loading && <div style={styles.loadingContainer}><div style={styles.spinner} /><p style={styles.loadingText}>Chargement...</p></div>}
            {!loading && appointments.length === 0 && <div style={styles.emptyState}><span style={styles.emptyIcon}>📭</span><p>Aucun rendez-vous assigné.</p></div>}
            {!loading && appointments.map((apt) => {
              const timeStr = apt.preferredTime?.slice(0, 5) || '00:00';
              return (
                <div key={apt.id} style={styles.courseCard}>
                  <div style={styles.courseHeader}>
                    <div>
                      <h4 style={styles.courseSubject}>📚 {apt.subject} — {apt.level}</h4>
                      <p style={styles.courseStudent}>👦 Élève : {apt.studentName}</p>
                      <p style={styles.courseParent}>👤 Parent : {apt.parentName}</p>
                    </div>
                    <div style={styles.badgeGroup}>{getStatusBadge(apt.status)}</div>
                  </div>
                  <div style={styles.courseDetails}>
                    <span style={styles.courseDetail}>📅 {new Date(apt.preferredDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    <span style={styles.courseDetail}>🕐 {timeStr}</span>
                    <span style={styles.courseDetail}>⏱️ {apt.duration}h</span>
                    <span style={styles.courseDetail}>📍 {apt.location === 'online' ? '💻 En ligne' : '🏠 À domicile'}</span>
                  </div>
                  <div style={styles.infoSection}>
                    <p style={styles.infoLabel}>📧 Contact Parent</p><p style={styles.infoValue}>{apt.parentEmail}</p>
                    {apt.parentPhone && <><p style={styles.infoLabel}>📞 Téléphone</p><p style={styles.infoValue}>{apt.parentPhone}</p></>}
                    {apt.notes && <><p style={styles.infoLabel}>📝 Notes</p><p style={styles.infoValue}>{apt.notes}</p></>}
                  </div>
                  <button onClick={() => handleJoinVideo(apt)} style={{ ...styles.videoButton, ...styles.videoButtonActive }}>📹 Démarrer la visio</button>
                  <div style={styles.actionButtons}>
                    <button onClick={() => handleCompleteCourse(apt.id)} style={styles.completeButton}>✅ Marquer terminé</button>
                    <button onClick={() => handleReschedule(apt)}        style={styles.manageButton}>📆 Reporter</button>
                    <button onClick={() => handleCancelAppointment(apt)} style={styles.cancelActionButton}>❌ Annuler</button>
                  </div>

                  {/* ── FICHIERS DU COURS ── */}
                  <div style={styles.filesSection}>
                    <button onClick={() => toggleFiles(apt.id)} style={styles.filesToggleBtn}>
                      <span>📎 Documents du cours</span>
                      <span style={styles.filesCount}>{courseFiles[apt.id] ? `${courseFiles[apt.id].length} fichier${courseFiles[apt.id].length !== 1 ? 's' : ''}` : 'Voir'}</span>
                      <span style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: expandedFiles[apt.id] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                    </button>
                    {expandedFiles[apt.id] && (
                      <div style={styles.filesPanel}>
                        <div style={styles.uploadZone}
                          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#FDD835'; }}
                          onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(253,216,53,0.3)'; }}
                          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(253,216,53,0.3)'; const f = e.dataTransfer.files[0]; if(f) handleFileUpload(apt.id, f); }}
                        >
                          <span style={{ fontSize: '28px' }}>📤</span>
                          <p style={styles.uploadZoneText}>Partagez un document avec l'élève</p>
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                            style={{ display: 'none' }} id={`file-input-t-${apt.id}`}
                            onChange={e => handleFileUpload(apt.id, e.target.files[0])}
                          />
                          <label htmlFor={`file-input-t-${apt.id}`} style={styles.uploadBtn}>
                            {uploadingFile[apt.id] ? '⏳ Envoi...' : '📁 Choisir un fichier'}
                          </label>
                          <input type="text" placeholder="Description (ex: Exercices chapitre 3)"
                            value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                            style={styles.uploadDescInput}
                          />
                          <p style={styles.uploadHint}>PDF • Images • Word • Excel — max 20 Mo</p>
                        </div>
                        {filesLoading[apt.id] && <p style={{ textAlign:'center', color:'#94a3b8', padding:'1rem' }}>⏳ Chargement...</p>}
                        {!filesLoading[apt.id] && courseFiles[apt.id]?.length === 0 && (
                          <p style={{ textAlign:'center', color:'#64748b', padding:'1rem', fontSize:'13px' }}>Aucun document partagé pour ce cours.</p>
                        )}
                        {(courseFiles[apt.id] || []).map(cf => {
                          const typeMap = { pdf:{icon:'📄',color:'#ef4444'}, image:{icon:'🖼️',color:'#3b82f6'}, word:{icon:'📝',color:'#2563eb'}, excel:{icon:'📊',color:'#16a34a'}, other:{icon:'📎',color:'#94a3b8'} };
                          const fi = typeMap[cf.file_type] || typeMap.other;
                          const uploaderLabel = cf.uploaded_by === 'parent' ? `👤 ${cf.uploader_name || 'Élève/Parent'}` : `👨‍🏫 ${cf.uploader_name || 'Enseignant'}`;
                          return (
                            <div key={cf.id} style={styles.fileItem}>
                              <span style={{ fontSize: '22px', flexShrink: 0 }}>{fi.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ ...styles.fileName, color: fi.color }}>{cf.original_name}</p>
                                <p style={styles.fileMeta}>{formatFileSize(cf.file_size)} • {uploaderLabel} • {new Date(cf.uploaded_at).toLocaleDateString('fr-FR')}</p>
                                {cf.description && <p style={styles.fileDesc}>{cf.description}</p>}
                              </div>
                              <div style={styles.fileActions}>
                                <a href={`${API_URL}/files/${cf.id}/download/`} download={cf.original_name} style={styles.downloadBtn} title="Télécharger">⬇️</a>
                                <button onClick={() => handleDeleteFile(apt.id, cf.id)} style={styles.deleteFileBtn} title="Supprimer">🗑️</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ONGLET COURS TERMINÉS ── */}
        {activeTab === 'completed' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>✅ Cours terminés</h3>
            {completedCourses.length === 0 && <div style={styles.emptyState}><span style={styles.emptyIcon}>📭</span><p>Aucun cours terminé.</p></div>}
            {completedCourses.map((course) => (
              <div key={course.id} style={styles.courseCard}>
                <div style={styles.courseHeader}>
                  <div><h4 style={styles.courseSubject}>📚 {course.subject}</h4><p style={styles.courseStudent}>👦 {course.student}</p><p style={styles.courseParent}>👤 {course.parent}</p></div>
                  <div style={styles.amountBadge}>💰 {course.amount.toFixed(2)}€</div>
                </div>
                <div style={styles.courseDetails}>
                  <span style={styles.courseDetail}>📅 {new Date(course.date).toLocaleDateString('fr-FR')}</span>
                  <span style={styles.courseDetail}>🕐 {course.time}</span>
                  <span style={styles.courseDetail}>⏱️ {course.duration}</span>
                </div>
                <div style={styles.validationSection}>
                  <p style={styles.validationTitle}>📋 Statut de validation :</p>
                  <div style={styles.validationStatus}>
                    <div style={styles.validationItem}><span style={course.validated.parent ? styles.validated : styles.notValidated}>{course.validated.parent ? '✓' : '○'}</span><span style={styles.validationLabel}>Parent {course.validated.parent ? 'a validé' : "n'a pas encore validé"}</span></div>
                    <div style={styles.validationItem}><span style={course.validated.teacher ? styles.validated : styles.notValidated}>{course.validated.teacher ? '✓' : '○'}</span><span style={styles.validationLabel}>Vous {course.validated.teacher ? 'avez validé' : "n'avez pas encore validé"}</span></div>
                  </div>
                  {course.validated.parent && course.validated.teacher && <div style={styles.successMessage}>🎉 Cours entièrement validé — sera facturé !</div>}
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
                  <button onClick={() => handleOpenRemarkModal(course)} style={styles.remarkButton}>{course.teacherRemarks ? '✏️ Modifier les remarques' : '📝 Ajouter des remarques'}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ONGLET MESSAGES ── */}
        {activeTab === 'messages' && (
          <div style={styles.contentSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={styles.sectionTitle}>💬 Messages des élèves & parents</h3>
              <button onClick={fetchMessages} style={styles.manageButton}>🔄 Actualiser</button>
            </div>

            {messagesLoading && <div style={styles.loadingContainer}><div style={styles.spinner} /><p style={styles.loadingText}>Chargement...</p></div>}

            {!messagesLoading && messages.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>💬</span>
                <p>Aucun message pour l'instant.</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} style={{ ...styles.messageCard, ...(!msg.is_read && msg.sender_type === 'parent' ? styles.messageCardUnread : {}) }}>
                <div style={styles.messageHeader}>
                  <div style={styles.messageAuthor}>
                    <span style={styles.messageAvatar}>{msg.sender_type === 'teacher' ? '👨‍🏫' : '👤'}</span>
                    <div>
                      <p style={styles.messageSender}>{msg.sender_name}</p>
                      <p style={styles.messageTime}>
                        {new Date(msg.created_at).toLocaleDateString('fr-FR')} à {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {!msg.is_read && msg.sender_type === 'parent' && <span style={styles.unreadDot} />}
                </div>
                <p style={styles.messageText}>{msg.content}</p>

                {/* Réponses existantes */}
                {msg.replies && msg.replies.length > 0 && (
                  <div style={styles.repliesContainer}>
                    {msg.replies.map(reply => (
                      <div key={reply.id} style={styles.replyCard}>
                        <div style={styles.messageAuthor}>
                          <span style={styles.messageAvatar}>{reply.sender_type === 'teacher' ? '👨‍🏫' : '👤'}</span>
                          <div>
                            <p style={{ ...styles.messageSender, fontSize: '13px' }}>{reply.sender_name}</p>
                            <p style={styles.messageTime}>{new Date(reply.created_at).toLocaleDateString('fr-FR')} à {new Date(reply.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <p style={{ ...styles.messageText, fontSize: '13px' }}>{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* FIX 1 : formulaire de réponse isolé par message grâce à replyContents[msg.id] */}
                {replyingTo === msg.id ? (
                  <div style={{ marginTop: '12px' }}>
                    <textarea
                      autoFocus
                      placeholder="Votre réponse..."
                      value={replyContents[msg.id] || ''}
                      onChange={e => setReplyContents(prev => ({ ...prev, [msg.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendReply(msg.id);
                        if (e.key === 'Escape') setReplyingTo(null);
                      }}
                      style={{ width: '100%', minHeight: '70px', padding: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '4px' }}
                      rows={2}
                    />
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px', textAlign: 'right' }}>Ctrl+Entrée pour envoyer • Échap pour annuler</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyContents(prev => ({ ...prev, [msg.id]: '' })); }}
                        style={styles.cancelModalBtn}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleSendReply(msg.id)}
                        disabled={sendingReply[msg.id] || !(replyContents[msg.id] || '').trim()}
                        style={{
                          ...styles.confirmBtn,
                          opacity: (sendingReply[msg.id] || !(replyContents[msg.id] || '').trim()) ? 0.5 : 1,
                          cursor:  (sendingReply[msg.id] || !(replyContents[msg.id] || '').trim()) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {sendingReply[msg.id] ? '⏳ Envoi...' : '📤 Répondre'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(msg.id)}
                    style={styles.replyButton}
                  >
                    ↩️ Répondre
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── ONGLET REVENUS ── */}
        {activeTab === 'earnings' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>💰 Mes revenus</h3>

            {/* Résumé global */}
            <div style={styles.earningsSummary}>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Total gagné</span><span style={styles.summaryValue}>{totalEarnings.toFixed(2)}€</span></div>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Heures enseignées</span><span style={styles.summaryValue}>{totalHours.toFixed(1)}h</span></div>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Taux moyen</span><span style={styles.summaryValue}>{avgRate}€/h</span></div>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Cours terminés</span><span style={styles.summaryValue}>{completedCourses.length}</span></div>
            </div>

            {/* Aucun cours */}
            {earnings.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>💰</span>
                <p>Aucun cours terminé pour l'instant.<br />Vos revenus apparaîtront ici automatiquement.</p>
              </div>
            )}

            {/* Par mois */}
            {earnings.length > 0 && (
              <>
                <h4 style={{ color: '#94a3b8', fontSize: '1rem', margin: '0 0 1rem' }}>Détail par mois</h4>
                <div style={styles.earningsList}>
                  {earnings.map((e, i) => (
                    <div key={i} style={styles.earningCard}>
                      <div style={styles.earningHeader}>
                        <h4 style={styles.earningMonth}>📅 {e.month}</h4>
                        <span style={styles.earningAmount}>{e.amount.toFixed(2)}€</span>
                      </div>
                      <div style={styles.earningDetails}>
                        <span>⏱️ {e.hours.toFixed(1)} heures</span>
                        <span>{e.hours > 0 ? (e.amount / e.hours).toFixed(2) : '0.00'}€/h</span>
                      </div>
                      <div style={styles.progressBarTrack}>
                        <div style={{ ...styles.progressBarFill, width: `${(e.hours / maxHours) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Détail des cours */}
            {completedCourses.length > 0 && (
              <>
                <h4 style={{ color: '#94a3b8', fontSize: '1rem', margin: '2rem 0 1rem' }}>Détail des cours</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {completedCourses.map(course => (
                    <div key={course.id} style={{ ...styles.earningCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <p style={{ color: '#FDD835', fontWeight: '600', margin: '0 0 3px', fontSize: '0.95rem' }}>{course.subject}</p>
                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem' }}>
                          👦 {course.student} • 📅 {new Date(course.date).toLocaleDateString('fr-FR')} • ⏱️ {course.duration}
                        </p>
                      </div>
                      <span style={{ ...styles.amountBadge, flexShrink: 0 }}>💰 {course.amount.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* MODAL VISIO */}
      {showVideoConference && selectedCourse && (
        <div style={styles.videoModal}>
          <div style={styles.videoContainer}>
            <div style={styles.videoHeader}>
              <div style={styles.videoHeaderInfo}>
                <h3 style={styles.videoTitle}>{selectedCourse.subject} — {selectedCourse.studentName}</h3>
                <p style={styles.videoSubtitle}>Parent : {selectedCourse.parentName} | Durée : {selectedCourse.duration}h</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={() => openWhiteboardTab(selectedCourse)} style={styles.wbToggleBtn}>🖊️ Tableau blanc ↗</button>
                <button onClick={() => setShowVideoConference(false)} style={styles.videoCloseBtn}>✕</button>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative', background: '#0a0a0a', overflow: 'hidden' }}>
              <div ref={zegoContainerRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPORT */}
      {showRescheduleModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowRescheduleModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>📆 Reporter le cours</h3><button onClick={() => setShowRescheduleModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              <div style={styles.currentInfo}><p style={styles.currentLabel}>Date actuelle :</p><p style={styles.currentValue}>{selectedCourse.preferredDate && new Date(selectedCourse.preferredDate).toLocaleDateString('fr-FR')} à {selectedCourse.preferredTime?.slice(0, 5)}</p></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Nouvelle date</label><input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Nouvelle heure</label><input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Raison (optionnel)</label><textarea value={rescheduleData.reason} onChange={e => setRescheduleData({ ...rescheduleData, reason: e.target.value })} style={styles.formTextarea} /></div>
              <div style={styles.warningBox}><span>⚠️</span><p style={styles.warningText}>Le parent sera notifié et devra confirmer le nouveau créneau.</p></div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowRescheduleModal(false)} style={styles.cancelModalBtn}>Annuler</button><button onClick={confirmReschedule} style={styles.confirmBtn}>Confirmer le report</button></div>
          </div>
        </div>
      )}

      {/* MODAL ANNULATION */}
      {showCancelModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>❌ Annuler le cours</h3><button onClick={() => setShowCancelModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              <div style={styles.cancelInfo}><h4 style={styles.cancelCourseTitle}>{selectedCourse.subject}</h4><p style={styles.cancelCourseDetails}>{selectedCourse.studentName} — {selectedCourse.parentName}<br />{selectedCourse.preferredDate && new Date(selectedCourse.preferredDate).toLocaleDateString('fr-FR')} à {selectedCourse.preferredTime?.slice(0, 5)}</p></div>
              <div style={styles.dangerBox}><span style={{ fontSize: '24px' }}>⚠️</span><div><p style={styles.dangerTitle}>Attention !</p><p style={styles.dangerText}>Cette action est irréversible. Le parent sera immédiatement notifié.</p></div></div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowCancelModal(false)} style={styles.cancelModalBtn}>Retour</button><button onClick={confirmCancel} style={styles.dangerBtn}>Confirmer l'annulation</button></div>
          </div>
        </div>
      )}

      {/* MODAL REMARQUES */}
      {showRemarkModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowRemarkModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>📝 Remarques sur le cours</h3><button onClick={() => setShowRemarkModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              {[{ key: 'studentBehavior', label: "Comportement de l'élève", ph: "Comment s'est comporté l'élève ?" }, { key: 'progress', label: 'Progression', ph: "Quels progrès ?" }, { key: 'suggestions', label: 'Suggestions pour la suite', ph: 'Recommandations...' }].map(({ key, label, ph }) => (
                <div key={key} style={styles.formGroup}><label style={styles.formLabel}>{label}</label><textarea style={styles.formTextarea} value={remarkData[key]} onChange={e => setRemarkData({ ...remarkData, [key]: e.target.value })} placeholder={ph} rows={3} /></div>
              ))}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Évaluation (1-5 étoiles)</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[1,2,3,4,5].map(star => <button key={star} onClick={() => setRemarkData({ ...remarkData, rating: star })} style={{ ...styles.starButton, color: star <= remarkData.rating ? '#FDD835' : '#475569' }}>⭐</button>)}
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowRemarkModal(false)} style={styles.cancelModalBtn}>Annuler</button><button onClick={handleSaveRemarks} style={styles.confirmBtn}>💾 Enregistrer</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  container:          { minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', paddingBottom: '40px' },
  bgDecor1:           { position: 'fixed', top: '-120px', right: '-120px', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,216,53,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  bgDecor2:           { position: 'fixed', bottom: '-160px', left: '-160px', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,58,147,0.2) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  header:             { background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(253,216,53,0.2)', padding: '1.5rem 2rem', position: 'sticky', top: 0, zIndex: 100 },
  headerContent:      { maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
  logoSection:        { display: 'flex', alignItems: 'center', gap: '1rem' },
  logoCircle:         { width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #FDD835, #8B3A93)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff', boxShadow: '0 4px 15px rgba(253,216,53,0.4)' },
  brandName:          { fontSize: '1.5rem', fontWeight: 'bold', color: '#FDD835', margin: 0 },
  brandTagline:       { fontSize: '0.9rem', color: '#94a3b8', margin: 0 },
  headerActions:      { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  refreshButton:      { padding: '0.6rem 1.2rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  homeButton:         { padding: '0.6rem 1.2rem', background: 'rgba(253,216,53,0.15)', color: '#FDD835', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  logoutButton:       { padding: '0.6rem 1.2rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  welcomeBanner:      { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' },
  welcomeContent:     { background: 'linear-gradient(135deg, rgba(253,216,53,0.12), rgba(139,58,147,0.1))', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '16px', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  welcomeTitle:       { fontSize: '2rem', fontWeight: 'bold', color: '#FDD835', margin: '0 0 0.5rem 0' },
  welcomeSubtitle:    { fontSize: '1rem', color: '#cbd5e1', margin: 0 },
  bannerDecor:        { fontSize: '4rem' },
  errorAlertContainer:{ maxWidth: '1400px', margin: '1rem auto 0', padding: '0 2rem' },
  errorAlert:         { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#f87171' },
  closeErrorBtn:      { marginLeft: 'auto', background: 'transparent', border: 'none', color: '#f87171', fontSize: '1.5rem', cursor: 'pointer' },
  statsSection:       { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' },
  statsGrid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' },
  statCard:           { background: 'rgba(15,23,42,0.8)', borderRadius: '14px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' },
  statIcon:           { fontSize: '2rem' },
  statLabel:          { color: '#94a3b8', fontSize: '0.9rem', margin: 0 },
  statValue:          { color: '#FDD835', fontSize: '1.8rem', fontWeight: 'bold', margin: 0 },
  tabsSection:        { maxWidth: '1400px', margin: '2rem auto 1rem', padding: '0 2rem' },
  tabsContainer:      { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  tab:                { flex: 1, minWidth: '180px', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.7)', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.95rem' },
  tabActive:          { background: 'linear-gradient(135deg, #FDD835, #F9A825)', color: '#0f172a', fontWeight: 'bold' },
  tabIcon:            { fontSize: '1.2rem' },
  tabBadge:           { background: 'rgba(0,0,0,0.25)', color: '#FDD835', borderRadius: '999px', padding: '0.2rem 0.6rem', fontSize: '0.8rem' },
  tabBadgeDanger:     { background: '#ef4444', color: '#fff' },
  mainContent:        { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' },
  contentSection:     { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  sectionTitle:       { color: '#FDD835', fontSize: '1.6rem', marginBottom: '0.5rem' },
  courseCard:         { background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 15px 30px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  courseHeader:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  badgeGroup:         { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' },
  courseSubject:      { color: '#FDD835', margin: 0 },
  courseStudent:      { color: '#cbd5e1', margin: '0.2rem 0' },
  courseParent:       { color: '#94a3b8', margin: 0 },
  badge:              { padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600' },
  courseDetails:      { display: 'flex', flexWrap: 'wrap', gap: '1rem', color: '#cbd5e1' },
  courseDetail:       { fontSize: '0.95rem' },
  infoSection:        { background: 'rgba(30,41,59,0.6)', borderRadius: '10px', padding: '1rem' },
  infoLabel:          { color: '#FDD835', fontSize: '0.85rem', marginBottom: '0.2rem' },
  infoValue:          { color: '#cbd5e1', marginBottom: '0.5rem' },
  videoButton:        { padding: '0.8rem 1.2rem', borderRadius: '12px', border: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  videoButtonActive:  { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 8px 30px rgba(34,197,94,0.4)' },
  actionButtons:      { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  completeButton:     { background: '#8B3A93', color: '#fff', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '10px', cursor: 'pointer' },
  manageButton:       { padding: '0.7rem 1.2rem', background: 'rgba(253,216,53,0.1)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#FDD835', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  cancelActionButton: { padding: '0.7rem 1.2rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
  remarkButton:       { padding: '0.7rem 1.4rem', background: 'linear-gradient(135deg, rgba(139,58,147,0.3), rgba(147,51,234,0.3))', border: '1px solid rgba(147,51,234,0.4)', borderRadius: '12px', color: '#a78bfa', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
  amountBadge:        { padding: '0.4rem 0.9rem', background: 'rgba(253,216,53,0.15)', color: '#FDD835', borderRadius: '999px', fontWeight: '600', fontSize: '0.9rem' },
  validationSection:  { background: 'rgba(30,41,59,0.6)', borderRadius: '10px', padding: '1rem' },
  validationTitle:    { color: '#FDD835', fontSize: '0.9rem', marginBottom: '0.5rem' },
  validationStatus:   { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  validationItem:     { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  validationLabel:    { color: '#cbd5e1', fontSize: '0.9rem' },
  validated:          { color: '#22c55e', fontWeight: 'bold', fontSize: '1.1rem' },
  notValidated:       { color: '#94a3b8', fontSize: '1.1rem' },
  successMessage:     { marginTop: '0.5rem', padding: '0.6rem', background: 'rgba(34,197,94,0.15)', borderRadius: '8px', color: '#22c55e', fontSize: '0.9rem', textAlign: 'center' },
  remarksDisplay:     { background: 'rgba(30,41,59,0.6)', borderRadius: '10px', padding: '1rem' },
  remarksTitle:       { color: '#FDD835', fontSize: '0.9rem', marginBottom: '0.5rem' },
  remarkItem:         { color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '0.3rem' },
  loadingContainer:   { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '1rem' },
  spinner:            { width: '40px', height: '40px', border: '4px solid rgba(253,216,53,0.2)', borderTop: '4px solid #FDD835', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText:        { color: '#94a3b8' },
  emptyState:         { textAlign: 'center', padding: '3rem', color: '#94a3b8' },
  emptyIcon:          { fontSize: '3rem', display: 'block', marginBottom: '1rem' },
  // Messages
  messageCard:        { background: 'rgba(15,23,42,0.85)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(148,163,184,0.15)' },
  messageCardUnread:  { borderColor: 'rgba(253,216,53,0.4)', background: 'rgba(253,216,53,0.04)' },
  messageHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  messageAuthor:      { display: 'flex', alignItems: 'center', gap: '12px' },
  messageAvatar:      { fontSize: '2rem' },
  messageSender:      { fontSize: '1rem', fontWeight: '600', color: '#FDD835', margin: '0 0 3px 0' },
  messageTime:        { fontSize: '0.8rem', color: '#94a3b8', margin: 0 },
  unreadDot:          { width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 },
  messageText:        { fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '12px' },
  replyButton:        { padding: '0.6rem 1.2rem', background: 'rgba(253,216,53,0.1)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#FDD835', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
  repliesContainer:   { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' },
  replyCard:          { background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 14px', borderLeft: '3px solid rgba(253,216,53,0.3)' },
  // Fichiers
  filesSection:       { marginTop: '14px', borderTop: '1px solid rgba(148,163,184,0.1)', paddingTop: '14px' },
  filesToggleBtn:     { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(253,216,53,0.07)', border: '1px solid rgba(253,216,53,0.2)', borderRadius: '10px', color: '#FDD835', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  filesCount:         { background: 'rgba(253,216,53,0.15)', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  filesPanel:         { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
  uploadZone:         { border: '2px dashed rgba(253,216,53,0.3)', borderRadius: '12px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(253,216,53,0.04)', transition: 'border-color 0.2s' },
  uploadZoneText:     { color: '#94a3b8', fontSize: '13px', margin: 0 },
  uploadBtn:          { display: 'inline-block', padding: '8px 20px', background: 'rgba(253,216,53,0.15)', border: '1px solid rgba(253,216,53,0.4)', borderRadius: '8px', color: '#FDD835', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  uploadDescInput:    { width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box', marginTop: '4px' },
  uploadHint:         { fontSize: '11px', color: '#64748b', margin: 0 },
  fileItem:           { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' },
  fileName:           { fontSize: '13px', fontWeight: '600', margin: '0 0 3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileMeta:           { fontSize: '11px', color: '#64748b', margin: 0 },
  fileDesc:           { fontSize: '11px', color: '#94a3b8', margin: '3px 0 0 0', fontStyle: 'italic' },
  fileActions:        { display: 'flex', gap: '6px', flexShrink: 0 },
  downloadBtn:        { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', fontSize: '14px', textDecoration: 'none', cursor: 'pointer' },
  deleteFileBtn:      { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
  // Revenus
  earningsSummary:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  summaryCard:        { background: 'rgba(15,23,42,0.8)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', border: '1px solid rgba(253,216,53,0.15)' },
  summaryLabel:       { color: '#94a3b8', fontSize: '0.85rem' },
  summaryValue:       { color: '#FDD835', fontSize: '1.6rem', fontWeight: 'bold' },
  earningsList:       { display: 'flex', flexDirection: 'column', gap: '1rem' },
  earningCard:        { background: 'rgba(15,23,42,0.8)', borderRadius: '12px', padding: '1.2rem', border: '1px solid rgba(148,163,184,0.15)' },
  earningHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
  earningMonth:       { color: '#cbd5e1', margin: 0 },
  earningAmount:      { color: '#FDD835', fontWeight: 'bold', fontSize: '1.2rem' },
  earningDetails:     { display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.6rem' },
  progressBarTrack:   { background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '8px', overflow: 'hidden' },
  progressBarFill:    { height: '100%', background: 'linear-gradient(90deg, #FDD835, #F9A825)', borderRadius: '999px' },
  // Modals
  videoModal:         { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' },
  videoContainer:     { background: '#0f172a', borderRadius: '20px', width: '100%', maxWidth: '1400px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(253,216,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' },
  videoHeader:        { padding: '16px 24px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  videoHeaderInfo:    { flex: 1 },
  videoTitle:         { fontSize: '18px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 4px 0' },
  videoSubtitle:      { fontSize: '13px', color: '#9ca3af', margin: 0 },
  videoCloseBtn:      { width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  wbToggleBtn:        { padding: '8px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#d1d5db', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  modalOverlay:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent:       { background: 'rgba(15,23,42,0.98)', backdropFilter: 'blur(20px)', borderRadius: '24px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(253,216,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  modalHeader:        { padding: '25px 30px', borderBottom: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139,58,147,0.15)' },
  modalTitle:         { fontSize: '22px', fontWeight: '700', color: '#FDD835', margin: 0 },
  modalClose:         { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody:          { padding: '30px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  modalFooter:        { padding: '20px 30px', borderTop: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  formGroup:          { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  formLabel:          { fontSize: '14px', fontWeight: '600', color: '#FDD835' },
  formInput:          { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  formTextarea:       { width: '100%', minHeight: '80px', padding: '12px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  starButton:         { background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
  currentInfo:        { padding: '15px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.3)' },
  currentLabel:       { fontSize: '13px', color: '#60a5fa', marginBottom: '6px', fontWeight: '600' },
  currentValue:       { fontSize: '16px', color: '#e5e7eb', margin: 0 },
  warningBox:         { padding: '15px', background: 'rgba(251,191,36,0.1)', borderRadius: '12px', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'flex-start', gap: '12px' },
  warningText:        { fontSize: '13px', color: '#fbbf24', margin: 0, lineHeight: '1.6' },
  dangerBox:          { padding: '15px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '10px' },
  dangerTitle:        { fontSize: '15px', fontWeight: 'bold', color: '#fca5a5', marginBottom: '8px' },
  dangerText:         { fontSize: '13px', color: '#fca5a5', margin: 0, lineHeight: '1.6' },
  cancelInfo:         { padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center' },
  cancelCourseTitle:  { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', marginBottom: '10px' },
  cancelCourseDetails:{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', margin: 0 },
  cancelModalBtn:     { padding: '12px 24px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '12px', color: '#FDD835', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  confirmBtn:         { padding: '12px 24px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#0f172a', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  dangerBtn:          { padding: '12px 24px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
};
