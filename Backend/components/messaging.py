import pandas as pd
from datetime import datetime
from django.utils import timezone
from .models import Conversation, Message

def load_messages():
    """
    Loads all messages from the DB into a pandas DataFrame.
    """
    msgs = Message.objects.all().order_by('timestamp')
    df = pd.DataFrame.from_records(
        msgs.values('id', 'conversation_id', 'sender', 'content', 'timestamp', 'file_url', 'message_type')
    )
    return df

def save_messages(df):
    """
    Overwrites all messages in DB using the rows from the given DataFrame.
    """
    Message.objects.all().delete()
    for _, row in df.iterrows():
        Message.objects.create(
            conversation_id=row['conversation_id'],
            sender=row['sender'],
            content=row['content'],
            timestamp=row['timestamp'],
            file_url=row.get('file_url', ''),
            message_type=row.get('message_type', 'text')
        )

def time_ago(dt):
    """
    Returns a string (like '2 minutes ago') for how long ago dt was.
    """
    now = timezone.now()
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return "Online just now"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds // 3600)
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    else:
        days = int(seconds // 86400)
        return f"{days} day{'s' if days > 1 else ''} ago"

def update_user_activity(username):
    pass

def get_users_status():
    return []

def display_emoji_picker():
    return ""

def show_messaging():
    pass

def create_conversation(name: str, is_group: bool = True):
    conv = Conversation.objects.create(name=name, is_group=is_group)
    return conv

def list_conversations(is_group: bool = None):
    qs = Conversation.objects.all()
    if is_group is True:
        qs = qs.filter(is_group=True)
    elif is_group is False:
        qs = qs.filter(is_group=False)
    return qs.order_by('name')

def add_message(
    conversation_id: int,
    sender: str,
    content: str,
    timestamp=None,
    file_url=None,
    message_type='text',
    sender_user=None  # [NEW]
):
    if timestamp is None:
        timestamp = timezone.now()
    conv = Conversation.objects.get(id=conversation_id)
    msg = Message.objects.create(
        conversation=conv,
        sender=sender,           # old text field
        content=content,
        timestamp=timestamp,
        file_url=file_url,
        message_type=message_type,
        sender_user=sender_user  # new optional link
    )
    return msg

def get_messages_for_conversation(conversation_id: int):
    conv = Conversation.objects.get(id=conversation_id)
    return conv.messages.all().order_by('timestamp')

def clear_messages_for_conversation(conversation_id: int):
    conv = Conversation.objects.get(id=conversation_id)
    conv.messages.all().delete()