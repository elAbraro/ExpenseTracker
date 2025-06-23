from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillViewSet, ReminderViewSet

router = DefaultRouter()
router.register(r'bills', BillViewSet)
router.register(r'reminders', ReminderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
