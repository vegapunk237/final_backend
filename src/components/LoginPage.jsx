import { useState } from 'react';

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

const LoginPage = ({ navigate, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Données mockées pour la démo (Parent et Admin uniquement)
  const mockUsers = [
    { email: 'parent@demo.com', password: 'parent123', role: 'parent', name: 'Marie Dupont' },
    { email: 'admin@demo.com', password: 'admin123', role: 'admin', name: 'Administrateur' }
  ];

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // 1. Vérifier d'abord si c'est un compte parent ou admin (mock)
      const mockUser = mockUsers.find(u => u.email === email && u.password === password);
      
      if (mockUser) {
        setLoading(false);
        onLogin(mockUser);
        return;
      }

      // 2. Essayer de se connecter en tant qu'enseignant
      let response = await fetch(`${API_URL}/teacher-login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      let data = await response.json();

      // Si l'enseignant n'existe pas, essayer en tant que parent
      if (!data.success && response.status === 401) {
        console.log('🔄 Tentative de connexion en tant que parent...');
        response = await fetch(`${API_URL}/parent-login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        data = await response.json();
      }

      if (data.success) {
        // Connexion réussie
        console.log('✅ Connexion réussie:', data.data);
        onLogin(data.data);
      } else {
        // Erreur de connexion
        if (response.status === 403) {
          // Compte non approuvé
          setError(data.message || 'Votre inscription n\'a pas encore été approuvée');
        } else if (response.status === 401) {
          // Email ou mot de passe incorrect
          setError('Email ou mot de passe incorrect');
        } else {
          setError(data.message || 'Erreur de connexion');
        }
      }

    } catch (err) {
      console.error('❌ Erreur de connexion:', err);
      setError('Impossible de se connecter. Vérifiez que le serveur est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div style={styles.container}>
      {/* Background decorative elements */}
      <div style={styles.bgDecor1}></div>
      <div style={styles.bgDecor2}></div>

      <div style={styles.loginWrapper}>
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <div style={styles.logoContainer}>
            <div style={styles.logoCircle}>KH</div>
            <div style={styles.logoText}>
              <h1 style={styles.brandName}>KH PERFECTION</h1>
              <p style={styles.brandTagline}>Votre succès, notre mission</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.loginTitle}>Connexion</h2>
            <p style={styles.loginSubtitle}>Accédez à votre espace personnel</p>
          </div>

          <div style={styles.formContainer}>
            {/* Email Input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>📧 Email</label>
              <div style={styles.inputWrapper}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={styles.input}
                  placeholder="votre@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>🔒 Mot de passe</label>
              <div style={styles.inputWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={styles.input}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Demo Info */}
            <div style={styles.demoBox}>
              <p style={styles.demoNote}>
                💡 Les enseignants et les parents doivent d'abord soumettre une candidature et être approuvés par l'admin
              </p>
            </div>

            {/* Submit Button */}
            <button 
              onClick={handleSubmit} 
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonDisabled : {})
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span style={styles.buttonIcon}>🚀</span>
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Links */}
          <div style={styles.cardFooter}>
            <p style={styles.footerText}>Pas encore de compte ?</p>
            <div style={styles.footerLinks}>
              <button onClick={() => navigate('parent-signup')} style={styles.linkButton}>
                Inscription Parent
              </button>
              <span style={styles.separator}>|</span>
              <button onClick={() => navigate('teacher-signup')} style={styles.linkButton}>
                Inscription Enseignant
              </button>
            </div>
            <button onClick={() => navigate('home')} style={styles.backButton}>
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgDecor1: {
    position: 'absolute',
    top: '-100px',
    right: '-100px',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(253, 216, 53, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
  },
  bgDecor2: {
    position: 'absolute',
    bottom: '-150px',
    left: '-150px',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(139, 58, 147, 0.15) 0%, transparent 70%)',
    borderRadius: '50%',
  },
  loginWrapper: {
    width: '100%',
    maxWidth: '500px',
    position: 'relative',
    zIndex: 10,
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logoContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '15px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    padding: '15px 30px',
    borderRadius: '50px',
    border: '1px solid rgba(253, 216, 53, 0.2)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
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
  logoText: {
    textAlign: 'left',
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
  loginCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    borderRadius: '25px',
    border: '1px solid rgba(253, 216, 53, 0.1)',
    boxShadow: '0 15px 50px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  cardHeader: {
    background: 'linear-gradient(135deg, rgba(139, 58, 147, 0.3) 0%, rgba(253, 216, 53, 0.1) 100%)',
    padding: '30px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(253, 216, 53, 0.2)',
  },
  loginTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FDD835',
    margin: '0 0 10px 0',
  },
  loginSubtitle: {
    fontSize: '14px',
    color: '#aaa',
    margin: 0,
  },
  formContainer: {
    padding: '40px 30px',
  },
  inputGroup: {
    marginBottom: '25px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FDD835',
    marginBottom: '10px',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(253, 216, 53, 0.2)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    outline: 'none',
    boxSizing: 'border-box',
  },
  eyeButton: {
    position: 'absolute',
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '15px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#ff6b6b',
    fontSize: '14px',
  },
  errorIcon: {
    fontSize: '20px',
  },
  demoBox: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '25px',
  },
  demoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px',
  },
  demoIcon: {
    fontSize: '20px',
  },
  demoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#60a5fa',
  },
  demoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    marginBottom: '12px',
  },
  demoItem: {
    fontSize: '12px',
    color: '#93c5fd',
    marginBottom: '8px',
    paddingLeft: '20px',
  },
  demoRole: {
    fontWeight: '600',
    color: '#60a5fa',
  },
  demoNote: {
    fontSize: '11px',
    color: '#60a5fa',
    margin: 0,
    fontStyle: 'italic',
    paddingTop: '10px',
    borderTop: '1px solid rgba(59, 130, 246, 0.2)',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #FDD835 0%, #FFC107 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#1a1a2e',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    boxShadow: '0 4px 20px rgba(253, 216, 53, 0.4)',
    transition: 'all 0.3s ease',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  buttonIcon: {
    fontSize: '20px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(26, 26, 46, 0.3)',
    borderTop: '3px solid #1a1a2e',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  cardFooter: {
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '25px 30px',
    textAlign: 'center',
    borderTop: '1px solid rgba(253, 216, 53, 0.1)',
  },
  footerText: {
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '15px',
  },
  footerLinks: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '15px',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#FDD835',
    fontSize: '14px',
    cursor: 'pointer',
    textDecoration: 'underline',
    transition: 'color 0.3s ease',
  },
  separator: {
    color: '#555',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
  },
};
