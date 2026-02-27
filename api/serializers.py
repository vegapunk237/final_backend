# api/serializers.py
from rest_framework import serializers
from .models import TeacherRequest, ParentRequest, Appointment
from .models import CourseFile

class CourseFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model  = CourseFile
        fields = [
            'id', 'appointment', 'original_name', 'file_type',
            'file_size', 'uploaded_by', 'uploader_name',
            'description', 'uploaded_at', 'file_url'
        ]
        read_only_fields = ['id', 'uploaded_at', 'file_url']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

class TeacherRequestSerializer(serializers.ModelSerializer):
    documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TeacherRequest
        fields = [
            'id',
            'full_name',
            'email',
            'phone',
            'password',
            'zone',
            'school',
            'diplome',
            'qualification',
            'experience',
            'niveau_accepter',
            'format_cours',
            'matiere_niveau',
            'subjects',
            'availability',
            'motivation',
            'cv_file',
            'cv_filename',
            'documents',
            'documents_count',
            'accept_terms',
            'accept_verification',
            'accept_profile_sharing',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'documents_count']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def get_documents_count(self, obj):
        return len(obj.documents) if obj.documents else 0
    
    def validate_email(self, value):
        value = value.lower().strip()
        if not value:
            raise serializers.ValidationError("L'email est requis")
        return value
    
    def validate_subjects(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Les matières doivent être une liste")
        if len(value) == 0:
            raise serializers.ValidationError("Au moins une matière est requise")
        return value
    
    def validate_documents(self, value):
        """Accepter les documents sans validation stricte — la view s'en charge"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Les documents doivent être une liste")
        if len(value) > 5:
            raise serializers.ValidationError("Maximum 5 documents autorisés")
        # Normaliser fileName/name sans bloquer
        normalized = []
        for doc in value:
            if isinstance(doc, dict):
                file_name = doc.get('fileName') or doc.get('name') or 'document'
                normalized.append({
                    'type':     doc.get('type', ''),
                    'fileName': file_name,
                    'name':     file_name,
                    'file':     doc.get('file', ''),
                })
        return normalized
    
    def validate_accept_terms(self, value):
        if not value:
            raise serializers.ValidationError("Vous devez accepter les Conditions Générales d'Utilisation")
        return value
    
    def validate(self, data):
        if self.instance is None:  # Création uniquement
            if 'password' not in data or not data['password']:
                raise serializers.ValidationError({'password': 'Le mot de passe est requis'})
            if len(data['password']) < 6:
                raise serializers.ValidationError({'password': 'Le mot de passe doit contenir au moins 6 caractères'})
        return data


class ParentRequestSerializer(serializers.ModelSerializer):
    # Accepter à la fois camelCase (frontend) et snake_case (backend)
    parentName = serializers.CharField(source='parent_name', required=False)
    childName = serializers.CharField(source='child_name', required=False)
    childAge = serializers.IntegerField(source='child_age', required=False)
    childLevel = serializers.CharField(source='child_level', required=False)
    
    class Meta:
        model  = ParentRequest
        fields = '__all__'
    
    def validate_email(self, value):
        """Normaliser l'email"""
        if value:
            value = value.lower().strip()
        return value
    
    def validate_subjects(self, value):
        """Valider les matières"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Subjects doit être une liste")
        if len(value) == 0:
            raise serializers.ValidationError("Au moins une matière est requise")
        return value
    
    def validate_child_age(self, value):
        """Valider l'âge"""
        if value < 5 or value > 25:
            raise serializers.ValidationError("L'âge doit être entre 5 et 25 ans")
        return value
    
    def to_representation(self, instance):
        """Convertit snake_case → camelCase pour le frontend."""
        data = super().to_representation(instance)
        return {
            'id':              data.get('id'),
            'parentFirstName': data.get('parent_first_name'),
            'parentLastName':  data.get('parent_last_name'),
            'parentName':      f"{data.get('parent_first_name', '')} {data.get('parent_last_name', '')}".strip(),
            'email':           data.get('email'),
            'phone':           data.get('phone'),
            'password':        data.get('password'),   # retiré dans les réponses API
            'address':         data.get('address'),
            'postalCode':      data.get('postal_code'),
            'message':         data.get('message'),
            'children':        data.get('children', []),
            'acceptTerms':     data.get('accept_terms'),
            'status':          data.get('status'),
            'createdAt':       data.get('created_at'),
            'updatedAt':       data.get('updated_at'),
        }


class AppointmentSerializer(serializers.ModelSerializer):
    # Accepter camelCase du frontend
    parentId = serializers.CharField(source='parent_id', required=False)
    parentName = serializers.CharField(source='parent_name', required=False)
    parentEmail = serializers.EmailField(source='parent_email', required=False)
    parentPhone = serializers.CharField(source='parent_phone', required=False, allow_blank=True)
    studentName = serializers.CharField(source='student_name', required=False)
    preferredDate = serializers.DateField(source='preferred_date', required=False)
    preferredTime = serializers.TimeField(source='preferred_time', required=False)
    pricePerHour = serializers.DecimalField(source='price_per_hour', max_digits=6, decimal_places=2, required=False)
    totalAmount = serializers.DecimalField(source='total_amount', max_digits=8, decimal_places=2, required=False)
    isTrialCourse = serializers.BooleanField(source='is_trial_course', required=False)
    assignedTeacherId = serializers.CharField(source='assigned_teacher_id', required=False, allow_blank=True)
    assignedTeacher = serializers.CharField(source='assigned_teacher', required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id',
            'parent_id', 'parentId',
            'parent_name', 'parentName',
            'parent_email', 'parentEmail',
            'parent_phone', 'parentPhone',
            'student_name', 'studentName',
            'subject',
            'level',
            'preferred_date', 'preferredDate',
            'preferred_time', 'preferredTime',
            'duration',
            'location',
            'notes',
            'price_per_hour', 'pricePerHour',
            'total_amount', 'totalAmount',
            'is_trial_course', 'isTrialCourse',
            'assigned_teacher_id', 'assignedTeacherId',
            'assigned_teacher', 'assignedTeacher',
            'status',
            'created_at', 'createdAt',
            'updated_at', 'updatedAt'
        ]
        extra_kwargs = {
            'status': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True}
        }
    
    def to_representation(self, instance):
        """Renvoyer uniquement camelCase au frontend"""
        data = super().to_representation(instance)
        # Supprimer les champs snake_case pour éviter les doublons
        snake_case_fields = [
            'parent_id', 'parent_name', 'parent_email', 'parent_phone',
            'student_name', 'preferred_date', 'preferred_time',
            'price_per_hour', 'total_amount', 'is_trial_course',
            'assigned_teacher_id', 'assigned_teacher', 'created_at', 'updated_at'
        ]
        for field in snake_case_fields:
            data.pop(field, None)
        return data