# api/models.py
from django.db import models
from django.core.validators import EmailValidator
import json

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


class ParentRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
    ]
    
    # Informations parent
    parent_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    phone = models.CharField(max_length=50)
    address = models.TextField()
    password = models.CharField(max_length=255)
    
    # Informations enfant
    child_name = models.CharField(max_length=255)
    child_age = models.IntegerField()
    child_level = models.CharField(max_length=100)
    subjects = models.JSONField()
    availability = models.TextField(blank=True, null=True)
    
    # Statut
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'parent_requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.parent_name} - {self.child_name}"


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
