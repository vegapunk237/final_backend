# api/views.py
import traceback
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import TeacherRequest, ParentRequest, Appointment
from .serializers import (
    TeacherRequestSerializer, 
    ParentRequestSerializer, 
    AppointmentSerializer
)

from django.core.mail import EmailMessage
from django.conf import settings
import base64
from io import BytesIO

class TeacherRequestViewSet(viewsets.ModelViewSet):
    queryset = TeacherRequest.objects.all()
    serializer_class = TeacherRequestSerializer
    
    def send_teacher_application_email(self, teacher, documents):
        """Envoie un email avec les documents de candidature"""
        try:
            subject = f'Nouvelle candidature enseignant - {teacher.full_name}'
            
            # Corps de l'email
            message = f"""
Nouvelle candidature enseignant reçue !

📋 INFORMATIONS PERSONNELLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Nom complet : {teacher.full_name}
• Email : {teacher.email}
• Téléphone : {teacher.phone}
• Zone d'enseignement : {teacher.zone}
• École : {teacher.school or 'Non spécifié'}

🎓 QUALIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Diplôme : {teacher.qualification}
• Diplôme obtenu : {teacher.diplome or 'Non spécifié'}
• Expérience : {teacher.experience}
• Matières : {', '.join(teacher.subjects) if isinstance(teacher.subjects, list) else teacher.subjects}

📚 PRÉFÉRENCES D'ENSEIGNEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Niveaux acceptés : {teacher.niveau_accepter or 'Non spécifié'}
• Format de cours : {teacher.format_cours or 'Non spécifié'}
• Matière/Niveau : {teacher.matiere_niveau or 'Non spécifié'}

💬 MOTIVATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{teacher.motivation}

📄 DOCUMENTS FOURNIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{chr(10).join([f"• {doc.get('type')} - {doc.get('name')}" for doc in documents])}

✅ CONSENTEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• CGU acceptées : {'Oui' if teacher.accept_terms else 'Non'}
• Vérification acceptée : {'Oui' if teacher.accept_verification else 'Non'}
• Partage de profil : {'Oui' if teacher.accept_profile_sharing else 'Non'}

🔗 ACCÈS RAPIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID de candidature : {teacher.id}
Date de soumission : {teacher.created_at.strftime('%d/%m/%Y à %H:%M')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cet email a été envoyé automatiquement par la plateforme.
            """
            
            # Créer l'email
            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[settings.ADMIN_EMAIL],  # Email de l'admin
                reply_to=[teacher.email]
            )
            
            # Attacher le CV
            if teacher.cv_file:
                try:
                    # Décoder le base64 du CV
                    cv_data = base64.b64decode(teacher.cv_file.split(',')[1] if ',' in teacher.cv_file else teacher.cv_file)
                    email.attach(
                        filename=teacher.cv_filename or 'cv.pdf',
                        content=cv_data,
                        mimetype='application/pdf'
                    )
                except Exception as e:
                    print(f"⚠️ Erreur lors de l'attachement du CV: {str(e)}")
            
            # Attacher les autres documents
            for doc in documents:
                try:
                    if doc.get('file'):
                        # Décoder le base64
                        file_data = base64.b64decode(doc['file'].split(',')[1] if ',' in doc['file'] else doc['file'])
                        
                        # Déterminer le type MIME
                        mime_type = 'application/pdf'
                        if doc.get('name'):
                            if doc['name'].lower().endswith(('.jpg', '.jpeg')):
                                mime_type = 'image/jpeg'
                            elif doc['name'].lower().endswith('.png'):
                                mime_type = 'image/png'
                        
                        email.attach(
                            filename=doc.get('name', f"{doc.get('type', 'document')}.pdf"),
                            content=file_data,
                            mimetype=mime_type
                        )
                except Exception as e:
                    print(f"⚠️ Erreur lors de l'attachement du document {doc.get('name')}: {str(e)}")
            
            # Envoyer l'email
            email.send(fail_silently=False)
            print(f"✉️ Email envoyé avec succès pour {teacher.full_name}")
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors de l'envoi de l'email: {str(e)}")
            return False
    
    def create(self, request):
        """POST - Créer candidature enseignant avec documents obligatoires"""
        print("📥 Données reçues:", request.data.keys())
        
        # Extraire les données
        data = request.data
        
        # Vérifier que l'email n'existe pas déjà
        email = data.get('email', '').lower().strip()
        if not email:
            return Response({
                'success': False,
                'message': 'Email requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if TeacherRequest.objects.filter(email__iexact=email).exists():
            return Response({
                'success': False,
                'message': 'Une candidature avec cet email existe déjà'
            }, status=status.HTTP_409_CONFLICT)
        
        # Validation des champs obligatoires
        required_fields = {
            'fullName': 'Nom complet',
            'email': 'Email',
            'phone': 'Téléphone',
            'password': 'Mot de passe',
            'zone': "Zone d'enseignement",
            'qualification': 'Diplôme',
            'experience': 'Expérience',
            'subjects': 'Matières',
            'motivation': 'Lettre de motivation',
            'cvFile': 'CV',
            'acceptTerms': 'Acceptation des CGU'
        }
        
        for field, label in required_fields.items():
            if field not in data or not data[field]:
                return Response({
                    'success': False,
                    'message': f'Le champ "{label}" est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier les CGU
        if not data.get('acceptTerms'):
            return Response({
                'success': False,
                'message': 'Vous devez accepter les Conditions Générales d\'Utilisation'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation des documents obligatoires
        documents = data.get('documents', [])
        if not documents or len(documents) == 0:
            return Response({
                'success': False,
                'message': 'Vous devez télécharger au moins un document obligatoire'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier les documents requis
        required_docs = [
            "Pièce d'identité",
            "Justificatif de domicile",
            "RIB pour paiement",
            "Copie du diplôme"
        ]
        
        uploaded_doc_types = [doc.get('type') for doc in documents]
        missing_docs = [doc for doc in required_docs if doc not in uploaded_doc_types]
        
        if missing_docs:
            return Response({
                'success': False,
                'message': f'Documents manquants: {", ".join(missing_docs)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Préparer les données pour le modèle
        teacher_data = {
            'full_name': data.get('fullName'),
            'email': email,
            'phone': data.get('phone'),
            'password': data.get('password'),  # ⚠️ À hasher en production
            'zone': data.get('zone'),
            'school': data.get('school', ''),
            'diplome': data.get('diplome', ''),
            'qualification': data.get('qualification'),
            'experience': data.get('experience'),
            'niveau_accepter': data.get('niveauAccepter', ''),
            'format_cours': data.get('formatCours', ''),
            'matiere_niveau': data.get('MatiereNiveau', ''),
            'subjects': data.get('subjects', []),
            'availability': data.get('availability', ''),
            'motivation': data.get('motivation'),
            'cv_file': data.get('cvFile'),
            'cv_filename': data.get('cvFileName', 'cv.pdf'),
            'documents': documents,
            'accept_terms': data.get('acceptTerms', False),
            'accept_verification': data.get('acceptVerification', False),
            'accept_profile_sharing': data.get('acceptProfileSharing', False),
            'status': 'pending'
        }
        
        try:
            # Créer l'enseignant
            serializer = self.get_serializer(data=teacher_data)
            
            if serializer.is_valid():
                teacher = serializer.save()
                
                print(f"✅ Candidature créée: {teacher.full_name} (ID: {teacher.id})")
                
                # 📧 ENVOYER L'EMAIL AVEC LES DOCUMENTS
                email_sent = self.send_teacher_application_email(teacher, documents)
                
                if email_sent:
                    print(f"✉️ Email de notification envoyé à l'administration")
                else:
                    print(f"⚠️ L'email n'a pas pu être envoyé, mais la candidature est enregistrée")
                
                return Response({
                    'success': True,
                    'message': 'Candidature enregistrée avec succès. Vous recevrez une notification par email sous 48-72h.',
                    'data': {
                        'id': teacher.id,
                        'fullName': teacher.full_name,
                        'email': teacher.email,
                        'status': teacher.status,
                        'documentsCount': len(teacher.documents),
                        'created_at': teacher.created_at.isoformat(),
                        'emailSent': email_sent
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                print("❌ Erreurs de validation:", serializer.errors)
                return Response({
                    'success': False,
                    'message': 'Données invalides',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"❌ Erreur lors de la création: {str(e)}")
            return Response({
                'success': False,
                'message': f'Erreur serveur: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def list(self, request):
        """GET - Liste toutes les candidatures"""
        teachers = self.get_queryset()
        serializer = self.get_serializer(teachers, many=True)
        
        # Statistiques
        stats = {
            'total': teachers.count(),
            'pending': teachers.filter(status='pending').count(),
            'approved': teachers.filter(status='approved').count(),
            'rejected': teachers.filter(status='rejected').count(),
        }
        
        return Response({
            'success': True,
            'data': serializer.data,
            'stats': stats
        })
    
    def retrieve(self, request, pk=None):
        """GET - Une candidature par ID"""
        teacher = get_object_or_404(TeacherRequest, pk=pk)
        serializer = self.get_serializer(teacher)
        
        # Ne pas renvoyer le mot de passe
        data = serializer.data
        data.pop('password', None)
        
        return Response({
            'success': True,
            'data': data
        })
    
    def update(self, request, pk=None):
        """PUT - Mettre à jour statut ou informations"""
        teacher = get_object_or_404(TeacherRequest, pk=pk)
        
        # Si c'est juste un changement de statut
        if 'status' in request.data and len(request.data) == 1:
            new_status = request.data.get('status')
            
            if new_status not in ['pending', 'approved', 'rejected']:
                return Response({
                    'success': False,
                    'message': 'Statut invalide. Valeurs acceptées: pending, approved, rejected'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            teacher.status = new_status
            teacher.save()
            
            serializer = self.get_serializer(teacher)
            return Response({
                'success': True,
                'message': f'Statut mis à jour: {new_status}',
                'data': serializer.data
            })
        
        # Sinon mise à jour complète
        serializer = self.get_serializer(teacher, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Candidature mise à jour avec succès',
                'data': serializer.data
            })
        
        return Response({
            'success': False,
            'message': 'Données invalides',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """DELETE - Supprimer candidature"""
        teacher = get_object_or_404(TeacherRequest, pk=pk)
        teacher_name = teacher.full_name
        teacher.delete()
        
        return Response({
            'success': True,
            'message': f'Candidature de {teacher_name} supprimée avec succès'
        })
    
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        """POST - Connexion enseignant"""
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'success': False,
                'message': 'Email et mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            teacher = TeacherRequest.objects.get(email__iexact=email)
        except TeacherRequest.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Email ou mot de passe incorrect'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Vérifier le statut
        if teacher.status == 'rejected':
            return Response({
                'success': False,
                'message': 'Votre candidature a été rejetée. Contactez l\'administration.',
                'status': teacher.status
            }, status=status.HTTP_403_FORBIDDEN)
        
        if teacher.status == 'pending':
            return Response({
                'success': False,
                'message': 'Votre candidature est en cours de vérification. Vous serez notifié par email sous 48-72h.',
                'status': teacher.status
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Vérifier le mot de passe
        if teacher.password != password:  # ⚠️ Utiliser bcrypt en production
            return Response({
                'success': False,
                'message': 'Email ou mot de passe incorrect'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Connexion réussie
        serializer = self.get_serializer(teacher)
        data = serializer.data
        data.pop('password', None)
        data.pop('cv_file', None)  # Ne pas renvoyer le CV en base64
        data['role'] = 'teacher'
        data['documentsCount'] = len(teacher.documents)
        
        return Response({
            'success': True,
            'message': 'Connexion réussie',
            'data': data
        })
    
    @action(detail=False, methods=['get'], url_path='stats')
    def get_stats(self, request):
        """GET - Statistiques des candidatures"""
        total = TeacherRequest.objects.count()
        pending = TeacherRequest.objects.filter(status='pending').count()
        approved = TeacherRequest.objects.filter(status='approved').count()
        rejected = TeacherRequest.objects.filter(status='rejected').count()
        
        # Dernières candidatures
        recent = TeacherRequest.objects.order_by('-created_at')[:5]
        recent_serializer = self.get_serializer(recent, many=True)
        
        return Response({
            'success': True,
            'stats': {
                'total': total,
                'pending': pending,
                'approved': approved,
                'rejected': rejected
            },
            'recent': recent_serializer.data
        })


# ============================================
# VIEWSETS PARENTS (inchangé)
# ============================================


class ParentRequestViewSet(viewsets.ModelViewSet):
    queryset = ParentRequest.objects.all()
    serializer_class = ParentRequestSerializer
    
    def create(self, request):
        """POST - Créer demande parent"""
        try:
            print("=" * 60)
            print("📥 REQUÊTE PARENT REÇUE")
            print("=" * 60)
            print("Données reçues:", list(request.data.keys()))
            print("Email:", request.data.get('email'))
            print("Parent name:", request.data.get('parentName'))
            print("Child name:", request.data.get('childName'))
            print("Subjects:", request.data.get('subjects'))
            print("=" * 60)
            
            # Normaliser les données (camelCase → snake_case)
            data = {
                'parent_name': request.data.get('parentName'),
                'email': request.data.get('email', '').lower().strip(),
                'phone': request.data.get('phone'),
                'address': request.data.get('address'),
                'password': request.data.get('password'),
                'child_name': request.data.get('childName'),
                'child_age': request.data.get('childAge'),
                'child_level': request.data.get('childLevel'),
                'subjects': request.data.get('subjects', []),
                'availability': request.data.get('availability', ''),
                'status': 'pending'
            }
            
            # Validation manuelle
            if not data['email']:
                return Response({
                    'success': False,
                    'message': 'Email requis'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Vérifier doublon email
            if ParentRequest.objects.filter(email__iexact=data['email']).exists():
                return Response({
                    'success': False,
                    'message': 'Une demande avec cet email existe déjà'
                }, status=status.HTTP_409_CONFLICT)
            
            # Créer avec le serializer
            serializer = self.get_serializer(data=data)
            
            if serializer.is_valid():
                parent = serializer.save()
                
                print(f"✅ Demande créée: {parent.parent_name} (ID: {parent.id})")
                
                return Response({
                    'success': True,
                    'message': 'Demande enregistrée avec succès',
                    'data': {
                        'id': parent.id,
                        'parentName': parent.parent_name,
                        'email': parent.email,
                        'childName': parent.child_name,
                        'status': parent.status,
                        'created_at': parent.created_at.isoformat()
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                print("❌ Erreurs de validation:", serializer.errors)
                return Response({
                    'success': False,
                    'message': 'Données invalides',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            print("=" * 60)
            print("❌ ERREUR EXCEPTION")
            print("=" * 60)
            print(f"Type: {type(e).__name__}")
            print(f"Message: {str(e)}")
            print("Traceback:")
            print(traceback.format_exc())
            print("=" * 60)
            
            return Response({
                'success': False,
                'message': f'Erreur serveur: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def list(self, request):
        """GET - Liste demandes"""
        parents = self.get_queryset()
        serializer = self.get_serializer(parents, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': parents.count()
        })
    
    def retrieve(self, request, pk=None):
        """GET - Une demande par ID"""
        parent = get_object_or_404(ParentRequest, pk=pk)
        serializer = self.get_serializer(parent)
        
        # Ne pas renvoyer le mot de passe
        data = serializer.data
        data.pop('password', None)
        
        return Response({
            'success': True,
            'data': data
        })
    
    def update(self, request, pk=None):
        """PUT - Mettre à jour statut"""
        parent = get_object_or_404(ParentRequest, pk=pk)
        
        # Si c'est juste un changement de statut
        if 'status' in request.data and len(request.data) == 1:
            new_status = request.data.get('status')
            
            if new_status not in ['pending', 'approved', 'rejected']:
                return Response({
                    'success': False,
                    'message': 'Statut invalide'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            parent.status = new_status
            parent.save()
            
            serializer = self.get_serializer(parent)
            return Response({
                'success': True,
                'message': f'Statut mis à jour: {new_status}',
                'data': serializer.data
            })
        
        # Sinon mise à jour complète
        serializer = self.get_serializer(parent, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Demande mise à jour',
                'data': serializer.data
            })
        
        return Response({
            'success': False,
            'message': 'Données invalides',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """DELETE - Supprimer"""
        parent = get_object_or_404(ParentRequest, pk=pk)
        parent_name = parent.parent_name
        parent.delete()
        
        return Response({
            'success': True,
            'message': f'Demande de {parent_name} supprimée'
        })
    
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        """POST - Connexion parent"""
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'success': False,
                'message': 'Email et mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            parent = ParentRequest.objects.get(email__iexact=email)
        except ParentRequest.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Email ou mot de passe incorrect'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Vérifier le statut
        if parent.status == 'rejected':
            return Response({
                'success': False,
                'message': 'Votre demande a été rejetée',
                'status': parent.status
            }, status=status.HTTP_403_FORBIDDEN)
        
        if parent.status == 'pending':
            return Response({
                'success': False,
                'message': 'Votre demande est en cours de vérification',
                'status': parent.status
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Vérifier le mot de passe
        if parent.password != password:
            return Response({
                'success': False,
                'message': 'Email ou mot de passe incorrect'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Connexion réussie
        serializer = self.get_serializer(parent)
        data = serializer.data
        data.pop('password', None)
        data['role'] = 'parent'
        
        return Response({
            'success': True,
            'message': 'Connexion réussie',
            'data': data
        })
    
    @action(detail=False, methods=['delete'], url_path='clear-all')
    def clear_all(self, request):
        """DELETE - Supprimer toutes les demandes (DEV ONLY)"""
        count = ParentRequest.objects.count()
        ParentRequest.objects.all().delete()
        
        return Response({
            'success': True,
            'message': f'{count} demande(s) supprimée(s)'
        })


# ============================================
# VIEWSETS RENDEZ-VOUS (inchangé)
# ============================================

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    
    def create(self, request):
        """POST - Créer rendez-vous"""
        try:
            print("\n" + "="*60)
            print("📥 CRÉATION RENDEZ-VOUS")
            print("="*60)
            print("Données reçues:", list(request.data.keys()))
            
            # Mapper les données camelCase → snake_case
            data = {
                'parent_id': request.data.get('parentId'),
                'parent_name': request.data.get('parentName'),
                'parent_email': request.data.get('parentEmail'),
                'parent_phone': request.data.get('parentPhone', ''),
                'student_name': request.data.get('studentName'),
                'subject': request.data.get('subject'),
                'level': request.data.get('level'),
                'preferred_date': request.data.get('preferredDate'),
                'preferred_time': request.data.get('preferredTime'),
                'duration': request.data.get('duration'),
                'location': request.data.get('location'),
                'notes': request.data.get('notes', ''),
                'price_per_hour': request.data.get('pricePerHour'),
                'total_amount': request.data.get('totalAmount'),
                'is_trial_course': request.data.get('isTrialCourse', False),
                'status': 'pending'
            }
            
            print("📦 Données mappées:")
            print(f"  Parent: {data['parent_name']} ({data['parent_email']})")
            print(f"  Élève: {data['student_name']}")
            print(f"  Cours: {data['subject']} - {data['level']}")
            print(f"  Date: {data['preferred_date']} à {data['preferred_time']}")
            print(f"  Durée: {data['duration']}h")
            print(f"  Lieu: {data['location']}")
            print(f"  Prix/h: {data['price_per_hour']}€")
            print(f"  Total: {data['total_amount']}€")
            print(f"  Cours d'essai: {'OUI ✓' if data['is_trial_course'] else 'NON'}")
            
            parent_id = data['parent_id']
            is_trial = data['is_trial_course']
            
            # Vérifier si le cours d'essai a déjà été utilisé
            if is_trial and parent_id:
                trial_count = Appointment.objects.filter(
                    parent_id=parent_id,
                    is_trial_course=True
                ).count()
                
                if trial_count > 0:
                    print(f"❌ Cours d'essai déjà utilisé par parent ID: {parent_id}")
                    return Response({
                        'success': False,
                        'message': "Vous avez déjà utilisé votre cours d'essai gratuit."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                print("✓ Cours d'essai disponible")
            
            # Créer le rendez-vous
            serializer = self.get_serializer(data=data)
            
            if serializer.is_valid():
                appointment = serializer.save()
                print(f"✅ Rendez-vous créé (ID: {appointment.id})")
                print("="*60 + "\n")
                
                return Response({
                    'success': True,
                    'message': "Cours d'essai réservé avec succès !" if is_trial else "Rendez-vous créé avec succès",
                    'data': {
                        'id': appointment.id,
                        'parentId': appointment.parent_id,
                        'parentName': appointment.parent_name,
                        'studentName': appointment.student_name,
                        'subject': appointment.subject,
                        'level': appointment.level,
                        'preferredDate': appointment.preferred_date.isoformat(),
                        'preferredTime': appointment.preferred_time.strftime('%H:%M'),
                        'duration': float(appointment.duration),
                        'location': appointment.location,
                        'totalAmount': float(appointment.total_amount),
                        'isTrialCourse': appointment.is_trial_course,
                        'status': appointment.status,
                        'createdAt': appointment.created_at.isoformat()
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                print("❌ Erreurs de validation:")
                print(serializer.errors)
                print("="*60 + "\n")
                
                return Response({
                    'success': False,
                    'message': 'Données invalides',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            print("\n" + "="*60)
            print("❌ ERREUR EXCEPTION")
            print("="*60)
            print(f"Type: {type(e).__name__}")
            print(f"Message: {str(e)}")
            print("Traceback:")
            print(traceback.format_exc())
            print("="*60 + "\n")
            
            return Response({
                'success': False,
                'message': f'Erreur serveur: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def list(self, request):
        """GET - Liste rendez-vous"""
        appointments = self.get_queryset()
        serializer = self.get_serializer(appointments, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': len(serializer.data)  # ✅ Utiliser len() au lieu de count()
        })
    
    def retrieve(self, request, pk=None):
        """GET - Un rendez-vous par ID"""
        appointment = get_object_or_404(Appointment, pk=pk)
        serializer = self.get_serializer(appointment)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='check-trial/(?P<user_id>[^/.]+)')
    def check_trial(self, request, user_id=None):
        """GET - Vérifier si le cours d'essai a été utilisé"""
        print(f"\n🔍 Vérification cours d'essai pour user_id: {user_id}")
        
        has_used_trial = Appointment.objects.filter(
            parent_id=user_id,
            is_trial_course=True
        ).exists()
        
        print(f"Résultat: {'Déjà utilisé ✗' if has_used_trial else 'Disponible ✓'}\n")
        
        return Response({
            'success': True,
            'hasUsedTrial': has_used_trial
        })
    
    @action(detail=True, methods=['put'], url_path='assign')
    def assign_teacher(self, request, pk=None):
        """PUT - Assigner un enseignant à un rendez-vous"""
        try:
            print(f"\n📌 Assignation enseignant au rendez-vous ID: {pk}")
            
            appointment = get_object_or_404(Appointment, pk=pk)
            teacher_id = request.data.get('teacherId')
            teacher_name = request.data.get('teacherName')
            
            print(f"Enseignant: {teacher_name} (ID: {teacher_id})")
            
            if not teacher_id or not teacher_name:
                return Response({
                    'success': False,
                    'message': 'teacherId et teacherName requis'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            appointment.assigned_teacher_id = teacher_id
            appointment.assigned_teacher = teacher_name
            appointment.status = 'assigned'
            appointment.save()
            
            print(f"✅ Enseignant assigné avec succès\n")
            
            serializer = self.get_serializer(appointment)
            return Response({
                'success': True,
                'message': 'Enseignant assigné avec succès',
                'data': serializer.data
            })
        
        except Exception as e:
            print(f"❌ Erreur assignation: {str(e)}\n")
            return Response({
                'success': False,
                'message': f'Erreur: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, pk=None):
        """DELETE - Supprimer un rendez-vous"""
        appointment = get_object_or_404(Appointment, pk=pk)
        appointment_info = f"{appointment.student_name} - {appointment.subject}"
        appointment.delete()
        
        return Response({
            'success': True,
            'message': f'Rendez-vous {appointment_info} supprimé'
        })

# ============================================
# HEALTH CHECK
# ============================================

@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'success': True,
        'message': 'API KH Perfection fonctionnelle',
        'timestamp': timezone.now().isoformat(),
        'endpoints': {
            'teachers': '/api/teacher-requests/',
            'parents': '/api/parent-requests/',
            'appointments': '/api/appointments/'
        }
    })