from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model  # Use get_user_model instead of User
from .models import Debt, Conversation, Message, Profile
from .models import Investment, ProfitLoss, Notification, Report

User = get_user_model()  # Define User as the custom model

# ======= Finance / Chat Models =======
class DebtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Debt
        fields = '__all__'


class MessageSerializer(serializers.ModelSerializer):
    conversation_id = serializers.IntegerField(source='conversation.id', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id',
            'conversation_id',
            'sender',
            'content',
            'timestamp',
            'file_url',
            'message_type',
            'sender_user',
        ]
        read_only_fields = ['id', 'timestamp']

class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    class Meta:
        model = Conversation
        fields = ['id', 'name', 'is_group', 'messages']

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['full_name', 'avatar', 'last_active']


# ======= User Registration / Login =======
class UserRegistrationSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=True, max_length=200)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    avatar = serializers.ImageField(required=False)

    def create(self, validated_data):
        full_name = validated_data.get('full_name')
        email = validated_data.get('email')
        password = validated_data.get('password')
        avatar = validated_data.get('avatar', None)

        # Create a new User
        # We'll store the email in user.email, and we can generate a dummy username.
        user = User.objects.create(
            username=email.split('@')[0],  # or something unique
            email=email,
            password=make_password(password)
        )

        # Create profile with full_name + avatar
        profile = Profile.objects.create(user=user, full_name=full_name)
        if avatar:
            profile.avatar = avatar
            profile.save()

        return user

# For listing actual users (with full_name from Profile)
class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    avatarUrl = serializers.SerializerMethodField()
    lastActive = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'avatarUrl', 'lastActive']

    def get_full_name(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.full_name
        return ''

    def get_avatarUrl(self, obj):
        if hasattr(obj, 'profile') and obj.profile.avatar:
            return obj.profile.avatar.url
        return None

    def get_lastActive(self, obj):
        if hasattr(obj, 'profile') and obj.profile.last_active:
            return obj.profile.last_active.isoformat()
        return None

        
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User  # Uses the custom User model
        fields = ('id', 'name', 'email', 'age', 'college', 'year', 'course', 'expected_income')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)



# ======= Invest =======
class InvestmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investment
        fields = ['id', 'amount', 'type', 'status', 'description', 'date_invested']
        read_only_fields = ['date_invested']

class ProfitLossSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfitLoss
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'created_at']
        read_only_fields = ['created_at']

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'report_file', 'date_generated']
        read_only_fields = ['date_generated']