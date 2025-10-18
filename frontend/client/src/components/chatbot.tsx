import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { BarVisualizer } from "@/components/ui/bar-visualizer";
import 'katex/dist/katex.min.css';

interface ChatbotProps {
  onClose: () => void;
  initialMessage?: string;
  history: Message[];
  onHistoryChange: (history: Message[]) => void;
  onBookmarkChange: () => void;
}

export interface Message {
  text: string;
  sender: 'user' | 'bot';
  agent?: string;
}

export const Chatbot: React.FC<ChatbotProps> = ({ onClose, initialMessage, history, onHistoryChange, onBookmarkChange }) => {
  const [messages, setMessages] = useState<Message[]>(history);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Establish WebSocket connection
    const socket = new WebSocket('ws://localhost:8000/ws/chat/');
    ws.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      if (initialMessage) {
        handleSendMessage(initialMessage);
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage && lastMessage.sender === 'bot' && lastMessage.agent === data.agent) {
          // Append to the last message from the same agent
          const updatedMessages = [...prevMessages];
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            text: lastMessage.text + data.message
          };
          return updatedMessages;
        } else {
          // Create a new message
          const botMessage: Message = { text: data.message, sender: 'bot', agent: data.agent };
          return [...prevMessages, botMessage];
        }
      });

      setIsLoading(false);
       if (data.message.toLowerCase().includes('bookmark')) {
        onBookmarkChange();
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      const errorMessage: Message = { text: 'WebSocket connection error. Please try again later.', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      setIsLoading(false);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Cleanup on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [initialMessage, onBookmarkChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, isVoiceActive]);

  useEffect(() => {
    setMessages(history);
  }, [history]);

  useEffect(() => {
    onHistoryChange(messages);
  }, [messages]);

  const handleSendMessage = async (messageToSend: string) => {
    if (messageToSend.trim() === '' || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const userMessage: Message = { text: messageToSend, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    ws.current.send(JSON.stringify({ message: messageToSend }));
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
                className={`p-2 rounded-lg w-fit max-w-[85%] prose ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground dark:prose-invert'
                }`}
              >
                {message.agent && <div className="text-xs font-bold">{message.agent}</div>}
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {message.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-2 rounded-lg w-fit max-w-[85%] prose bg-muted">
                <div className="flex items-center justify-center space-x-1">
                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>
        {isVoiceActive && (
          <div className="h-5 mt-4">
            <BarVisualizer demo={true} state="speaking" barCount={15} />
          </div>
        )}
      </CardContent>
      <div className="p-4 border-t relative">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            className="flex-grow"
            disabled={isLoading || isVoiceActive}
          />
          <Button onClick={() => handleSendMessage(inputValue)} disabled={isLoading || isVoiceActive}>
            Send
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsVoiceActive(!isVoiceActive)}>
            <span className="material-symbols-outlined">{isVoiceActive ? 'mic_off' : 'mic'}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};