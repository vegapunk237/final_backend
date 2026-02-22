import { useState, useEffect } from 'react';

const API_URL = 'http://127.0.0.1:8000/api';

const AdminDashboard = ({ navigate, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('teachers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [completedCourses] = useState([
    {
      id: 1,
      subject: 'Mathématiques',
      teacher: 'Prof. Jean Martin',
      student: 'Lucas Dupont',
      parent: 'Marie Dupont',
      date: '2025-11-25',
      time: '14:00',
      duration: '1h',
      amount: 45,
      validated: { parent: true, teacher: true },
      status: 'completed'
    },
    {
      id: 2,
      subject: 'Français',
      teacher: 'Prof. Sophie Dubois',
      student: 'Emma Martin',
      parent: 'Jean Martin',
      date: '2025-11-27',
      time: '16:00',
      duration: '1h30',
      amount: 60,
      validated: { parent: true, teacher: true },
      status: 'completed'
    },
    {
      id: 3,
      subject: 'Anglais',
      teacher: 'Prof. Marie Laurent',
      student: 'Thomas Petit',
      parent: 'Claire Petit',
      date: '2025-11-28',
      time: '10:00',
      duration: '2h',
      amount: 90,
      validated: { parent: true, teacher: true },
      status: 'completed'
    },
    {
      id: 4,
      subject: 'Physique',
      teacher: 'Prof. Pierre Rousseau',
      student: 'Léa Bernard',
      parent: 'Sophie Bernard',
      date: '2025-11-29',
      time: '15:00',
      duration: '1h',
      amount: 45,
      validated: { parent: true, teacher: false },
      status: 'pending_validation'
    }
  ]);
  
  const [parentRequests, setParentRequests] = useState([]);
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);

  useEffect(() => {
    fetchTeacherRequests();
    fetchParentRequests();
    fetchAppointments();
  }, []);

  const fetchTeacherRequests = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/teacher-requests`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Candidatures enseignants chargées:', data.data);
        setTeacherRequests(data.data);
        
        // Extraire les enseignants approuvés
        // ✅ Après
const approved = data.data
  .filter(t => t.status === 'approved')
  .map(t => ({
    id: t.id,
    full_name: t.full_name,   // ← le modèle utilise 'full_name'
    subjects: t.subjects || [],
    availability: t.availability || ''
  }));
        setAvailableTeachers(approved);
        console.log('✅ Enseignants disponibles:', approved);
      } else {
        setError('Erreur lors du chargement des candidatures enseignants');
      }
    } catch (err) {
      console.error('❌ Erreur de chargement enseignants:', err);
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const fetchParentRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/parent-requests`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Demandes parents chargées:', data.data);
        setParentRequests(data.data);
      } else {
        console.error('Erreur lors du chargement des demandes parents');
      }
    } catch (err) {
      console.error('❌ Erreur de chargement parents:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_URL}/appointments/`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Rendez-vous chargés:', data.data);
         setAppointmentRequests(normalizeAppointments(data.data));
      } else {
        console.error('Erreur lors du chargement des rendez-vous');
      }
    } catch (err) {
      console.error('❌ Erreur de chargement rendez-vous:', err);
    }
  };

  const normalizeAppointments = (appointments) => {
  return appointments.map(a => ({
    ...a,
    assignedTeacher: a.assigned_teacher || null,
    assignedTeacherId: a.assigned_teacher_id || null,
    createdAt: a.created_at || a.createdAt,
  }));
};



  const handleDownloadCV = async (id, candidateName) => {
    try {
      const response = await fetch(`${API_URL}/teacher-requests/${id}/cv`);
      
      if (!response.ok) {
        const data = await response.json();
        alert('❌ ' + (data.message || 'Erreur lors du téléchargement du CV'));
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV_${candidateName.replace(/\s/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ CV téléchargé avec succès');
    } catch (err) {
      console.error('❌ Erreur téléchargement CV:', err);
      alert('❌ Erreur lors du téléchargement du CV');
    }
  };

const handleApproveParent = async (id) => {
  try {
    // ✅ AJOUTER LE SLASH FINAL ICI
    const response = await fetch(`${API_URL}/parent-requests/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });

    const data = await response.json();

    if (data.success) {
      setParentRequests(parentRequests.map(req => 
        req.id === id ? { ...req, status: 'approved' } : req
      ));
      alert('✅ Demande parent approuvée !');
    } else {
      alert('❌ Erreur: ' + data.message);
    }
  } catch (err) {
    console.error('Erreur:', err);
    alert('❌ Erreur de connexion');
  }
};

  const handleRejectParent = async (id) => {
  if (!window.confirm('Rejeter cette demande parent ?')) return;

  try {
    // ✅ AJOUTER LE SLASH FINAL ICI
    const response = await fetch(`${API_URL}/parent-requests/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    });

    const data = await response.json();

    if (data.success) {
      setParentRequests(parentRequests.map(req => 
        req.id === id ? { ...req, status: 'rejected' } : req
      ));
      alert('❌ Demande parent rejetée');
    }
  } catch (err) {
    console.error('Erreur:', err);
    alert('❌ Erreur de connexion');
  }
};

const handleDeleteParent = async (id) => {
  if (!window.confirm('Supprimer définitivement cette demande parent ?')) return;

  try {
    // ✅ AJOUTER LE SLASH FINAL ICI
    const response = await fetch(`${API_URL}/parent-requests/${id}/`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      setParentRequests(parentRequests.filter(req => req.id !== id));
      alert('🗑️ Demande parent supprimée');
    }
  } catch (err) {
    console.error('Erreur:', err);
    alert('❌ Erreur de connexion');
  }
};

// Même chose pour les enseignants:

const handleApproveTeacher = async (id) => {
  try {
    // ✅ AJOUTER LE SLASH FINAL ICI
    const response = await fetch(`${API_URL}/teacher-requests/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' })
    });

    const data = await response.json();

    if (data.success) {
      setTeacherRequests(teacherRequests.map(req => 
        req.id === id ? { ...req, status: 'approved' } : req
      ));
      await fetchTeacherRequests();
      alert('✅ Candidature approuvée !');
    } else {
      alert('❌ Erreur: ' + data.message);
    }
  } catch (err) {
    console.error('Erreur:', err);
    alert('❌ Erreur de connexion');
  }
};

  const handleRejectTeacher = async (id) => {
    if (!window.confirm('Rejeter cette candidature ?')) return;

    try {
      const response = await fetch(`${API_URL}/teacher-requests/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });

      const data = await response.json();

      if (data.success) {
        setTeacherRequests(teacherRequests.map(req => 
          req.id === id ? { ...req, status: 'rejected' } : req
        ));
        alert('❌ Candidature rejetée');
      }
    } catch (err) {
      alert('❌ Erreur de connexion');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Supprimer définitivement cette candidature ?')) return;

    try {
      const response = await fetch(`${API_URL}/teacher-requests/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setTeacherRequests(teacherRequests.filter(req => req.id !== id));
        alert('🗑️ Candidature supprimée');
      }
    } catch (err) {
      alert('❌ Erreur de connexion');
    }
  };

const handleAssignTeacher = async (appointmentId, teacherId) => {
  const teacher = availableTeachers.find(t => t.id === teacherId);
  
  // ✅ Vérification explicite
  if (!teacher) return alert('Enseignant introuvable');
  if (!teacher.full_name) return alert('Nom enseignant manquant — vérifiez full_name');

  console.log('✅ Envoi:', { teacherId: teacher.id, teacherName: teacher.full_name });

  try {
    const response = await fetch(
      `${API_URL}/appointments/${appointmentId}/assign/`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          teacherName: teacher.full_name   // ← sera full_name maintenant
        })
      }
    );

    const data = await response.json();
    console.log('Réponse backend:', data);

    if (data.success) {
      setAppointmentRequests(prev =>
        prev.map(a =>
          a.id === appointmentId
            ? { ...a, assignedTeacher: teacher.name, assignedTeacherId: teacher.id, status: 'assigned' }
            : a
        )
      );
      alert('✅ Enseignant assigné');
    } else {
      alert('❌ ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('❌ Erreur serveur');
  }
};

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', icon: '⏳', label: 'En attente' },
      approved: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', icon: '✓', label: 'Approuvé' },
      rejected: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', icon: '✗', label: 'Rejeté' },
      assigned: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', icon: '👨‍🏫', label: 'Assigné' },
      confirmed: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', icon: '✓', label: 'Confirmé' }
    };
    const { bg, color, icon, label } = config[status] || config.pending;
    return (
      <span style={{ ...styles.badge, background: bg, color }}>
        {icon} {label}
      </span>
    );
  };

  const pendingCount = parentRequests.filter(r => r.status === 'pending').length + 
                       teacherRequests.filter(r => r.status === 'pending').length +
                       appointmentRequests.filter(r => r.status === 'pending').length;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>KH</div>
            <div>
              <h1 style={styles.brandName}>KH PERFECTION</h1>
              <p style={styles.brandTagline}>Admin Panel</p>
            </div>
          </div>
          
          <div style={styles.headerActions}>
            <button onClick={() => {
              fetchTeacherRequests();
              fetchParentRequests();
              fetchAppointments();
            }} style={styles.refreshButton}>
              🔄 Actualiser
            </button>
            <button onClick={() => navigate('home')} style={styles.homeButton}>
              🏠 Accueil
            </button>
            <button onClick={onLogout} style={styles.logoutButton}>
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </header>

      <section style={styles.welcomeBanner}>
        <div style={styles.welcomeContent}>
          <h2 style={styles.welcomeTitle}>⚡ Panneau d'Administration</h2>
          <p style={styles.welcomeSubtitle}>Gérez les comptes, demandes et rendez-vous</p>
        </div>
      </section>

      {error && (
        <div style={styles.errorAlertContainer}>
          <div style={styles.errorAlert}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError('')} style={styles.closeButton}>✕</button>
          </div>
        </div>
      )}

      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={{...styles.statCard, ...styles.statCard1}}>
            <div style={styles.statIcon}>👥</div>
            <div>
              <p style={styles.statLabel}>Parents inscrits</p>
              <p style={styles.statValue}>{parentRequests.length}</p>
            </div>
          </div>

          <div style={{...styles.statCard, ...styles.statCard2}}>
            <div style={styles.statIcon}>👨‍🏫</div>
            <div>
              <p style={styles.statLabel}>Enseignants actifs</p>
              <p style={styles.statValue}>
                {teacherRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>
          </div>

          <div style={{...styles.statCard, ...styles.statCard3}}>
            <div style={styles.statIcon}>📅</div>
            <div>
              <p style={styles.statLabel}>Rendez-vous</p>
              <p style={styles.statValue}>{appointmentRequests.length}</p>
            </div>
          </div>

          <div style={{...styles.statCard, ...styles.statCard4}}>
            <div style={styles.statIcon}>⏳</div>
            <div>
              <p style={styles.statLabel}>Demandes en attente</p>
              <p style={styles.statValue}>{pendingCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.tabsSection}>
        <div style={styles.tabsContainer}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              ...styles.tab,
              ...(activeTab === 'pending' ? styles.tabActive : {})
            }}
          >
            <span style={styles.tabIcon}>👨‍👩‍👧</span>
            <span>Demandes Parents</span>
            <span style={styles.tabBadge}>
              {parentRequests.filter(r => r.status === 'pending').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            style={{
              ...styles.tab,
              ...(activeTab === 'teachers' ? styles.tabActive : {})
            }}
          >
            <span style={styles.tabIcon}>🎓</span>
            <span>Candidatures Enseignants</span>
            <span style={styles.tabBadge}>
              {teacherRequests.filter(r => r.status === 'pending').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            style={{
              ...styles.tab,
              ...(activeTab === 'appointments' ? styles.tabActive : {})
            }}
          >
            <span style={styles.tabIcon}>📆</span>
            <span>Rendez-vous</span>
            <span style={styles.tabBadge}>
              {appointmentRequests.filter(r => r.status === 'pending').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            style={{
              ...styles.tab,
              ...(activeTab === 'completed' ? styles.tabActive : {})
            }}
          >
            <span style={styles.tabIcon}>✅</span>
            <span>Cours Terminés</span>
            <span style={styles.tabBadge}>
              {completedCourses.length}
            </span>
          </button>
        </div>
      </section>

      <section style={styles.contentSection}>
        {activeTab === 'pending' && (
          <div style={styles.requestsList}>
            <h3 style={styles.listTitle}>📋 Demandes d'inscription des parents</h3>
            
            {parentRequests.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p style={styles.emptyTitle}>Aucune demande parent</p>
              </div>
            )}
            
            {parentRequests.map((request) => (
              <div key={request.id} style={styles.requestCard}>
                <div style={styles.requestHeader}>
                  <div>
                    <h4 style={styles.requestName}>{request.parentName}</h4>
                    <p style={styles.requestDate}>
                      📅 {new Date(request.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div style={styles.requestBody}>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoBlock}>
                      <p style={styles.infoLabel}>📧 Contact Parent</p>
                      <p style={styles.infoValue}>{request.email}</p>
                      <p style={styles.infoValue}>📱 {request.phone}</p>
                      <p style={styles.infoValue}>📍 {request.address}</p>
                    </div>
                    <div style={styles.infoBlock}>
                      <p style={styles.infoLabel}>👦 Élève</p>
                      <p style={styles.infoValue}>{request.childName}, {request.childAge} ans</p>
                      <p style={styles.infoValue}>📚 Niveau: {request.childLevel}</p>
                    </div>
                  </div>

                  <div style={styles.subjectsSection}>
                    <p style={styles.infoLabel}>📚 Matières demandées</p>
                    <div style={styles.subjectsList}>
                      {request.subjects.map((subject, idx) => (
                        <span key={idx} style={styles.subjectBadge}>{subject}</span>
                      ))}
                    </div>
                  </div>

                  {request.availability && (
                    <div style={styles.availabilitySection}>
                      <p style={styles.infoLabel}>🗓️ Disponibilités</p>
                      <p style={styles.infoValue}>{request.availability}</p>
                    </div>
                  )}
                </div>

                <div style={styles.actionButtons}>
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveParent(request.id)}
                        style={styles.approveButton}
                      >
                        ✓ Approuver
                      </button>
                      <button
                        onClick={() => handleRejectParent(request.id)}
                        style={styles.rejectButton}
                      >
                        ✗ Rejeter
                      </button>
                    </>
                  )}
                  
                  {request.status === 'approved' && (
                    <div style={styles.approvedBanner}>
                      <span>✓</span>
                      <span>Demande approuvée</span>
                    </div>
                  )}
                  
                  {request.status === 'rejected' && (
                    <div style={styles.rejectedBanner}>
                      <span>✗</span>
                      <span>Demande rejetée</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleDeleteParent(request.id)}
                    style={styles.deleteButton}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'teachers' && (
          <div style={styles.requestsList}>
            <div style={styles.listHeader}>
              <h3 style={styles.listTitle}>🎓 Candidatures des enseignants</h3>
              <p style={styles.listSubtitle}>
                Total: {teacherRequests.length} | 
                En attente: {teacherRequests.filter(r => r.status === 'pending').length} | 
                Approuvé(s): {teacherRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>

            {loading && (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Chargement...</p>
              </div>
            )}

            {!loading && teacherRequests.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p style={styles.emptyTitle}>Aucune candidature</p>
              </div>
            )}

            {!loading && teacherRequests.map((request) => (
              <div key={request.id} style={styles.requestCard}>
                <div style={styles.requestHeader}>
                  <div>
                    <h4 style={styles.requestName}>{request.full_name}</h4>
                    <p style={styles.requestName}>
                      {request.subjects}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div style={styles.requestBody}>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoBlock}>
                      <p style={styles.infoLabel}>📧 Contact</p>
                      <p style={styles.infoValue}>{request.email}</p>
                      <p style={styles.infoValue}>📱 {request.phone}</p>
                    </div>
                    <div style={styles.infoBlock}>
                      <p style={styles.infoLabel}>🎯 Qualifications</p>
                      <p style={styles.infoValue}>{request.qualification}</p>
                      <p style={styles.infoValue}>📊 Exp: {request.experience}</p>
                    </div>
                  </div>

                  <div style={styles.subjectsSection}>
                    <p style={styles.infoLabel}>📚 Matières enseignées</p>
                    <div style={styles.subjectsList}>
                      {request.subjects.map((subject, idx) => (
                        <span key={idx} style={{...styles.subjectBadge, background: 'rgba(253, 216, 53, 0.2)', color: '#FDD835'}}>
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  {request.availability && (
                    <div style={styles.availabilitySection}>
                      <p style={styles.infoLabel}>🗓️ Disponibilités</p>
                      <p style={styles.infoValue}>{request.availability}</p>
                    </div>
                  )}

                  <div style={styles.motivationSection}>
                    <p style={styles.infoLabel}>✍️ Lettre de motivation</p>
                    <p style={styles.motivationText}>{request.motivation}</p>
                  </div>

                  {request.cvFileName && (
                    <div style={styles.cvSection}>
                      <div style={styles.cvInfo}>
                        <span style={styles.cvIcon}>📄</span>
                        <div>
                          <p style={styles.cvLabel}>CV disponible</p>
                          <p style={styles.cvFileName}>{request.cvFileName}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownloadCV(request.id, request.name)}
                        style={styles.downloadCvButton}
                      >
                        ⬇️ Télécharger le CV
                      </button>
                    </div>
                  )}
                </div>

                <div style={styles.actionButtons}>
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveTeacher(request.id)}
                        style={styles.approveButton}
                      >
                        ✓ Approuver
                      </button>
                      <button
                        onClick={() => handleRejectTeacher(request.id)}
                        style={styles.rejectButton}
                      >
                        ✗ Rejeter
                      </button>
                    </>
                  )}
                  
                  {request.status === 'approved' && (
                    <div style={styles.approvedBanner}>
                      <span>✓</span>
                      <span>Candidature approuvée</span>
                    </div>
                  )}
                  
                  {request.status === 'rejected' && (
                    <div style={styles.rejectedBanner}>
                      <span>✗</span>
                      <span>Candidature rejetée</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleDeleteTeacher(request.id)}
                    style={styles.deleteButton}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div style={styles.requestsList}>
            <style>{`
              @keyframes slideInUp {
                from {
                  opacity: 0;
                  transform: translateY(30px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
              @keyframes pulse {
                0%, 100% {
                  opacity: 1;
                }
                50% {
                  opacity: 0.8;
                }
              }
              
              @keyframes shimmer {
                0% {
                  background-position: -1000px 0;
                }
                100% {
                  background-position: 1000px 0;
                }
              }
              
              @keyframes bounce {
                0%, 100% {
                  transform: translateY(0);
                }
                50% {
                  transform: translateY(-5px);
                }
              }
              
              .appointment-card {
                animation: slideInUp 0.5s ease-out;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              }
              
              .appointment-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 40px rgba(253, 216, 53, 0.2);
              }
              
              .teacher-card {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
              }
              
              .teacher-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(253, 216, 53, 0.1), transparent);
                transition: left 0.5s;
              }
              
              .teacher-card:hover::before {
                left: 100%;
              }
              
              .teacher-card:hover {
                transform: scale(1.03);
                box-shadow: 0 12px 24px rgba(253, 216, 53, 0.3);
                border-color: rgba(253, 216, 53, 0.5);
              }
              
              .assign-btn {
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
              }
              
              .assign-btn::after {
                content: '→';
                position: absolute;
                right: -20px;
                top: 50%;
                transform: translateY(-50%);
                opacity: 0;
                transition: all 0.3s ease;
              }
              
              .assign-btn:hover::after {
                right: 20px;
                opacity: 1;
              }
              
              .assign-btn:hover {
                transform: translateX(-5px);
                box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
                padding-right: 2.5rem;
              }
              
              .assign-btn:active {
                transform: scale(0.95) translateX(-5px);
              }
              
              .info-block {
                transition: all 0.3s ease;
              }
              
              .info-block:hover {
                background: rgba(255, 255, 255, 0.08);
                transform: translateX(5px);
              }
              
              .status-badge {
                animation: pulse 2s infinite;
              }
              
              .trial-badge {
                animation: bounce 2s infinite;
              }
              
              .availability-container {
                position: relative;
                overflow: hidden;
              }
              
              .availability-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 50%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.2), transparent);
                animation: shimmer 3s infinite;
              }
            `}</style>

            <div style={styles.listHeader}>
              <h3 style={styles.listTitle}>📆 Demandes de rendez-vous</h3>
              <p style={styles.listSubtitle}>
                Total: {appointmentRequests.length} | 
                En attente: {appointmentRequests.filter(r => r.status === 'pending').length} | 
                Assigné(s): {appointmentRequests.filter(r => r.status === 'assigned').length}
              </p>
            </div>

            {appointmentRequests.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p style={styles.emptyTitle}>Aucune demande de rendez-vous</p>
              </div>
            )}
            
            {appointmentRequests.map((request, index) => {
              const suitableTeachers = availableTeachers.filter(t => 
                t.subjects && t.subjects.includes(request.subject)
              );

              return (
                <div 
                  key={request.id} 
                  className="appointment-card"
                  style={{
                    ...styles.requestCard,
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div style={styles.requestHeader}>
                    <div>
                      <h4 style={styles.requestName}>
                        <span style={styles.subjectIcon}>📚</span>
                        {request.subject} - {request.level}
                      </h4>
                      <p style={styles.requestDate}>
                        <span style={styles.iconBadge}>👤</span>
                        Parent: {request.parentName}
                      </p>
                      <p style={styles.requestDate}>
                        <span style={styles.iconBadge}>👦</span>
                        Élève: {request.studentName}
                      </p>
                      <p style={styles.requestDate}>
                        <span style={styles.iconBadge}>📅</span>
                        Demandé le: {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="status-badge">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  <div style={styles.requestBody}>
                    <div style={styles.infoGrid}>
                      <div className="info-block" style={styles.infoBlock}>
                        <p style={styles.infoLabel}>📧 Contact Parent</p>
                        <p style={styles.infoValue}>{request.parentEmail}</p>
                        <p style={styles.infoValue}>📱 {request.parentPhone || 'Non fourni'}</p>
                      </div>
                      <div className="info-block" style={styles.infoBlock}>
                        <p style={styles.infoLabel}>📅 Date & Heure souhaitées</p>
                        <p style={styles.infoValue}>{request.preferredDate}</p>
                        <p style={styles.infoValue}>🕐 {request.preferredTime}</p>
                        <p style={styles.infoValue}>⏱️ Durée: {request.duration}</p>
                      </div>
                    </div>

                    <div style={styles.infoGrid}>
                      <div className="info-block" style={styles.infoBlock}>
                        <p style={styles.infoLabel}>📍 Lieu</p>
                        <p style={styles.infoValue}>
                          {request.location === 'online' ? (
                            <span style={styles.onlineBadge}>💻 En ligne</span>
                          ) : (
                            <span style={styles.homeBadge}>🏠 À domicile</span>
                          )}
                        </p>
                      </div>
                      <div className="info-block" style={styles.infoBlock}>
                        <p style={styles.infoLabel}>💰 Tarification</p>
                        <p style={styles.infoValue}>
                          {request.isTrialCourse ? (
                            <span className="trial-badge" style={styles.trialBadge}>
                              🎁 Cours d'essai GRATUIT
                            </span>
                          ) : (
                            <span style={styles.priceBadge}>
                              {request.pricePerHour}€/h - Total: {request.totalAmount}€
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {request.notes && (
                      <div style={styles.notesSection}>
                        <p style={styles.infoLabel}>📝 Notes supplémentaires</p>
                        <p style={styles.notesText}>{request.notes}</p>
                      </div>
                    )}

                    {request.status === 'pending' && suitableTeachers.length > 0 && (
                      <div style={styles.assignTeacherSection}>
                        <div style={styles.sectionHeader}>
                          <p style={styles.sectionTitle}>
                            <span style={styles.teacherIcon}>👨‍🏫</span>
                            Assigner un enseignant
                          </p>
                          <span style={styles.countBadge}>
                            {suitableTeachers.length} disponible{suitableTeachers.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div style={styles.teachersListContainer}>
                          { suitableTeachers.map(teacher => (
  <div key={teacher.id} style={styles.teacherCard}>

    <div style={styles.teacherCardContent}>

      {/* PHOTO ENSEIGNANT */}
      <div style={styles.teacherAvatarWrapper}>
        <img
          src={teacher.photo || '/testimonial-2.jpg'}
          alt={teacher.name}
          style={styles.teacherAvatar}
        />
      </div>

      {/* INFOS ENSEIGNANT */}
      <div style={styles.teacherInfo}>
        <p style={styles.teacherName}>👨‍🏫 {teacher.full_name}</p>

        <div style={styles.teacherSubjects}>
          {teacher.subjects.map((subject, idx) => (
            <span key={idx} style={styles.miniSubjectBadge}>
              {subject}
            </span>
          ))}
        </div>

        {teacher.full_name && (
          <p style={styles.teacherName}>
            🗓️ {teacher.availability}
          </p>
        )}
      </div>

      {/* ACTION */}
      <div style={styles.teacherAction}>
        <button
          onClick={() => handleAssignTeacher(request.id, teacher.id)}
          style={styles.assignTeacherButton}
        >
          ✓ Assigner
        </button>
      </div>

    </div>

  </div>
))}

                        </div>
                      </div>
                    )}

                    {request.status === 'pending' && suitableTeachers.length === 0 && (
                      <div style={styles.noTeacherAlert}>
                        <span style={styles.warningIcon}>⚠️</span>
                        <div>
                          <p style={styles.alertTitle}>Aucun enseignant disponible</p>
                          <p style={styles.alertSubtitle}>
                            Aucun enseignant qualifié trouvé pour {request.subject}
                          </p>
                        </div>
                      </div>
                    )}

                    {request.status === 'assigned' && (
                      <div style={styles.assignedTeacherInfo}>
                        <p style={styles.assignedLabel}>
                          <span style={styles.checkIcon}>✓</span>
                          Enseignant assigné
                        </p>
                        <div style={styles.assignedTeacherBadge}>
                          <span style={styles.teacherAssignedAvatar}>👨‍🏫</span>
                          <span>{request.assignedTeacher}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'completed' && (
          <div style={styles.requestsList}>
            <div style={styles.listHeader}>
              <h3 style={styles.listTitle}>✅ Cours terminés & Facturation</h3>
              <p style={styles.listSubtitle}>
                Total: {completedCourses.length} cours | 
                Revenus totaux: {completedCourses.reduce((sum, c) => sum + c.amount, 0)}€
              </p>
            </div>

            {completedCourses.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p style={styles.emptyTitle}>Aucun cours terminé</p>
              </div>
            )}

            {completedCourses.map((course) => (
              <div key={course.id} style={styles.requestCard}>
                <div style={styles.requestHeader}>
                  <div>
                    <h4 style={styles.requestName}>📚 {course.subject}</h4>
                    <p style={styles.requestDate}>
                      📅 {course.date} à {course.time} - Durée: {course.duration}
                    </p>
                  </div>
                  {getStatusBadge(course.status)}
                </div>

                <div style={styles.requestBody}>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoBlock}>
                      <p style={styles.infoLabel}>👨‍🏫 Enseignant</p>
                      <p style={styles.infoValue}>{course.teacher}</p>
                    </div>
                    <div style={styles.infoBlock}>
                      <p style={styles.infoLabel}>👦 Élève & Parent</p>
                      <p style={styles.infoValue}>{course.student}</p>
                      <p style={styles.infoValue}>Parent: {course.parent}</p>
                    </div>
                  </div>

                  <div style={styles.validationSection}>
                    <p style={styles.infoLabel}>✓ Validations</p>
                    <div style={styles.validationGrid}>
                      <div style={styles.validationItem}>
                        <span style={course.validated.parent ? styles.validatedIcon : styles.pendingIcon}>
                          {course.validated.parent ? '✓' : '⏳'}
                        </span>
                        <span>Parent: {course.validated.parent ? 'Validé' : 'En attente'}</span>
                      </div>
                      <div style={styles.validationItem}>
                        <span style={course.validated.teacher ? styles.validatedIcon : styles.pendingIcon}>
                          {course.validated.teacher ? '✓' : '⏳'}
                        </span>
                        <span>Enseignant: {course.validated.teacher ? 'Validé' : 'En attente'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={styles.amountSection}>
                    <p style={styles.infoLabel}>💰 Montant</p>
                    <p style={styles.amountValue}>{course.amount}€</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    color: '#fff'
  },
  header: {
    background: 'rgba(15, 23, 42, 0.95)',
    borderBottom: '1px solid rgba(253, 216, 53, 0.2)',
    padding: '1rem 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  logoCircle: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FDD835 0%, #F9A825 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '20px',
    color: '#0F172A'
  },
  brandName: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
    background: 'linear-gradient(135deg, #FDD835 0%, #F9A825 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  brandTagline: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  refreshButton: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#3b82f6',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  homeButton: {
    background: 'rgba(253, 216, 53, 0.1)',
    border: '1px solid rgba(253, 216, 53, 0.3)',
    color: '#FDD835',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  logoutButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  welcomeBanner: {
    background: 'linear-gradient(135deg, rgba(253, 216, 53, 0.1) 0%, rgba(249, 168, 37, 0.1) 100%)',
    borderBottom: '1px solid rgba(253, 216, 53, 0.2)',
    padding: '2rem'
  },
  welcomeContent: {
    maxWidth: '1400px',
    margin: '0 auto'
  },
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: '#FDD835'
  },
  welcomeSubtitle: {
    fontSize: '16px',
    color: '#94a3b8',
    margin: 0
  },
  errorAlertContainer: {
    maxWidth: '1400px',
    margin: '1rem auto',
    padding: '0 2rem'
  },
  errorAlert: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    color: '#ef4444'
  },
  errorIcon: {
    fontSize: '24px'
  },
  closeButton: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0.5rem'
  },
  statsSection: {
    maxWidth: '1400px',
    margin: '2rem auto',
    padding: '0 2rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem'
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  statCard1: { borderLeft: '4px solid #3b82f6' },
  statCard2: { borderLeft: '4px solid #22c55e' },
  statCard3: { borderLeft: '4px solid #f59e0b' },
  statCard4: { borderLeft: '4px solid #ef4444' },
  statIcon: { fontSize: '32px' },
  statLabel: { fontSize: '14px', color: '#94a3b8', margin: '0 0 0.25rem 0' },
  statValue: { fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#FDD835' },
  tabsSection: { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' },
  tabsContainer: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  tab: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#94a3b8',
    padding: '1rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  tabActive: {
    background: 'linear-gradient(135deg, rgba(253, 216, 53, 0.2) 0%, rgba(249, 168, 37, 0.2) 100%)',
    border: '1px solid rgba(253, 216, 53, 0.4)',
    color: '#FDD835'
  },
  tabIcon: { fontSize: '20px' },
  tabBadge: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  contentSection: { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem 4rem 2rem' },
  requestsList: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  listHeader: { marginBottom: '1rem' },
  listTitle: { fontSize: '24px', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#FDD835' },
  listSubtitle: { fontSize: '14px', color: '#94a3b8', margin: 0 },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '4rem',
    gap: '1rem'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(253, 216, 53, 0.1)',
    borderTop: '4px solid #FDD835',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: { color: '#94a3b8', fontSize: '16px' },
  emptyState: {
    textAlign: 'center',
    padding: '4rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  emptyIcon: { fontSize: '64px', display: 'block', marginBottom: '1rem' },
  emptyTitle: { fontSize: '20px', fontWeight: 'bold', color: '#94a3b8', margin: 0 },
  requestCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden'
  },
  requestHeader: {
    padding: '1.5rem',
    background: 'rgba(253, 216, 53, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  requestName: { fontSize: '20px', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'black' },
  requestDate: { fontSize: '14px', color: '#94a3b8', margin: '0.25rem 0' },
  badge: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  teacherCard: {
  backgroundColor: '#f9fafb',
  borderRadius: '14px',
  padding: '12px',
  border: '1px solid #e5e7eb',
  marginBottom: '12px',
  transition: '0.2s',
},

teacherCardContent: {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
},

teacherAvatarWrapper: {
  flexShrink: 0,
},

teacherAvatar: {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  objectFit: 'cover',
  border: '2px solid #6366f1',
},

teacherInfo: {
  flex: 1,
},

teacherName: {
  fontWeight: 'bold',
  fontSize: '16px',
  marginBottom: '6px',
  color:'purple',
},

teacherSubjects: {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginBottom: '6px',
},

miniSubjectBadge: {
  backgroundColor: '#eef2ff',
  color: '#4338ca',
  padding: '3px 8px',
  borderRadius: '8px',
  fontSize: '12px',
},

teacherAvailability: {
  fontSize: '13px',
  color: '#6b7280',
},

teacherAction: {
  display: 'flex',
  alignItems: 'center',
},

assignTeacherButton: {
  backgroundColor: '#22c55e',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 14px',
  cursor: 'pointer',
  fontWeight: 'bold',
},

  requestBody: { padding: '1.5rem' },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem'
  },
  infoBlock: {
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '1rem',
    borderRadius: '8px'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
    fontWeight: 'bold'
  },
  infoValue: { fontSize: '14px', color: '#e2e8f0', margin: '0.25rem 0' },
  subjectsSection: { marginBottom: '1rem' },
  subjectsList: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' },
  subjectBadge: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '13px'
  },
  availabilitySection: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px'
  },
  motivationSection: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px'
  },
  motivationText: {
    fontSize: '14px',
    color: '#cbd5e1',
    lineHeight: '1.6',
    marginTop: '0.5rem',
    whiteSpace: 'pre-wrap'
  },
  cvSection: {
    marginTop: '1.5rem',
    padding: '1.25rem',
    background: 'rgba(34, 197, 94, 0.1)',
    border: '2px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  cvInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  cvIcon: {
    fontSize: '40px'
  },
  cvLabel: {
    fontSize: '12px',
    color: '#22c55e',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    margin: 0
  },
  cvFileName: {
    fontSize: '14px',
    color: '#86efac',
    margin: '0.25rem 0 0 0'
  },
  downloadCvButton: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    border: 'none',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
  },
  actionButtons: {
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  approveButton: {
    flex: 1,
    minWidth: '150px',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    border: 'none',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  rejectButton: {
    flex: 1,
    minWidth: '150px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    border: 'none',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  deleteButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  approvedBanner: {
    flex: 1,
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#22c55e',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  rejectedBanner: {
    flex: 1,
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  teacherAssignment: {
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  },
  assignLabel: { fontSize: '14px', color: '#94a3b8', marginBottom: '1rem', fontWeight: 'bold' },
  teacherButtons: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem' },
  teacherButton: {
    background: 'rgba(253, 216, 53, 0.1)',
    border: '1px solid rgba(253, 216, 53, 0.3)',
    color: '#FDD835',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  },
  miniStatCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  miniStatIcon: { fontSize: '32px' },
  miniStatLabel: { fontSize: '12px', color: '#94a3b8', margin: '0 0 0.25rem 0' },
  miniStatValue: { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', margin: 0 }
};

export default AdminDashboard;

