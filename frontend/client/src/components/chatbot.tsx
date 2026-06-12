import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { BarVisualizer, AgentState } from "@/components/ui/bar-visualizer";
import 'katex/dist/katex.min.css';
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '@/lib/audio-utils';

interface ChatbotProps {
  onClose: () => void;
  initialMessage?: string;
  history?: Message[];
  onHistoryChange?: (history: Message[]) => void;
  onBookmarkChange?: () => void;
}

export interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export const Chatbot: React.FC<ChatbotProps> = ({ 
  onClose, 
  initialMessage, 
  history = [], 
  onHistoryChange = () => {}, 
  onBookmarkChange 
}) => {
  const [messages, setMessages] = useState<Message[]>(history);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentInputTranscription, setCurrentInputTranscription] = useState('');
  const [currentOutputTranscription, setCurrentOutputTranscription] = useState('');
  const [visualizerStream, setVisualizerStream] = useState<MediaStream | null>(null);
  const [agentState, setAgentState] = useState<AgentState>('initializing');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const client = useRef<GoogleGenAI | null>(null);
  const sessionPromise = useRef<Promise<Session> | null>(null);
  const isRecordingRef = useRef(isRecording);
  const inputAudioContext = useRef<AudioContext | null>(null);
  const outputAudioContext = useRef<AudioContext | null>(null);
  const inputNode = useRef<GainNode | null>(null);
  const outputNode = useRef<GainNode | null>(null);
  const nextStartTime = useRef(0);
  const mediaStream = useRef<MediaStream | null>(null);
  const sourceNode = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorNode = useRef<ScriptProcessorNode | null>(null);
  const sources = useRef(new Set<AudioBufferSourceNode>());
  const visualizerUserSourceNode = useRef<MediaStreamAudioSourceNode | null>(null);
  const visualizerDestinationNode = useRef<MediaStreamAudioDestinationNode | null>(null);
  const inputTranscriptionRef = useRef('');
  const outputTranscriptionRef = useRef('');

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        stopRecording();
      }
      sessionPromise.current?.then((session) => session.close());
    };
  }, []);

  const initAudio = () => {
    inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    inputNode.current = inputAudioContext.current.createGain();
    outputNode.current = outputAudioContext.current.createGain();
    nextStartTime.current = outputAudioContext.current.currentTime;
  };

  const initSession = async () => {
    const model = 'gemini-2.5-flash-native-audio-preview-09-2025';

    if (!client.current) return;

    const token = localStorage.getItem('token');
    let tools: any[] = [];
    try {
      const response = await fetch('/api/chatbot/tools/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      if (data.tools) {
        tools = [{ functionDeclarations: data.tools }];
      }
    } catch (e) {
      console.error("Failed to fetch tools", e);
    }

    sessionPromise.current = client.current.live.connect({
      model: model,
      tools: tools,
      systemInstruction: {
        parts: [{
          text: "You are PrepUp's voice assistant. You help students prepare for exams like CAT and GATE. You can access tools to get quizzes, check dictionary, etc. Be concise and helpful. When a user asks for a quiz, use the get_quiz_question tool."
        }]
      },
      callbacks: {
        onopen: () => {
          console.log('Opened');
          setAgentState('listening');
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Tool Calls
          if (message.toolCall) {
            setAgentState('thinking');
            const toolCalls = message.toolCall.functionCalls;
            const toolResponses: any[] = [];

            for (const call of toolCalls) {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/chatbot/execute-tool/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                  },
                  body: JSON.stringify({ name: call.name, arguments: call.args }),
                });
                const result = await response.json();

                toolResponses.push({
                  id: call.id,
                  name: call.name,
                  response: result,
                });
              } catch (e) {
                console.error(`Error executing tool ${call.name}:`, e);
                toolResponses.push({
                  id: call.id,
                  name: call.name,
                  response: { error: String(e) },
                });
              }
            }

            sessionPromise.current?.then(session => {
              session.sendToolResponse({ functionResponses: toolResponses });
            });
            return;
          }

          const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData;

          if (audio) {
            setAgentState('speaking');
            nextStartTime.current = Math.max(
              nextStartTime.current,
              outputAudioContext.current!.currentTime,
            );

            const audioBuffer = await decodeAudioData(
              decode(audio.data),
              outputAudioContext.current!,
              24000,
              1,
            );
            const source = outputAudioContext.current!.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputNode.current!);
            source.addEventListener('ended', () => {
              sources.current.delete(source);
            });

            source.start(nextStartTime.current);
            nextStartTime.current = nextStartTime.current + audioBuffer.duration;
            sources.current.add(source);
          }

          if (message.serverContent?.inputTranscription) {
            setCurrentInputTranscription(prev => {
              const newText = prev + message.serverContent.inputTranscription.text;
              inputTranscriptionRef.current = newText;
              return newText;
            });
          }

          if (message.serverContent?.outputTranscription) {
            setCurrentOutputTranscription(prev => {
              const newText = prev + message.serverContent.outputTranscription.text;
              outputTranscriptionRef.current = newText;
              return newText;
            });
          }

          if (message.serverContent?.turnComplete) {
            const newMessages: Message[] = [];
            if (inputTranscriptionRef.current.trim()) {
              newMessages.push({
                text: inputTranscriptionRef.current,
                sender: 'user',
              });
            }
            if (outputTranscriptionRef.current.trim()) {
              newMessages.push({
                text: outputTranscriptionRef.current,
                sender: 'bot',
              });
            }

            if (newMessages.length > 0) {
              setMessages(prev => {
                const updatedMessages = [...prev, ...newMessages];
                onHistoryChange(updatedMessages);
                return updatedMessages;
              });
            }

            setCurrentInputTranscription('');
            setCurrentOutputTranscription('');
            inputTranscriptionRef.current = '';
            outputTranscriptionRef.current = '';
            setAgentState(isRecordingRef.current ? 'listening' : 'thinking');
          }

          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
            for (const source of Array.from(sources.current.values())) {
              source.stop();
              sources.current.delete(source);
            }
            nextStartTime.current = 0;
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error(e);
        },
        onclose: (e: CloseEvent) => {
          console.log('Close:' + e.reason);
          setAgentState('initializing');
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    });
    sessionPromise.current?.catch((e) => {
      console.error(e);
    });
  };

  const initClient = async () => {
    initAudio();
    setAgentState('connecting');
    
    let apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chatbot/config/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      if (data.api_key) {
        apiKey = data.api_key;
      }
    } catch (e) {
      console.error("Failed to fetch runtime API key, falling back to build env key", e);
    }

    client.current = new GoogleGenAI({
      apiKey: apiKey,
    });
    outputNode.current?.connect(outputAudioContext.current!.destination);
    initSession();
  };

  const startRecording = async () => {
    if (isRecordingRef.current) return;

    if (!sessionPromise.current) {
      initClient();
    }

    inputAudioContext.current?.resume();

    try {
      mediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      sourceNode.current = inputAudioContext.current!.createMediaStreamSource(
        mediaStream.current,
      );
      sourceNode.current.connect(inputNode.current!);

      if (outputAudioContext.current) {
        visualizerDestinationNode.current = outputAudioContext.current.createMediaStreamDestination();
        visualizerUserSourceNode.current = outputAudioContext.current.createMediaStreamSource(mediaStream.current);
        visualizerUserSourceNode.current.connect(visualizerDestinationNode.current);
        outputNode.current?.connect(visualizerDestinationNode.current);
        setVisualizerStream(visualizerDestinationNode.current.stream);
      }

      const bufferSize = 4096;
      scriptProcessorNode.current = inputAudioContext.current!.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      scriptProcessorNode.current.onaudioprocess = (audioProcessingEvent) => {
        if (!isRecordingRef.current) return;
        const pcmData = audioProcessingEvent.inputBuffer.getChannelData(0);
        sessionPromise.current?.then((session) => {
          session.sendRealtimeInput({ media: createBlob(pcmData) });
        });
      };

      sourceNode.current.connect(scriptProcessorNode.current);
      scriptProcessorNode.current.connect(inputAudioContext.current!.destination);
      setIsRecording(true);
      setAgentState('listening');

    } catch (err) {
      console.error('Error starting recording:', err);
      stopRecording();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setAgentState('thinking');
    if (scriptProcessorNode.current && sourceNode.current && inputAudioContext.current) {
      scriptProcessorNode.current.disconnect();
      sourceNode.current.disconnect();
    }
    visualizerUserSourceNode.current?.disconnect();
    visualizerUserSourceNode.current = null;
    visualizerDestinationNode.current = null;
    setVisualizerStream(null);
    scriptProcessorNode.current = null;
    sourceNode.current = null;
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
      mediaStream.current = null;
    }
    sessionPromise.current?.then((session) => session.close());
    sessionPromise.current = null;
  };

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
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isRecording, currentInputTranscription, currentOutputTranscription]);

  useEffect(() => {
    setMessages(history);
  }, [history]);

  useEffect(() => {
    onHistoryChange(messages);
  }, [messages]);

  const handleSendMessage = async (messageToSend: string) => {
    if (messageToSend.trim() === '' || isLoading || isRecording) return;

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
      let replyText = '';
      if (typeof data.reply === 'string') {
        replyText = data.reply;
      } else if (Array.isArray(data.reply)) {
        replyText = data.reply.map((part: any) => {
          if (typeof part === 'string') return part;
          if (part && typeof part === 'object' && part.type === 'text') return part.text || '';
          return '';
        }).join('');
      } else {
        replyText = String(data.reply || '');
      }

      const botMessage: Message = { text: replyText, sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, botMessage]);

      if (replyText.toLowerCase().includes('bookmark')) {
        onBookmarkChange?.();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { text: error.message || 'Sorry, something went wrong. Please try again.', sender: 'bot' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
                className={`p-2 rounded-lg w-fit max-w-[85%] prose ${message.sender === 'user'
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
          {currentInputTranscription && (
            <div className="flex justify-end">
              <div className="p-2 rounded-lg w-fit max-w-[85%] prose bg-primary text-primary-foreground">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {currentInputTranscription}
                </ReactMarkdown>
              </div>
            </div>
          )}
          {currentOutputTranscription && (
            <div className="flex justify-start">
              <div className="p-2 rounded-lg w-fit max-w-[85%] prose bg-muted text-foreground dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {currentOutputTranscription}
                </ReactMarkdown>
              </div>
            </div>
          )}
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
        {isRecording && (
          <div className="h-5 mt-4">
            <BarVisualizer mediaStream={visualizerStream} state={agentState} barCount={15} />
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
            disabled={isLoading || isRecording}
          />
          <Button onClick={() => handleSendMessage(inputValue)} disabled={isLoading || isRecording}>
            Send
          </Button>
          <Button variant="ghost" size="icon" onClick={handleVoiceButtonClick}>
            <span className="material-symbols-outlined">{isRecording ? 'mic_off' : 'mic'}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
