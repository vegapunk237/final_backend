# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherRequestViewSet,
    ParentRequestViewSet,
    AppointmentViewSet,
    health_check
    
)

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
]