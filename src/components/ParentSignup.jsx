import { useState } from 'react';

const API_URL = 'http://127.0.0.1:8000/api';

const ParentSignup = ({ navigate }) => {
  const [formData, setFormData] = useState({
    parentName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    childName: '',
    childAge: '',
    childLevel: '',
    subjects: [],
    availability: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subjectsList = [
    'Mathématiques',
    'Français',
    'Anglais',
    'Sciences',
    'Histoire-Géo',
    'Physique-Chimie',
    'Philosophie',
    'Économie'
  ];

  const subjectsList2 = [
    'reussir un examen',
    'parler avec aisance',
    'mieux ce cocentrer',
    'gerer son stress'
  ];



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const validateForm = () => {
    if (!formData.parentName.trim()) {
      setError('Le nom du parent est requis');
      return false;
    }
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Format d\'email invalide');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Le numéro de téléphone est requis');
      return false;
    }
    if (!formData.address.trim()) {
      setError('L\'adresse est requise');
      return false;
    }
    if (!formData.password) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (!formData.childName.trim()) {
      setError('Le nom de l\'élève est requis');
      return false;
    }
    if (!formData.childAge) {
      setError('L\'âge de l\'élève est requis');
      return false;
    }
    if (!formData.childLevel) {
      setError('Le niveau scolaire est requis');
      return false;
    }
    if (formData.subjects.length === 0) {
      setError('Veuillez sélectionner au moins une matière');
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
      const response = await fetch(`${API_URL}/parent-requests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentName: formData.parentName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          password: formData.password,
          childName: formData.childName.trim(),
          childAge: parseInt(formData.childAge),
          childLevel: formData.childLevel,
          subjects: formData.subjects,
          availability: formData.availability.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Inscription réussie:', data.data);
        setSubmitted(true);
      } else {
        setError(data.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      console.error('❌ Erreur d\'inscription:', err);
      setError('Impossible de se connecter au serveur. Vérifiez que le serveur est démarré.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.logoSection}>
              <div style={styles.logoCircle}>KH</div>
              <div>
                <h1 style={styles.brandName}>KH PERFECTION</h1>
                <p style={styles.brandTagline}>Inscription Parent</p>
              </div>
            </div>
            
            <div style={styles.headerActions}>
              <button onClick={() => navigate('home')} style={styles.homeButton}>
                🏠 Accueil
              </button>
            </div>
          </div>
        </header>

        {/* Success Message */}
        <div style={styles.successContainer}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Demande envoyée !</h2>
            <p style={styles.successMessage}>
              Votre demande a été transmise avec succès. Notre équipe va l'examiner et vous recevrez une confirmation par email sous 24-48 heures.
            </p>
            <button
              onClick={() => navigate('home')}
              style={styles.primaryButton}
            >
              🏠 Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>KH</div>
            <div>
              <h1 style={styles.brandName}>KH PERFECTION</h1>
              <p style={styles.brandTagline}>Inscription Parent</p>
            </div>
          </div>
          
          <div style={styles.headerActions}>
            <button onClick={() => navigate('home')} style={styles.backButton}>
              ← Retour
            </button>
            <button onClick={() => navigate('home')} style={styles.homeButton}>
              🏠 Accueil
            </button>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <section style={styles.pageHeader}>
        <div style={styles.pageHeaderContent}>
          <h2 style={styles.pageTitle}>Inscription Parent 👨‍👩‍👧</h2>
          <p style={styles.pageSubtitle}>Remplissez le formulaire pour solliciter des cours pour votre enfant</p>
        </div>
      </section>

      {/* Form Container */}
      <section style={styles.formSection}>
        <div style={styles.formContainer}>
          
          {/* Error Message */}
          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Informations Parent */}
          <div style={styles.formGroup}>
            <div style={styles.formGroupHeader}>
              <span style={styles.formGroupIcon}>👤</span>
              <h3 style={styles.formGroupTitle}>Vos informations</h3>
            </div>
            
            <div style={styles.formContent}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nom complet *</label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Votre nom et prénom"
                  required
                  disabled={loading}
                />
              </div>

              <div style={styles.gridTwo}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="votre@email.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Téléphone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="06 12 34 56 78"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Adresse *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Votre adresse complète"
                  rows="2"
                  required
                  disabled={loading}
                />
              </div>

              <div style={styles.gridTwo}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mot de passe *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirmer mot de passe *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informations Enfant */}
          <div style={styles.formGroup}>
            <div style={styles.formGroupHeader}>
              <span style={styles.formGroupIcon}>👶</span>
              <h3 style={styles.formGroupTitle}>Informations sur l'élève</h3>
            </div>
            
            <div style={styles.formContent}>
              <div style={styles.gridThree}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nom de l'élève *</label>
                  <input
                    type="text"
                    name="childName"
                    value={formData.childName}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Prénom"
                    required
                    disabled={loading}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Âge *</label>
                  <input
                    type="number"
                    name="childAge"
                    value={formData.childAge}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="12"
                    min="5"
                    max="25"
                    required
                    disabled={loading}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Niveau scolaire *</label>
                  <select
                    name="childLevel"
                    value={formData.childLevel}
                    onChange={handleChange}
                    style={styles.select}
                    required
                    disabled={loading}
                  >
                    <option value="">Sélectionner</option>
                    <option value="Primaire">Primaire</option>
                    <option value="Collège">Collège</option>
                    <option value="Lycée">Lycée</option>
                    <option value="Supérieur">Supérieur</option>
                  </select>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Matières souhaitées *</label>
                <div style={styles.subjectsGrid}>
                  {subjectsList.map((subject) => (
                    <label
                      key={subject}
                      style={{
                        ...styles.subjectCard,
                        ...(formData.subjects.includes(subject) ? styles.subjectCardSelected : {}),
                        ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                        style={styles.checkbox}
                        disabled={loading}
                      />
                      <span style={styles.subjectLabel}>{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Objectif</label>
                <div style={styles.subjectsGrid}>
                  {subjectsList2.map((subject) => (
                    <label
                      key={subject}
                      style={{
                        ...styles.subjectCard,
                        ...(formData.subjects.includes(subject) ? styles.subjectCardSelected : {}),
                        ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                        style={styles.checkbox}
                        disabled={loading}
                      />
                      <span style={styles.subjectLabel}>{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Disponibilités préférées</label>
                <textarea
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Ex: Lundi et mercredi après 17h, samedi matin..."
                  rows="3"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={styles.formButtons}>
            <button
              type="button"
              onClick={() => navigate('home')}
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
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <span>✓ Envoyer la demande</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ParentSignup;

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  header: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(253, 216, 53, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  logoCircle: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FDD835 0%, #8B3A93 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(253, 216, 53, 0.4)',
  },
  brandName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FDD835',
    margin: 0,
  },
  brandTagline: {
    fontSize: '12px',
    color: '#aaa',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
  },
  backButton: {
    padding: '10px 20px',
    background: 'rgba(139, 58, 147, 0.2)',
    border: '1px solid rgba(139, 58, 147, 0.3)',
    borderRadius: '10px',
    color: '#8B3A93',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  homeButton: {
    padding: '10px 20px',
    background: 'rgba(253, 216, 53, 0.1)',
    border: '1px solid rgba(253, 216, 53, 0.3)',
    borderRadius: '10px',
    color: '#FDD835',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  pageHeader: {
    maxWidth: '1400px',
    margin: '30px auto',
    padding: '0 20px',
  },
  pageHeaderContent: {
    textAlign: 'center',
    padding: '40px 20px',
    background: 'linear-gradient(135deg, rgba(139, 58, 147, 0.3) 0%, rgba(253, 216, 53, 0.2) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    border: '1px solid rgba(253, 216, 53, 0.2)',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FDD835',
    margin: '0 0 10px 0',
  },
  pageSubtitle: {
    fontSize: '16px',
    color: '#aaa',
    margin: 0,
  },
  formSection: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '0 20px 40px',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#ff6b6b',
    fontSize: '14px',
  },
  errorIcon: {
    fontSize: '20px',
  },
  formGroup: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    border: '1px solid rgba(253, 216, 53, 0.1)',
    overflow: 'hidden',
  },
  formGroupHeader: {
    background: 'rgba(139, 58, 147, 0.2)',
    padding: '20px 25px',
    borderBottom: '1px solid rgba(253, 216, 53, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  formGroupIcon: {
    fontSize: '24px',
  },
  formGroupTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FDD835',
    margin: 0,
  },
  formContent: {
    padding: '25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    color: '#aaa',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(253, 216, 53, 0.2)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 15px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(253, 216, 53, 0.2)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 15px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(253, 216, 53, 0.2)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  gridThree: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  subjectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  subjectCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 15px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '2px solid rgba(253, 216, 53, 0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  subjectCardSelected: {
    background: 'rgba(253, 216, 53, 0.1)',
    borderColor: 'rgba(253, 216, 53, 0.5)',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  subjectLabel: {
    fontSize: '13px',
    color: '#fff',
  },
  formButtons: {
    display: 'flex',
    gap: '15px',
    marginTop: '10px',
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(253, 216, 53, 0.2)',
    borderRadius: '12px',
    color: '#aaa',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  submitButton: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, #FDD835 0%, #FFC107 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#1a1a2e',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(253, 216, 53, 0.4)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(26, 26, 46, 0.3)',
    borderTop: '3px solid #1a1a2e',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  successContainer: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '0 20px',
  },
  successCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    border: '1px solid rgba(253, 216, 53, 0.2)',
    padding: '50px 40px',
    textAlign: 'center',
  },
  successIcon: {
    width: '80px',
    height: '80px',
    margin: '0 auto 25px',
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    color: '#fff',
    boxShadow: '0 8px 30px rgba(34, 197, 94, 0.4)',
  },
  successTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#FDD835',
    margin: '0 0 20px 0',
  },
  successMessage: {
    fontSize: '15px',
    color: '#aaa',
    lineHeight: '1.6',
    margin: '0 0 30px 0',
  },
  primaryButton: {
    width: '100%',
    padding: '14px 30px',
    background: 'linear-gradient(135deg, #FDD835 0%, #FFC107 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#1a1a2e',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(253, 216, 53, 0.4)',
    transition: 'all 0.3s ease',
  },
};