import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatbotProps {
  onClose: () => void;
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (messageToSend: string) => {
    if (messageToSend.trim() === '') return;

    const userMessage: Message = { text: messageToSend, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue(''); // Clear input after sending

    const token = localStorage.getItem('token');
    if (!token) {
      const errorMessage: Message = { text: 'Authentication error. Please log in again.', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      return;
    }

    try {
      const response = await fetch('/api/chatbot/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const botMessage: Message = { text: data.reply, sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { text: 'Sorry, something went wrong. Please try again.', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[28rem] flex flex-col shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <CardTitle className="text-lg font-semibold">Live Chat</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-2 rounded-lg max-w-xs ${
                  message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            className="flex-grow"
          />
          <Button onClick={() => handleSendMessage(inputValue)}>Send</Button>
        </div>
      </div>
    </Card>
  );
};