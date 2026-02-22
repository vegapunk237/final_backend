import { useState } from 'react';

// Configuration de l'API
const API_URL = 'http://127.0.0.1:8000/api';

// ============= TEACHER SIGNUP =============
const TeacherSignup = ({ navigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    zone: '',
    school: '',
    diplome: '',
    niveauAccepter: '',
    formatCours: '',
    MatiereNiveau: '',
    qualification: '',
    experience: '',
    subjects: [],
    availability: '',
    motivation: '',
    cvFile: null,
    // ← NOUVEAUX CHAMPS
    documents: [], // Tableau pour stocker les documents obligatoires
    acceptTerms: false,
    acceptVerification: false,
    acceptProfileSharing: false
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [diplomeFileName, setDiplomeFileName] = useState('');
  const [uploadedDocuments, setUploadedDocuments] = useState([]); // ← NOUVEAU

  const subjectsList = [
    'Mathématiques', 'Français', 'Anglais', 'Sciences', 'Histoire-Géo',
    'Physique-Chimie', 'Philosophie', 'Économie', 'Espagnol', 'Allemand',
    'SVT', 'Informatique'
  ];

  // ← NOUVEAU: Types de documents obligatoires
  const documentTypes = [
    { id: 'identity', label: 'Pièce d\'identité', required: true },
    { id: 'address', label: 'Justificatif de domicile', required: true },
    { id: 'rib', label: 'RIB pour paiement', required: true },
    { id: 'reference', label: 'Références/Lettres de recommandation', required: false },
    { id: 'diploma', label: 'Copie du diplôme', required: true }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    setError('');
  };

  // Gestion du CV
  const handleCvChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Le CV doit être au format PDF');
        e.target.value = '';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Le CV ne doit pas dépasser 5 MB');
        e.target.value = '';
        return;
      }
      
      setCvFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          cvFile: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ← NOUVELLE FONCTION: Gestion des documents obligatoires
  const handleDocumentChange = (e, docType) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Vérifier le type de fichier
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Format non supporté. Utilisez PDF, JPG, PNG ou DOC/DOCX');
      e.target.value = '';
      return;
    }
    
    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 10 MB');
      e.target.value = '';
      return;
    }

    // Vérifier qu'on n'a pas déjà 5 documents
    if (uploadedDocuments.length >= 5 && !uploadedDocuments.find(d => d.type === docType.id)) {
      setError('Maximum 5 documents autorisés');
      e.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const newDoc = {
        type: docType.label,
        file: event.target.result,
        fileName: file.name
      };

      // Remplacer si le document existe déjà, sinon ajouter
      setUploadedDocuments(prev => {
        const filtered = prev.filter(d => d.type !== docType.label);
        return [...filtered, newDoc];
      });

      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents.filter(d => d.type !== docType.label), newDoc]
      }));

      setError('');
    };
    reader.readAsDataURL(file);
  };

  // ← NOUVELLE FONCTION: Supprimer un document
  const removeDocument = (docType) => {
    setUploadedDocuments(prev => prev.filter(d => d.type !== docType));
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(d => d.type !== docType)
    }));
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
    if (!formData.fullName.trim()) {
      setError('Le nom complet est requis');
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
      setError('Le téléphone est requis');
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

    if (!formData.zone) {
      setError('La zone d\'enseignement est requise');
      return false;
    }
    
    if (!formData.qualification.trim()) {
      setError('Le diplôme est requis');
      return false;
    }
    
    if (!formData.experience) {
      setError('L\'expérience est requise');
      return false;
    }
    
    if (formData.subjects.length === 0) {
      setError('Veuillez sélectionner au moins une matière');
      return false;
    }
    
    if (!formData.motivation.trim()) {
      setError('La lettre de motivation est requise');
      return false;
    }
    
    if (!formData.cvFile) {
      setError('Le CV en PDF est requis');
      return false;
    }

    // ← NOUVELLE VALIDATION: Documents obligatoires
    if (formData.documents.length === 0) {
      setError('Vous devez télécharger au moins un document obligatoire');
      return false;
    }

    // Vérifier les documents obligatoires requis
    const requiredDocs = documentTypes.filter(d => d.required);
    const uploadedTypes = formData.documents.map(d => d.type);
    
    for (const reqDoc of requiredDocs) {
      if (!uploadedTypes.includes(reqDoc.label)) {
        setError(`Le document "${reqDoc.label}" est obligatoire`);
        return false;
      }
    }

    // ← NOUVELLE VALIDATION: Conditions générales
    if (!formData.acceptTerms) {
      setError('Vous devez accepter les Conditions Générales d\'Utilisation');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/teacher-requests/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          zone: formData.zone,
          school: formData.school,
          diplome: formData.diplome,
          email: formData.email,
          niveauAccepter: formData.niveauAccepter,
          formatCours: formData.formatCours,
          MatiereNiveau: formData.MatiereNiveau,
          phone: formData.phone,
          password: formData.password,
          qualification: formData.qualification,
          experience: formData.experience,
          subjects: formData.subjects,
          availability: formData.availability,
          motivation: formData.motivation,
          cvFile: formData.cvFile,
          cvFileName: cvFileName,
          // ← NOUVEAUX CHAMPS
          documents: formData.documents,
          acceptTerms: formData.acceptTerms,
          acceptVerification: formData.acceptVerification,
          acceptProfileSharing: formData.acceptProfileSharing
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Candidature enregistrée:', data.data);
        setSubmitted(true);
      } else {
        setError(data.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
      setError('Impossible de se connecter au serveur. Vérifiez que l\'API est démarrée.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.bgDecor1}></div>
        <div style={styles.bgDecor2}></div>
        
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Candidature envoyée !</h2>
          <p style={styles.successMessage}>
            Votre candidature a été transmise avec succès à notre équipe.
          </p>
          
          <div style={styles.infoBox}>
            <div style={styles.infoIcon}>📋</div>
            <div>
              <h4 style={styles.infoTitle}>Vérification en cours</h4>
              <p style={styles.infoText}>
                Votre profil et vos documents seront vérifiés sous <strong>48 à 72 heures</strong>.
                <br />
                Vous recevrez une notification par email une fois la vérification terminée.
              </p>
            </div>
          </div>

          <button onClick={() => navigate('home')} style={styles.homeButton}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.bgDecor1}></div>
      <div style={styles.bgDecor2}></div>

      <div style={styles.formWrapper}>
        <div style={styles.headerSection}>
          <div style={styles.logoContainer}>
            <div style={styles.logoCircle}>KH</div>
            <div style={styles.logoText}>
              <h1 style={styles.brandName}>KH PERFECTION</h1>
              <p style={styles.brandTagline}>Votre succès, notre mission</p>
            </div>
          </div>
          <h2 style={styles.pageTitle}>🎓 Candidature Enseignant</h2>
          <p style={styles.pageSubtitle}>Rejoignez notre équipe et partagez votre savoir</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div style={styles.formCard}>
          {/* SECTION 1: Informations personnelles */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>👤</span>
              Informations personnelles
            </h3>
            
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>📝 Nom complet *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Votre nom et prénom"
                  disabled={loading}
                />
              </div>

              <div style={styles.inputRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>📧 Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="votre@email.com"
                    disabled={loading}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>📱 Téléphone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="06 12 34 56 78"
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={styles.inputRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>🔒 Mot de passe *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>🔒 Confirmer *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>📍 Zone d'enseignement *</label>
                <select
                  name="zone"
                  value={formData.zone}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                >
                  <option value="">Sélectionner une zone</option>
                  <option value="Paris">Paris</option>
                  <option value="Marseille">Marseille</option>
                  <option value="Lyon">Lyon</option>
                  <option value="Toulouse">Toulouse</option>
                  <option value="Nice">Nice</option>
                  <option value="Nantes">Nantes</option>
                  <option value="Bordeaux">Bordeaux</option>
                  {/* Ajoutez toutes vos zones ici */}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Qualifications */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>🎓</span>
              Qualifications et expérience
            </h3>
            
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>📜 Diplôme le plus élevé *</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Ex: Master en Mathématiques"
                  disabled={loading}
                />
              </div>

              <div style={styles.inputRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>⏱️ Années d'expérience *</label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    style={styles.input}
                    disabled={loading}
                  >
                    <option value="">Sélectionner</option>
                    <option value="0-1">Moins d'1 an</option>
                    <option value="1-3">1 à 3 ans</option>
                    <option value="3-5">3 à 5 ans</option>
                    <option value="5-10">5 à 10 ans</option>
                    <option value="10+">Plus de 10 ans</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>🏫 École fréquentée</label>
                  <select
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    style={styles.input}
                    disabled={loading}
                  >
                    <option value="">Sélectionner</option>
                    <option value="HEC">HEC</option>
                    <option value="ESSEC">ESSEC</option>
                    <option value="Sciences Po Paris">Sciences Po Paris</option>
                    {/* Ajoutez toutes vos écoles ici */}
                  </select>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>📚 Matières enseignées * (min. 1)</label>
                <div style={styles.subjectsGrid}>
                  {subjectsList.map((subject) => (
                    <label
                      key={subject}
                      style={{
                        ...styles.subjectLabel,
                        ...(formData.subjects.includes(subject) ? styles.subjectLabelActive : {}),
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
                      <span style={styles.subjectText}>{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>🎯 Niveaux acceptés *</label>
                <select
                  name="niveauAccepter"
                  value={formData.niveauAccepter}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                >
                  <option value="">Sélectionner</option>
                  <option value="Primaire">Primaire</option>
                  <option value="Collège">Collège</option>
                  <option value="Lycée">Lycée</option>
                  <option value="Supérieur">Supérieur</option>
                  <option value="Prepa">Prépa</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>💻 Format des cours *</label>
                <select
                  name="formatCours"
                  value={formData.formatCours}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                >
                  <option value="">Sélectionner</option>
                  <option value="enligne">En ligne</option>
                  <option value="adomicile">À domicile</option>
                  <option value="special">Aux enfants spéciaux</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>📄 CV (PDF uniquement) *</label>
                <div style={styles.fileInputWrapper}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleCvChange}
                    style={styles.fileInput}
                    disabled={loading}
                    id="cvFile"
                  />
                  <label htmlFor="cvFile" style={styles.fileInputLabel}>
                    <span style={styles.fileIcon}>📎</span>
                    <span>{cvFileName || 'Choisir un fichier PDF'}</span>
                  </label>
                  {cvFileName && (
                    <div style={styles.fileInfo}>
                      <span style={styles.fileCheckIcon}>✓</span>
                      <span style={styles.fileNameText}>{cvFileName}</span>
                    </div>
                  )}
                </div>
                <p style={styles.fileHint}>Maximum 5 MB - Format PDF uniquement</p>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>🗓️ Disponibilités</label>
                <textarea
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  style={{...styles.input, minHeight: '80px'}}
                  placeholder="Ex: Lundi au vendredi après 16h, week-end disponible..."
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>✍️ Lettre de motivation *</label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  style={{...styles.input, minHeight: '120px'}}
                  placeholder="Parlez-nous de votre passion pour l'enseignement..."
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>📚 Matières et niveaux proposés</label>
                <textarea
                  name="MatiereNiveau"
                  value={formData.MatiereNiveau}
                  onChange={handleChange}
                  style={{...styles.input, minHeight: '100px'}}
                  placeholder="Ex: Mathématiques niveau Lycée, Physique niveau Collège..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* ← NOUVELLE SECTION: Documents obligatoires */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📎</span>
              Vérifications & documents OBLIGATOIRES
            </h3>
            
            <div style={styles.documentsInfo}>
              <p style={styles.documentsNote}>
                <strong>⚠️ Documents requis :</strong>
              </p>
              <ul style={styles.documentsList}>
                <li>✓ Pièce d'identité (CNI, Passeport)</li>
                <li>✓ Justificatif de domicile (- 3 mois)</li>
                <li>✓ RIB pour paiement</li>
                <li>✓ Copie du diplôme</li>
                <li>○ Références ou lettres de recommandation (optionnel)</li>
              </ul>
              <p style={styles.documentsHint}>
                📤 Importez jusqu'à 5 fichiers compatibles : PDF, document ou image. 10 MB max. par fichier.
              </p>
            </div>

            <div style={styles.formGrid}>
              {documentTypes.map((docType) => (
                <div key={docType.id} style={styles.inputGroup}>
                  <label style={styles.label}>
                    {docType.required ? '📎 ' : '📋 '}{docType.label} {docType.required && '*'}
                  </label>
                  
                  <div style={styles.fileInputWrapper}>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleDocumentChange(e, docType)}
                      style={styles.fileInput}
                      disabled={loading}
                      id={`doc-${docType.id}`}
                    />
                    <label htmlFor={`doc-${docType.id}`} style={styles.fileInputLabel}>
                      <span style={styles.fileIcon}>📎</span>
                      <span>
                        {uploadedDocuments.find(d => d.type === docType.label)?.fileName || 'Choisir un fichier'}
                      </span>
                    </label>
                    
                    {uploadedDocuments.find(d => d.type === docType.label) && (
                      <div style={styles.fileInfo}>
                        <span style={styles.fileCheckIcon}>✓</span>
                        <span style={styles.fileNameText}>
                          {uploadedDocuments.find(d => d.type === docType.label)?.fileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDocument(docType.label)}
                          style={styles.removeDocBtn}
                          disabled={loading}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <p style={styles.fileHint}>
                    {docType.required ? 'Obligatoire' : 'Optionnel'} - PDF, JPG, PNG, DOC/DOCX - Max 10 MB
                  </p>
                </div>
              ))}

              <div style={styles.uploadedCount}>
                📊 Documents téléchargés : {uploadedDocuments.length} / 5
              </div>
            </div>
          </div>

          {/* ← NOUVELLE SECTION: Conditions générales */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>📜</span>
              Conditions Générales d'Inscription
            </h3>

            <div style={styles.termsContainer}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  style={styles.checkboxInput}
                  disabled={loading}
                />
                <span style={styles.checkboxText}>
                  <strong>*</strong> J'ai lu et j'accepte les <a href="#" style={styles.link}>Conditions Générales d'Utilisation</a> et la <a href="#" style={styles.link}>Politique de Confidentialité</a>. 
                  En cochant cette case, je confirme comprendre que mon inscription entraîne l'acceptation de ces conditions et que mes données pourront être utilisées conformément à la réglementation en vigueur.
                </span>
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="acceptVerification"
                  checked={formData.acceptVerification}
                  onChange={handleChange}
                  style={styles.checkboxInput}
                  disabled={loading}
                />
                <span style={styles.checkboxText}>
                  J'autorise la vérification de mes informations et documents par l'équipe KH Perfection
                </span>
              </label>

              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="acceptProfileSharing"
                  checked={formData.acceptProfileSharing}
                  onChange={handleChange}
                  style={styles.checkboxInput}
                  disabled={loading}
                />
                <span style={styles.checkboxText}>
                  Je consens à la diffusion de mon profil enseignant auprès des parents d'élèves
                </span>
              </label>
            </div>

            <div style={styles.verificationNote}>
              <div style={styles.verificationIcon}>⏱️</div>
              <div>
                <strong>Délai de vérification :</strong>
                <p style={styles.verificationText}>
                  Votre profil sera vérifié sous 48 à 72h. Vous recevrez une notification par email une fois la validation terminée.
                </p>
              </div>
            </div>
          </div>

          <div style={styles.buttonRow}>
            <button
              type="button"
              onClick={() => navigate('home')}
              style={{
                ...styles.cancelButton,
                ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
              }}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                ...styles.submitButton,
                ...(loading ? { opacity: 0.8, cursor: 'wait' } : {})
              }}
              disabled={loading}
            >
              {loading ? '⏳ Envoi en cours...' : '📤 Envoyer la candidature'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default TeacherSignup;

const styles = {
  /* ================= CONTAINER ================= */
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #2b1055 50%, #6d28d9 100%)',
    padding: '40px 20px',
    position: 'relative',
    overflow: 'hidden',
  },

  /* ================= DECORATIONS ================= */
  bgDecor1: {
    position: 'absolute',
    top: '-120px',
    right: '-120px',
    width: '420px',
    height: '420px',
    background:
      'radial-gradient(circle, rgba(253,216,53,0.18) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'float 12s ease-in-out infinite',
  },

  bgDecor2: {
    position: 'absolute',
    bottom: '-160px',
    left: '-160px',
    width: '520px',
    height: '520px',
    background:
      'radial-gradient(circle, rgba(147,51,234,0.25) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'floatReverse 14s ease-in-out infinite',
  },

  /* ================= WRAPPER ================= */
  formWrapper: {
    maxWidth: '1000px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 10,
  },

  /* ================= HEADER ================= */
  headerSection: {
    textAlign: 'center',
    marginBottom: '35px',
  },

  logoContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '15px',
    padding: '16px 32px',
    borderRadius: '60px',
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(253,216,53,0.3)',
    marginBottom: '25px',
  },

  logoCircle: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FDD835, #9333EA)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#fff',
    boxShadow: '0 6px 20px rgba(253,216,53,0.5)',
  },

  logoText: { textAlign: 'left' },

  brandName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FDD835',
    margin: 0,
  },

  brandTagline: {
    fontSize: '12px',
    color: '#e5e7eb',
    margin: 0,
  },

  pageTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#FDD835',
    marginBottom: '10px',
  },

  pageSubtitle: {
    fontSize: '16px',
    color: '#d1d5db',
  },

  /* ================= FORM CARD ================= */
  formCard: {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(22px)',
    borderRadius: '26px',
    padding: '40px',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    animation: 'fadeInUp 0.8s ease',
  },

  /* ================= SECTIONS ================= */
  section: { marginBottom: '45px' },

  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#FDD835',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid rgba(253,216,53,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  sectionIcon: { fontSize: '24px' },

  /* ================= FORM ================= */
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  inputRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },

  inputGroup: { display: 'flex', flexDirection: 'column' },

  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FDD835',
    marginBottom: '6px',
  },

  input: {
    padding: '14px 16px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(253,216,53,0.3)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },

  /* ================= SUBJECTS ================= */
  subjectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
  },

  subjectLabel: {
    padding: '12px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(253,216,53,0.25)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
  },

  subjectLabelActive: {
    background: 'linear-gradient(135deg, rgba(253,216,53,0.35), rgba(147,51,234,0.35))',
    borderColor: '#FDD835',
  },

  checkbox: { cursor: 'pointer' },

  subjectText: { fontSize: '13px', color: '#fff' },

  /* ================= FILE ================= */
  fileInput: { display: 'none' },

  fileInputLabel: {
    padding: '14px',
    borderRadius: '14px',
    border: '2px dashed rgba(253,216,53,0.35)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#e5e7eb',
    transition: 'all 0.3s ease',
  },

  fileInfo: {
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#a7f3d0',
  },

  removeDocBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
  },

  /* ================= BUTTONS ================= */
  buttonRow: {
    display: 'flex',
    gap: '16px',
    marginTop: '30px',
  },

  cancelButton: {
    flex: 1,
    padding: '15px',
    borderRadius: '14px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(253,216,53,0.4)',
    color: '#FDD835',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  submitButton: {
    flex: 1,
    padding: '15px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #FDD835, #FFC107)',
    border: 'none',
    color: '#1a1a2e',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(253,216,53,0.5)',
    transition: 'all 0.3s ease',
  },

  /* ================= SUCCESS ================= */
  successContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e, #6d28d9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  successCard: {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
    padding: '50px',
    borderRadius: '26px',
    textAlign: 'center',
    maxWidth: '600px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },

  successIcon: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '42px',
    color: '#fff',
    margin: '0 auto 25px',
  },

  successTitle: {
    fontSize: '30px',
    fontWeight: '800',
    color: '#FDD835',
  },

  successMessage: {
    fontSize: '15px',
    color: '#e5e7eb',
    marginBottom: '25px',
  },

  homeButton: {
    width: '100%',
    padding: '15px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #FDD835, #FFC107)',
    border: 'none',
    color: '#1a1a2e',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
