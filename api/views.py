# api/views.py
import traceback
from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import TeacherRequest, ParentRequest, Appointment
from .models import Message
from .serializers import MessageSerializer
from .serializers import (
    TeacherRequestSerializer, 
    ParentRequestSerializer, 
    AppointmentSerializer
)
from django.http import JsonResponse
from django.views import View  
from django.core.mail import EmailMessage
from django.conf import settings
import base64
from io import BytesIO

from django.http import FileResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import CourseFile, Appointment
from .serializers import CourseFileSerializer

# Types de fichiers autorisés
ALLOWED_EXTENSIONS = {
    'pdf':  ['pdf'],
    'image':['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'],
    'word': ['doc', 'docx'],
    'excel':['xls', 'xlsx'],
}
ALL_ALLOWED = [ext for exts in ALLOWED_EXTENSIONS.values() for ext in exts]
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def get_file_type(filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    for ftype, exts in ALLOWED_EXTENSIONS.items():
        if ext in exts:
            return ftype
    return 'other'


@method_decorator(csrf_exempt, name='dispatch')
class CourseFileListUploadView(APIView):
    """
    GET  /api/appointments/<appointment_id>/files/   → liste les fichiers du cours
    POST /api/appointments/<appointment_id>/files/   → upload un fichier
    """
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            return Response({'success': False, 'message': 'Rendez-vous introuvable'}, status=404)

        files = CourseFile.objects.filter(appointment=appointment)
        serializer = CourseFileSerializer(files, many=True, context={'request': request})
        return Response({'success': True, 'data': serializer.data})

    def post(self, request, appointment_id):
        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            return Response({'success': False, 'message': 'Rendez-vous introuvable'}, status=404)

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'success': False, 'message': 'Aucun fichier reçu'}, status=400)

        # Vérification extension
        original_name = uploaded_file.name
        ext = original_name.rsplit('.', 1)[-1].lower() if '.' in original_name else ''
        if ext not in ALL_ALLOWED:
            return Response({
                'success': False,
                'message': f'Extension .{ext} non autorisée. Formats acceptés : PDF, images, Word, Excel'
            }, status=400)

        # Vérification taille
        if uploaded_file.size > MAX_FILE_SIZE:
            return Response({
                'success': False,
                'message': f'Fichier trop lourd ({uploaded_file.size // (1024*1024)} MB). Maximum : 20 MB'
            }, status=400)

        course_file = CourseFile(
            appointment   = appointment,
            file          = uploaded_file,
            original_name = original_name,
            file_type     = get_file_type(original_name),
            file_size     = uploaded_file.size,
            uploaded_by   = request.data.get('uploaded_by', 'parent'),
            uploader_name = request.data.get('uploader_name', ''),
            description   = request.data.get('description', ''),
        )
        course_file.save()

        serializer = CourseFileSerializer(course_file, context={'request': request})
        return Response({'success': True, 'data': serializer.data}, status=201)


@method_decorator(csrf_exempt, name='dispatch')
class CourseFileDetailView(APIView):
    """
    GET    /api/files/<file_id>/download/  → télécharger le fichier
    DELETE /api/files/<file_id>/           → supprimer le fichier
    """

    def get_object(self, file_id):
        try:
            return CourseFile.objects.get(id=file_id)
        except CourseFile.DoesNotExist:
            return None

    def delete(self, request, file_id):
        course_file = self.get_object(file_id)
        if not course_file:
            return Response({'success': False, 'message': 'Fichier introuvable'}, status=404)

        # Supprimer le fichier physique
        if course_file.file and os.path.isfile(course_file.file.path):
            os.remove(course_file.file.path)

        course_file.delete()
        return Response({'success': True, 'message': 'Fichier supprimé'})


class CourseFileDownloadView(APIView):
    """
    GET /api/files/<file_id>/download/
    Force le téléchargement avec Content-Disposition: attachment
    """

    def get(self, request, file_id):
        try:
            course_file = CourseFile.objects.get(id=file_id)
        except CourseFile.DoesNotExist:
            raise Http404

        if not course_file.file or not os.path.isfile(course_file.file.path):
            raise Http404

        response = FileResponse(
            open(course_file.file.path, 'rb'),
            as_attachment=True,
            filename=course_file.original_name
        )
        return response

class TeacherRequestViewSet(viewsets.ModelViewSet):
    queryset = TeacherRequest.objects.all()
    serializer_class = TeacherRequestSerializer
    
    def send_teacher_application_email(self, teacher, documents):
        """Envoie un email avec les documents de candidature"""
        try:
            subject = f'Nouvelle candidature enseignant - {teacher.full_name}'
            
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
{chr(10).join([f"• {doc.get('type')} - {doc.get('fileName') or doc.get('name', 'fichier')}" for doc in documents])}

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
            
            email_msg = EmailMessage(
                subject=subject,
                body=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[settings.ADMIN_EMAIL],
                reply_to=[teacher.email]
            )
            
            # Attacher le CV
            if teacher.cv_file:
                try:
                    cv_data = base64.b64decode(
                        teacher.cv_file.split(',')[1] if ',' in teacher.cv_file else teacher.cv_file
                    )
                    email_msg.attach(
                        filename=teacher.cv_filename or 'cv.pdf',
                        content=cv_data,
                        mimetype='application/pdf'
                    )
                except Exception as e:
                    print(f"⚠️ Erreur attachement CV: {str(e)}")
            
            # Attacher les autres documents
            for doc in documents:
                try:
                    if doc.get('file'):
                        file_data = base64.b64decode(
                            doc['file'].split(',')[1] if ',' in doc['file'] else doc['file']
                        )
                        # Accepter fileName OU name
                        doc_filename = doc.get('fileName') or doc.get('name') or f"{doc.get('type', 'document')}.pdf"
                        
                        mime_type = 'application/pdf'
                        name_lower = doc_filename.lower()
                        if name_lower.endswith(('.jpg', '.jpeg')):
                            mime_type = 'image/jpeg'
                        elif name_lower.endswith('.png'):
                            mime_type = 'image/png'
                        elif name_lower.endswith(('.doc', '.docx')):
                            mime_type = 'application/msword'
                        
                        email_msg.attach(
                            filename=doc_filename,
                            content=file_data,
                            mimetype=mime_type
                        )
                except Exception as e:
                    print(f"⚠️ Erreur attachement document {doc.get('fileName') or doc.get('name')}: {str(e)}")
            
            email_msg.send(fail_silently=False)
            print(f"✉️ Email envoyé avec succès pour {teacher.full_name}")
            return True
            
        except Exception as e:
            print(f"❌ Erreur envoi email: {str(e)}")
            return False
    
    def create(self, request):
        """POST - Créer candidature enseignant avec documents obligatoires"""
        print("📥 Données reçues:", request.data.keys())
        
        data = request.data
        
        # Vérifier email
        email = data.get('email', '').lower().strip()
        if not email:
            return Response({'success': False, 'message': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        if TeacherRequest.objects.filter(email__iexact=email).exists():
            return Response({
                'success': False,
                'message': 'Une candidature avec cet email existe déjà'
            }, status=status.HTTP_409_CONFLICT)
        
        # Validation champs obligatoires
        required_fields = {
            'fullName':    'Nom complet',
            'email':       'Email',
            'phone':       'Téléphone',
            'password':    'Mot de passe',
            'zone':        "Zone d'enseignement",
            'qualification': 'Diplôme',
            'experience':  'Expérience',
            'subjects':    'Matières',
            'motivation':  'Lettre de motivation',
            'cvFile':      'CV',
            'acceptTerms': 'Acceptation des CGU',
        }
        
        for field, label in required_fields.items():
            if field not in data or not data[field]:
                return Response({
                    'success': False,
                    'message': f'Le champ "{label}" est obligatoire'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if not data.get('acceptTerms'):
            return Response({
                'success': False,
                'message': "Vous devez accepter les Conditions Générales d'Utilisation"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation documents
        documents = data.get('documents', [])
        if not documents:
            return Response({
                'success': False,
                'message': 'Vous devez télécharger au moins un document obligatoire'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # ✅ CORRECTION : normaliser chaque document (accepter fileName OU name)
        normalized_docs = []
        for doc in documents:
            # Récupérer le nom du fichier depuis fileName ou name
            file_name = doc.get('fileName') or doc.get('name')
            if not file_name:
                return Response({
                    'success': False,
                    'message': f"Le nom du fichier est manquant pour le document de type '{doc.get('type', 'inconnu')}'"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            normalized_docs.append({
                'type':     doc.get('type', ''),
                'fileName': file_name,   # ← toujours 'fileName' en base
                'name':     file_name,   # ← garder aussi 'name' pour compatibilité
                'file':     doc.get('file', ''),
            })
        
        # Vérifier documents requis
        required_docs = [
            "Pièce d'identité",
            "Justificatif de domicile",
            "RIB pour paiement",
            "Copie du diplôme",
        ]
        uploaded_types = [doc['type'] for doc in normalized_docs]
        missing_docs   = [d for d in required_docs if d not in uploaded_types]
        
        if missing_docs:
            return Response({
                'success': False,
                'message': f'Documents manquants: {", ".join(missing_docs)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Préparer données pour le modèle
        teacher_data = {
            'full_name':          data.get('fullName'),
            'email':              email,
            'phone':              data.get('phone'),
            'password':           data.get('password'),
            'zone':               data.get('zone'),
            'school':             data.get('school', ''),
            'diplome':            data.get('diplome', ''),
            'qualification':      data.get('qualification'),
            'experience':         data.get('experience'),
            'niveau_accepter':    data.get('niveauAccepter', ''),
            'format_cours':       data.get('formatCours', ''),
            'matiere_niveau':     data.get('MatiereNiveau', ''),
            'subjects':           data.get('subjects', []),
            'availability':       data.get('availability', ''),
            'motivation':         data.get('motivation'),
            'cv_file':            data.get('cvFile'),
            'cv_filename':        data.get('cvFileName', 'cv.pdf'),
            'documents':          normalized_docs,   # ← docs normalisés
            'accept_terms':       data.get('acceptTerms', False),
            'accept_verification': data.get('acceptVerification', False),
            'accept_profile_sharing': data.get('acceptProfileSharing', False),
            'status':             'pending',
        }
        
        try:
            serializer = self.get_serializer(data=teacher_data)
            
            if serializer.is_valid():
                teacher = serializer.save()
                print(f"✅ Candidature créée: {teacher.full_name} (ID: {teacher.id})")
                
                email_sent = self.send_teacher_application_email(teacher, normalized_docs)
                
                return Response({
                    'success': True,
                    'message': 'Candidature enregistrée avec succès. Vous recevrez une notification par email sous 48-72h.',
                    'data': {
                        'id':             teacher.id,
                        'fullName':       teacher.full_name,
                        'email':          teacher.email,
                        'status':         teacher.status,
                        'documentsCount': len(teacher.documents),
                        'created_at':     teacher.created_at.isoformat(),
                        'emailSent':      email_sent,
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
        stats = {
            'total':    teachers.count(),
            'pending':  teachers.filter(status='pending').count(),
            'approved': teachers.filter(status='approved').count(),
            'rejected': teachers.filter(status='rejected').count(),
        }
        return Response({'success': True, 'data': serializer.data, 'stats': stats})
    
    def retrieve(self, request, pk=None):
        """GET - Une candidature par ID"""
        teacher = get_object_or_404(TeacherRequest, pk=pk)
        serializer = self.get_serializer(teacher)
        data = serializer.data
        data.pop('password', None)
        return Response({'success': True, 'data': data})
    
    def update(self, request, pk=None):
        """PUT - Mettre à jour statut ou informations"""
        teacher = get_object_or_404(TeacherRequest, pk=pk)
        
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
            return Response({'success': True, 'message': f'Statut mis à jour: {new_status}', 'data': serializer.data})
        
        serializer = self.get_serializer(teacher, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Candidature mise à jour avec succès', 'data': serializer.data})
        
        return Response({'success': False, 'message': 'Données invalides', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        """DELETE - Supprimer candidature"""
        teacher = get_object_or_404(TeacherRequest, pk=pk)
        teacher_name = teacher.full_name
        teacher.delete()
        return Response({'success': True, 'message': f'Candidature de {teacher_name} supprimée avec succès'})
    
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        """POST - Connexion enseignant"""
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'success': False, 'message': 'Email et mot de passe requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            teacher = TeacherRequest.objects.get(email__iexact=email)
        except TeacherRequest.DoesNotExist:
            return Response({'success': False, 'message': 'Email ou mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if teacher.status == 'rejected':
            return Response({
                'success': False,
                'message': "Votre candidature a été rejetée. Contactez l'administration.",
                'status': teacher.status
            }, status=status.HTTP_403_FORBIDDEN)
        
        if teacher.status == 'pending':
            return Response({
                'success': False,
                'message': 'Votre candidature est en cours de vérification. Vous serez notifié par email sous 48-72h.',
                'status': teacher.status
            }, status=status.HTTP_403_FORBIDDEN)
        
        if teacher.password != password:
            return Response({'success': False, 'message': 'Email ou mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
        
        serializer = self.get_serializer(teacher)
        data = serializer.data
        data.pop('password', None)
        data.pop('cv_file', None)
        data['role'] = 'teacher'
        data['documentsCount'] = len(teacher.documents)
        
        return Response({'success': True, 'message': 'Connexion réussie', 'data': data})
    
    @action(detail=False, methods=['get'], url_path='stats')
    def get_stats(self, request):
        """GET - Statistiques des candidatures"""
        total    = TeacherRequest.objects.count()
        pending  = TeacherRequest.objects.filter(status='pending').count()
        approved = TeacherRequest.objects.filter(status='approved').count()
        rejected = TeacherRequest.objects.filter(status='rejected').count()
        recent   = TeacherRequest.objects.order_by('-created_at')[:5]
        recent_serializer = self.get_serializer(recent, many=True)
        
        return Response({
            'success': True,
            'stats': {'total': total, 'pending': pending, 'approved': approved, 'rejected': rejected},
            'recent': recent_serializer.data
        })


# ============================================
# VIEWSETS PARENTS (inchangé)
# ============================================


# ─── REMPLACE la classe ParentRequestViewSet dans api/views.py ───────────────
# (garde tout le reste du fichier intact)

class ParentRequestViewSet(viewsets.ModelViewSet):
    queryset = ParentRequest.objects.all()
    serializer_class = ParentRequestSerializer

    # ─────────────────────────────────────────────────────────────────────────
    # 📧  EMAIL — envoyé à l'admin après chaque nouvelle candidature
    # ─────────────────────────────────────────────────────────────────────────
    def send_parent_request_email(self, parent):
        """Envoie un email complet à l'admin avec toutes les infos du parent."""
        try:
            children = parent.children  # liste JSON

            # ── Construire le bloc enfants ────────────────────────────────────
            children_block = ""
            for i, child in enumerate(children, 1):
                formula_labels = {
                    'enligne':      'Cours particulier en ligne',
                    'adomicile':    "Cours à domicile (crédit d'impôt -50%)",
                    'stage':        'Stage intensif (5 à 30 jours)',
                    'pasencoresur': 'Je ne sais pas encore',
                }
                formula = formula_labels.get(child.get('formula', ''), child.get('formula', 'Non spécifié'))

                def fmt_list(lst):
                    return ', '.join(lst) if lst else 'Non spécifié'

                children_block += f"""
┌─ ENFANT {i} ──────────────────────────────────────────────
│ Prénom / Nom    : {child.get('firstName', '')} {child.get('lastName', '')}
│ Niveau scolaire : {child.get('level', 'Non spécifié')}
│ Matières        : {fmt_list(child.get('subjects', []))}
│ Formule         : {formula}
│ Jours préférés  : {fmt_list(child.get('preferredDays', []))}
│ Créneaux        : {fmt_list(child.get('preferredSlots', []))}
│ Objectifs       : {fmt_list(child.get('objectives', []))}
│ Besoins spéc.   : {fmt_list(child.get('specificNeeds', []))}
│ Centres intérêt : {fmt_list(child.get('interests', []))}
│ État d'esprit   : {fmt_list(child.get('mindset', []))}
└────────────────────────────────────────────────────────────
"""

            subject = (
                f"📚 Nouvelle demande de cours — "
                f"{parent.parent_first_name} {parent.parent_last_name}"
            )

            body = f"""
╔══════════════════════════════════════════════════════════════╗
║          NOUVELLE DEMANDE DE COURS — KH PERFECTION           ║
╚══════════════════════════════════════════════════════════════╝

👤 INFORMATIONS PARENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Prénom        : {parent.parent_first_name}
• Nom           : {parent.parent_last_name}
• Email         : {parent.email}
• Téléphone     : {parent.phone}
• Adresse       : {parent.address or 'Non renseignée'}
• Code postal   : {parent.postal_code or 'Non renseigné'}
• Message       : {parent.message or 'Aucun message'}

👶 ENFANT(S) CONCERNÉ(S) ({len(children)} enfant{'s' if len(children) > 1 else ''})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{children_block}
✅ CONSENTEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• CGU acceptées : {'Oui ✓' if parent.accept_terms else 'Non ✗'}

🔗 ACCÈS RAPIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• ID demande    : {parent.id}
• Date          : {parent.created_at.strftime('%d/%m/%Y à %H:%M')}
• Statut actuel : {parent.status}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cet email a été généré automatiquement par la plateforme KH Perfection.
Répondez directement à cet email pour contacter le parent.
"""

            email_msg = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[settings.ADMIN_EMAIL],
                reply_to=[parent.email],
            )
            email_msg.send(fail_silently=False)
            print(f"✉️  Email envoyé pour {parent.parent_first_name} {parent.parent_last_name}")
            return True

        except Exception as e:
            print(f"❌ Erreur email: {str(e)}")
            return False

    # ─────────────────────────────────────────────────────────────────────────
    # POST /api/parent-requests/   — Créer une demande
    # ─────────────────────────────────────────────────────────────────────────
    def create(self, request):
        try:
            print("=" * 60)
            print("📥 NOUVELLE DEMANDE PARENT")
            print("=" * 60)

            d = request.data  # alias court

            # ── Validation email ──────────────────────────────────────────────
            email = d.get('email', '').lower().strip()
            if not email:
                return Response(
                    {'success': False, 'message': 'Email requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if ParentRequest.objects.filter(email__iexact=email).exists():
                return Response(
                    {'success': False, 'message': 'Une demande avec cet email existe déjà'},
                    status=status.HTTP_409_CONFLICT
                )

            # ── Mapper camelCase → snake_case ─────────────────────────────────
            data = {
                'parent_first_name': d.get('parentFirstName', '').strip(),
                'parent_last_name':  d.get('parentLastName', '').strip(),
                'email':             email,
                'phone':             d.get('phone', '').strip(),
                'password':          d.get('password', ''),
                'address':           d.get('address', '').strip(),
                'postal_code':       d.get('postalCode', '').strip(),
                'message':           d.get('message', '').strip(),
                'children':          d.get('children', []),
                'accept_terms':      d.get('acceptTerms', False),
                'status':            'pending',
            }

            # ── Validations de base ───────────────────────────────────────────
            if not data['parent_first_name']:
                return Response({'success': False, 'message': 'Prénom requis'}, status=400)
            if not data['parent_last_name']:
                return Response({'success': False, 'message': 'Nom requis'}, status=400)
            if not data['phone']:
                return Response({'success': False, 'message': 'Téléphone requis'}, status=400)
            if not data['password']:
                return Response({'success': False, 'message': 'Mot de passe requis'}, status=400)
            if not data['children']:
                return Response({'success': False, 'message': 'Au moins un enfant requis'}, status=400)
            if not data['accept_terms']:
                return Response({'success': False, 'message': 'Veuillez accepter les CGU'}, status=400)

            # ── Créer via serializer ──────────────────────────────────────────
            serializer = self.get_serializer(data=data)

            if serializer.is_valid():
                parent = serializer.save()
                print(f"✅ Demande créée — ID {parent.id}")

                # 📧 Envoyer l'email
                email_sent = self.send_parent_request_email(parent)

                return Response({
                    'success': True,
                    'message': (
                        'Votre demande a bien été enregistrée. '
                        'Vous recevrez votre devis sous 24 à 48h.'
                    ),
                    'data': {
                        'id':          parent.id,
                        'parentName':  f"{parent.parent_first_name} {parent.parent_last_name}",
                        'email':       parent.email,
                        'status':      parent.status,
                        'emailSent':   email_sent,
                        'createdAt':   parent.created_at.isoformat(),
                    }
                }, status=status.HTTP_201_CREATED)

            else:
                print("❌ Erreurs validation:", serializer.errors)
                return Response({
                    'success': False,
                    'message': 'Données invalides',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print(f"❌ Exception: {traceback.format_exc()}")
            return Response(
                {'success': False, 'message': f'Erreur serveur: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─────────────────────────────────────────────────────────────────────────
    # GET /api/parent-requests/
    # ─────────────────────────────────────────────────────────────────────────
    def list(self, request):
        parents = self.get_queryset()
        serializer = self.get_serializer(parents, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': parents.count()
        })

    # ─────────────────────────────────────────────────────────────────────────
    # GET /api/parent-requests/{id}/
    # ─────────────────────────────────────────────────────────────────────────
    def retrieve(self, request, pk=None):
        parent = get_object_or_404(ParentRequest, pk=pk)
        serializer = self.get_serializer(parent)
        data = serializer.data
        data.pop('password', None)
        return Response({'success': True, 'data': data})

    # ─────────────────────────────────────────────────────────────────────────
    # PUT /api/parent-requests/{id}/
    # ─────────────────────────────────────────────────────────────────────────
    def update(self, request, pk=None):
        parent = get_object_or_404(ParentRequest, pk=pk)

        if 'status' in request.data and len(request.data) == 1:
            new_status = request.data.get('status')
            if new_status not in ['pending', 'approved', 'rejected']:
                return Response(
                    {'success': False, 'message': 'Statut invalide'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            parent.status = new_status
            parent.save()
            return Response({
                'success': True,
                'message': f'Statut mis à jour : {new_status}',
                'data': self.get_serializer(parent).data
            })

        serializer = self.get_serializer(parent, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Demande mise à jour', 'data': serializer.data})

        return Response(
            {'success': False, 'message': 'Données invalides', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ─────────────────────────────────────────────────────────────────────────
    # DELETE /api/parent-requests/{id}/
    # ─────────────────────────────────────────────────────────────────────────
    def destroy(self, request, pk=None):
        parent = get_object_or_404(ParentRequest, pk=pk)
        name = f"{parent.parent_first_name} {parent.parent_last_name}"
        parent.delete()
        return Response({'success': True, 'message': f'Demande de {name} supprimée'})

    # ─────────────────────────────────────────────────────────────────────────
    # POST /api/parent-requests/login/
    # ─────────────────────────────────────────────────────────────────────────
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        email    = request.data.get('email', '').lower().strip()
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'success': False, 'message': 'Email et mot de passe requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            parent = ParentRequest.objects.get(email__iexact=email)
        except ParentRequest.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Email ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if parent.status == 'rejected':
            return Response(
                {'success': False, 'message': 'Votre demande a été rejetée.', 'status': parent.status},
                status=status.HTTP_403_FORBIDDEN
            )
        if parent.status == 'pending':
            return Response(
                {'success': False, 'message': 'Votre demande est en cours de vérification.', 'status': parent.status},
                status=status.HTTP_403_FORBIDDEN
            )
        if parent.password != password:
            return Response(
                {'success': False, 'message': 'Email ou mot de passe incorrect'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        data = self.get_serializer(parent).data
        data.pop('password', None)
        data['role'] = 'parent'
        data['name'] = f"{parent.parent_first_name} {parent.parent_last_name}"

        return Response({'success': True, 'message': 'Connexion réussie', 'data': data})

    # ─────────────────────────────────────────────────────────────────────────
    # DELETE /api/parent-requests/clear-all/  (dev only)
    # ─────────────────────────────────────────────────────────────────────────
    @action(detail=False, methods=['delete'], url_path='clear-all')
    def clear_all(self, request):
        count = ParentRequest.objects.count()
        ParentRequest.objects.all().delete()
        return Response({'success': True, 'message': f'{count} demande(s) supprimée(s)'})



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
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Q
# (ces imports existent déjà dans views.py, ne pas dupliquer)


@method_decorator(csrf_exempt, name='dispatch')
class MessageListView(APIView):
    """
    GET  /api/messages/
        ?user_type=teacher              → tous les messages (root)
        ?user_type=parent&user_id=X    → messages envoyés par ce parent

    POST /api/messages/
        { senderType, senderId, senderName, content, parentMessageId? }
    """

    def get(self, request):
        user_type = request.query_params.get('user_type', 'teacher')
        user_id   = request.query_params.get('user_id')

        # Récupérer uniquement les messages racine (pas les réponses)
        qs = Message.objects.filter(parent_message=None)

        # Un parent ne voit que ses propres messages
        if user_type == 'parent' and user_id:
            qs = qs.filter(sender_id=str(user_id), sender_type='parent')

        result = []
        for msg in qs.order_by('-created_at'):
            data           = MessageSerializer(msg).data
            data['replies'] = MessageSerializer(
                msg.replies.all().order_by('created_at'), many=True
            ).data
            result.append(data)

        return Response({'success': True, 'data': result})

    def post(self, request):
        d = request.data
        try:
            msg = Message(
                sender_type  = d.get('senderType', ''),
                sender_id    = str(d.get('senderId', '')),
                sender_name  = d.get('senderName', ''),
                content      = d.get('content', ''),
            )
            if d.get('parentMessageId'):
                msg.parent_message_id = d['parentMessageId']
            if d.get('appointmentId'):
                msg.appointment_id = d['appointmentId']
            msg.save()
            return Response(
                {'success': True, 'data': MessageSerializer(msg).data},
                status=201
            )
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class MessageMarkReadView(APIView):
    """
    PUT /api/messages/<id>/read/
    """
    def put(self, request, message_id):
        try:
            msg         = Message.objects.get(id=message_id)
            msg.is_read = True
            msg.save()
            return Response({'success': True})
        except Message.DoesNotExist:
            return Response({'success': False, 'message': 'Message introuvable'}, status=404)

class AppointmentStatusView(View):
    def put(self, request, appointment_id):
        try:
            import json
            body = json.loads(request.body)
            new_status = body.get('status')

            VALID_STATUSES = ['pending', 'assigned', 'confirmed', 'completed', 'cancelled']
            if new_status not in VALID_STATUSES:
                return JsonResponse({
                    'success': False,
                    'message': f'Statut invalide : {new_status}'
                }, status=400)

            appointment = Appointment.objects.get(id=appointment_id)
            appointment.status = new_status
            appointment.save()

            return JsonResponse({
                'success': True,
                'message': f'Statut mis à jour : {new_status}',
                'data': { 'id': appointment.id, 'status': appointment.status }
            })

        except Appointment.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Rendez-vous introuvable'
            }, status=404)

        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=500)


class AppointmentStatusView(APIView):
    def put(self, request, appointment_id):
        try:
            new_status = request.data.get('status')
            appointment = Appointment.objects.get(id=appointment_id)
            appointment.status = new_status
            appointment.save()
            return Response({'success': True, 'data': {'id': appointment.id, 'status': appointment.status}})
        except Appointment.DoesNotExist:
            return Response({'success': False, 'message': 'Introuvable'}, status=404)