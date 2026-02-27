# api/models.py
from django.db import models
from django.core.validators import EmailValidator
import json
import os
import uuid

def course_file_upload_path(instance, filename):
    ext = filename.rsplit('.', 1)[-1].lower()
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    return f"course_files/{instance.appointment_id}/{unique_name}"


class CourseFile(models.Model):
    FILE_TYPE_CHOICES = [
        ('pdf',   'PDF'),
        ('image', 'Image'),
        ('word',  'Word'),
        ('excel', 'Excel'),
        ('other', 'Autre'),
    ]
    UPLOADED_BY_CHOICES = [
        ('parent',  'Parent / Élève'),
        ('teacher', 'Enseignant'),
    ]

    appointment     = models.ForeignKey(
        'Appointment',                      # ← adapte au nom exact de ton modèle RDV
        on_delete=models.CASCADE,
        related_name='course_files'
    )
    file            = models.FileField(upload_to=course_file_upload_path)
    original_name   = models.CharField(max_length=255)
    file_type       = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES, default='other')
    file_size       = models.PositiveIntegerField(help_text="Taille en octets")
    uploaded_by     = models.CharField(max_length=10, choices=UPLOADED_BY_CHOICES)
    uploader_name   = models.CharField(max_length=150, blank=True)
    description     = models.CharField(max_length=300, blank=True)
    uploaded_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Fichier de cours"
        verbose_name_plural = "Fichiers de cours"

    def __str__(self):
        return f"{self.original_name} ({self.appointment_id})"

    def get_file_type(self, filename):
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        if ext == 'pdf':            return 'pdf'
        if ext in ('jpg','jpeg','png','gif','webp','heic'): return 'image'
        if ext in ('doc','docx'):   return 'word'
        if ext in ('xls','xlsx'):   return 'excel'
        return 'other'

    def save(self, *args, **kwargs):
        if not self.file_type or self.file_type == 'other':
            self.file_type = self.get_file_type(self.original_name)
        super().save(*args, **kwargs)


class TeacherRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    ]
    
    # Informations personnelles
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    phone = models.CharField(max_length=50)
    password = models.CharField(max_length=255)  # À hasher en production
    zone = models.CharField(max_length=100)
    school = models.CharField(max_length=255, blank=True, null=True)
    diplome = models.CharField(max_length=255, blank=True, null=True)
    
    # Qualifications
    qualification = models.CharField(max_length=255)
    experience = models.CharField(max_length=255)
    niveau_accepter = models.CharField(max_length=255, blank=True, null=True)
    format_cours = models.CharField(max_length=255, blank=True, null=True)
    matiere_niveau = models.CharField(max_length=255, blank=True, null=True)
    
    # Données JSON
    subjects = models.JSONField()
    availability = models.TextField(blank=True, null=True)
    motivation = models.TextField()
    
    # Fichiers
    cv_file = models.TextField()  # Base64
    cv_filename = models.CharField(max_length=255)
    documents = models.JSONField(default=list)
    
    # Acceptations
    accept_terms = models.BooleanField(default=False)
    accept_verification = models.BooleanField(default=False)
    accept_profile_sharing = models.BooleanField(default=False)
    
    # Statut
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teacher_requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.full_name} - {self.email}"


# ─── REMPLACE la classe ParentRequest dans api/models.py ─────────────────────

class ParentRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    ]

    # ── Informations parent ───────────────────────────────────────────────────
    parent_first_name = models.CharField(max_length=150)
    parent_last_name  = models.CharField(max_length=150)
    email             = models.EmailField(unique=True, validators=[EmailValidator()])
    phone             = models.CharField(max_length=50)
    password          = models.CharField(max_length=255)   # ⚠️ hasher en prod
    address           = models.TextField(blank=True)
    postal_code       = models.CharField(max_length=20, blank=True)
    message           = models.TextField(blank=True)       # précisions complémentaires

    # ── Enfants (JSON array) ──────────────────────────────────────────────────
    # Chaque enfant : { firstName, lastName, level, subjects, formula,
    #                   preferredDays, preferredSlots, objectives,
    #                   specificNeeds, interests, mindset }
    children = models.JSONField(default=list)

    # ── Consentements ─────────────────────────────────────────────────────────
    accept_terms = models.BooleanField(default=False)

    # ── Statut ────────────────────────────────────────────────────────────────
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'parent_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.parent_first_name} {self.parent_last_name} - {self.email}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('assigned', 'Enseignant assigné'),
        ('confirmed', 'Confirmé'),
        ('completed', 'Terminé'),
        ('cancelled', 'Annulé'),
    ]
    
    LOCATION_CHOICES = [
        ('online', 'En ligne'),
        ('home', 'À domicile'),
    ]
    
    # Informations parent
    parent_id = models.CharField(max_length=100, verbose_name="ID Parent")
    parent_name = models.CharField(max_length=255, verbose_name="Nom Parent")
    parent_email = models.EmailField(verbose_name="Email Parent")
    parent_phone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone Parent")
    
    # Informations élève
    student_name = models.CharField(max_length=255, verbose_name="Nom Élève")
    
    # Détails du cours
    subject = models.CharField(max_length=100, verbose_name="Matière")
    level = models.CharField(max_length=100, verbose_name="Niveau")
    
    # Date et horaire
    preferred_date = models.DateField(verbose_name="Date souhaitée")
    preferred_time = models.TimeField(verbose_name="Heure souhaitée")
    duration = models.DecimalField(max_digits=3, decimal_places=1, verbose_name="Durée (heures)")
    
    # Lieu
    location = models.CharField(
        max_length=20,
        choices=LOCATION_CHOICES,
        default='online',
        verbose_name="Lieu du cours"
    )
    
    # Notes
    notes = models.TextField(blank=True, verbose_name="Notes supplémentaires")
    
    # Tarification
    price_per_hour = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="Prix/heure")
    total_amount = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="Montant total")
    is_trial_course = models.BooleanField(default=False, verbose_name="Cours d'essai")
    
    # Enseignant assigné
    assigned_teacher_id = models.CharField(max_length=100, blank=True, verbose_name="ID Enseignant")
    assigned_teacher = models.CharField(max_length=255, blank=True, verbose_name="Nom Enseignant", default="NULL")
    
    # Statut
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Statut"
    )
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Date de mise à jour")
    
    class Meta:
        verbose_name = "Rendez-vous"
        verbose_name_plural = "Rendez-vous"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student_name} - {self.subject} ({self.preferred_date})"
