// server.js avec PostgreSQL
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration PostgreSQL - CORRECTION ICI
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // TOUJOURS false sur Render
  }
});

// Test connexion UNIQUE - SUPPRIMEZ LES DOUBLONS
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur connexion PostgreSQL:', err.stack);
    return;
  }
  console.log('✅ Connecté à PostgreSQL sur Render!');
  
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      console.error('❌ Erreur d\'exécution:', err.stack);
      return;
    }
    console.log('✅ Heure du serveur:', result.rows[0].now);
  });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES ENSEIGNANTS
// ============================================

// GET - Récupérer toutes les candidatures enseignants
app.get('/api/teacher-requests', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM teacher_requests ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ Erreur GET teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des candidatures',
      error: error.message
    });
  }
});

// GET - Récupérer une candidature par ID
app.get('/api/teacher-requests/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM teacher_requests WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur GET teacher by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
});

// POST - Créer une nouvelle candidature enseignant
app.post('/api/teacher-requests', async (req, res) => {
  try {
    const {
      fullName, email, phone, password, zone, school, diplome,
      qualification, experience, niveauAccepter, formatCours,
      MatiereNiveau, subjects, availability, motivation,
      cvFile, cvFileName, documents, acceptTerms,
      acceptVerification, acceptProfileSharing
    } = req.body;

    // Validation
    if (!fullName || !email || !phone || !password || !qualification || 
        !experience || !Array.isArray(subjects) || subjects.length === 0 || 
        !motivation || !cvFile || !zone || !acceptTerms) {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires manquants'
      });
    }

    // Vérifier si l'email existe déjà
    const emailCheck = await pool.query(
      'SELECT id FROM teacher_requests WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Une candidature avec cet email existe déjà'
      });
    }

    // Insérer la nouvelle candidature
    const result = await pool.query(
      `INSERT INTO teacher_requests (
        full_name, email, phone, password, zone, school, diplome,
        qualification, experience, niveau_accepter, format_cours,
        matiere_niveau, subjects, availability, motivation,
        cv_file, cv_filename, documents, accept_terms,
        accept_verification, accept_profile_sharing, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING id, email, status, created_at`,
      [
        fullName, email.toLowerCase(), phone, password, zone, school || '', diplome || '',
        qualification, experience, niveauAccepter || '', formatCours || '',
        MatiereNiveau || '', JSON.stringify(subjects), availability || '', motivation,
        cvFile, cvFileName, JSON.stringify(documents || []), acceptTerms,
        acceptVerification || false, acceptProfileSharing || false, 'pending'
      ]
    );

    console.log('✅ Candidature enseignant créée:', result.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'Candidature enregistrée avec succès',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur POST teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement',
      error: error.message
    });
  }
});

// PUT - Mettre à jour le statut d'une candidature
app.put('/api/teacher-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = req.params.id;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const result = await pool.query(
      `UPDATE teacher_requests 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }

    console.log(`✅ Statut enseignant mis à jour: ${requestId} -> ${status}`);

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur PUT teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
});

// DELETE - Supprimer une candidature
app.delete('/api/teacher-requests/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM teacher_requests WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }

    console.log(`✅ Candidature supprimée: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Candidature supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur DELETE teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
});

// POST - Connexion enseignant
app.post('/api/teacher-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const result = await pool.query(
      'SELECT * FROM teacher_requests WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const teacher = result.rows[0];

    if (teacher.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Votre candidature n\'a pas encore été approuvée',
        status: teacher.status
      });
    }

    if (teacher.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('✅ Connexion enseignant réussie:', email);

    const { password: _, cv_file, ...teacherData } = teacher;

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: { ...teacherData, role: 'teacher' }
    });

  } catch (error) {
    console.error('❌ Erreur login teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
});

// ============================================
// ROUTES PARENTS
// ============================================

// GET - Récupérer toutes les demandes parents
app.get('/api/parent-requests', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM parent_requests ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ Erreur GET parents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
});

// POST - Créer une demande parent
app.post('/api/parent-requests', async (req, res) => {
  try {
    const {
      parentName, email, phone, address, password,
      childName, childAge, childLevel, subjects, availability
    } = req.body;

    // Validation
    if (!parentName || !email || !phone || !address || !password || 
        !childName || !childAge || !childLevel || 
        !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Vérifier email existant
    const emailCheck = await pool.query(
      'SELECT id FROM parent_requests WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Une demande avec cet email existe déjà'
      });
    }

    // Insérer
    const result = await pool.query(
      `INSERT INTO parent_requests (
        parent_name, email, phone, address, password,
        child_name, child_age, child_level, subjects, availability, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, parent_name, email, created_at`,
      [
        parentName, email.toLowerCase(), phone, address, password,
        childName, parseInt(childAge), childLevel, JSON.stringify(subjects),
        availability || '', 'pending'
      ]
    );

    console.log('✅ Demande parent créée:', result.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'Demande enregistrée avec succès',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur POST parent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement',
      error: error.message
    });
  }
});

// PUT - Mettre à jour statut parent
app.put('/api/parent-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const result = await pool.query(
      `UPDATE parent_requests 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Statut mis à jour',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur PUT parent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
});

// DELETE - Supprimer demande parent
app.delete('/api/parent-requests/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM parent_requests WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Demande non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Demande supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur DELETE parent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
});

// POST - Connexion parent
app.post('/api/parent-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const result = await pool.query(
      'SELECT * FROM parent_requests WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const parent = result.rows[0];

    if (parent.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Votre inscription n\'a pas encore été approuvée',
        status: parent.status
      });
    }

    if (parent.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const { password: _, ...parentData } = parent;

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: { ...parentData, role: 'parent' }
    });

  } catch (error) {
    console.error('❌ Erreur login parent:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
});

// ============================================
// ROUTES RENDEZ-VOUS
// ============================================

// GET - Tous les rendez-vous
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM appointments ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ Erreur GET appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message
    });
  }
});

// GET - Vérifier cours d'essai
app.get('/api/appointments/check-trial/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM appointments WHERE parent_id = $1 AND is_trial_course = true',
      [userId]
    );

    const hasUsedTrial = parseInt(result.rows[0].count) > 0;

    res.json({
      success: true,
      hasUsedTrial
    });

  } catch (error) {
    console.error('❌ Erreur check-trial:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: error.message
    });
  }
});

// POST - Créer rendez-vous
app.post('/api/appointments', async (req, res) => {
  try {
    const {
      parentId, parentName, parentEmail, studentName, subject, level,
      preferredDate, preferredTime, duration, location, notes,
      pricePerHour, totalAmount, isTrialCourse
    } = req.body;

    if (!parentId || !parentEmail || !studentName || 
        !subject || !level || !preferredDate || !preferredTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires manquants'
      });
    }

    // Vérifier essai déjà utilisé
    if (isTrialCourse) {
      const trialCheck = await pool.query(
        'SELECT COUNT(*) as count FROM appointments WHERE parent_id = $1 AND is_trial_course = true',
        [parentId]
      );

      if (parseInt(trialCheck.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cours d\'essai déjà utilisé'
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO appointments (
        parent_id, parent_name, parent_email, student_name, subject, level,
        preferred_date, preferred_time, duration, location, notes,
        price_per_hour, total_amount, is_trial_course, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        parentId, parentName, parentEmail, studentName, subject, level,
        preferredDate, preferredTime, duration, location || 'online', notes || '',
        pricePerHour, totalAmount, isTrialCourse || false, 'pending'
      ]
    );

    console.log('✅ Rendez-vous créé:', result.rows[0].id);

    res.status(201).json({
      success: true,
      message: isTrialCourse ? 'Cours d\'essai réservé' : 'Rendez-vous créé',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur POST appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création',
      error: error.message
    });
  }
});

// PUT - Assigner enseignant
app.put('/api/appointments/:id/assign', async (req, res) => {
  try {
    const { teacherId, teacherName } = req.body;

    if (!teacherId || !teacherName) {
      return res.status(400).json({
        success: false,
        message: 'teacherId et teacherName requis'
      });
    }

    const result = await pool.query(
      `UPDATE appointments 
       SET assigned_teacher_id = $1, assigned_teacher = $2, status = 'assigned', updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [teacherId, teacherName, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Enseignant assigné',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erreur assign:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API KH Perfect - Backend opérationnel',
    endpoints: {
      health: '/api/health',
      teachers: '/api/teacher-requests',
      parents: '/api/parent-requests',
      appointments: '/api/appointments'
    }
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.path
  });
});

// Gestion erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: err.message
  });
});

// Démarrage
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('✅ ================================');
  console.log(`✅  Serveur démarré sur le port ${PORT}`);
  console.log('✅ ================================');
  console.log(`🔗  URL: http://localhost:${PORT}`);
  console.log(`📡  API: http://localhost:${PORT}/api`);
  console.log('================================');
});

// Gestion arrêt propre
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur...');
  pool.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Arrêt du serveur (SIGTERM)...');
  pool.end();
  process.exit(0);
});