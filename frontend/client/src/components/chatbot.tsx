import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChatbotProps {
  onClose: () => void;
  initialMessage?: string;
  history: Message[];
  onHistoryChange: (history: Message[]) => void;
}

export interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export const Chatbot: React.FC<ChatbotProps> = ({ onClose, initialMessage, history, onHistoryChange }) => {
  const [messages, setMessages] = useState<Message[]>(history);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    // Delay scrolling to allow Katex to render and prevent layout shifts from causing scroll jumps.
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100); // A small delay is often enough.

    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    setMessages(history);
  }, [history]);

  useEffect(() => {
    onHistoryChange(messages);
  }, [messages]);

  const handleSendMessage = async (messageToSend: string) => {
    if (messageToSend.trim() === '' || isLoading) return;

    const userMessage: Message = { text: messageToSend, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication error. Please log in again.');
      }

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
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { text: error.message || 'Sorry, something went wrong. Please try again.', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="absolute bottom-24 right-8 w-[calc(100%-4rem)] md:w-3/5 lg:w-2/5 max-w-lg h-4/5 max-h-[600px] z-20 flex flex-col shadow-lg rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <CardTitle className="text-lg font-semibold">Live Chat</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </Button>
      </CardHeader>
      <CardContent ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-2 rounded-lg w-[85%] prose ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground dark:prose-invert'
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {message.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-2 rounded-lg w-[85%] prose bg-muted">
                <div className="flex items-center justify-center space-x-1">
                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
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
            disabled={isLoading}
          />
          <Button onClick={() => handleSendMessage(inputValue)} disabled={isLoading}>
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
};
