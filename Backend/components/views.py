from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model  # Use get_user_model instead of importing User directly
from django.core.exceptions import ValidationError

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

import os
import requests
import json

from .models import Debt, Conversation, Message, Profile
from .models import Investment, ProfitLoss, Notification, Report
from .serializers import (
    DebtSerializer,
    ConversationSerializer,
    MessageSerializer,
    UserRegistrationSerializer,
    ProfileSerializer,
    LoginSerializer,
    UserListSerializer,
    UserSerializer,
    InvestmentSerializer,
    ProfitLossSerializer,
    NotificationSerializer,
    ReportSerializer
)
from . import data_manager
from . import debt_calculator
from django.db.models import Sum, Q
from .openai_utils import ChatSession, generate_openai_reply
from .messaging import create_conversation, add_message, clear_messages_for_conversation

User = get_user_model()  # Define User as the custom model

# ------------------------------------------------------------------------------------
#                                Debt Views
# ------------------------------------------------------------------------------------
class DebtListCreateView(generics.ListCreateAPIView):
    queryset = Debt.objects.all()
    serializer_class = DebtSerializer


class DebtRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Debt.objects.all()
    serializer_class = DebtSerializer


@api_view(['GET'])
def load_data_view(request):
    df = data_manager.load_data()
    data = df.to_dict(orient='records')
    return Response(data, status=200)


@api_view(['POST'])
def save_data_view(request):
    df = debt_calculator.pd.DataFrame(request.data)
    data_manager.save_data(df)
    return Response({"message": "Data saved successfully."}, status=200)


@api_view(['GET'])
def payment_schedule_view(request, pk):
    try:
        debt = Debt.objects.get(pk=pk)
    except Debt.DoesNotExist:
        return Response({"error": "Debt not found."}, status=404)

    schedule_df = debt_calculator.calculate_payment_schedule(
        debt.principal,
        debt.interest_rate,
        debt.term_months
    )
    schedule_data = schedule_df.to_dict(orient='records')
    return Response(schedule_data, status=200)


# ------------------------------------------------------------------------------------
#                                Messaging Views
# ------------------------------------------------------------------------------------
@api_view(['GET', 'POST'])
def list_conversations(request):
    if request.method == 'GET':
        convs = Conversation.objects.all()
        serializer = ConversationSerializer(convs, many=True)
        return Response(serializer.data, status=200)
    else:
        name = request.data.get('name', 'Unnamed Group')
        is_group = request.data.get('is_group', True)
        conv = create_conversation(name, is_group=is_group)
        serializer = ConversationSerializer(conv)
        return Response(serializer.data, status=201)

@api_view(['GET', 'POST'])
def conversation_detail(request, pk):
    try:
        conv = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation not found"}, status=404)

    if request.method == 'GET':
        messages = conv.messages.all().order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response({"messages": serializer.data}, status=200)
    else:
        sender = request.data.get('sender', 'Unknown')
        content = request.data.get('content', '')
        message_type = request.data.get('message_type', 'text')
        sender_user = None

        sender_user_id = request.data.get('sender_user_id')
        if sender_user_id:
            try:
                sender_user = User.objects.get(pk=sender_user_id)
            except User.DoesNotExist:
                pass

        new_msg = add_message(
            conversation_id=pk,
            sender=sender,
            content=content,
            message_type=message_type,
            sender_user=sender_user
        )
        out_serializer = MessageSerializer(new_msg)
        return Response(out_serializer.data, status=201)

@api_view(['POST'])
def upload_file(request, pk):
    try:
        conv = Conversation.objects.get(pk=pk)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation not found"}, status=404)

    file = request.FILES.get('file')
    sender = request.data.get('sender', 'Unknown')
    file_type = request.data.get('type', 'file')

    sender_user_id = request.data.get('sender_user_id')
    sender_user = None
    if sender_user_id:
        try:
            sender_user = User.objects.get(pk=sender_user_id)
        except User.DoesNotExist:
            pass

    if not file:
        return Response({"error": "No file provided"}, status=400)

    file_name = default_storage.save(f'uploads/{file.name}', ContentFile(file.read()))
    file_url = request.build_absolute_uri(settings.MEDIA_URL + file_name)

    new_msg = add_message(
        conversation_id=pk,
        sender=sender,
        content=file_url,
        file_url=file_url,
        message_type=file_type,
        sender_user=sender_user
    )
    serializer = MessageSerializer(new_msg)
    return Response({"fileUrl": file_url}, status=201)

@api_view(['DELETE'])
def clear_conversation(request, pk):
    try:
        clear_messages_for_conversation(pk)
        return Response({"message": "Chat cleared successfully."}, status=200)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation not found"}, status=404)


# ------------------------------------------------------------------------------------
#                                AI Advisor
# ------------------------------------------------------------------------------------
@api_view(['POST'])
def advisor_chat(request):
    user_message = request.data.get('message', '')
    category = request.data.get('category', '')
    session = ChatSession(
        system_prompt=(
            "You are a helpful financial assistant. "
            f"The user is asking about {category or 'general finance'}."
        )
    )
    session.add_user_message(user_message)
    reply = generate_openai_reply(session)
    session.add_assistant_message(reply)
    return Response({"response": reply}, status=200)


# ------------------------------------------------------------------------------------
#                                AUTH VIEWS
# ------------------------------------------------------------------------------------
# User = get_user_model()  # Already defined above

# 1) Registration using debt's `UserRegistrationSerializer`
@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({"error": "Missing email or password"}, status=400)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Invalid credentials"}, status=401)

    # Password validation
    if not user.password.startswith('pbkdf2_'):
        # Plain text password (for migration)
        if user.password == password:
            user.set_password(password)
            user.save()
            valid = True
        else:
            valid = False
    else:
        valid = user.check_password(password)

    if valid:
        # Generate token (you'll need to implement this)
        token = generate_token_for_user(user)  # Your token generation logic
        
        # Prepare user data
        user_data = {
            "id": user.id,
            "email": user.email,
            "full_name": user.profile.full_name if hasattr(user, 'profile') else "",
            "avatarUrl": user.profile.avatar.url if hasattr(user, 'profile') and user.profile.avatar else None,
        }
        
        # Update last active
        if hasattr(user, 'profile'):
            user.profile.update_activity()
        
        return Response({
            "message": "Login successful",
            "token": token,
            "user": user_data
        }, status=200)
    else:
        return Response({"error": "Invalid credentials"}, status=401)

def generate_token_for_user(user):
    """Example token generation - implement your actual token logic"""
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_encode
    from django.utils.encoding import force_bytes
    
    return {
        'uid': urlsafe_base64_encode(force_bytes(user.pk)),
        'token': default_token_generator.make_token(user),
    }
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        if hasattr(user, 'profile'):
            user.profile.update_activity()
        return Response(
            {
                "message": "User registered successfully.",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.profile.full_name if hasattr(user, 'profile') else '',
                },
            },
            status=status.HTTP_201_CREATED
        )

@api_view(['GET'])
def user_list(request):
    """
    Returns list of real users (with full_name, avatarUrl, lastActive).
    """
    users = User.objects.all().order_by('id')
    serializer = UserListSerializer(users, many=True)
    return Response(serializer.data, status=200)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()

    def get_object(self):
        user_id = self.kwargs.get('pk')
        return get_object_or_404(Profile, user__id=user_id)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(username=email, password=password)
        
        if user:
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email
                }
            })
        return Response({
            'message': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ------------------------------------------------------------------------------------
#                              Invest FUNCTIONS
# ------------------------------------------------------------------------------------

class InvestmentListCreate(generics.ListCreateAPIView):
    serializer_class = InvestmentSerializer
    
    def get_queryset(self):
        return Investment.objects.all()
    
    def perform_create(self, serializer):
        # Add any additional processing here
        serializer.save()

class InvestmentDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Investment.objects.all()
    serializer_class = InvestmentSerializer

class ProfitLossListCreate(generics.ListCreateAPIView):
    serializer_class = ProfitLossSerializer
    
    def get_queryset(self):
        return ProfitLoss.objects.filter(investment__id=self.kwargs['investment_pk'])

class Overview(generics.GenericAPIView):
    def get(self, request):
        total_investment = Investment.objects.all().aggregate(Sum('amount'))['amount__sum'] or 0
        total_profit = ProfitLoss.objects.filter(type='PROFIT').aggregate(Sum('amount'))['amount__sum'] or 0
        total_loss = ProfitLoss.objects.filter(type='LOSS').aggregate(Sum('amount'))['amount__sum'] or 0
        
        return Response({
            'total_investment': total_investment,
            'total_profit': total_profit,
            'total_loss': total_loss,
            'net_balance': total_profit - total_loss
        })
    
class ReportListCreate(generics.ListCreateAPIView):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = []


class NotificationList(generics.ListAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [] 

    

# ------------------------------------------------------------------------------------
#                              HELPER FUNCTIONS
# ------------------------------------------------------------------------------------