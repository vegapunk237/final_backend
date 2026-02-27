import { useState, useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const API_URL = 'https://dollar5665.pythonanywhere.com/api';


// ─── PARENT DASHBOARD ─────────────────────────────────────────────────────────
const ParentDashboard = ({ navigate, user, onLogout }) => {
  const [activeTab, setActiveTab]               = useState('planned');
  const [selectedCourse, setSelectedCourse]     = useState(null);

  const [showEvaluation, setShowEvaluation]           = useState(false);
  const [showVideoConference, setShowVideoConference] = useState(false);
  const [showModifyModal, setShowModifyModal]         = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal]         = useState(false);


  const [plannedCourses, setPlannedCourses]   = useState([]);
  const [loadingCourses, setLoadingCourses]   = useState(true);
  const [modifyData, setModifyData]           = useState({ subject: '', childName: '', notes: '' });
  const [rescheduleData, setRescheduleData]   = useState({ date: '', time: '', reason: '' });
  const zegoContainerRef = useRef(null);

  // ── Fichiers de cours ─────────────────────────────────────────────────────
  const [courseFiles, setCourseFiles]           = useState({});   // { [courseId]: [...files] }
  const [filesLoading, setFilesLoading]         = useState({});   // { [courseId]: bool }
  const [uploadingFile, setUploadingFile]       = useState({});   // { [courseId]: bool }
  const [uploadDesc, setUploadDesc]             = useState('');
  const [expandedFiles, setExpandedFiles]       = useState({});   // { [courseId]: bool }
  const fileInputRef = useRef(null);

  const ALLOWED_TYPES = {
    'application/pdf':                                                  { icon: '📄', label: 'PDF',   color: '#ef4444' },
    'image/jpeg':                                                       { icon: '🖼️', label: 'Image', color: '#3b82f6' },
    'image/png':                                                        { icon: '🖼️', label: 'Image', color: '#3b82f6' },
    'image/gif':                                                        { icon: '🖼️', label: 'Image', color: '#3b82f6' },
    'image/webp':                                                       { icon: '🖼️', label: 'Image', color: '#3b82f6' },
    'application/msword':                                               { icon: '📝', label: 'Word',  color: '#2563eb' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':{ icon: '📝', label: 'Word',  color: '#2563eb' },
    'application/vnd.ms-excel':                                         { icon: '📊', label: 'Excel', color: '#16a34a' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':{ icon: '📊', label: 'Excel', color: '#16a34a' },
  };

  const fetchCourseFiles = async (courseId) => {
    setFilesLoading(prev => ({ ...prev, [courseId]: true }));
    try {
      const res  = await fetch(`${API_URL}/appointments/${courseId}/files/`);
      const data = await res.json();
      if (data.success) setCourseFiles(prev => ({ ...prev, [courseId]: data.data }));
    } catch(e) { console.error('Erreur chargement fichiers:', e); }
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
    if (!ALLOWED_TYPES[file.type]) {
      alert('❌ Type de fichier non autorisé.\nFormats acceptés : PDF, images (JPG/PNG/GIF/WEBP), Word (.doc/.docx), Excel (.xls/.xlsx)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('❌ Fichier trop lourd (max 20 MB)');
      return;
    }
    setUploadingFile(prev => ({ ...prev, [courseId]: true }));
    try {
      const formData = new FormData();
      formData.append('file',          file);
      formData.append('uploaded_by',   'parent');
      formData.append('uploader_name', user?.name || 'Parent');
      formData.append('description',   uploadDesc);
      const res  = await fetch(`${API_URL}/appointments/${courseId}/files/`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setCourseFiles(prev => ({ ...prev, [courseId]: [data.data, ...(prev[courseId] || [])] }));
        setUploadDesc('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else { alert('❌ Erreur : ' + data.message); }
    } catch(e) { alert('❌ Erreur de connexion'); }
    finally { setUploadingFile(prev => ({ ...prev, [courseId]: false })); }
  };

  const handleDeleteFile = async (courseId, fileId) => {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    try {
      const res  = await fetch(`${API_URL}/files/${fileId}/`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setCourseFiles(prev => ({ ...prev, [courseId]: prev[courseId].filter(f => f.id !== fileId) }));
      else alert('❌ Erreur : ' + data.message);
    } catch(e) { alert('❌ Erreur de connexion'); }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024)        return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  const getFileInfo = (mimeOrType) => ALLOWED_TYPES[mimeOrType] || { icon: '📎', label: 'Fichier', color: '#9ca3af' };

  // ─── ZegoCloud ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showVideoConference || !selectedCourse || !zegoContainerRef.current) return;
    const appID        = parseInt(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
    const roomID       = `kh_course_${selectedCourse.id}`;
    const userID       = `parent_${user?.id || Date.now()}`;
    const userName     = user?.name || 'Parent';
    const kitToken     = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID, userID, userName);
    const zp           = ZegoUIKitPrebuilt.create(kitToken);
    zp.joinRoom({
      container:               zegoContainerRef.current,
      scenario:                { mode: ZegoUIKitPrebuilt.GroupCall },
      showScreenSharingButton: true,
      showTextChat:            true,
      showUserList:            true,
      onLeaveRoom:             () => { setShowVideoConference(false); },
    });
    return () => { zp.destroy(); };
  }, [showVideoConference, selectedCourse]);

  // ─── Chargement RDV ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const fetchPlannedCourses = async () => {
      setLoadingCourses(true);
      try {
        const response = await fetch(`${API_URL}/appointments/`);
        const data     = await response.json();
        if (data.success) {
          const mine = (data.data || []).filter(a =>
            String(a.parentId) === String(user.id) &&
            (a.status === 'assigned' || a.status === 'confirmed') &&
            a.assignedTeacher
          );
          setPlannedCourses(mine.map(a => ({
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
          })));
        }
      } catch (err) {
        console.error('❌ Erreur:', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchPlannedCourses();
  }, [user]);

  const [completedCourses] = useState([
    { id: 4, subject: 'Mathématiques', teacher: 'Prof. Jean Martin', teacherAvatar: '👨‍🏫', date: '2025-12-01', time: '14:00', duration: '1h30', childName: 'Sophie', evaluation: { theme: 'LES DROITES PERPENDICULAIRES (maths) et les circuits électriques en physique', themeStatus: 'acquired', summary: "L'étudiant utilise avec détermination son énergie et ses ressources personnelles dans le but d'accroître son niveau.", criteria: [{ name: 'Motivation', value: 50, color: '#ef4444' }, { name: 'Compréhension', value: 50, color: '#3b82f6' }, { name: 'Maîtrise', value: 50, color: '#f59e0b' }, { name: 'Autonomie', value: 50, color: '#8b5cf6' }] } },
    { id: 5, subject: 'Français', teacher: 'Prof. Sophie Dubois', teacherAvatar: '👩‍🏫', date: '2025-11-28', time: '16:00', duration: '1h', childName: 'Marc', evaluation: { theme: "L'analyse de texte et la rédaction", themeStatus: 'in-progress', summary: "L'étudiant progresse bien dans la compréhension des textes littéraires.", criteria: [{ name: 'Motivation', value: 70, color: '#ef4444' }, { name: 'Compréhension', value: 65, color: '#3b82f6' }, { name: 'Maîtrise', value: 60, color: '#f59e0b' }, { name: 'Autonomie', value: 55, color: '#8b5cf6' }] } }
  ]);

  const [messages] = useState([
    { id: 1, sender: 'Prof. Jean Martin',   avatar: '👨‍🏫', message: "Bonjour, Sophie a fait d'excellents progrès cette semaine !", time: '14:30', date: '2025-12-10', unread: true },
    { id: 2, sender: 'Prof. Sophie Dubois', avatar: '👩‍🏫', message: 'Le prochain cours sera sur la poésie romantique.',              time: '10:15', date: '2025-12-09', unread: false }
  ]);

  const handleJoinVideo        = (course) => { setSelectedCourse(course); setShowVideoConference(true); };
  const handleModifyCourse     = (course) => { setSelectedCourse(course); setModifyData({ subject: course.subject, childName: course.childName, notes: '' }); setShowModifyModal(true); };
  const handleRescheduleCourse = (course) => { setSelectedCourse(course); setRescheduleData({ date: course.date, time: course.time, reason: '' }); setShowRescheduleModal(true); };
  const handleCancelCourse     = (course) => { setSelectedCourse(course); setShowCancelModal(true); };
  const confirmModify          = () => setShowModifyModal(false);
  const confirmReschedule      = () => setShowRescheduleModal(false);
  const confirmCancel          = () => { setPlannedCourses(prev => prev.filter(c => c.id !== selectedCourse.id)); setShowCancelModal(false); };

  const getThemeStatusLabel = (s) => ({ 'not-acquired': 'Non acquise', 'in-progress': "En cours d'acquisition", 'acquired': 'Acquis' }[s] || s);
  const getThemeStatusStyle = (s) => ({ 'not-acquired': { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' }, 'in-progress': { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' }, 'acquired': { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' } }[s] || { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' });


  // ─── Ouvrir tableau blanc dans un nouvel onglet ───────────────────────────
  const openWhiteboardTab = (course) => {
    const name = encodeURIComponent(`${course.subject} — ${course.teacher || course.studentName || ''}`);
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
            <div><h1 style={styles.brandName}>KH PERFECTION</h1><p style={styles.brandTagline}>Espace Parent</p></div>
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
          <button onClick={() => navigate('appointment')} style={styles.primaryCta}>➕ Réserver un cours</button>
        </div>
      </section>

      {/* STATS */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          {[{ icon: '📅', label: 'Cours planifiés', value: plannedCourses.length }, { icon: '✅', label: 'Cours terminés', value: completedCourses.length }, { icon: '💬', label: 'Messages', value: messages.filter(m => m.unread).length }, { icon: '👨‍🏫', label: 'Enseignants', value: 4 }].map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={styles.statIcon}>{s.icon}</div>
              <div><p style={styles.statLabel}>{s.label}</p><p style={styles.statValue}>{s.value}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* ONGLETS */}
      <section style={styles.tabsContainer}>
        <div style={styles.tabs}>
          {[{ key: 'planned', icon: '📅', label: 'Cours planifiés', badge: plannedCourses.length }, { key: 'completed', icon: '✅', label: 'Cours terminés', badge: completedCourses.length }, { key: 'chat', icon: '💬', label: 'Messages', notif: messages.filter(m => m.unread).length }].map(({ key, icon, label, badge, notif }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ ...styles.tab, ...(activeTab === key ? styles.tabActive : {}) }}>
              <span>{icon}</span><span>{label}</span>
              {badge !== undefined && <span style={styles.tabBadge}>{badge}</span>}
              {notif > 0 && <span style={styles.tabNotification}>{notif}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* CONTENU */}
      <section style={styles.mainContent}>

        {activeTab === 'planned' && (
          <div>
            <h3 style={styles.sectionTitle}>📅 Prochains cours</h3>
            {loadingCourses && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>⏳ Chargement...</p>}
            {!loadingCourses && plannedCourses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
                <p>Aucun cours planifié avec un enseignant assigné.</p>
                <button onClick={() => navigate('appointment')} style={{ ...styles.primaryCta, margin: '1rem auto' }}>➕ Réserver un cours</button>
              </div>
            )}
            <div style={styles.coursesList}>
              {plannedCourses.map((course) => (
                <div key={course.id} style={styles.courseCard}>
                  <div style={styles.courseCardHeader}>
                    <div style={styles.teacherInfo}>
                      <div style={styles.teacherAvatar}>{course.teacherAvatar}</div>
                      <div><h4 style={styles.courseSubject}>{course.subject}</h4><p style={styles.courseTeacher}>👨‍🏫 {course.teacher}</p></div>
                    </div>
                    <span style={styles.liveBadge}><span style={styles.livePulse} />Disponible</span>
                  </div>
                  <div style={styles.courseDetails}>
                    <div style={styles.detailItem}><span>👶</span><span style={styles.detailText}>{course.childName}</span></div>
                    <div style={styles.detailItem}><span>🎓</span><span style={styles.detailText}>{course.level}</span></div>
                    <div style={styles.detailItem}><span>📅</span><span style={styles.detailText}>{new Date(course.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
                    <div style={styles.detailItem}><span>🕐</span><span style={styles.detailText}>{course.time} — Durée : {course.duration}</span></div>
                    <div style={styles.detailItem}><span>📍</span><span style={styles.detailText}>{course.location === 'online' ? '💻 En ligne' : '🏠 À domicile'}</span></div>
                  </div>
                  <div style={styles.courseActions}>
                    <button onClick={() => handleJoinVideo(course)} style={{ ...styles.videoButton, ...styles.videoButtonActive }}>📹 Rejoindre la visio</button>
                    <button onClick={() => navigate('chat', { teacherId: course.teacher })} style={styles.chatButton}>💬 Contacter</button>
                  </div>
                  <div style={styles.courseManagement}>
                    <button onClick={() => handleModifyCourse(course)}     style={styles.manageButton}>✏️ Modifier</button>
                    <button onClick={() => handleRescheduleCourse(course)} style={styles.manageButton}>📆 Reporter</button>
                    <button onClick={() => handleCancelCourse(course)}     style={styles.cancelButton}>❌ Annuler</button>
                  </div>

                  {/* ── SECTION FICHIERS DU COURS ── */}
                  <div style={styles.filesSection}>
                    <button onClick={() => toggleFiles(course.id)} style={styles.filesToggleBtn}>
                      <span>📎 Documents du cours</span>
                      <span style={styles.filesCount}>
                        {courseFiles[course.id] ? `${courseFiles[course.id].length} fichier${courseFiles[course.id].length !== 1 ? 's' : ''}` : 'Voir'}
                      </span>
                      <span style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: expandedFiles[course.id] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                    </button>

                    {expandedFiles[course.id] && (
                      <div style={styles.filesPanel}>
                        {/* Zone d'upload */}
                        <div style={styles.uploadZone}
                          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#FDD835'; }}
                          onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(253,216,53,0.3)'; }}
                          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(253,216,53,0.3)'; const f = e.dataTransfer.files[0]; if(f) handleFileUpload(course.id, f); }}
                        >
                          <span style={{ fontSize: '28px' }}>📤</span>
                          <p style={styles.uploadZoneText}>Glissez un fichier ici ou</p>
                          <input type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                            style={{ display: 'none' }} id={`file-input-${course.id}`}
                            onChange={e => handleFileUpload(course.id, e.target.files[0])}
                          />
                          <label htmlFor={`file-input-${course.id}`} style={styles.uploadBtn}>
                            {uploadingFile[course.id] ? '⏳ Envoi en cours...' : '📁 Choisir un fichier'}
                          </label>
                          <input
                            type="text" placeholder="Description (optionnel)"
                            value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                            style={styles.uploadDescInput}
                          />
                          <p style={styles.uploadHint}>PDF • Images (JPG/PNG/GIF) • Word • Excel — max 20 Mo</p>
                        </div>

                        {/* Liste des fichiers */}
                        {filesLoading[course.id] && (
                          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>⏳ Chargement...</p>
                        )}
                        {!filesLoading[course.id] && courseFiles[course.id]?.length === 0 && (
                          <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem', fontSize: '13px' }}>Aucun document partagé pour ce cours.</p>
                        )}
                        {(courseFiles[course.id] || []).map(cf => {
                          const typeMap = { pdf: { icon: '📄', color: '#ef4444' }, image: { icon: '🖼️', color: '#3b82f6' }, word: { icon: '📝', color: '#2563eb' }, excel: { icon: '📊', color: '#16a34a' }, other: { icon: '📎', color: '#9ca3af' } };
                          const fi = typeMap[cf.file_type] || typeMap.other;
                          return (
                            <div key={cf.id} style={styles.fileItem}>
                              <span style={{ fontSize: '22px', flexShrink: 0 }}>{fi.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ ...styles.fileName, color: fi.color }}>{cf.original_name}</p>
                                <p style={styles.fileMeta}>
                                  {formatFileSize(cf.file_size)} • {cf.uploader_name || cf.uploaded_by} • {new Date(cf.uploaded_at).toLocaleDateString('fr-FR')}
                                </p>
                                {cf.description && <p style={styles.fileDesc}>{cf.description}</p>}
                              </div>
                              <div style={styles.fileActions}>
                                <a href={`${API_URL}/files/${cf.id}/download/`} download={cf.original_name} style={styles.downloadBtn} title="Télécharger">⬇️</a>
                                {cf.uploaded_by === 'parent' && (
                                  <button onClick={() => handleDeleteFile(course.id, cf.id)} style={styles.deleteFileBtn} title="Supprimer">🗑️</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
          <div>
            <h3 style={styles.sectionTitle}>✅ Historique des cours</h3>
            <div style={styles.coursesList}>
              {completedCourses.map((course) => (
                <div key={course.id} style={styles.courseCard}>
                  <div style={styles.courseCardHeader}>
                    <div style={styles.teacherInfo}>
                      <div style={styles.teacherAvatar}>{course.teacherAvatar}</div>
                      <div><h4 style={styles.courseSubject}>{course.subject}</h4><p style={styles.courseTeacher}>{course.teacher}</p></div>
                    </div>
                    <span style={styles.completedBadge}>✓ Terminé</span>
                  </div>
                  <div style={styles.courseDetails}>
                    <div style={styles.detailItem}><span>👶</span><span style={styles.detailText}>{course.childName}</span></div>
                    <div style={styles.detailItem}><span>📅</span><span style={styles.detailText}>{new Date(course.date).toLocaleDateString('fr-FR')}</span></div>
                    <div style={styles.detailItem}><span>🕐</span><span style={styles.detailText}>{course.time} - {course.duration}</span></div>
                  </div>
                  <button onClick={() => { setSelectedCourse(course); setShowEvaluation(true); }} style={styles.evaluationButton}>📊 Voir l'appréciation du professeur</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div>
            <h3 style={styles.sectionTitle}>💬 Messages des enseignants</h3>
            <div style={styles.messagesList}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ ...styles.messageCard, ...(msg.unread ? styles.messageCardUnread : {}) }}>
                  <div style={styles.messageHeader}>
                    <div style={styles.messageAuthor}><span style={styles.messageAvatar}>{msg.avatar}</span><div><p style={styles.messageSender}>{msg.sender}</p><p style={styles.messageTime}>{new Date(msg.date).toLocaleDateString('fr-FR')} à {msg.time}</p></div></div>
                    {msg.unread && <span style={styles.unreadDot} />}
                  </div>
                  <p style={styles.messageText}>{msg.message}</p>
                  <button style={styles.replyButton}>Répondre →</button>
                </div>
              ))}
            </div>
            <button style={styles.newMessageButton}>✉️ Nouveau message</button>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          MODAL VISIOCONFÉRENCE + TABLEAU BLANC INTÉGRÉ
      ══════════════════════════════════════════════════════ */}
      {showVideoConference && selectedCourse && (
        <div style={styles.videoModal}>
          <div style={styles.videoContainer}>

            {/* Header visio */}
            <div style={styles.videoHeader}>
              <div style={{ flex: 1 }}>
                <h3 style={styles.videoTitle}>{selectedCourse.subject} — {selectedCourse.teacher}</h3>
                <p style={styles.videoSubtitle}>Élève : {selectedCourse.childName} | Durée : {selectedCourse.duration}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* Bouton pour afficher/masquer le tableau */}
                <button
                  onClick={() => openWhiteboardTab(selectedCourse)}
                  style={styles.wbToggleBtn}
                  title="Ouvre le tableau dans un nouvel onglet — partagez cet onglet dans la visio"
                >
                  🖊️ Tableau blanc ↗
                </button>
                <button onClick={() => setShowVideoConference(false)} style={styles.videoCloseBtn}>✕</button>
              </div>
            </div>

            
            {/* Corps : visio plein écran */}
            <div style={{ flex: 1, position: 'relative', background: '#0a0a0a', overflow: 'hidden' }}>
              <div ref={zegoContainerRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL MODIFICATION ══ */}
      {showModifyModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowModifyModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>✏️ Modifier le cours</h3><button onClick={() => setShowModifyModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}><label style={styles.formLabel}>Matière</label><input type="text" value={modifyData.subject} onChange={e => setModifyData({ ...modifyData, subject: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Enfant concerné</label><input type="text" value={modifyData.childName} onChange={e => setModifyData({ ...modifyData, childName: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Notes</label><textarea value={modifyData.notes} onChange={e => setModifyData({ ...modifyData, notes: e.target.value })} style={styles.formTextarea} placeholder="Ex: Insister sur les fractions..." /></div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowModifyModal(false)} style={styles.cancelModalBtn}>Annuler</button><button onClick={confirmModify} style={styles.confirmBtn}>Enregistrer</button></div>
          </div>
        </div>
      )}

      {/* ══ MODAL REPORT ══ */}
      {showRescheduleModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowRescheduleModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>📆 Reporter le cours</h3><button onClick={() => setShowRescheduleModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.3)' }}>
                <p style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '600', marginBottom: '6px' }}>Date actuelle :</p>
                <p style={{ fontSize: '16px', color: '#e5e7eb', margin: 0 }}>{new Date(selectedCourse.date).toLocaleDateString('fr-FR')} à {selectedCourse.time}</p>
              </div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Nouvelle date</label><input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Nouvelle heure</label><input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Raison (optionnel)</label><textarea value={rescheduleData.reason} onChange={e => setRescheduleData({ ...rescheduleData, reason: e.target.value })} style={styles.formTextarea} /></div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowRescheduleModal(false)} style={styles.cancelModalBtn}>Annuler</button><button onClick={confirmReschedule} style={styles.confirmBtn}>Confirmer le report</button></div>
          </div>
        </div>
      )}

      {/* ══ MODAL ANNULATION ══ */}
      {showCancelModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>❌ Annuler le cours</h3><button onClick={() => setShowCancelModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: '#FDD835', marginBottom: '10px' }}>{selectedCourse.subject}</h4>
                <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', margin: 0 }}>{selectedCourse.teacher} — {selectedCourse.childName}<br />{new Date(selectedCourse.date).toLocaleDateString('fr-FR')} à {selectedCourse.time}</p>
              </div>
              <div style={{ padding: '15px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div><p style={{ fontSize: '15px', fontWeight: 'bold', color: '#fca5a5', marginBottom: '8px' }}>Attention !</p><p style={{ fontSize: '13px', color: '#fca5a5', margin: 0 }}>Cette action est irréversible. Le cours sera définitivement annulé.</p></div>
              </div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowCancelModal(false)} style={styles.cancelModalBtn}>Retour</button><button onClick={confirmCancel} style={styles.dangerBtn}>Confirmer l'annulation</button></div>
          </div>
        </div>
      )}

      {/* ══ MODAL ÉVALUATION ══ */}
      {showEvaluation && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowEvaluation(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>📊 Évaluation du cours</h3><button onClick={() => setShowEvaluation(false)} style={styles.modalClose}>✕</button></div>
            <div style={{ padding: '30px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(253,216,53,0.2)', marginBottom: '25px' }}>
                <h4 style={{ fontSize: '20px', fontWeight: '700', color: '#FDD835', margin: '0 0 8px 0' }}>{selectedCourse.subject}</h4>
                <p style={{ fontSize: '15px', color: '#a78bfa', margin: '0 0 8px 0' }}>Par {selectedCourse.teacher}</p>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>{new Date(selectedCourse.date).toLocaleDateString('fr-FR')} — {selectedCourse.childName}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '20px', marginBottom: '25px', border: '1px solid rgba(253,216,53,0.15)' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#FDD835', margin: '0 0 15px 0' }}>📚 Thématique</h4>
                <p style={{ fontSize: '15px', color: '#e5e7eb', lineHeight: '1.6', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom: '15px' }}>{selectedCourse.evaluation.theme}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['not-acquired', 'in-progress', 'acquired'].map((s) => {
                    const isSel = selectedCourse.evaluation.themeStatus === s;
                    const ss    = getThemeStatusStyle(s);
                    return <div key={s} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: isSel ? ss.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${isSel ? ss.color : 'rgba(255,255,255,0.1)'}`, color: isSel ? ss.color : '#6b7280', fontSize: '12px', fontWeight: '600', textAlign: 'center' }}>{isSel && '✓ '}{getThemeStatusLabel(s)}</div>;
                  })}
                </div>
              </div>
              <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(59,130,246,0.3)', marginBottom: '25px' }}>
                <p style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '600', marginBottom: '8px' }}>📝 Résumé</p>
                <p style={{ fontSize: '14px', color: '#d1d5db', lineHeight: '1.6', margin: 0 }}>{selectedCourse.evaluation.summary}</p>
              </div>
              {selectedCourse.evaluation.criteria.map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '18px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#e5e7eb' }}>{c.name}</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#FDD835' }}>{c.value}%</span>
                  </div>
                  <div style={{ height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.value}%`, height: '100%', background: c.color, borderRadius: '8px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowEvaluation(false)} style={styles.confirmBtn}>Fermer</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  container:        { minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #2b1055 50%, #6d28d9 100%)', paddingBottom: '40px', position: 'relative', overflow: 'hidden' },
  bgDecor1:         { position: 'absolute', top: '-120px', right: '-120px', width: '420px', height: '420px', background: 'radial-gradient(circle, rgba(253,216,53,0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' },
  bgDecor2:         { position: 'absolute', bottom: '-160px', left: '-160px', width: '520px', height: '520px', background: 'radial-gradient(circle, rgba(147,51,234,0.25) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' },
  header:           { background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(253,216,53,0.2)', position: 'sticky', top: 0, zIndex: 100 },
  headerContent:    { maxWidth: '1400px', margin: '0 auto', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  logoSection:      { display: 'flex', alignItems: 'center', gap: '15px' },
  logoCircle:       { width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #FDD835, #9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 'bold', color: '#fff', boxShadow: '0 6px 20px rgba(253,216,53,0.5)' },
  brandName:        { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', margin: 0 },
  brandTagline:     { fontSize: '12px', color: '#e5e7eb', margin: 0 },
  headerActions:    { display: 'flex', gap: '10px' },
  homeButton:       { padding: '10px 20px', background: 'rgba(253,216,53,0.1)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#FDD835', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  logoutButton:     { padding: '10px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  welcomeBanner:    { maxWidth: '1400px', margin: '30px auto', padding: '0 20px' },
  welcomeContent:   { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '40px', border: '1px solid rgba(253,216,53,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' },
  welcomeTitle:     { fontSize: '32px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 10px 0' },
  welcomeSubtitle:  { fontSize: '16px', color: '#d1d5db', margin: 0 },
  primaryCta:       { padding: '14px 30px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 30px rgba(253,216,53,0.5)' },
  statsSection:     { maxWidth: '1400px', margin: '0 auto 30px', padding: '0 20px' },
  statsGrid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
  statCard:         { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '25px', border: '1px solid rgba(253,216,53,0.2)', display: 'flex', alignItems: 'center', gap: '20px' },
  statIcon:         { fontSize: '40px', background: 'rgba(253,216,53,0.15)', width: '70px', height: '70px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel:        { fontSize: '14px', color: '#9ca3af', margin: '0 0 5px 0' },
  statValue:        { fontSize: '32px', fontWeight: 'bold', color: '#FDD835', margin: 0 },
  tabsContainer:    { maxWidth: '1400px', margin: '0 auto 30px', padding: '0 20px' },
  tabs:             { background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '8px', display: 'flex', gap: '8px', border: '1px solid rgba(253,216,53,0.15)' },
  tab:              { flex: 1, padding: '16px 24px', background: 'transparent', border: 'none', borderRadius: '12px', color: '#9ca3af', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', position: 'relative' },
  tabActive:        { background: 'linear-gradient(135deg, rgba(253,216,53,0.25), rgba(147,51,234,0.25))', color: '#FDD835', boxShadow: '0 4px 15px rgba(253,216,53,0.3)' },
  tabBadge:         { background: 'rgba(253,216,53,0.2)', color: '#FDD835', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  tabNotification:  { background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', position: 'absolute', top: '8px', right: '8px' },
  mainContent:      { maxWidth: '1400px', margin: '0 auto', padding: '0 20px' },
  sectionTitle:     { fontSize: '24px', fontWeight: '700', color: '#FDD835', marginBottom: '25px' },
  coursesList:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '25px' },
  courseCard:       { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '25px', border: '1px solid rgba(253,216,53,0.2)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' },
  courseCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  teacherInfo:      { display: 'flex', alignItems: 'center', gap: '15px' },
  teacherAvatar:    { width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(253,216,53,0.3), rgba(147,51,234,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '2px solid rgba(253,216,53,0.4)' },
  courseSubject:    { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 5px 0' },
  courseTeacher:    { fontSize: '14px', color: '#9ca3af', margin: 0 },
  liveBadge:        { padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', gap: '8px' },
  livePulse:        { width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' },
  completedBadge:   { padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: 'rgba(34,197,94,0.2)', color: '#22c55e' },
  courseDetails:    { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' },
  detailItem:       { display: 'flex', alignItems: 'center', gap: '10px' },
  detailText:       { fontSize: '14px', color: '#d1d5db' },
  courseActions:    { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' },
  videoButton:      { padding: '14px 20px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  videoButtonActive:{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 8px 30px rgba(34,197,94,0.4)' },
  chatButton:       { padding: '14px 20px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '12px', color: '#60a5fa', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  evaluationButton: { width: '100%', padding: '14px 20px', background: 'linear-gradient(135deg, rgba(139,58,147,0.3), rgba(147,51,234,0.3))', border: '1px solid rgba(147,51,234,0.4)', borderRadius: '12px', color: '#a78bfa', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  courseManagement: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(253,216,53,0.15)' },
  manageButton:     { padding: '10px 12px', background: 'rgba(253,216,53,0.1)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#FDD835', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  cancelButton:     { padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },

  // ─── Modal visio ───────────────────────────────────────────────────────────
  videoModal:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' },
  videoContainer:   { background: '#1a1a2e', borderRadius: '20px', width: '100%', maxWidth: '1400px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(253,216,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' },
  videoHeader:      { padding: '16px 24px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  videoTitle:       { fontSize: '18px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 4px 0' },
  videoSubtitle:    { fontSize: '13px', color: '#9ca3af', margin: 0 },
  videoCloseBtn:    { width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  wbToggleBtn:      { padding: '8px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#d1d5db', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' },
  wbToggleBtnOn:    { background: 'rgba(253,216,53,0.2)', border: '1px solid rgba(253,216,53,0.5)', color: '#FDD835', boxShadow: '0 0 12px rgba(253,216,53,0.2)' },

  // ── Fichiers de cours ──────────────────────────────────────────────────────
  filesSection:     { marginTop: '14px', borderTop: '1px solid rgba(253,216,53,0.15)', paddingTop: '14px' },
  filesToggleBtn:   { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(253,216,53,0.07)', border: '1px solid rgba(253,216,53,0.2)', borderRadius: '10px', color: '#FDD835', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  filesCount:       { background: 'rgba(253,216,53,0.15)', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  filesPanel:       { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
  uploadZone:       { border: '2px dashed rgba(253,216,53,0.3)', borderRadius: '12px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(253,216,53,0.04)', transition: 'border-color 0.2s', cursor: 'default' },
  uploadZoneText:   { color: '#9ca3af', fontSize: '13px', margin: 0 },
  uploadBtn:        { display: 'inline-block', padding: '8px 20px', background: 'linear-gradient(135deg, rgba(253,216,53,0.2), rgba(253,216,53,0.1))', border: '1px solid rgba(253,216,53,0.4)', borderRadius: '8px', color: '#FDD835', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  uploadDescInput:  { width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#d1d5db', fontSize: '12px', outline: 'none', boxSizing: 'border-box', marginTop: '4px' },
  uploadHint:       { fontSize: '11px', color: '#6b7280', margin: 0 },
  fileItem:         { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' },
  fileName:         { fontSize: '13px', fontWeight: '600', margin: '0 0 3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileMeta:         { fontSize: '11px', color: '#6b7280', margin: 0 },
  fileDesc:         { fontSize: '11px', color: '#9ca3af', margin: '3px 0 0 0', fontStyle: 'italic' },
  fileActions:      { display: 'flex', gap: '6px', flexShrink: 0 },
  downloadBtn:      { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', fontSize: '14px', textDecoration: 'none', cursor: 'pointer' },
  deleteFileBtn:    { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },

  // ─── Modals ────────────────────────────────────────────────────────────────
  modalOverlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent:     { background: 'rgba(26,26,46,0.95)', backdropFilter: 'blur(20px)', borderRadius: '24px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(253,216,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  modalHeader:      { padding: '25px 30px', borderBottom: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139,58,147,0.15)' },
  modalTitle:       { fontSize: '22px', fontWeight: '700', color: '#FDD835', margin: 0 },
  modalClose:       { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody:        { padding: '30px' },
  modalFooter:      { padding: '20px 30px', borderTop: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  formGroup:        { marginBottom: '20px' },
  formLabel:        { display: 'block', fontSize: '14px', fontWeight: '600', color: '#FDD835', marginBottom: '8px' },
  formInput:        { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  formTextarea:     { width: '100%', minHeight: '100px', padding: '12px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  cancelModalBtn:   { padding: '12px 24px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '12px', color: '#FDD835', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  confirmBtn:       { padding: '12px 24px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  dangerBtn:        { padding: '12px 24px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  messagesList:     { display: 'flex', flexDirection: 'column', gap: '20px' },
  messageCard:      { background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(253,216,53,0.15)' },
  messageCardUnread:{ borderColor: 'rgba(253,216,53,0.4)', background: 'rgba(253,216,53,0.05)' },
  messageHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  messageAuthor:    { display: 'flex', alignItems: 'center', gap: '12px' },
  messageAvatar:    { fontSize: '32px' },
  messageSender:    { fontSize: '16px', fontWeight: '600', color: '#FDD835', margin: '0 0 4px 0' },
  messageTime:      { fontSize: '12px', color: '#9ca3af', margin: 0 },
  unreadDot:        { width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' },
  messageText:      { fontSize: '14px', color: '#d1d5db', lineHeight: '1.6', marginBottom: '15px' },
  replyButton:      { padding: '10px 20px', background: 'rgba(253,216,53,0.15)', border: '1px solid rgba(253,216,53,0.3)', borderRadius: '10px', color: '#FDD835', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  newMessageButton: { width: '100%', padding: '16px', marginTop: '20px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
};