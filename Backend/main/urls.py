from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

def home_view(request):
    return HttpResponse("WELCOME TO DJANGO BACKEND!!!")

urlpatterns = [
    path('', home_view),
    path('admin/', admin.site.urls),
    path('api/', include('components.urls')),
    path('api/auth/', include('components.urls')),
    path('bills-reminders/', include('bills_app.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
