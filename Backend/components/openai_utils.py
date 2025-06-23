import openai
import tiktoken
# Use OpenAIError from openai directly
from openai import OpenAIError
from typing import List, Dict
import os

openai.api_key = "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"

def num_tokens_from_messages(messages: List[Dict], model: str) -> int:
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")

    if model.startswith("gpt-3.5-turbo"):
        tokens_per_message = 4
        tokens_per_name = -1
    elif model.startswith("gpt-4"):
        tokens_per_message = 3
        tokens_per_name = 1
    else:
        tokens_per_message = 4
        tokens_per_name = -1

    num_tokens = 0
    for message in messages:
        num_tokens += tokens_per_message
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
            if key == "name":
                num_tokens += tokens_per_name
    num_tokens += 3
    return num_tokens

class ChatSession:
    def __init__(self, system_prompt=None, model="gpt-3.5-turbo", max_tokens=2000):
        self.model = model
        self.max_tokens = max_tokens
        self.messages = []
        if system_prompt is not None:
            self.messages.append({"role": "system", "content": system_prompt})
        else:
            self.messages.append({
                "role": "system",
                "content": ("You are a helpful financial assistant specializing in debt management.")
            })

    def add_user_message(self, content: str):
        self.messages.append({"role": "user", "content": content})

    def add_assistant_message(self, content: str):
        self.messages.append({"role": "assistant", "content": content})

    def discard_exceeding_tokens(self):
        current_tokens = self._calculate_token_usage()
        while current_tokens > self.max_tokens and len(self.messages) > 1:
            self.messages.pop(1)
            current_tokens = self._calculate_token_usage()

    def _calculate_token_usage(self) -> int:
        return num_tokens_from_messages(self.messages, self.model)

def generate_openai_reply(chat_session: ChatSession) -> str:
    chat_session.discard_exceeding_tokens()
    try:
        response = openai.ChatCompletion.create(
            model=chat_session.model,
            messages=chat_session.messages,
            temperature=0.7,
            max_tokens=512,
            top_p=1.0,
            frequency_penalty=0.0,
            presence_penalty=0.0
        )
        return response.choices[0].message.content
    except OpenAIError as e:
        return f"Error from OpenAI API: {e}"
