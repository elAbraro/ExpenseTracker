from django.urls import path, re_path
from .views import (
    DebtListCreateView,
    DebtRetrieveUpdateDestroyView,
    load_data_view,
    save_data_view,
    payment_schedule_view,
    list_conversations,
    conversation_detail,
    upload_file,
    clear_conversation,
    advisor_chat,
    login_view,
    UserRegistrationView,
    register,
    login,
    user_list,
    ProfileView,
    InvestmentListCreate, 
    InvestmentDetail, 
    Overview, 
    ReportListCreate, 
    NotificationList
)
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]

urlpatterns = [
    #dashboard
    path('register/', register, name='register'),
    path('login/', login, name='login'),

    # Debt
    path('debts/', DebtListCreateView.as_view(), name='debts-list-create'),
    path('debts/<int:pk>/', DebtRetrieveUpdateDestroyView.as_view(), name='debts-rud'),
    path('debts/<int:pk>/schedule/', payment_schedule_view, name='debt-schedule'),
    path('debts/load/', load_data_view, name='load-data'),
    path('debts/save/', save_data_view, name='save-data'),

    # Messaging
    path('messages/conversations/', list_conversations, name='conversation-list'),
    path('messages/<int:pk>/', conversation_detail, name='conversation-detail'),
    path('messages/<int:pk>/upload', upload_file, name='upload-file'),
    path('messages/<int:pk>/clear', clear_conversation, name='clear-conversation'),

    # AI Advisor
    path('advisor/chat/', advisor_chat, name='advisor-chat'),

    #Invest
    path('investments/', InvestmentListCreate.as_view()),
    path('investments/<int:pk>/', InvestmentDetail.as_view()),
    path('reports/', ReportListCreate.as_view()),
    path('notifications/', NotificationList.as_view()),
    path('investments/overview/', Overview.as_view()),

    # Auth
    path('user/login/', login_view, name='login'),
    path('user/register/', UserRegistrationView.as_view(), name='register'),
    path('users/', user_list, name='user-list'),
    path('profile/<int:pk>/', ProfileView.as_view(), name='profile-view'),
]
