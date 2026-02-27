# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherRequestViewSet,
    ParentRequestViewSet,
    AppointmentViewSet,
    health_check
    
)
from . import views

router = DefaultRouter()
router.register(r'teacher-requests', TeacherRequestViewSet, basename='teacher-request')
router.register(r'parent-requests', ParentRequestViewSet, basename='parent-request')
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health'),
    path('teacher-register/', health_check, name='health'),
    
    # Routes de connexion
    path('teacher-login/', TeacherRequestViewSet.as_view({'post': 'login'}), name='teacher-login'),
    path('parent-login/', ParentRequestViewSet.as_view({'post': 'login'}), name='parent-login'),
    # ── Fichiers de cours ──────────────────────────────────────────────────
    # Lister + uploader les fichiers d'un cours
    path(
        'appointments/<int:appointment_id>/files/',
        views.CourseFileListUploadView.as_view(),
        name='course-files'
    ),
    # Supprimer un fichier
    path(
        'files/<int:file_id>/',
        views.CourseFileDetailView.as_view(),
        name='course-file-detail'
    ),
    # Télécharger un fichier (force download)
    path(
        'files/<int:file_id>/download/',
        views.CourseFileDownloadView.as_view(),
        name='course-file-download'
    ),
]