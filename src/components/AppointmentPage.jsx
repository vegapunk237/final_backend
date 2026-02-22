import { useState, useEffect } from 'react';

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

const AppointmentPage = ({ navigate, user, onLogout }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    subject: '',
    level: '',
    preferredDate: '',
    preferredTime: '',
    duration: '1',
    location: 'online',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [checkingTrial, setCheckingTrial] = useState(true);

  const subjects = [
    'Mathématiques',
    'Français',
    'Anglais',
    'Physique',
    'Chimie',
    'Sciences',
    'Histoire-Géo',
    'Philosophie',
    'Économie',
    'Espagnol',
    'Allemand',
    'SVT',
    'Informatique'
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  // Vérifier si l'utilisateur a déjà utilisé son cours d'essai
  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/appointments/check-trial/${user?.id}`);
        const data = await response.json();
        
        if (data.success) {
          setHasUsedTrial(data.hasUsedTrial);
          console.log('✅ Statut cours d\'essai:', data.hasUsedTrial ? 'Utilisé' : 'Disponible');
        }
      } catch (err) {
        console.error('❌ Erreur vérification cours d\'essai:', err);
        // En cas d'erreur, on considère que le cours n'a pas été utilisé
        setHasUsedTrial(false);
      } finally {
        setCheckingTrial(false);
      }
    };

    if (user?.id) {
      checkTrialStatus();
    } else {
      setCheckingTrial(false);
    }
  }, [user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.studentName.trim()) {
      setError('Le nom de l\'élève est requis');
      return false;
    }
    if (!formData.subject) {
      setError('Veuillez sélectionner une matière');
      return false;
    }
    if (!formData.level) {
      setError('Veuillez sélectionner un niveau');
      return false;
    }
    if (!formData.preferredDate) {
      setError('Veuillez sélectionner une date');
      return false;
    }
    if (!formData.preferredTime) {
      setError('Veuillez sélectionner une heure');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isTrialCourse = !hasUsedTrial;
      const pricePerHour = isTrialCourse ? 0 : (formData.location === 'online' ? 35 : 45);
      const totalAmount = pricePerHour * parseFloat(formData.duration);

      const appointmentData = {
        parentId: user?.id,
        parentName: user?.parentName || user?.name,
        parentEmail: user?.email,
        parentPhone: user?.phone || '',
        studentName: formData.studentName.trim(),
        subject: formData.subject,
        level: formData.level,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        duration: formData.duration,
        location: formData.location,
        notes: formData.notes.trim(),
        pricePerHour: pricePerHour,
        totalAmount: totalAmount,
        isTrialCourse: isTrialCourse,
        status: 'pending'
      };

      console.log('📤 Envoi de la demande de rendez-vous:', {
        ...appointmentData,
        isTrialCourse: isTrialCourse ? '✓ GRATUIT' : '✗ Payant'
      });

      const response = await fetch(`${API_URL}/appointments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Rendez-vous créé avec succès:', data.data);
        
        if (isTrialCourse) {
          // Cours d'essai gratuit - Pas de paiement requis
          alert(
            '🎉 Félicitations !\n\n' +
            'Votre cours d\'essai GRATUIT a été réservé avec succès.\n\n' +
            'Notre équipe va vous assigner un enseignant et vous contacter très bientôt.\n\n' +
            '⚠️ Note importante : À partir de votre prochain cours, les tarifs normaux s\'appliqueront :\n' +
            '• Cours en ligne : 35€/heure\n' +
            '• Cours à domicile : 45€/heure'
          );
          
          // Retour au dashboard
          navigate('parent-dashboard');
        } else {
          // Cours payant - Redirection vers le paiement
          navigate('payment', { 
            appointmentId: data.data.id,
            amount: totalAmount,
            courseData: {
              ...formData,
              isTrialCourse: false
            }
          });
        }
      } else {
        setError(data.message || 'Erreur lors de la création du rendez-vous');
      }
    } catch (err) {
      console.error('❌ Erreur création rendez-vous:', err);
      setError('Impossible de se connecter au serveur. Vérifiez que le serveur est démarré.');
    } finally {
      setLoading(false);
    }
  };

  // Calculer le prix
  const isTrialCourse = !hasUsedTrial;
  const pricePerHour = isTrialCourse ? 0 : (formData.location === 'online' ? 35 : 45);
  const totalAmount = pricePerHour * (parseFloat(formData.duration) || 1);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>KH</div>
            <div>
              <h1 style={styles.brandName}>KH PERFECTION</h1>
              <p style={styles.brandTagline}>Réservation de cours</p>
            </div>
          </div>
          
          <div style={styles.headerActions}>
            <button onClick={() => navigate('parent-dashboard')} style={styles.backButton}>
              ← Retour
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

      {/* Page Header */}
      <section style={styles.pageHeader}>
        <div style={styles.pageHeaderContent}>
          <h2 style={styles.pageTitle}>Prendre un rendez-vous 📅</h2>
          <p style={styles.pageSubtitle}>
            {isTrialCourse 
              ? '🎁 Réservez votre cours d\'essai GRATUIT' 
              : 'Réservez un cours avec un enseignant qualifié'}
          </p>
        </div>
      </section>

      {/* Form Container */}
      <section style={styles.formSection}>
        <div style={styles.formContainer}>
          
          {/* Trial Course Banner */}
          {!checkingTrial && isTrialCourse && (
            <div style={styles.trialBanner}>
              <div style={styles.trialIcon}>🎉</div>
              <div style={styles.trialContent}>
                <h3 style={styles.trialTitle}>Cours d'essai GRATUIT !</h3>
                <p style={styles.trialText}>
                  Profitez de votre premier cours gratuitement pour découvrir nos services.
                  <br />
                  <strong>⚠️ Important :</strong> Après ce cours d'essai, les tarifs normaux s'appliqueront 
                  (35€/h en ligne, 45€/h à domicile).
                </p>
              </div>
            </div>
          )}

          {/* Already Used Trial Banner */}
          {!checkingTrial && !isTrialCourse && (
            <div style={styles.infoBanner}>
              <div style={styles.infoIcon}>ℹ️</div>
              <div style={styles.infoContent}>
                <h3 style={styles.infoTitle}>Tarifs normaux</h3>
                <p style={styles.infoText}>
                  Vous avez déjà utilisé votre cours d'essai gratuit.
                  <br />
                  Tarifs : 35€/h en ligne • 45€/h à domicile
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Informations de l'élève */}
          <div style={styles.formGroup}>
            <div style={styles.formGroupHeader}>
              <span style={styles.formGroupIcon}>👤</span>
              <h3 style={styles.formGroupTitle}>Informations sur l'élève</h3>
            </div>
            
            <div style={styles.formContent}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nom de l'élève *</label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Prénom et nom"
                  required
                  disabled={loading}
                />
              </div>

              <div style={styles.gridTwo}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Matière *</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    style={styles.select}
                    required
                    disabled={loading}
                  >
                    <option value="">Sélectionner une matière</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Niveau *</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    style={styles.select}
                    required
                    disabled={loading}
                  >
                    <option value="">Sélectionner un niveau</option>
                    <option value="Primaire">Primaire (CP-CM2)</option>
                    <option value="Collège">Collège (6ème-3ème)</option>
                    <option value="Lycée">Lycée (2nde-Terminale)</option>
                    <option value="Supérieur">Supérieur</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Date et Heure */}
          <div style={styles.formGroup}>
            <div style={styles.formGroupHeader}>
              <span style={styles.formGroupIcon}>📅</span>
              <h3 style={styles.formGroupTitle}>Date et horaire souhaités</h3>
            </div>
            
            <div style={styles.formContent}>
              <div style={styles.gridThree}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Date préférée *</label>
                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    style={styles.input}
                    required
                    disabled={loading}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Heure préférée *</label>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    style={styles.select}
                    required
                    disabled={loading}
                  >
                    <option value="">Sélectionner</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Durée (heures) *</label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    style={styles.select}
                    required
                    disabled={loading}
                  >
                    <option value="1">1 heure</option>
                    <option value="1.5">1h30</option>
                    <option value="2">2 heures</option>
                    <option value="2.5">2h30</option>
                    <option value="3">3 heures</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Lieu du cours */}
          <div style={styles.formGroup}>
            <div style={styles.formGroupHeader}>
              <span style={styles.formGroupIcon}>📍</span>
              <h3 style={styles.formGroupTitle}>Lieu du cours</h3>
            </div>
            
            <div style={styles.formContent}>
              <div style={styles.gridTwo}>
                <label style={{
                  ...styles.radioCard,
                  ...(formData.location === 'online' ? styles.radioCardSelected : {}),
                  ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                }}>
                  <input
                    type="radio"
                    name="location"
                    value="online"
                    checked={formData.location === 'online'}
                    onChange={handleChange}
                    style={styles.radioInput}
                    disabled={loading}
                  />
                  <div>
                    <p style={styles.radioTitle}>💻 En ligne</p>
                    <p style={styles.radioSubtitle}>
                      Via visioconférence {!isTrialCourse && '(35€/h)'}
                    </p>
                  </div>
                </label>

                <label style={{
                  ...styles.radioCard,
                  ...(formData.location === 'home' ? styles.radioCardSelected : {}),
                  ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                }}>
                  <input
                    type="radio"
                    name="location"
                    value="home"
                    checked={formData.location === 'home'}
                    onChange={handleChange}
                    style={styles.radioInput}
                    disabled={loading}
                  />
                  <div>
                    <p style={styles.radioTitle}>🏠 À domicile</p>
                    <p style={styles.radioSubtitle}>
                      Chez l'élève {!isTrialCourse && '(45€/h)'}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Notes additionnelles */}
          <div style={styles.formGroup}>
            <div style={styles.formGroupHeader}>
              <span style={styles.formGroupIcon}>📝</span>
              <h3 style={styles.formGroupTitle}>Notes additionnelles</h3>
            </div>
            
            <div style={styles.formContent}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Informations complémentaires</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Objectifs spécifiques, difficultés particulières, préférences..."
                  rows="4"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Pricing Info */}
          <div style={styles.pricingCard}>
            <div style={styles.pricingHeader}>
              <span style={styles.pricingIcon}>💰</span>
              <h4 style={styles.pricingTitle}>Tarification</h4>
            </div>
            <div style={styles.pricingContent}>
              {isTrialCourse ? (
                <>
                  <div style={styles.freeTrialBox}>
                    <span style={styles.freeTrialIcon}>🎁</span>
                    <div>
                      <p style={styles.freeTrialTitle}>Cours d'essai GRATUIT</p>
                      <p style={styles.freeTrialSubtitle}>
                        Profitez de votre premier cours sans frais
                      </p>
                    </div>
                  </div>
                  <div style={styles.pricingDivider}></div>
                  <div style={styles.futureRatesBox}>
                    <p style={styles.futureRatesTitle}>📌 Tarifs après le cours d'essai :</p>
                    <div style={styles.futureRatesList}>
                      <div style={styles.futureRateItem}>
                        <span>💻 Cours en ligne</span>
                        <span style={styles.futureRateValue}>35€/h</span>
                      </div>
                      <div style={styles.futureRateItem}>
                        <span>🏠 Cours à domicile</span>
                        <span style={styles.futureRateValue}>45€/h</span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.pricingTotal}>
                    <span style={styles.totalLabel}>Total à payer aujourd'hui</span>
                    <span style={styles.totalAmountFree}>0€</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.pricingRow}>
                    <span style={styles.pricingLabel}>
                      Cours {formData.location === 'online' ? 'en ligne' : 'à domicile'}
                    </span>
                    <span style={styles.pricingValue}>
                      {pricePerHour}€/h
                    </span>
                  </div>
                  <div style={styles.pricingRow}>
                    <span style={styles.pricingLabel}>
                      Durée: {formData.duration || '1'} heure(s)
                    </span>
                    <span style={styles.pricingValue}></span>
                  </div>
                  <div style={styles.pricingTotal}>
                    <span style={styles.totalLabel}>Total à payer</span>
                    <span style={styles.totalAmount}>{totalAmount}€</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div style={styles.formButtons}>
            <button
              type="button"
              onClick={() => navigate('parent-dashboard')}
              style={styles.cancelButton}
              disabled={loading}
            >
              ← Annuler
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              style={{
                ...styles.submitButton,
                ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <span>
                    {isTrialCourse 
                      ? '🎁 Réserver mon cours gratuit →' 
                      : 'Continuer vers le paiement →'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
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
    maxWidth: '1200px',
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
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  backButton: {
    background: 'rgba(100, 116, 139, 0.2)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    color: '#94a3b8',
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
  pageHeader: {
    background: 'linear-gradient(135deg, rgba(253, 216, 53, 0.1) 0%, rgba(249, 168, 37, 0.1) 100%)',
    borderBottom: '1px solid rgba(253, 216, 53, 0.2)',
    padding: '2rem'
  },
  pageHeaderContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center'
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: '#FDD835'
  },
  pageSubtitle: {
    fontSize: '16px',
    color: '#94a3b8',
    margin: 0
  },
  formSection: {
    maxWidth: '900px',
    margin: '2rem auto',
    padding: '0 2rem 4rem 2rem'
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  trialBanner: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
    border: '2px solid rgba(34, 197, 94, 0.4)',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start'
  },
  trialIcon: {
    fontSize: '48px',
    lineHeight: 1
  },
  trialContent: {
    flex: 1
  },
  trialTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#22c55e',
    margin: '0 0 0.5rem 0'
  },
  trialText: {
    fontSize: '14px',
    color: '#86efac',
    margin: 0,
    lineHeight: '1.6'
  },
  infoBanner: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '2px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start'
  },
  infoIcon: {
    fontSize: '32px',
    lineHeight: 1
  },
  infoContent: {
    flex: 1
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#3b82f6',
    margin: '0 0 0.5rem 0'
  },
  infoText: {
    fontSize: '14px',
    color: '#93c5fd',
    margin: 0,
    lineHeight: '1.6'
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#ef4444'
  },
  errorIcon: {
    fontSize: '24px'
  },
  formGroup: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden'
  },
  formGroupHeader: {
    background: 'rgba(253, 216, 53, 0.05)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  formGroupIcon: {
    fontSize: '24px'
  },
  formGroupTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    color: '#FDD835'
  },
  formContent: {
    padding: '1.5rem'
  },
  inputGroup: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '0.5rem',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem'
  },
  gridThree: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  radioCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  radioCardSelected: {
    background: 'rgba(253, 216, 53, 0.1)',
    border: '2px solid rgba(253, 216, 53, 0.4)',
    boxShadow: '0 0 20px rgba(253, 216, 53, 0.2)'
  },
  radioInput: {
    width: '20px',
    height: '20px',
    cursor: 'pointer'
  },
  radioTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    margin: '0 0 0.25rem 0'
  },
  radioSubtitle: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0
  },
  pricingCard: {
    background: 'linear-gradient(135deg, rgba(253, 216, 53, 0.1) 0%, rgba(249, 168, 37, 0.1) 100%)',
    border: '2px solid rgba(253, 216, 53, 0.3)',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  pricingHeader: {
    background: 'rgba(253, 216, 53, 0.1)',
    borderBottom: '1px solid rgba(253, 216, 53, 0.2)',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  pricingIcon: {
    fontSize: '24px'
  },
  pricingTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    color: '#FDD835'
  },
  pricingContent: {
    padding: '1.5rem'
  },
  freeTrialBox: {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '2px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem'
  },
  freeTrialIcon: {
    fontSize: '48px',
    lineHeight: 1
  },
  freeTrialTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#22c55e',
    margin: '0 0 0.25rem 0'
  },
  freeTrialSubtitle: {
    fontSize: '14px',
    color: '#86efac',
    margin: 0
  },
  pricingDivider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '1rem 0'
  },
  futureRatesBox: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem'
  },
  futureRatesTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#cbd5e1',
    margin: '0 0 0.75rem 0'
  },
  futureRatesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  futureRateItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#94a3b8'
  },
  futureRateValue: {
    fontWeight: 'bold',
    color: '#FDD835'
  },
  pricingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  pricingLabel: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  pricingValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FDD835'
  },
  pricingTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0 0 0',
    marginTop: '0.5rem',
    borderTop: '2px solid rgba(253, 216, 53, 0.3)'
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff'
  },
  totalAmount: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FDD835'
  },
  totalAmountFree: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#22c55e'
  },
  formButtons: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem'
  },
  cancelButton: {
    flex: 1,
    padding: '1rem 2rem',
    background: 'rgba(100, 116, 139, 0.2)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  submitButton: {
    flex: 2,
    padding: '1rem 2rem',
    background: 'linear-gradient(135deg, #FDD835 0%, #F9A825 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#0F172A',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(15, 23, 42, 0.2)',
    borderTop: '2px solid #0F172A',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }
};

export default AppointmentPage;