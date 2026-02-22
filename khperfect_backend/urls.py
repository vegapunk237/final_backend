"""
URL configuration for khperfect_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# khperfect_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def root_view(request):
    return JsonResponse({
        'success': True,
        'message': 'API KH Perfect - Backend Django opérationnel',
        'endpoints': {
            'health': '/api/health/',
            'teacher_requests': '/api/teacher-requests/',
            'teacher_login': '/api/teacher-requests/login/',
            'teacher_stats': '/api/teacher-requests/stats/',
            'parent_requests': '/api/parent-requests/',
            'parent_login': '/api/parent-requests/login/',
            'appointments': '/api/appointments/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', root_view),
]