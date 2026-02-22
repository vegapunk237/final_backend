import { useState } from 'react';

import './animations.css';

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

const ParentSignup = ({ navigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Informations parent
    parentFirstName: '',
    parentLastName: '',
    email: '',
    phone: '',
    postalCode: '',
    address: '',          // NEW: Adresse complète
    password: '',
    confirmPassword: '',
    message: '',          // NEW: Message / Précisions complémentaires

    // Enfants (array pour gérer plusieurs)
    children: [
      {
        id: 1,
        firstName: '',
        lastName: '',
        level: '',
        subjects: [],
        formula: '',
        // Availability now split into structured fields:
        preferredDays: [],    // NEW
        preferredSlots: [],   // NEW
        // New child fields:
        objectives: [],       // NEW
        specificNeeds: [],    // NEW
        interests: [],        // NEW
        mindset: [],          // NEW
      }
    ],

    // Options
    acceptTerms: false
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Static data ────────────────────────────────────────────────────────────

  const levelsList = [
    'PRIMAIRE', '6EME', '5EME', '4EME', '3EME', '2NDE',
    'PREMIERE', 'TERMINAL', 'PREPA', 'SUPERIEUR', 'BAC', 'AUTRE'
  ];

  const subjectsList = [
    'Mathématique', 'Anglais', 'Français', 'Aide aux devoirs',
    'Préparation aux examens', 'Physique chimie', 'Droit',
    'Histoire-géographie', 'Espagnol', 'Allemand',
    'Accompagnement Orientation', 'Économie (SES)', 'Biologie (SVT)',
    'Philosophie', 'Accompagnement Parcoursup', 'Chimie',
    'Informatique', 'Italien', 'Langues', 'Médecine', 'Orthographe'
  ];

  const formulasList = [
    { value: 'enligne',       label: 'Cours particulier en ligne' },
    { value: 'adomicile',     label: 'Cours à domicile (crédit d\'impôt -50%)' },
    { value: 'stage',         label: 'Stage intensif (5 à 30 jours)' },
    { value: 'pasencoresur',  label: 'Je ne sais pas encore' }
  ];

  // NEW lists
  const objectivesList = [
    'Mieux apprendre / Méthodologie',
    'Réussir un examen',
    'Combler des lacunes',
    'Gérer son stress',
    'Rattraper un retard',
    'Améliorer la concentration',
    'Suivre le programme scolaire'
  ];

  const specificNeedsList = [
    'Aucun', 'Dyslexie', 'Dyscalculie', 'Dysgraphie', 'TDAH', 'Autisme', 'HPI'
  ];

  const interestsList = [
    'Sport', 'Voyages', 'Nature / Animaux', 'Jeux Vidéo',
    'Art', 'Technologie', 'Rien de spécifique'
  ];

  const daysList = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const slotsList = ['Matin', 'Après-midi', 'Soir (après les cours)'];

  const mindsetList = [
    'Stressé ou anxieux face aux évaluations',
    'Manque de confiance en ses capacités',
    'Curieux et prêt à s\'engager activement',
    'En recherche d\'autonomie (besoin d\'être responsabilisé)',
    'RAS (Rien de spécifique)'
  ];

  const totalSteps = 3;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleChildChange = (childId, field, value) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map(child =>
        child.id === childId ? { ...child, [field]: value } : child
      )
    }));
    setError('');
  };

  /** Toggle an item inside a child's array field (subjects, objectives, etc.) */
  const handleChildArrayToggle = (childId, field, item) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map(child => {
        if (child.id !== childId) return child;
        const arr = child[field];
        const next = arr.includes(item)
          ? arr.filter(v => v !== item)
          : [...arr, item];
        return { ...child, [field]: next };
      })
    }));
  };

  // Legacy alias kept for backwards compat with existing JSX below
  const handleChildSubjectToggle = (childId, subject) =>
    handleChildArrayToggle(childId, 'subjects', subject);

  const addChild = () => {
    const newId = Math.max(...formData.children.map(c => c.id), 0) + 1;
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, {
        id: newId,
        firstName: '',
        lastName: '',
        level: '',
        subjects: [],
        formula: '',
        preferredDays: [],
        preferredSlots: [],
        objectives: [],
        specificNeeds: [],
        interests: [],
        mindset: [],
      }]
    }));
  };

  const removeChild = (childId) => {
    if (formData.children.length > 1) {
      setFormData(prev => ({
        ...prev,
        children: prev.children.filter(c => c.id !== childId)
      }));
    }
  };

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.parentFirstName.trim()) { setError('Le prénom du parent est requis'); return false; }
      if (!formData.parentLastName.trim())  { setError('Le nom du parent est requis');    return false; }
      if (!formData.email.trim())           { setError('L\'email est requis');             return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Format d\'email invalide'); return false;
      }
      if (!formData.phone.trim())    { setError('Le téléphone est requis');                           return false; }
      if (!formData.password)        { setError('Le mot de passe est requis');                        return false; }
      if (formData.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return false; }
      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas'); return false;
      }
    }

    if (step === 2) {
      for (const child of formData.children) {
        if (!child.firstName.trim()) { setError('Le prénom de l\'enfant est requis'); return false; }
        if (!child.lastName.trim())  { setError('Le nom de l\'enfant est requis');    return false; }
        if (!child.level)            { setError(`Le niveau scolaire est requis pour ${child.firstName || 'l\'enfant'}`); return false; }
        if (child.subjects.length === 0) { setError(`Veuillez sélectionner au moins une matière pour ${child.firstName || 'l\'enfant'}`); return false; }
        if (!child.formula)          { setError(`Veuillez sélectionner une formule pour ${child.firstName || 'l\'enfant'}`); return false; }
      }
      const needsAddress = formData.children.some(c => c.formula === 'adomicile');
      if (needsAddress && !formData.address.trim() && !formData.postalCode.trim()) {
        setError('L\'adresse est requise pour les cours à domicile'); return false;
      }
    }

    if (step === 3) {
      if (!formData.acceptTerms) {
        setError('Vous devez accepter les Conditions Générales d\'Utilisation'); return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setError('');
    }
  };

  const prevStep = () => { setCurrentStep(prev => Math.max(prev - 1, 1)); setError(''); };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/parent-requests/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentFirstName: formData.parentFirstName.trim(),
          parentLastName:  formData.parentLastName.trim(),
          email:           formData.email.trim().toLowerCase(),
          phone:           formData.phone.trim(),
          postalCode:      formData.postalCode.trim(),
          address:         formData.address.trim(),
          message:         formData.message.trim(),
          password:        formData.password,
          children: formData.children.map(child => ({
            firstName:    child.firstName.trim(),
            lastName:     child.lastName.trim(),
            level:        child.level,
            subjects:     child.subjects,
            formula:      child.formula,
            preferredDays:  child.preferredDays,
            preferredSlots: child.preferredSlots,
            objectives:   child.objectives,
            specificNeeds: child.specificNeeds,
            interests:    child.interests,
            mindset:      child.mindset,
          })),
          acceptTerms: formData.acceptTerms
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

  // ─── Success screen ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={styles.successContainer}>
        <div style={styles.bgDecor1}></div>
        <div style={styles.bgDecor2}></div>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Demande envoyée avec succès !</h2>
          <p style={styles.successMessage}>
            Votre demande de cours a été transmise avec succès à notre équipe.
            <br />
            Vous recevrez votre devis personnalisé sous <strong>24 à 48 heures</strong> par email.
          </p>
          <div style={styles.infoBox}>
            <div style={styles.infoIcon}>📧</div>
            <div>
              <h4 style={styles.infoTitle}>Prochaines étapes</h4>
              <p style={styles.infoText}>
                Notre équipe va analyser vos besoins et vous proposer les enseignants les plus adaptés.
                <br />
                Un conseiller pédagogique vous contactera pour finaliser votre inscription.
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

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      <div style={styles.bgDecor1}></div>
      <div style={styles.bgDecor2}></div>

      <div style={styles.formWrapper}>
        {/* Header */}
        <div style={styles.headerSection}>
          <div style={styles.logoContainer}>
            <div style={styles.logoCircle}>KH</div>
            <div style={styles.logoText}>
              <h1 style={styles.brandName}>KH PERFECTION</h1>
              <p style={styles.brandTagline}>Votre succès, notre mission</p>
            </div>
          </div>
          <h2 style={styles.pageTitle}>👨‍👩‍👧 Demande de Cours</h2>
          <p style={styles.pageSubtitle}>Obtenez votre devis personnalisé en 3 étapes</p>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${(currentStep / totalSteps) * 100}%` }}></div>
          </div>
          <div style={styles.stepsIndicator}>
            {[1, 2, 3].map(step => (
              <div key={step} style={styles.stepItem}>
                <div style={{ ...styles.stepCircle, ...(currentStep >= step ? styles.stepCircleActive : {}) }}>
                  {step}
                </div>
                <span style={styles.stepLabel}>
                  {step === 1 && 'Vos infos'}
                  {step === 2 && 'Vos enfants'}
                  {step === 3 && 'Validation'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div style={styles.formCard}>

          {/* ═══════════════ ÉTAPE 1: Informations Parent ═══════════════ */}
          {currentStep === 1 && (
            <div style={styles.stepContent}>
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  <span style={styles.sectionIcon}>👤</span>
                  Vos informations de contact
                </h3>

                <div style={styles.formGrid}>
                  <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>📝 Prénom *</label>
                      <input type="text" name="parentFirstName" value={formData.parentFirstName}
                        onChange={handleChange} style={styles.input} placeholder="Votre prénom" disabled={loading} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>📝 Nom *</label>
                      <input type="text" name="parentLastName" value={formData.parentLastName}
                        onChange={handleChange} style={styles.input} placeholder="Votre nom" disabled={loading} />
                    </div>
                  </div>

                  <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>📧 Email *</label>
                      <input type="email" name="email" value={formData.email}
                        onChange={handleChange} style={styles.input} placeholder="votre@email.com" disabled={loading} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>📱 Téléphone *</label>
                      <input type="tel" name="phone" value={formData.phone}
                        onChange={handleChange} style={styles.input} placeholder="06 12 34 56 78" disabled={loading} />
                    </div>
                  </div>

                  {/* NEW: Full address */}
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>🏠 Adresse du domicile</label>
                    <input type="text" name="address" value={formData.address}
                      onChange={handleChange} style={styles.input}
                      placeholder="Ex: 12 rue de la Paix, 75001 Paris"
                      disabled={loading} />
                    <p style={styles.fileHint}>Requise pour les cours à domicile (éligible au crédit d'impôt -50%)</p>
                  </div>

                  {/* Keep postal code for legacy / quick lookup */}
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>📮 Code postal</label>
                    <input type="text" name="postalCode" value={formData.postalCode}
                      onChange={handleChange} style={styles.input}
                      placeholder="Ex: 75001" disabled={loading} />
                  </div>

                  <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>🔒 Mot de passe *</label>
                      <input type="password" name="password" value={formData.password}
                        onChange={handleChange} style={styles.input} placeholder="••••••••" disabled={loading} />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>🔒 Confirmer le mot de passe *</label>
                      <input type="password" name="confirmPassword" value={formData.confirmPassword}
                        onChange={handleChange} style={styles.input} placeholder="••••••••" disabled={loading} />
                    </div>
                  </div>

                  {/* NEW: Message */}
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>💬 Message / Précisions complémentaires</label>
                    <textarea name="message" value={formData.message} onChange={handleChange}
                      style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                      placeholder="Utilisez cet espace pour toute demande spécifique ou information complémentaire..."
                      disabled={loading} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ ÉTAPE 2: Informations Enfants ═══════════════ */}
          {currentStep === 2 && (
            <div style={styles.stepContent}>
              {formData.children.map((child, index) => (
                <div key={child.id} style={styles.childSection}>
                  <div style={styles.childHeader}>
                    <h3 style={styles.sectionTitle}>
                      <span style={styles.sectionIcon}>👶</span>
                      Enfant {index + 1}
                    </h3>
                    {formData.children.length > 1 && (
                      <button onClick={() => removeChild(child.id)} style={styles.removeChildBtn} disabled={loading}>
                        ✕ Retirer
                      </button>
                    )}
                  </div>

                  <div style={styles.formGrid}>
                    {/* Name */}
                    <div style={styles.inputRow}>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>📝 Prénom de l'enfant *</label>
                        <input type="text" value={child.firstName}
                          onChange={(e) => handleChildChange(child.id, 'firstName', e.target.value)}
                          style={styles.input} placeholder="Prénom" disabled={loading} />
                      </div>
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>📝 Nom de l'enfant *</label>
                        <input type="text" value={child.lastName}
                          onChange={(e) => handleChildChange(child.id, 'lastName', e.target.value)}
                          style={styles.input} placeholder="Nom" disabled={loading} />
                      </div>
                    </div>

                    {/* Level */}
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>🎓 Niveau scolaire *</label>
                      <div style={styles.levelsGrid}>
                        {levelsList.map((level) => (
                          <label key={level} style={{
                            ...styles.levelCard,
                            ...(child.level === level ? styles.levelCardActive : {}),
                            ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                          }}>
                            <input type="radio" name={`level-${child.id}`}
                              checked={child.level === level}
                              onChange={() => handleChildChange(child.id, 'level', level)}
                              style={styles.radioInput} disabled={loading} />
                            <span style={styles.levelText}>{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Subjects */}
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>📚 Matière(s) souhaitée(s) * (minimum 1)</label>
                      <div style={styles.subjectsGrid}>
                        {subjectsList.map((subject) => (
                          <label key={subject} style={{
                            ...styles.subjectLabel,
                            ...(child.subjects.includes(subject) ? styles.subjectLabelActive : {}),
                            ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                          }}>
                            <input type="checkbox" checked={child.subjects.includes(subject)}
                              onChange={() => handleChildSubjectToggle(child.id, subject)}
                              style={styles.checkbox} disabled={loading} />
                            <span style={styles.subjectText}>{subject}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Formula */}
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>💻 Formule de cours *</label>
                      <div style={styles.formulaGrid}>
                        {formulasList.map((formula) => (
                          <label key={formula.value} style={{
                            ...styles.formulaCard,
                            ...(child.formula === formula.value ? styles.formulaCardActive : {}),
                            ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                          }}>
                            <input type="radio" name={`formula-${child.id}`}
                              checked={child.formula === formula.value}
                              onChange={() => handleChildChange(child.id, 'formula', formula.value)}
                              style={styles.radioInput} disabled={loading} />
                            <span style={styles.formulaText}>{formula.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* NEW: Preferred Days */}
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>📅 Jours de préférence</label>
                      <div style={styles.tagsRow}>
                        {daysList.map((day) => (
                          <label key={day} style={{
                            ...styles.tagChip,
                            ...(child.preferredDays.includes(day) ? styles.tagChipActive : {}),
                            ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                          }}>
                            <input type="checkbox" checked={child.preferredDays.includes(day)}
                              onChange={() => handleChildArrayToggle(child.id, 'preferredDays', day)}
                              style={styles.checkbox} disabled={loading} />
                            <span style={styles.tagText}>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* NEW: Preferred Time Slots */}
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>🕐 Créneaux horaires préférés</label>
                      <div style={styles.tagsRow}>
                        {slotsList.map((slot) => (
                          <label key={slot} style={{
                            ...styles.tagChip,
                            ...(child.preferredSlots.includes(slot) ? styles.tagChipActive : {}),
                            ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                          }}>
                            <input type="checkbox" checked={child.preferredSlots.includes(slot)}
                              onChange={() => handleChildArrayToggle(child.id, 'preferredSlots', slot)}
                              style={styles.checkbox} disabled={loading} />
                            <span style={styles.tagText}>{slot}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* NEW: Objectives */}
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>🎯 Objectifs pédagogiques (plusieurs choix possibles)</label>
                      <div style={styles.subjectsGrid}>
                        {objectivesList.map((obj) => (
                          <label key={obj} style={{
                            ...styles.subjectLabel,
                            ...(child.objectives.includes(obj) ? styles.subjectLabelActive : {}),
                            ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                          }}>
                            <input type="checkbox" checked={child.objectives.includes(obj)}
                              onChange={() => handleChildArrayToggle(child.id, 'objectives', obj)}
                              style={styles.checkbox} disabled={loading} />
                            <span style={styles.subjectText}>{obj}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* NEW: Specific Needs */}
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>🧩 Besoins spécifiques / Profil atypique</label>
                      <div style={styles.tagsRow}>
                        {specificNeedsList.map((need) => (
                          <label key={need} style={{
                            ...styles.tagChip,
                            ...(child.specificNeeds.includes(need) ? styles.tagChipActive : {}),
                            ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                          }}>
                            <input type="checkbox" checked={child.specificNeeds.includes(need)}
                              onChange={() => handleChildArrayToggle(child.id, 'specificNeeds', need)}
                              style={styles.checkbox} disabled={loading} />
                            <span style={styles.tagText}>{need}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* NEW: Interests */}
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>⭐ Centres d'intérêt de l'élève</label>
                      <div style={styles.tagsRow}>
                        {interestsList.map((interest) => (
                          <label key={interest} style={{
                            ...styles.tagChip,
                            ...(child.interests.includes(interest) ? styles.tagChipActive : {}),
                            ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                          }}>
                            <input type="checkbox" checked={child.interests.includes(interest)}
                              onChange={() => handleChildArrayToggle(child.id, 'interests', interest)}
                              style={styles.checkbox} disabled={loading} />
                            <span style={styles.tagText}>{interest}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* NEW: Mindset */}
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>🧠 État d'esprit actuel de l'élève</label>
                      <div style={styles.subjectsGrid}>
                        {mindsetList.map((state) => (
                          <label key={state} style={{
                            ...styles.subjectLabel,
                            ...(child.mindset.includes(state) ? styles.subjectLabelActive : {}),
                            ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                          }}>
                            <input type="checkbox" checked={child.mindset.includes(state)}
                              onChange={() => handleChildArrayToggle(child.id, 'mindset', state)}
                              style={styles.checkbox} disabled={loading} />
                            <span style={styles.subjectText}>{state}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addChild} style={styles.addChildBtn}
                disabled={loading || formData.children.length >= 5}>
                ➕ Ajouter un autre enfant
              </button>
              {formData.children.length >= 5 && (
                <p style={styles.fileHint}>Maximum 5 enfants par demande</p>
              )}
            </div>
          )}

          {/* ═══════════════ ÉTAPE 3: Validation ═══════════════ */}
          {currentStep === 3 && (
            <div style={styles.stepContent}>
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                  <span style={styles.sectionIcon}>✅</span>
                  Récapitulatif de votre demande
                </h3>

                <div style={styles.summaryBox}>
                  {/* Parent info */}
                  <div style={styles.summarySection}>
                    <h4 style={styles.summaryTitle}>👤 Vos informations</h4>
                    <p style={styles.summaryText}>
                      <strong>{formData.parentFirstName} {formData.parentLastName}</strong><br />
                      📧 {formData.email}<br />
                      📱 {formData.phone}
                      {formData.address && (<><br />🏠 {formData.address}</>)}
                      {formData.postalCode && !formData.address && (<><br />📮 Code postal : {formData.postalCode}</>)}
                      {formData.message && (<><br />💬 {formData.message}</>)}
                    </p>
                  </div>

                  <div style={styles.summaryDivider}></div>

                  {/* Children info */}
                  {formData.children.map((child, index) => (
                    <div key={child.id} style={styles.summarySection}>
                      <h4 style={styles.summaryTitle}>👶 Enfant {index + 1}</h4>
                      <p style={styles.summaryText}>
                        <strong>{child.firstName} {child.lastName}</strong><br />
                        🎓 Niveau : {child.level}<br />
                        📚 Matières : {child.subjects.join(', ')}<br />
                        💻 Formule : {formulasList.find(f => f.value === child.formula)?.label}
                        {child.preferredDays.length > 0 && (<><br />📅 Jours : {child.preferredDays.join(', ')}</>)}
                        {child.preferredSlots.length > 0 && (<><br />🕐 Créneaux : {child.preferredSlots.join(', ')}</>)}
                        {child.objectives.length > 0 && (<><br />🎯 Objectifs : {child.objectives.join(', ')}</>)}
                        {child.specificNeeds.length > 0 && (<><br />🧩 Besoins : {child.specificNeeds.join(', ')}</>)}
                        {child.interests.length > 0 && (<><br />⭐ Centres d'intérêt : {child.interests.join(', ')}</>)}
                        {child.mindset.length > 0 && (<><br />🧠 État d'esprit : {child.mindset.join(', ')}</>)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Terms */}
                <div style={styles.termsContainer}>
                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms}
                      onChange={handleChange} style={styles.checkboxInput} disabled={loading} />
                    <span style={styles.checkboxText}>
                      <strong>*</strong> J'ai lu et j'accepte les{' '}
                      <a href="#" style={styles.link}>Conditions Générales d'Utilisation</a> et la{' '}
                      <a href="#" style={styles.link}>Politique de Confidentialité</a>.
                      Je consens à être contacté par KH Perfection pour le suivi de ma demande.
                    </span>
                  </label>
                </div>

                <div style={styles.verificationNote}>
                  <div style={styles.verificationIcon}>⏱️</div>
                  <div>
                    <strong>Délai de réponse :</strong>
                    <p style={styles.verificationText}>
                      Vous recevrez votre devis personnalisé sous 24 à 48h par email.
                      Un conseiller pédagogique vous contactera pour finaliser votre inscription.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={styles.buttonRow}>
            {currentStep > 1 && (
              <button onClick={prevStep}
                style={{ ...styles.cancelButton, ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                disabled={loading}>
                ← Précédent
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
                {loading ? '⏳ Envoi en cours...' : '📤 Envoyer la demande'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentSignup;

// ═══════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════════════════
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
    position: 'absolute', top: '-120px', right: '-120px',
    width: '420px', height: '420px',
    background: 'radial-gradient(circle, rgba(253,216,53,0.18) 0%, transparent 70%)',
    borderRadius: '50%', animation: 'float 12s ease-in-out infinite',
  },
  bgDecor2: {
    position: 'absolute', bottom: '-160px', left: '-160px',
    width: '520px', height: '520px',
    background: 'radial-gradient(circle, rgba(147,51,234,0.25) 0%, transparent 70%)',
    borderRadius: '50%', animation: 'floatReverse 14s ease-in-out infinite',
  },

  /* ================= WRAPPER ================= */
  formWrapper: { maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 },

  /* ================= HEADER ================= */
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

  /* ================= PROGRESS BAR ================= */
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

  /* ================= ERROR ALERT ================= */
  errorAlert: {
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: '14px', padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: '12px',
    color: '#fca5a5', fontSize: '14px', marginBottom: '25px',
    animation: 'shake 0.5s ease',
  },
  errorIcon: { fontSize: '20px' },

  /* ================= FORM CARD ================= */
  formCard: {
    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(22px)',
    borderRadius: '26px', padding: '40px',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'fadeInUp 0.8s ease',
  },
  stepContent: { animation: 'slideIn 0.5s ease' },

  /* ================= SECTIONS ================= */
  section: { marginBottom: '30px' },
  childSection: {
    marginBottom: '35px', padding: '25px',
    background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
    border: '1px solid rgba(253,216,53,0.15)',
  },
  childHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: {
    fontSize: '20px', fontWeight: '700', color: '#FDD835',
    margin: 0, display: 'flex', alignItems: 'center', gap: '10px',
  },
  sectionIcon: { fontSize: '24px' },
  removeChildBtn: {
    padding: '8px 16px', background: 'rgba(239,68,68,0.2)',
    border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px',
    color: '#fca5a5', fontSize: '13px', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.3s ease',
  },
  addChildBtn: {
    width: '100%', padding: '15px',
    background: 'rgba(34,197,94,0.15)', border: '2px dashed rgba(34,197,94,0.4)',
    borderRadius: '14px', color: '#4ade80', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.3s ease', marginTop: '20px',
  },

  /* ================= FORM ================= */
  formGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '14px', fontWeight: '600', color: '#FDD835', marginBottom: '6px' },
  input: {
    padding: '14px 16px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(253,216,53,0.3)',
    color: '#fff', fontSize: '14px', outline: 'none',
    transition: 'all 0.3s ease', width: '100%', boxSizing: 'border-box',
  },
  fileHint: { fontSize: '12px', color: '#9ca3af', marginTop: '5px' },

  /* ================= LEVELS GRID ================= */
  levelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' },
  levelCard: {
    padding: '12px 8px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(253,216,53,0.25)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', transition: 'all 0.3s ease', textAlign: 'center',
  },
  levelCardActive: {
    background: 'linear-gradient(135deg, rgba(253,216,53,0.35), rgba(147,51,234,0.35))',
    borderColor: '#FDD835', transform: 'scale(1.05)', boxShadow: '0 4px 15px rgba(253,216,53,0.3)',
  },
  levelText: { fontSize: '12px', fontWeight: '600', color: '#fff' },
  radioInput: { display: 'none' },

  /* ================= SUBJECTS / OBJECTIVES / MINDSET GRID ================= */
  subjectsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' },
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

  /* ================= FORMULA ================= */
  formulaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
  formulaCard: {
    padding: '16px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(253,216,53,0.25)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
    transition: 'all 0.3s ease',
  },
  formulaCardActive: {
    background: 'linear-gradient(135deg, rgba(253,216,53,0.35), rgba(147,51,234,0.35))',
    borderColor: '#FDD835', transform: 'translateY(-2px)', boxShadow: '0 4px 15px rgba(253,216,53,0.3)',
  },
  formulaText: { fontSize: '13px', fontWeight: '500', color: '#fff' },

  /* ================= TAG CHIPS (days, slots, needs, interests) ================= */
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  tagChip: {
    padding: '8px 16px', borderRadius: '30px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(253,216,53,0.25)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
    transition: 'all 0.3s ease',
  },
  tagChipActive: {
    background: 'linear-gradient(135deg, rgba(253,216,53,0.35), rgba(147,51,234,0.35))',
    borderColor: '#FDD835', boxShadow: '0 2px 10px rgba(253,216,53,0.25)',
  },
  tagText: { fontSize: '13px', fontWeight: '600', color: '#fff' },

  /* ================= SUMMARY ================= */
  summaryBox: {
    background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
    padding: '25px', border: '1px solid rgba(253,216,53,0.2)', marginBottom: '25px',
  },
  summarySection: { marginBottom: '20px' },
  summaryTitle: { fontSize: '16px', fontWeight: '700', color: '#FDD835', marginBottom: '12px' },
  summaryText: { fontSize: '14px', color: '#d1d5db', lineHeight: '1.8', margin: 0 },
  summaryDivider: { height: '1px', background: 'rgba(253,216,53,0.2)', marginBottom: '20px' },

  /* ================= TERMS ================= */
  termsContainer: { marginBottom: '25px' },
  checkboxLabel: { display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' },
  checkboxInput: { marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer' },
  checkboxText: { fontSize: '14px', color: '#d1d5db', lineHeight: '1.6' },
  link: { color: '#FDD835', textDecoration: 'underline' },
  verificationNote: {
    background: 'rgba(59,130,246,0.1)', borderRadius: '14px', padding: '18px',
    display: 'flex', alignItems: 'flex-start', gap: '15px',
    border: '1px solid rgba(59,130,246,0.3)',
  },
  verificationIcon: { fontSize: '28px' },
  verificationText: { fontSize: '13px', color: '#bfdbfe', lineHeight: '1.6', margin: '5px 0 0 0' },

  /* ================= BUTTONS ================= */
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

  /* ================= SUCCESS ================= */
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