// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const { saveCvFile, saveDocuments } = require('./utils/fileStorage');


// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log toutes les requêtes pour déboguer
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Chemins
const DATA_DIR = path.join(__dirname, 'data');
const CV_DIR = path.join(__dirname, 'data', 'cvs');
const DATA_FILE = path.join(DATA_DIR, 'teacher-requests.json');
const PARENT_DATA_FILE = path.join(DATA_DIR, 'parent-requests.json');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');

async function readAppointments() {
  try {
    await fs.access(APPOINTMENTS_FILE);
    const data = await fs.readFile(APPOINTMENTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    console.log(`📖 Lecture rendez-vous: ${parsed.length} rendez-vous`);
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📄 Fichier appointments.json n\'existe pas encore, création...');
      await writeAppointments([]);
      return [];
    }
    console.error('❌ Erreur lecture rendez-vous:', error);
    throw error;
  }
}

// =======================
// UTILS JSON
// =======================
async function readJSON(file, defaultValue = []) {
  try {
    await fs.access(file);
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// =======================
// CHECK TRIAL STATUS
// =======================
// GET /api/appointments/check-trial/:userId
app.get('/api/appointments/check-trial/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const appointments = await readJSON(APPOINTMENTS_FILE);
    const parents = await readJSON(PARENT_DATA_FILE);

    const trialFromAppointments = appointments.some(
      a => a.parentId === userId && a.isTrialCourse === true
    );

    const parent = parents.find(p => p.id === userId);
    const trialFromParent = parent?.hasUsedTrial === true;

    const hasUsedTrial = trialFromAppointments || trialFromParent;

    console.log(`🎯 Parent ${userId} | Trial utilisé: ${hasUsedTrial}`);

    res.json({
      success: true,
      hasUsedTrial
    });

  } catch (err) {
    console.error('❌ check-trial error:', err);
    res.status(500).json({ success: false });
  }
});

// =======================
// CREATE APPOINTMENT
// =======================
// POST /api/appointments
app.post('/api/appointments', async (req, res) => {
  try {
    const {
      parentId,
      parentName,
      parentEmail,
      studentName,
      subject,
      level,
      preferredDate,
      preferredTime,
      duration,
      location,
      notes,
      pricePerHour,
      totalAmount,
      isTrialCourse
    } = req.body;

    if (!parentId || !parentName || !parentEmail || !studentName || !subject ||
        !level || !preferredDate || !preferredTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires manquants'
      });
    }

    const appointments = await readJSON(APPOINTMENTS_FILE);
    const parents = await readJSON(PARENT_DATA_FILE);

    // 🔒 Sécurité : vérifier essai déjà utilisé
    if (isTrialCourse) {
      const alreadyUsed = appointments.some(
        a => a.parentId === parentId && a.isTrialCourse === true
      );

      if (alreadyUsed) {
        return res.status(400).json({
          success: false,
          message: 'Cours d’essai déjà utilisé'
        });
      }
    }

    const newAppointment = {
      id: Date.now(),
      parentId,
      parentName,
      parentEmail,
      studentName,
      subject,
      level,
      preferredDate,
      preferredTime,
      duration,
      location,
      notes: notes || '',
      pricePerHour,
      totalAmount,
      isTrialCourse: !!isTrialCourse,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    appointments.push(newAppointment);
    await writeJSON(APPOINTMENTS_FILE, appointments);

    // 🟢 IMPORTANT : marquer le parent comme ayant utilisé l’essai
    if (isTrialCourse) {
      const parentIndex = parents.findIndex(p => p.id === parentId);

      if (parentIndex !== -1) {
        parents[parentIndex].hasUsedTrial = true;
        parents[parentIndex].updatedAt = new Date().toISOString();
        await writeJSON(PARENT_DATA_FILE, parents);

        console.log(`✅ Parent ${parentId} marqué comme ESSAI UTILISÉ`);
      }
    }

    res.status(201).json({
      success: true,
      data: newAppointment,
      message: isTrialCourse
        ? 'Cours d’essai réservé avec succès'
        : 'Rendez-vous créé avec succès'
    });

  } catch (err) {
    console.error('❌ POST appointment error:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});


async function writeAppointments(data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(APPOINTMENTS_FILE, jsonString, 'utf8');
    console.log(`💾 Sauvegarde rendez-vous: ${data.length} rendez-vous`);
    return true;
  } catch (error) {
    console.error('❌ Erreur écriture rendez-vous:', error);
    throw error;
  }
}

// ============================================
// ROUTES POUR LES RENDEZ-VOUS
// ============================================

// GET - Vérifier si un parent a déjà utilisé son cours d'essai
app.get('/api/appointments/check-trial/:parentId', async (req, res) => {
  try {
    const parentId = parseInt(req.params.parentId);
    
    console.log('🔍 Vérification cours d\'essai pour parent:', parentId);

    if (!parentId || isNaN(parentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID parent invalide'
      });
    }

    const appointments = await readAppointments();
    
    // Vérifier si le parent a déjà un rendez-vous avec isTrialCourse = true
    const hasUsedTrial = appointments.some(
      appointment => appointment.parentId === parentId && appointment.isTrialCourse === true
    );

    console.log(`✅ Parent ${parentId} - Cours d'essai utilisé: ${hasUsedTrial}`);

    res.json({
      success: true,
      hasUsedTrial: hasUsedTrial,
      parentId: parentId
    });

  } catch (error) {
    console.error('❌ Erreur vérification cours d\'essai:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du cours d\'essai',
      error: error.message
    });
  }
});

// GET - Récupérer tous les rendez-vous (pour l'admin)
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await readAppointments();
    res.json({
      success: true,
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('❌ Erreur GET appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous',
      error: error.message
    });
  }
});

// GET - Récupérer les rendez-vous d'un parent spécifique
app.get('/api/appointments/parent/:parentId', async (req, res) => {
  try {
    const parentId = parseInt(req.params.parentId);
    const appointments = await readAppointments();
    const parentAppointments = appointments.filter(a => a.parentId === parentId);
    
    res.json({
      success: true,
      data: parentAppointments,
      count: parentAppointments.length
    });
  } catch (error) {
    console.error('❌ Erreur GET parent appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous',
      error: error.message
    });
  }
});

// GET - Récupérer un rendez-vous par ID
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const appointments = await readAppointments();
    const appointment = appointments.find(a => a.id === parseInt(req.params.id));
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('❌ Erreur GET appointment by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du rendez-vous',
      error: error.message
    });
  }
});

// POST - Créer un nouveau rendez-vous
app.post('/api/appointments', async (req, res) => {
  try {
    console.log('📥 Nouvelle demande de rendez-vous');

    const {
      parentId,
      parentName,
      parentEmail,
      studentName,
      subject,
      level,
      preferredDate,
      preferredTime,
      duration,
      location,
      notes,
      pricePerHour,
      totalAmount,
      isTrialCourse
    } = req.body;

    // Validation des champs obligatoires
    if (!parentName || !parentEmail || !studentName || !subject || 
        !level || !preferredDate || !preferredTime || !duration) {
      console.log('⚠️ Validation échouée: champs manquants');
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis',
        received: {
          parentName: !!parentName,
          parentEmail: !!parentEmail,
          studentName: !!studentName,
          subject: !!subject,
          level: !!level,
          preferredDate: !!preferredDate,
          preferredTime: !!preferredTime,
          duration: !!duration
        }
      });
    }

    // Validation de la date (ne peut pas être dans le passé)
    const appointmentDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      return res.status(400).json({
        success: false,
        message: 'La date du rendez-vous ne peut pas être dans le passé'
      });
    }

    // Lire les rendez-vous existants
    console.log('📖 Lecture des rendez-vous existants...');
    const appointments = await readAppointments();
    console.log(`✅ ${appointments.length} rendez-vous trouvés`);

    // Si c'est un cours d'essai, vérifier que le parent n'en a pas déjà utilisé un
    if (isTrialCourse && parentId) {
      const hasUsedTrial = appointments.some(
        appointment => appointment.parentId === parentId && appointment.isTrialCourse === true
      );
      
      if (hasUsedTrial) {
        console.log('⚠️ Parent a déjà utilisé son cours d\'essai');
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà utilisé votre cours d\'essai gratuit'
        });
      }
    }

    // Créer le nouveau rendez-vous
    const newAppointment = {
      id: Date.now(),
      parentId: parentId || null,
      parentName: parentName.trim(),
      parentEmail: parentEmail.trim().toLowerCase(),
      studentName: studentName.trim(),
      subject: subject,
      level: level,
      preferredDate: preferredDate,
      preferredTime: preferredTime,
      duration: duration,
      location: location || 'online',
      notes: notes ? notes.trim() : '',
      pricePerHour: pricePerHour || (location === 'online' ? 35 : 45),
      totalAmount: totalAmount || 0,
      isTrialCourse: isTrialCourse || false, // ← NOUVEAU: Sauvegarder le flag cours d'essai
      status: 'pending', // pending, assigned, confirmed, completed, cancelled
      assignedTeacher: null,
      assignedTeacherId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Log spécial pour les cours d'essai
    if (newAppointment.isTrialCourse) {
      console.log('🎁 Cours d\'essai GRATUIT créé pour:', parentName);
    }

    console.log('➕ Ajout du nouveau rendez-vous...');
    appointments.push(newAppointment);

    // Sauvegarder dans le fichier
    console.log('💾 Sauvegarde dans le fichier...');
    await writeAppointments(appointments);

    console.log('✅ Rendez-vous créé avec succès:', newAppointment.id);

    res.status(201).json({
      success: true,
      message: isTrialCourse 
        ? 'Cours d\'essai gratuit réservé avec succès' 
        : 'Rendez-vous créé avec succès',
      data: newAppointment
    });

  } catch (error) {
    console.error('❌ Erreur POST appointment:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du rendez-vous',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT - Assigner un enseignant à un rendez-vous
app.put('/api/appointments/:id/assign', async (req, res) => {
  try {
    const { teacherId, teacherName } = req.body;
    const appointmentId = parseInt(req.params.id);

    if (!teacherId || !teacherName) {
      return res.status(400).json({
        success: false,
        message: 'teacherId et teacherName sont requis'
      });
    }

    const appointments = await readAppointments();
    const index = appointments.findIndex(a => a.id === appointmentId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    appointments[index].assignedTeacherId = teacherId;
    appointments[index].assignedTeacher = teacherName;
    appointments[index].status = 'assigned';
    appointments[index].updatedAt = new Date().toISOString();

    await writeAppointments(appointments);

    console.log(`✅ Enseignant assigné au rendez-vous ${appointmentId}: ${teacherName}`);

    res.json({
      success: true,
      message: 'Enseignant assigné avec succès',
      data: appointments[index]
    });

  } catch (error) {
    console.error('❌ Erreur PUT assign teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation',
      error: error.message
    });
  }
});

// PUT - Mettre à jour le statut d'un rendez-vous
app.put('/api/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = parseInt(req.params.id);

    const validStatuses = ['pending', 'assigned', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Valeurs acceptées: ${validStatuses.join(', ')}`
      });
    }

    const appointments = await readAppointments();
    const index = appointments.findIndex(a => a.id === appointmentId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    appointments[index].status = status;
    appointments[index].updatedAt = new Date().toISOString();

    await writeAppointments(appointments);

    console.log(`✅ Statut rendez-vous mis à jour: ${appointmentId} -> ${status}`);

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: appointments[index]
    });

  } catch (error) {
    console.error('❌ Erreur PUT status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
});

// DELETE - Supprimer un rendez-vous
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const appointments = await readAppointments();
    
    const appointmentToDelete = appointments.find(a => a.id === appointmentId);
    
    if (!appointmentToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    const filteredAppointments = appointments.filter(a => a.id !== appointmentId);
    await writeAppointments(filteredAppointments);

    console.log(`✅ Rendez-vous supprimé: ${appointmentId}`);

    res.json({
      success: true,
      message: 'Rendez-vous supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur DELETE appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
});

// Lire les demandes parents
async function readParentData() {
  try {
    await fs.access(PARENT_DATA_FILE);
    const data = await fs.readFile(PARENT_DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    console.log(`📖 Lecture parents: ${parsed.length} demandes`);
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📄 Fichier parent-requests.json n\'existe pas encore, création...');
      await writeParentData([]);
      return [];
    }
    console.error('❌ Erreur lecture parents:', error);
    throw error;
  }
}

// Écrire les demandes parents
async function writeParentData(data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(PARENT_DATA_FILE, jsonString, 'utf8');
    console.log(`💾 Sauvegarde parents: ${data.length} demandes`);
    return true;
  } catch (error) {
    console.error('❌ Erreur écriture parents:', error);
    throw error;
  }
}

// ============================================
// ROUTES POUR LES PARENTS
// ============================================

// GET - Récupérer toutes les demandes parents (pour l'admin)
app.get('/api/parent-requests', async (req, res) => {
  try {
    const requests = await readParentData();
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('❌ Erreur GET parents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des demandes parents',
      error: error.message
    });
  }
});

// GET - Récupérer une demande parent par ID
app.get('/api/parent-requests/:id', async (req, res) => {
  try {
    const requests = await readParentData();
    const request = requests.find(r => r.id === parseInt(req.params.id));
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Demande parent non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('❌ Erreur GET parent by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la demande',
      error: error.message
    });
  }
});

// POST - Créer une nouvelle demande parent
app.post('/api/parent-requests', async (req, res) => {
  try {
    console.log('📥 Nouvelle demande parent reçue');

    const {
      parentName,
      email,
      phone,
      address,
      password,
      childName,
      childAge,
      childLevel,
      subjects,
      availability
    } = req.body;

    // Validation des champs obligatoires
    if (!parentName || !email || !phone || !address || !password || 
        !childName || !childAge || !childLevel || 
        !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      console.log('⚠️ Validation échouée: champs manquants');
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis',
        received: {
          parentName: !!parentName,
          email: !!email,
          phone: !!phone,
          address: !!address,
          password: !!password,
          childName: !!childName,
          childAge: !!childAge,
          childLevel: !!childLevel,
          subjects: Array.isArray(subjects) ? subjects.length : 0
        }
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('⚠️ Email invalide:', email);
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Validation de l'âge
    const age = parseInt(childAge);
    if (isNaN(age) || age < 5 || age > 25) {
      console.log('⚠️ Âge invalide:', childAge);
      return res.status(400).json({
        success: false,
        message: 'L\'âge doit être entre 5 et 25 ans'
      });
    }

    // Lire les demandes existantes
    console.log('📖 Lecture des demandes parents existantes...');
    const requests = await readParentData();
    console.log(`✅ ${requests.length} demandes trouvées`);

    // Vérifier si l'email existe déjà
    const existingRequest = requests.find(r => r.email.toLowerCase() === email.toLowerCase());
    if (existingRequest) {
      console.log('⚠️ Email déjà existant:', email);
      return res.status(409).json({
        success: false,
        message: 'Une demande avec cet email existe déjà'
      });
    }

    // Créer la nouvelle demande
    const newRequest = {
      id: Date.now(),
      parentName: parentName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      password: password, // ⚠️ En production: hasher avec bcrypt !
      childName: childName.trim(),
      childAge: age,
      childLevel: childLevel,
      subjects: subjects,
      availability: availability ? availability.trim() : '',
      date: new Date().toISOString(),
      status: 'pending'
    };

    console.log('➕ Ajout de la nouvelle demande parent...');
    requests.push(newRequest);

    // Sauvegarder dans le fichier
    console.log('💾 Sauvegarde dans le fichier...');
    await writeParentData(requests);

    console.log('✅ Demande parent enregistrée avec succès:', newRequest.email);

    res.status(201).json({
      success: true,
      message: 'Demande d\'inscription enregistrée avec succès',
      data: {
        id: newRequest.id,
        parentName: newRequest.parentName,
        email: newRequest.email,
        date: newRequest.date
      }
    });

  } catch (error) {
    console.error('❌ Erreur POST parent:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de la demande',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT - Mettre à jour le statut d'une demande parent (pour l'admin)
app.put('/api/parent-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = parseInt(req.params.id);

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Valeurs acceptées: pending, approved, rejected'
      });
    }

    const requests = await readParentData();
    const index = requests.findIndex(r => r.id === requestId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Demande parent non trouvée'
      });
    }

    requests[index].status = status;
    requests[index].updatedAt = new Date().toISOString();

    await writeParentData(requests);

    console.log(`✅ Statut parent mis à jour: ${requestId} -> ${status}`);

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: requests[index]
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

// DELETE - Supprimer une demande parent (pour l'admin)
app.delete('/api/parent-requests/:id', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const requests = await readParentData();
    
    const requestToDelete = requests.find(r => r.id === requestId);
    
    if (!requestToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Demande parent non trouvée'
      });
    }

    const filteredRequests = requests.filter(r => r.id !== requestId);
    await writeParentData(filteredRequests);

    console.log(`✅ Demande parent supprimée: ${requestId}`);

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

    console.log('🔐 Tentative de connexion parent:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const requests = await readParentData();
    const parent = requests.find(r => r.email.toLowerCase() === email.toLowerCase());

    if (!parent) {
      console.log('⚠️ Parent non trouvé:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    if (parent.status !== 'approved') {
      console.log('🚫 Parent non approuvé:', email, '- Statut:', parent.status);
      return res.status(403).json({
        success: false,
        message: 'Votre inscription n\'a pas encore été approuvée par l\'administration',
        status: parent.status
      });
    }

    // ⚠️ EN PRODUCTION: Utiliser bcrypt.compare()
    if (parent.password !== password) {
      console.log('⚠️ Mot de passe incorrect pour:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('✅ Connexion parent réussie:', email);

    const { password: _, ...parentData } = parent;

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        ...parentData,
        role: 'parent'
      }
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
// FONCTIONS UTILITAIRES
// ============================================

// Créer les dossiers nécessaires
async function ensureDirectories() {
  try {
    await fs.access(DATA_DIR);
    console.log('✅ Dossier data existe');
  } catch {
    console.log('📁 Création du dossier data...');
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('✅ Dossier data créé');
  }

  try {
    await fs.access(CV_DIR);
    console.log('✅ Dossier cvs existe');
  } catch {
    console.log('📁 Création du dossier cvs...');
    await fs.mkdir(CV_DIR, { recursive: true });
    console.log('✅ Dossier cvs créé');
  }
}



// Lire les données du fichier JSON
async function readData() {
  try {
    await fs.access(DATA_FILE);
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    console.log(`📖 Lecture: ${parsed.length} candidatures`);
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📄 Fichier teacher-requests.json n\'existe pas encore, création...');
      await writeData([]);
      return [];
    }
    console.error('❌ Erreur lecture:', error);
    throw error;
  }
}

// Écrire les données dans le fichier JSON
async function writeData(data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(DATA_FILE, jsonString, 'utf8');
    console.log(`💾 Sauvegarde: ${data.length} candidatures`);
    return true;
  } catch (error) {
    console.error('❌ Erreur écriture:', error);
    throw error;
  }
}

// ============================================
// ROUTES POUR LES ENSEIGNANTS
// ============================================

// GET - Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API fonctionnelle',
    timestamp: new Date().toISOString(),
    dataFile: DATA_FILE,
    cvDirectory: CV_DIR
  });
});

// GET - Récupérer toutes les candidatures (pour l'admin)
app.get('/api/teacher-requests', async (req, res) => {
  try {
    const requests = await readData();
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('❌ Erreur GET all:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données',
      error: error.message
    });
  }
});

// GET - Récupérer une candidature par ID
app.get('/api/teacher-requests/:id', async (req, res) => {
  try {
    const requests = await readData();
    const request = requests.find(r => r.id === parseInt(req.params.id));
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('❌ Erreur GET by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données',
      error: error.message
    });
  }
});

// GET - Télécharger un CV
app.get('/api/teacher-requests/:id/cv', async (req, res) => {
  try {
    const requests = await readData();
    const request = requests.find(r => r.id === parseInt(req.params.id));
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }
    
    if (!request.cvFileName) {
      return res.status(404).json({
        success: false,
        message: 'Aucun CV associé à cette candidature'
      });
    }
    
    const cvPath = path.join(CV_DIR, request.cvFileName);
    
    // Vérifier que le fichier existe
    await fs.access(cvPath);
    
    // Envoyer le fichier
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${request.cvFileName}"`);
    
    const fileBuffer = await fs.readFile(cvPath);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('❌ Erreur téléchargement CV:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du CV',
      error: error.message
    });
  }
});

app.post('/api/teacher-requests', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      zone,
      school,
      diplome,
      qualification,
      experience,
      niveauAccepter,
      formatCours,
      MatiereNiveau,
      subjects,
      availability,
      motivation,
      cvFile,
      cvFileName,
      documents,
      acceptTerms,
      acceptVerification,
      acceptProfileSharing
    } = req.body;

    // ================= VALIDATION =================
    if (
      !fullName || !email || !phone || !password ||
      !qualification || !experience ||
      !Array.isArray(subjects) || subjects.length === 0 ||
      !motivation || !cvFile || !zone
    ) {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires manquants'
      });
    }

    if (!acceptTerms) {
      return res.status(400).json({
        success: false,
        message: 'Conditions générales non acceptées'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide'
      });
    }

    const requests = await readData();

    const emailExists = requests.find(
      r => r.email.toLowerCase() === email.toLowerCase()
    );

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Une candidature avec cet email existe déjà'
      });
    }

    // ================= SAUVEGARDE CV =================
    const newId = Date.now();
    const savedCvFileName = await saveCvFile(cvFile, cvFileName, newId);

    // ================= OBJET FINAL =================
    const newTeacherRequest = {
      id: newId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password, // ⚠️ À hasher en prod
      zone,
      school: school || '',
      diplome: diplome || '',
      qualification,
      experience,
      niveauAccepter: niveauAccepter || '',
      formatCours: formatCours || '',
      MatiereNiveau: MatiereNiveau || '',
      subjects,
      availability: availability || '',
      motivation,
      cvFileName: savedCvFileName,
      documents: Array.isArray(documents) ? documents : [],
      acceptTerms: !!acceptTerms,
      acceptVerification: !!acceptVerification,
      acceptProfileSharing: !!acceptProfileSharing,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    requests.push(newTeacherRequest);
    await writeData(requests);

    res.status(201).json({
      success: true,
      message: 'Candidature enseignant enregistrée avec succès',
      data: {
        id: newTeacherRequest.id,
        email: newTeacherRequest.email,
        status: newTeacherRequest.status
      }
    });

  } catch (error) {
    console.error('❌ Erreur POST teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});


// PUT - Mettre à jour le statut d'une candidature (pour l'admin)
app.put('/api/teacher-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const requestId = parseInt(req.params.id);

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Valeurs acceptées: pending, approved, rejected'
      });
    }

    const requests = await readData();
    const index = requests.findIndex(r => r.id === requestId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }

    requests[index].status = status;
    requests[index].updatedAt = new Date().toISOString();

    await writeData(requests);

    console.log(`✅ Statut mis à jour: ${requestId} -> ${status}`);

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: requests[index]
    });

  } catch (error) {
    console.error('❌ Erreur PUT:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    });
  }
});

// POST - Vérifier les credentials d'un enseignant lors de la connexion
app.post('/api/teacher-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Tentative de connexion enseignant:', email);

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Lire les candidatures enseignants
    const requests = await readData();

    // Chercher l'enseignant par email
    const teacher = requests.find(
      r => r.email.toLowerCase() === email.toLowerCase()
    );

    // Vérifier si l'enseignant existe
    if (!teacher) {
      console.log('⚠️ Enseignant non trouvé:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si l'enseignant est approuvé
    if (teacher.status !== 'approved') {
      console.log('🚫 Enseignant non approuvé:', email, '- Statut:', teacher.status);
      return res.status(403).json({
        success: false,
        message: 'Votre candidature n\'a pas encore été approuvée par l\'administration',
        status: teacher.status
      });
    }

    // Vérifier le mot de passe
    // ⚠️ EN PRODUCTION: Utiliser bcrypt.compare() pour comparer les hash
    if (teacher.password !== password) {
      console.log('⚠️ Mot de passe incorrect pour:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('✅ Connexion réussie:', email);

    // Retourner les infos de l'enseignant (sans le mot de passe)
    const { password: _, cvFileName, motivation, ...teacherData } = teacher;

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        ...teacherData,
        role: 'teacher'
      }
    });

  } catch (error) {
    console.error('❌ Erreur login enseignant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
});

// GET - Vérifier le statut d'une candidature par email (pour l'écran de connexion)
app.get('/api/teacher-status/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    
    const requests = await readData();
    const teacher = requests.find(r => r.email.toLowerCase() === email);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Aucune candidature trouvée pour cet email'
      });
    }

    res.json({
      success: true,
      data: {
        status: teacher.status,
        name: teacher.name,
        date: teacher.date
      }
    });

  } catch (error) {
    console.error('❌ Erreur vérification statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut',
      error: error.message
    });
  }
});

// DELETE - Supprimer une candidature (pour l'admin)
app.delete('/api/teacher-requests/:id', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const requests = await readData();
    
    const requestToDelete = requests.find(r => r.id === requestId);
    
    if (!requestToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }

    // Supprimer le fichier CV s'il existe
    if (requestToDelete.cvFileName) {
      try {
        const cvPath = path.join(CV_DIR, requestToDelete.cvFileName);
        await fs.unlink(cvPath);
        console.log(`🗑️ CV supprimé: ${requestToDelete.cvFileName}`);
      } catch (error) {
        console.error('⚠️ Erreur suppression CV:', error);
        // On continue même si la suppression du CV échoue
      }
    }

    const filteredRequests = requests.filter(r => r.id !== requestId);
    await writeData(filteredRequests);

    console.log(`✅ Candidature supprimée: ${requestId}`);

    res.json({
      success: true,
      message: 'Candidature supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur DELETE:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
});

// Middleware pour les routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.path
  });
});

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur non gérée:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: err.message
  });
});

// Initialisation du serveur
async function startServer() {
  try {
    console.log('🚀 Démarrage du serveur...');
    
    // Créer les dossiers nécessaires
    await ensureDirectories();

    await readParentData();
    
    // Vérifier/créer le fichier JSON
    await readData();

    await readAppointments();
    
    app.listen(PORT, () => {
      console.log('');
      console.log('✅ ================================');
      console.log(`✅  Serveur démarré avec succès`);
      console.log('✅ ================================');
      console.log(`🔗  URL: http://localhost:${PORT}`);
      console.log(`📂  Fichier données: ${DATA_FILE}`);
      console.log(`📂  Dossier CVs: ${CV_DIR}`);
      console.log(`📡  API: http://localhost:${PORT}/api`);
      console.log('');
      console.log('📋  Endpoints disponibles:');
      console.log(`   GET    /api/health`);
      console.log(`   GET    /api/teacher-requests`);
      console.log(`   GET    /api/teacher-requests/:id`);
      console.log(`   GET    /api/teacher-requests/:id/cv`);
      console.log(`   GET    /api/teacher-status/:email`);
      console.log(`   POST   /api/teacher-requests`);
      console.log(`   PUT    /api/teacher-requests/:id`);
      console.log(`   DELETE /api/teacher-requests/:id`);
      console.log(`   POST   /api/teacher-login`);
      console.log(`   GET    /api/parent-requests`);
      console.log(`   GET    /api/parent-requests/:id`);
      console.log(`   POST   /api/parent-requests`);
      console.log(`   POST   /api/parent-login`);
      console.log(`   PUT    /api/parent-requests/:id`);
      console.log(`   DELETE /api/parent-requests/:id`);
      console.log(`   GET    /api/appointments`);
      console.log(`   GET    /api/appointments/check-trial/:parentId`); // ← NOUVEAU
      console.log(`   GET    /api/appointments/parent/:parentId`);
      console.log(`   GET    /api/appointments/:id`);
      console.log(`   POST   /api/appointments`); // ← MODIFIÉ (avec isTrialCourse)
      console.log(`   PUT    /api/appointments/:id/assign`);
      console.log(`   PUT    /api/appointments/:id/status`);
      console.log(`   DELETE /api/appointments/:id`);
      console.log('');
      console.log('💡  Appuyez sur Ctrl+C pour arrêter');
      console.log('================================');
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Arrêt du serveur...');
  process.exit(0);
});

startServer();