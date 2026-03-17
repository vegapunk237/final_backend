import { useState } from 'react';

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

const TeacherSignup = ({ navigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Étape 1 — Infos personnelles
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    zone: '',
    school: '',

    // Étape 2 — Qualifications
    diplome: '',
    qualification: '',
    experience: '',
    niveauAccepter: '',
    formatCours: '',
    MatiereNiveau: '',
    subjects: [],
    availability: '',
    motivation: '',
    cvFile: null,
    cvFileName: '',

    // Étape 3 — Documents obligatoires
    documents: [],

    // Étape 4 — Consentements
    acceptTerms: false,
    acceptVerification: false,
    acceptProfileSharing: false,
  });

  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // ─── Données statiques ────────────────────────────────────────────────────
  const subjectsList = [
    'Mathématiques', 'Français', 'Anglais', 'Sciences', 'Histoire-Géo',
    'Physique-Chimie', 'Philosophie', 'Économie', 'Espagnol', 'Allemand',
    'SVT', 'Informatique',
  ];

  const zonesList = [
  // Villes d'origine
  'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice',
  'Nantes', 'Bordeaux', 'Strasbourg', 'Lille', 'Rennes',

  // Image 8
  'Troyes', 'Amiens', 'Levallois-Perret', 'Bondy', 'Brest',
  'La Rochelle', 'Tours', 'Montreuil', 'Cholet', 'Corbeil-Essonnes',
  'Melun', 'Le Havre',

  // Image 7
  'Bourg-en-Bresse', 'Metz', 'Colmar', 'Douai', 'Vannes',
  'Quimper', 'Alfortville', 'Suresnes', 'Mérignac', 'Châteauroux',
  'Beauvais', 'Valenciennes',

  // Image 6
  'Vitry-sur-Seine', 'Rouen', 'Bourges', 'Orléans', 'Sète',
  'Albi', 'Annecy', 'Clamart', 'Dijon', 'Rueil-Malmaison',
  'Noisy-le-Sec',

  // Image 5
  'Perpignan', 'Noisy-le-Grand', 'Montpellier', 'Béziers', 'Carcassonne',
  'Bayonne', 'Chambéry', 'Puteaux', 'Limoges', 'Mulhouse',
  'Ivry-sur-Seine', 'Clermont-Ferrand', 'Nanterre',

  // Image 4
  'Toulon', 'Versailles', 'Argenteuil', 'Aix-en-Provence', 'Tarbes',
  'Créteil', 'Grenoble', 'Bobigny', 'Le Mans', 'Caen',
  'Roubaix', 'Niort', 'Clichy',

  // Image 3
  'Villeurbanne', 'Nîmes', 'Neuilly-sur-Seine', 'Angoulême', 'Narbonne',
  'Aubervilliers', 'Boulogne-Billancourt', 'Pau', 'Boulogne-sur-Mer',
  'Cergy', 'Évry', 'Reims', 'Valence',

  // Image 2
  'Issy-les-Moulineaux', 'Poitiers', 'Dunkerque', 'Angers', 'Besançon',
  'Massy', 'Chartres', 'Compiègne', 'Blois', 'Nancy',
  'Calais', 'Fontenay-sous-Bois',

  // Image 1
  'Rosny-sous-Bois',
];

  const schoolsList = [
  // Écoles d'origine
  'HEC', 'ESSEC', 'Sciences Po Paris', 'Polytechnique', 'ENS',
  'CentraleSupélec', 'INSEAD', 'Sorbonne', 'Dauphine', 'Autre',

  // Image 6
  'AEMO', 'Agroparistech', 'AMU - Eco-droit', 'AMU - Neuronautes',
  'Audencia Nantes', 'Centrale Lille', 'Centrale Lyon', 'Centrale Marseille',
  'Centrale Nantes', 'Centrale Supéles',

  // Image 5
  'EBI', 'ECE', 'EDHEC', 'EIVP', 'EM Lyon', 'ENAC', 'ENS Ulm',
  'ENSAE', 'ENSAM Bordeaux', 'ENSAM Paris', 'ENSC', 'ENSEGID',

  // Image 4
  'ENSEIRB matmeca', 'ENSMAC', 'ENSTA', 'ENSTBB', 'ENVT', 'EPF',
  'EPISEN', 'EPITA', 'ESCP', 'ESF', 'ESIEE', 'ESILV', 'ESME - Sudria',

  // Image 3
  'ESPCI', 'ESTACA', 'ESTP', 'ICAM', 'IMT Atlantique',
  'IMT Atlantique Nantes', 'INSA Lyon', 'IPSA', 'ISAE-SUPMECA', 'ISEP', 'ISIT',

  // Image 2
  'ISUP', 'Magistère Bordeaux', 'Mines', 'Mines de Paris',
  'Médecine Paris cité', 'Polytech Marseille', 'Ponts et chaussées', 'PSL',
  'Sciences agro Bordeaux', 'Sciences Po Aix', 'Sciences Po Bordeaux',
  'Sciences Po Lille', 'Sciences Po Lyon',

  // Image 1
  'SciencesPoSaint-Germain', 'SUPAERO', 'Supaéro Toulouse',
  'Télécom', 'Université Catholique de Lille', 'Université scientifique',
];

  const documentTypes = [
    { id: 'identity',  label: "Pièce d'identité",              required: true  },
    { id: 'address',   label: 'Justificatif de domicile',       required: true  },
    { id: 'rib',       label: 'RIB pour paiement',              required: true  },
    { id: 'diploma',   label: 'Copie du diplôme',               required: true  },
    { id: 'reference', label: 'Lettres de recommandation',      required: false },
  ];

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleCvChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Le CV doit être au format PDF'); return; }
    if (file.size > 5 * 1024 * 1024)    { setError('Le CV ne doit pas dépasser 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setFormData(prev => ({
      ...prev, cvFile: ev.target.result, cvFileName: file.name,
    }));
    reader.readAsDataURL(file);
    setError('');
  };

  const handleDocumentChange = (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) { setError('Format non supporté. Utilisez PDF, JPG, PNG ou DOC'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Le fichier ne doit pas dépasser 10 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newDoc = { type: docType.label, file: ev.target.result, name: file.name, fileName: file.name };
      setUploadedDocuments(prev => [...prev.filter(d => d.type !== docType.label), newDoc]);
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents.filter(d => d.type !== docType.label), newDoc],
      }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (label) => {
    setUploadedDocuments(prev => prev.filter(d => d.type !== label));
    setFormData(prev => ({ ...prev, documents: prev.documents.filter(d => d.type !== label) }));
  };

  // ─── Validation par étape ─────────────────────────────────────────────────
  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.fullName.trim())  { setError('Le nom complet est requis'); return false; }
      if (!formData.email.trim())     { setError("L'email est requis"); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError("Format d'email invalide"); return false; }
      if (!formData.phone.trim())     { setError('Le téléphone est requis'); return false; }
      if (!formData.password)         { setError('Le mot de passe est requis'); return false; }
      if (formData.password.length < 6) { setError('Mot de passe : 6 caractères minimum'); return false; }
      if (formData.password !== formData.confirmPassword) { setError('Les mots de passe ne correspondent pas'); return false; }
      if (!formData.zone)             { setError("La zone d'enseignement est requise"); return false; }
    }
    if (step === 2) {
      if (!formData.qualification.trim()) { setError('Le diplôme est requis'); return false; }
      if (!formData.experience)           { setError("L'expérience est requise"); return false; }
      if (formData.subjects.length === 0) { setError('Sélectionnez au moins une matière'); return false; }
      if (!formData.motivation.trim())    { setError('La lettre de motivation est requise'); return false; }
      if (!formData.cvFile)               { setError('Le CV (PDF) est requis'); return false; }
    }
    if (step === 3) {
      const requiredDocs = documentTypes.filter(d => d.required).map(d => d.label);
      const uploadedTypes = formData.documents.map(d => d.type);
      for (const req of requiredDocs) {
        if (!uploadedTypes.includes(req)) { setError(`Document manquant : "${req}"`); return false; }
      }
    }
    if (step === 4) {
      if (!formData.acceptTerms) { setError('Vous devez accepter les CGU'); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) { setCurrentStep(p => Math.min(p + 1, totalSteps)); setError(''); }
  };
  const prevStep = () => { setCurrentStep(p => Math.max(p - 1, 1)); setError(''); };

  // ─── Soumission ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/teacher-requests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:             formData.fullName,
          email:                formData.email.trim().toLowerCase(),
          phone:                formData.phone,
          password:             formData.password,
          zone:                 formData.zone,
          school:               formData.school,
          diplome:              formData.diplome,
          qualification:        formData.qualification,
          experience:           formData.experience,
          niveauAccepter:       formData.niveauAccepter,
          formatCours:          formData.formatCours,
          MatiereNiveau:        formData.MatiereNiveau,
          subjects:             formData.subjects,
          availability:         formData.availability,
          motivation:           formData.motivation,
          cvFile:               formData.cvFile,
          cvFileName:           formData.cvFileName,
          documents:            formData.documents,
          acceptTerms:          formData.acceptTerms,
          acceptVerification:   formData.acceptVerification,
          acceptProfileSharing: formData.acceptProfileSharing,
        }),
      });
      const data = await res.json();
      console.log('📦 Réponse backend:', data);
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        let msg = data.message || "Erreur lors de l'enregistrement";
        if (data.errors) {
          const errs = Object.entries(data.errors)
            .map(([f, m]) => f + ': ' + (Array.isArray(m) ? m.join(', ') : m))
            .join(' | ');
          msg += ' — ' + errs;
        }
        console.error('❌ Erreur backend:', data);
        setError(msg);
      }
    } catch (err) {
      console.error('❌ Erreur réseau:', err);
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Écran succès ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.bgDecor1} /><div style={styles.bgDecor2} />
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Candidature envoyée !</h2>
          <p style={styles.successMessage}>
            Votre candidature a été transmise avec succès à notre équipe.
            <br />Votre profil sera vérifié sous <strong>48 à 72 heures</strong>.
          </p>
          <div style={styles.infoBox}>
            <div style={styles.infoIcon}>📋</div>
            <div>
              <h4 style={styles.infoTitle}>Vérification en cours</h4>
              <p style={styles.infoText}>
                Nos équipes vont analyser votre profil et vos documents.
                Vous recevrez une notification par email une fois la validation terminée.
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

  const stepLabels = ['Vos infos', 'Qualifications', 'Documents', 'Validation'];

  // ─── Rendu principal ──────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.bgDecor1} /><div style={styles.bgDecor2} />

      <div style={styles.formWrapper}>
        {/* ── Header ── */}
        <div style={styles.headerSection}>
          <div style={styles.logoContainer}>
            <div style={styles.logoCircle}>KH</div>
            <div style={styles.logoText}>
              <h1 style={styles.brandName}>KH PERFECTION</h1>
              <p style={styles.brandTagline}>Votre succès, notre mission</p>
            </div>
          </div>
          <h2 style={styles.pageTitle}>🎓 Candidature Enseignant</h2>
          <p style={styles.pageSubtitle}>Rejoignez notre équipe en {totalSteps} étapes</p>
        </div>

        {/* ── Barre de progression ── */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${(currentStep / totalSteps) * 100}%` }} />
          </div>
          <div style={styles.stepsIndicator}>
            {stepLabels.map((label, i) => (
              <div key={i} style={styles.stepItem}>
                <div style={{ ...styles.stepCircle, ...(currentStep >= i + 1 ? styles.stepCircleActive : {}) }}>
                  {currentStep > i + 1 ? '✓' : i + 1}
                </div>
                <span style={styles.stepLabel}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Erreur ── */}
        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div style={styles.formCard}>

          {/* ══════════════════════════════════════════════
              ÉTAPE 1 — Informations personnelles
          ══════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div style={styles.stepContent}>
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  <span style={styles.sectionIcon}>👤</span>
                  Informations personnelles
                </h3>
                <div style={styles.formGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>📝 Nom complet *</label>
                    <input type="text" name="fullName" value={formData.fullName}
                      onChange={handleChange} style={styles.input}
                      placeholder="Votre nom et prénom" disabled={loading} />
                  </div>

                  <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>📧 Email *</label>
                      <input type="email" name="email" value={formData.email}
                        onChange={handleChange} style={styles.input}
                        placeholder="votre@email.com" disabled={loading} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>📱 Téléphone *</label>
                      <input type="tel" name="phone" value={formData.phone}
                        onChange={handleChange} style={styles.input}
                        placeholder="06 12 34 56 78" disabled={loading} />
                    </div>
                  </div>

                  <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>🔒 Mot de passe *</label>
                      <input type="password" name="password" value={formData.password}
                        onChange={handleChange} style={styles.input}
                        placeholder="••••••••" disabled={loading} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>🔒 Confirmer *</label>
                      <input type="password" name="confirmPassword" value={formData.confirmPassword}
                        onChange={handleChange} style={styles.input}
                        placeholder="••••••••" disabled={loading} />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>📍 Zone d'enseignement *</label>
                    <select name="zone" value={formData.zone} onChange={handleChange}
                      style={styles.input} disabled={loading}>
                      <option value="">Sélectionner une zone</option>
                      {zonesList.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>🏫 École / Université</label>
                    <select name="school" value={formData.school} onChange={handleChange}
                      style={styles.input} disabled={loading}>
                      <option value="">Sélectionner (optionnel)</option>
                      {schoolsList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              ÉTAPE 2 — Qualifications
          ══════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div style={styles.stepContent}>
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  <span style={styles.sectionIcon}>🎓</span>
                  Qualifications & expérience
                </h3>
                <div style={styles.formGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>📜 Diplôme le plus élevé *</label>
                    <input type="text" name="qualification" value={formData.qualification}
                      onChange={handleChange} style={styles.input}
                      placeholder="Ex: Master en Mathématiques" disabled={loading} />
                  </div>

                  <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>⏱️ Années d'expérience *</label>
                      <select name="experience" value={formData.experience} onChange={handleChange}
                        style={styles.input} disabled={loading}>
                        <option value="">Sélectionner</option>
                        <option value="0-1">Moins d'1 an</option>
                        <option value="1-3">1 à 3 ans</option>
                        <option value="3-5">3 à 5 ans</option>
                        <option value="5-10">5 à 10 ans</option>
                        <option value="10+">Plus de 10 ans</option>
                      </select>
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>🎯 Niveaux acceptés</label>
                      <select name="niveauAccepter" value={formData.niveauAccepter} onChange={handleChange}
                        style={styles.input} disabled={loading}>
                        <option value="">Sélectionner</option>
                        <option value="Primaire">Primaire</option>
                        <option value="Collège">Collège</option>
                        <option value="Lycée">Lycée</option>
                        <option value="Supérieur">Supérieur</option>
                        <option value="Prepa">Prépa</option>
                        <option value="Tous niveaux">Tous niveaux</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>💻 Format des cours</label>
                    <select name="formatCours" value={formData.formatCours} onChange={handleChange}
                      style={styles.input} disabled={loading}>
                      <option value="">Sélectionner</option>
                      <option value="enligne">En ligne</option>
                      <option value="adomicile">À domicile</option>
                      <option value="lesdeux">Les deux</option>
                    </select>
                  </div>

                  {/* Matières sous forme de chips comme le formulaire parent */}
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>📚 Matières enseignées * (min. 1)</label>
                    <div style={styles.subjectsGrid}>
                      {subjectsList.map(subject => (
                        <label key={subject} style={{
                          ...styles.subjectLabel,
                          ...(formData.subjects.includes(subject) ? styles.subjectLabelActive : {}),
                          ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
                        }}>
                          <input type="checkbox" checked={formData.subjects.includes(subject)}
                            onChange={() => handleSubjectToggle(subject)}
                            style={styles.checkbox} disabled={loading} />
                          <span style={styles.subjectText}>{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>🗓️ Disponibilités</label>
                    <textarea name="availability" value={formData.availability}
                      onChange={handleChange}
                      style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                      placeholder="Ex: Lundi au vendredi après 16h, week-end disponible..."
                      disabled={loading} />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>📚 Matières & niveaux proposés en détail</label>
                    <textarea name="MatiereNiveau" value={formData.MatiereNiveau}
                      onChange={handleChange}
                      style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                      placeholder="Ex: Mathématiques Lycée, Physique Collège..."
                      disabled={loading} />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>✍️ Lettre de motivation *</label>
                    <textarea name="motivation" value={formData.motivation}
                      onChange={handleChange}
                      style={{ ...styles.input, minHeight: '130px', resize: 'vertical' }}
                      placeholder="Parlez-nous de votre passion pour l'enseignement..."
                      disabled={loading} />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>📄 CV (PDF uniquement) *</label>
                    <div style={styles.fileInputWrapper}>
                      <input type="file" accept=".pdf" onChange={handleCvChange}
                        style={styles.fileInput} disabled={loading} id="cvFile" />
                      <label htmlFor="cvFile" style={styles.fileInputLabel}>
                        <span style={styles.fileIcon}>📎</span>
                        <span>{formData.cvFileName || 'Choisir un fichier PDF'}</span>
                      </label>
                      {formData.cvFileName && (
                        <div style={styles.fileInfo}>
                          <span style={styles.fileCheckIcon}>✓</span>
                          <span style={styles.fileNameText}>{formData.cvFileName}</span>
                        </div>
                      )}
                    </div>
                    <p style={styles.fileHint}>Maximum 5 MB — Format PDF uniquement</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              ÉTAPE 3 — Documents obligatoires
          ══════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div style={styles.stepContent}>
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  <span style={styles.sectionIcon}>📎</span>
                  Documents obligatoires
                </h3>

                <div style={styles.documentsInfo}>
                  <p style={styles.documentsNote}>
                    <strong>⚠️ Documents requis pour valider votre candidature :</strong>
                  </p>
                  <ul style={styles.documentsList}>
                    {documentTypes.map(d => (
                      <li key={d.id}>
                        {d.required ? '✓' : '○'} {d.label} {d.required ? '' : '(optionnel)'}
                      </li>
                    ))}
                  </ul>
                  <p style={styles.documentsHint}>
                    📤 Formats acceptés : PDF, JPG, PNG, DOC/DOCX — Max 10 MB par fichier
                  </p>
                </div>

                <div style={styles.formGrid}>
                  {documentTypes.map(docType => {
                    const uploaded = uploadedDocuments.find(d => d.type === docType.label);
                    return (
                      <div key={docType.id} style={styles.inputGroup}>
                        <label style={styles.label}>
                          {docType.required ? '📎' : '📋'} {docType.label} {docType.required ? '*' : ''}
                        </label>
                        <div style={styles.fileInputWrapper}>
                          <input type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => handleDocumentChange(e, docType)}
                            style={styles.fileInput}
                            disabled={loading}
                            id={`doc-${docType.id}`} />
                          <label htmlFor={`doc-${docType.id}`}
                            style={{
                              ...styles.fileInputLabel,
                              ...(uploaded ? styles.fileInputLabelUploaded : {}),
                            }}>
                            <span style={styles.fileIcon}>{uploaded ? '✅' : '📎'}</span>
                            <span>{uploaded?.name || 'Choisir un fichier'}</span>
                          </label>
                          {uploaded && (
                            <div style={styles.fileInfo}>
                              <span style={styles.fileCheckIcon}>✓</span>
                              <span style={styles.fileNameText}>{uploaded.name}</span>
                              <button type="button"
                                onClick={() => removeDocument(docType.label)}
                                style={styles.removeDocBtn} disabled={loading}>✕</button>
                            </div>
                          )}
                        </div>
                        <p style={styles.fileHint}>
                          {docType.required ? 'Obligatoire' : 'Optionnel'} — PDF, JPG, PNG, DOC/DOCX — Max 10 MB
                        </p>
                      </div>
                    );
                  })}

                  {/* Compteur */}
                  <div style={styles.uploadedCount}>
                    📊 Documents téléchargés : <strong>{uploadedDocuments.length}</strong> / {documentTypes.length}
                    <div style={styles.docsProgressBar}>
                      <div style={{
                        ...styles.docsProgressFill,
                        width: `${(uploadedDocuments.length / documentTypes.length) * 100}%`,
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              ÉTAPE 4 — Récapitulatif & validation
          ══════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div style={styles.stepContent}>
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  <span style={styles.sectionIcon}>✅</span>
                  Récapitulatif de votre candidature
                </h3>

                <div style={styles.summaryBox}>
                  {/* Infos personnelles */}
                  <div style={styles.summarySection}>
                    <h4 style={styles.summaryTitle}>👤 Informations personnelles</h4>
                    <p style={styles.summaryText}>
                      <strong>{formData.fullName}</strong><br />
                      📧 {formData.email}<br />
                      📱 {formData.phone}<br />
                      📍 Zone : {formData.zone}
                      {formData.school && <><br />🏫 École : {formData.school}</>}
                    </p>
                  </div>

                  <div style={styles.summaryDivider} />

                  {/* Qualifications */}
                  <div style={styles.summarySection}>
                    <h4 style={styles.summaryTitle}>🎓 Qualifications</h4>
                    <p style={styles.summaryText}>
                      📜 Diplôme : {formData.qualification}<br />
                      ⏱️ Expérience : {formData.experience}<br />
                      {formData.niveauAccepter && <>🎯 Niveaux : {formData.niveauAccepter}<br /></>}
                      {formData.formatCours && <>💻 Format : {formData.formatCours}<br /></>}
                      📚 Matières : {formData.subjects.join(', ')}<br />
                      📄 CV : {formData.cvFileName || '—'}
                    </p>
                  </div>

                  <div style={styles.summaryDivider} />

                  {/* Documents */}
                  <div style={styles.summarySection}>
                    <h4 style={styles.summaryTitle}>📎 Documents</h4>
                    <p style={styles.summaryText}>
                      {uploadedDocuments.length === 0
                        ? 'Aucun document'
                        : uploadedDocuments.map(d => (
                          <span key={d.type}>✓ {d.type} — {d.name}<br /></span>
                        ))
                      }
                    </p>
                  </div>
                </div>

                {/* Conditions */}
                <h3 style={{ ...styles.sectionTitle, marginBottom: '20px' }}>
                  <span style={styles.sectionIcon}>📜</span>
                  Conditions Générales d'Inscription
                </h3>

                <div style={styles.termsContainer}>
                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms}
                      onChange={handleChange} style={styles.checkboxInput} disabled={loading} />
                    <span style={styles.checkboxText}>
                      <strong>*</strong> J'ai lu et j'accepte les{' '}
                      <a href="#" style={styles.link}>Conditions Générales d'Utilisation</a> et la{' '}
                      <a href="#" style={styles.link}>Politique de Confidentialité</a>.
                    </span>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" name="acceptVerification" checked={formData.acceptVerification}
                      onChange={handleChange} style={styles.checkboxInput} disabled={loading} />
                    <span style={styles.checkboxText}>
                      J'autorise la vérification de mes informations et documents par l'équipe KH Perfection.
                    </span>
                  </label>

                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" name="acceptProfileSharing" checked={formData.acceptProfileSharing}
                      onChange={handleChange} style={styles.checkboxInput} disabled={loading} />
                    <span style={styles.checkboxText}>
                      Je consens à la diffusion de mon profil enseignant auprès des parents d'élèves.
                    </span>
                  </label>
                </div>

                <div style={styles.verificationNote}>
                  <div style={styles.verificationIcon}>⏱️</div>
                  <div>
                    <strong style={{ color: '#FDD835' }}>Délai de vérification :</strong>
                    <p style={styles.verificationText}>
                      Votre profil sera vérifié sous 48 à 72h. Vous recevrez une notification
                      par email une fois la validation terminée.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div style={styles.buttonRow}>
            {currentStep > 1 && (
              <button onClick={prevStep}
                style={{ ...styles.cancelButton, ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                disabled={loading}>
                ← Précédent
              </button>
            )}
            {currentStep === 1 && (
              <button onClick={() => navigate('home')}
                style={{ ...styles.cancelButton }}>
                Annuler
              </button>
            )}
            {currentStep < totalSteps ? (
              <button onClick={nextStep}
                style={{ ...styles.submitButton, ...(loading ? { opacity: 0.8, cursor: 'wait' } : {}) }}
                disabled={loading}>
                Suivant →
              </button>
            ) : (
              <button onClick={handleSubmit}
                style={{ ...styles.submitButton, ...(loading ? { opacity: 0.8, cursor: 'wait' } : {}) }}
                disabled={loading}>
                {loading ? '⏳ Envoi en cours...' : '📤 Envoyer la candidature'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSignup;

// ═══════════════════════════════════════════════════════════════════════════════
//  STYLES — identiques au formulaire parent
// ═══════════════════════════════════════════════════════════════════════════════
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #2b1055 50%, #6d28d9 100%)',
    padding: '40px 20px', position: 'relative', overflow: 'hidden',
  },
  bgDecor1: {
    position: 'absolute', top: '-120px', right: '-120px',
    width: '420px', height: '420px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(253,216,53,0.18) 0%, transparent 70%)',
  },
  bgDecor2: {
    position: 'absolute', bottom: '-160px', left: '-160px',
    width: '520px', height: '520px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(147,51,234,0.25) 0%, transparent 70%)',
  },
  formWrapper: { maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 },

  headerSection: { textAlign: 'center', marginBottom: '35px' },
  logoContainer: {
    display: 'inline-flex', alignItems: 'center', gap: '15px',
    padding: '16px 32px', borderRadius: '60px',
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(253,216,53,0.3)', marginBottom: '25px',
  },
  logoCircle: {
    width: '52px', height: '52px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #FDD835, #9333EA)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', fontWeight: 'bold', color: '#fff',
    boxShadow: '0 6px 20px rgba(253,216,53,0.5)',
  },
  logoText: { textAlign: 'left' },
  brandName: { fontSize: '20px', fontWeight: 'bold', color: '#FDD835', margin: 0 },
  brandTagline: { fontSize: '12px', color: '#e5e7eb', margin: 0 },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#FDD835', marginBottom: '10px' },
  pageSubtitle: { fontSize: '16px', color: '#d1d5db' },

  progressContainer: { marginBottom: '30px' },
  progressBar: {
    width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)',
    borderRadius: '10px', overflow: 'hidden', marginBottom: '20px',
  },
  progressFill: {
    height: '100%', background: 'linear-gradient(90deg, #FDD835, #9333EA)',
    borderRadius: '10px', transition: 'width 0.5s ease',
  },
  stepsIndicator: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 },
  stepCircle: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(253,216,53,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', fontWeight: 'bold', color: '#999', transition: 'all 0.3s ease',
  },
  stepCircleActive: {
    background: 'linear-gradient(135deg, #FDD835, #9333EA)', borderColor: '#FDD835',
    color: '#fff', boxShadow: '0 4px 15px rgba(253,216,53,0.5)',
  },
  stepLabel: { fontSize: '12px', color: '#d1d5db', fontWeight: '600' },

  errorAlert: {
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: '14px', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: '12px',
    color: '#fca5a5', fontSize: '14px', marginBottom: '25px',
  },
  errorIcon: { fontSize: '20px' },

  formCard: {
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(22px)',
    borderRadius: '26px', padding: '40px',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  stepContent: {},

  section: { marginBottom: '30px' },
  sectionTitle: {
    fontSize: '20px', fontWeight: '700', color: '#FDD835',
    margin: '0 0 20px 0', paddingBottom: '12px',
    borderBottom: '2px solid rgba(253,216,53,0.3)',
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  sectionIcon: { fontSize: '24px' },

  formGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '14px', fontWeight: '600', color: '#FDD835', marginBottom: '6px' },
  input: {
    padding: '14px 16px', borderRadius: '12px',
    background: '#rgb(109 109 108 / 87%);)', border: '1px solid rgba(253,216,53,0.3)',
    color: 'black', fontSize: '14px', outline: 'none',
    transition: 'all 0.3s ease', width: '100%', boxSizing: 'border-box',
  },
  fileHint: { fontSize: '12px', color: '#9ca3af', marginTop: '5px' },

  subjectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' },
  subjectLabel: {
    padding: '12px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(253,216,53,0.25)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
    transition: 'all 0.3s ease',
  },
  subjectLabelActive: {
    background: 'linear-gradient(135deg, rgba(253,216,53,0.35), rgba(147,51,234,0.35))',
    borderColor: '#FDD835',
  },
  checkbox: { cursor: 'pointer' },
  subjectText: { fontSize: '13px', color: '#fff' },

  fileInputWrapper: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fileInput: { display: 'none' },
  fileInputLabel: {
    padding: '14px', borderRadius: '14px',
    border: '2px dashed rgba(253,216,53,0.35)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
    color: '#e5e7eb', transition: 'all 0.3s ease',
  },
  fileInputLabelUploaded: {
    border: '2px dashed rgba(34,197,94,0.5)',
    background: 'rgba(34,197,94,0.05)',
  },
  fileIcon: { fontSize: '20px' },
  fileInfo: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', color: '#a7f3d0',
  },
  fileCheckIcon: { color: '#22c55e', fontWeight: 'bold' },
  fileNameText: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  removeDocBtn: {
    background: 'transparent', border: 'none',
    color: '#ef4444', cursor: 'pointer', fontSize: '16px',
  },

  documentsInfo: {
    background: 'rgba(253,216,53,0.06)', borderRadius: '14px', padding: '18px',
    border: '1px solid rgba(253,216,53,0.2)', marginBottom: '24px',
  },
  documentsNote: { color: '#FDD835', fontWeight: '600', marginBottom: '10px', fontSize: '14px' },
  documentsList: { color: '#d1d5db', fontSize: '13px', lineHeight: '2', paddingLeft: '16px', margin: '0 0 10px 0' },
  documentsHint: { color: '#9ca3af', fontSize: '12px', margin: 0 },
  uploadedCount: {
    padding: '16px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(253,216,53,0.2)',
    color: '#FDD835', fontSize: '14px',
  },
  docsProgressBar: {
    width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)',
    borderRadius: '999px', overflow: 'hidden', marginTop: '10px',
  },
  docsProgressFill: {
    height: '100%', background: 'linear-gradient(90deg, #FDD835, #22c55e)',
    borderRadius: '999px', transition: 'width 0.4s ease',
  },

  summaryBox: {
    background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
    padding: '25px', border: '1px solid rgba(253,216,53,0.2)', marginBottom: '30px',
  },
  summarySection: { marginBottom: '20px' },
  summaryTitle: { fontSize: '16px', fontWeight: '700', color: '#FDD835', marginBottom: '12px' },
  summaryText: { fontSize: '14px', color: '#d1d5db', lineHeight: '1.8', margin: 0 },
  summaryDivider: { height: '1px', background: 'rgba(253,216,53,0.2)', marginBottom: '20px' },

  termsContainer: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '25px' },
  checkboxLabel: { display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' },
  checkboxInput: { marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 },
  checkboxText: { fontSize: '14px', color: '#d1d5db', lineHeight: '1.6' },
  link: { color: '#FDD835', textDecoration: 'underline' },
  verificationNote: {
    background: 'rgba(59,130,246,0.1)', borderRadius: '14px', padding: '18px',
    display: 'flex', alignItems: 'flex-start', gap: '15px',
    border: '1px solid rgba(59,130,246,0.3)',
  },
  verificationIcon: { fontSize: '28px', flexShrink: 0 },
  verificationText: { fontSize: '13px', color: '#bfdbfe', lineHeight: '1.6', margin: '5px 0 0 0' },

  buttonRow: { display: 'flex', gap: '16px', marginTop: '30px' },
  cancelButton: {
    flex: 1, padding: '15px', borderRadius: '14px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.4)',
    color: '#FDD835', fontWeight: '600', fontSize: '15px', cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  submitButton: {
    flex: 1, padding: '15px', borderRadius: '14px',
    background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none',
    color: '#1a1a2e', fontWeight: '700', fontSize: '15px', cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(253,216,53,0.5)', transition: 'all 0.3s ease',
  },

  successContainer: {
    minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e, #6d28d9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', padding: '20px',
  },
  successCard: {
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
    padding: '50px', borderRadius: '26px', textAlign: 'center', maxWidth: '600px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)', position: 'relative', zIndex: 10,
  },
  successIcon: {
    width: '90px', height: '90px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '42px', color: '#fff', margin: '0 auto 25px',
    boxShadow: '0 8px 30px rgba(34,197,94,0.5)',
  },
  successTitle: { fontSize: '30px', fontWeight: '800', color: '#FDD835', marginBottom: '15px' },
  successMessage: { fontSize: '15px', color: '#e5e7eb', lineHeight: '1.7', marginBottom: '25px' },
  infoBox: {
    background: 'rgba(59,130,246,0.1)', borderRadius: '16px', padding: '20px',
    display: 'flex', alignItems: 'flex-start', gap: '15px',
    border: '1px solid rgba(59,130,246,0.3)', marginBottom: '30px', textAlign: 'left',
  },
  infoIcon: { fontSize: '32px' },
  infoTitle: { fontSize: '16px', fontWeight: '700', color: '#FDD835', marginBottom: '8px' },
  infoText: { fontSize: '14px', color: '#bfdbfe', lineHeight: '1.6', margin: 0 },
  homeButton: {
    width: '100%', padding: '15px', borderRadius: '14px',
    background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none',
    color: '#1a1a2e', fontWeight: '700', fontSize: '16px', cursor: 'pointer',
    boxShadow: '0 8px 30px rgba(253,216,53,0.5)', transition: 'all 0.3s ease',
  },
};
