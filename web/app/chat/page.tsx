'use client';

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { getToken, clearAuth } from '@/lib/auth-client';
import { useAuth } from '@/hooks/use-auth';
import {
  Bot,
  User,
  Loader2,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Activity,
  Heart,
  Pill,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ChatSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

function normalizeMessages(messages: any[]): UIMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages.map((m: any) => ({
    id: m.id || crypto.randomUUID(),
    role: m.role as 'user' | 'assistant',
    parts: m.parts || [{ type: 'text' as const, text: m.content || '' }],
  }));
}

const SUGGESTED_PROMPTS = [
  { text: 'I have a headache', icon: Activity },
  { text: 'Analyze my recent symptoms', icon: Activity },
  { text: 'What medications am I taking?', icon: Pill },
  { text: 'Log my mood', icon: Heart },
  { text: 'I need to schedule a checkup', icon: Calendar },
  { text: 'Do any of my meds interact?', icon: AlertTriangle },
];

function ToolResultCard({ part }: { part: any }) {
  const output = part.output;
  if (!output?.success) return null;

  const iconMap: Record<string, typeof Activity> = {
    symptom: Activity,
    mood: Heart,
    medication: Pill,
    appointment: Calendar,
    allergy: AlertTriangle,
  };
  const Icon = iconMap[output.type] || CheckCircle2;

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background/50 px-3 py-2 text-xs my-1">
      <Icon className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
      <span className="text-muted-foreground">{output.message}</span>
      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 ml-auto flex-shrink-0" />
    </div>
  );
}

function ChatArea({
  chatId,
  initialMessages,
  onChatCreated,
}: {
  chatId: string;
  initialMessages: UIMessage[];
  onChatCreated: (id: string) => void;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useRef(
    new DefaultChatTransport({
      api: `${API_BASE}/chat`,
      headers: (): Record<string, string> => {
        const token = getToken();
        if (!token) {
          clearAuth();
          window.location.href = '/signin';
          return {};
        }
        return { Authorization: `Bearer ${token}` };
      },
    })
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: chatId,
    transport: transport.current,
    messages: initialMessages,
    onError: (err) => {
      toast.error(err.message || 'Something went wrong');
    },
    onFinish: () => {
      onChatCreated(chatId);
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const value = textareaRef.current?.value?.trim();
    if (!value || isStreaming) return;
    sendMessage({ text: value });
    if (textareaRef.current) textareaRef.current.value = '';
    autoResize();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handlePromptClick = (prompt: string) => {
    sendMessage({ text: prompt });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="w-full max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Welcome to CareBot</h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  Your AI health assistant. I can log symptoms, prescribe medications, track your
                  mood, and more — all from our conversation.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={prompt.text}
                        onClick={() => handlePromptClick(prompt.text)}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        {prompt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const showStreamLoader =
                message.role === 'assistant' &&
                isStreaming &&
                message === messages[messages.length - 1] &&
                message.parts.every(
                  (p) => p.type !== 'text' || !('text' in p) || !p.text
                );

              return (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {showStreamLoader && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {message.parts.map((part, i) => {
                      if (part.type === 'text' && part.text) {
                        return message.role === 'assistant' ? (
                          <div key={i} className="space-y-1">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-base font-semibold mb-2 mt-2">{children}</h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-sm font-medium mb-1 mt-2">{children}</h3>
                                ),
                                p: ({ children }) => <p className="mb-2 text-sm">{children}</p>,
                                ul: ({ children }) => (
                                  <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                                ),
                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                strong: ({ children }) => (
                                  <strong className="font-semibold">{children}</strong>
                                ),
                                em: ({ children }) => <em className="italic">{children}</em>,
                                code: (props) => {
                                  const { children, ...rest } = props;
                                  const isInline = !children?.toString().includes('\n');
                                  return isInline ? (
                                    <code
                                      className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs"
                                      {...rest}
                                    >
                                      {children}
                                    </code>
                                  ) : (
                                    <code
                                      className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto"
                                      {...rest}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-gray-300 pl-4 italic">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {part.text}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p key={i} className="text-sm">{part.text}</p>
                        );
                      }

                      if (part.type.startsWith('tool-') || (part as any).type === 'dynamic-tool') {
                        const toolPart = part as any;
                        if (toolPart.state === 'output-available' || toolPart.output) {
                          return <ToolResultCard key={i} part={toolPart} />;
                        }
                        if (toolPart.state === 'input-available' || toolPart.state === 'input-streaming') {
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground my-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Working...</span>
                            </div>
                          );
                        }
                      }

                      return null;
                    })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-3xl mx-auto">
          <Textarea
            ref={textareaRef}
            disabled={isStreaming}
            placeholder="Ask me anything about your health..."
            className="flex-1 min-h-[40px] max-h-[200px] resize-none"
            rows={1}
            onKeyDown={handleKeyDown}
            onInput={autoResize}
          />
          <Button type="submit" disabled={isStreaming} size="icon" className="flex-shrink-0">
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  const { isLoading: authLoading } = useAuth();
  const [chatList, setChatList] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [loadedMessages, setLoadedMessages] = useState<UIMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get('/chat');
      setChatList(res.data?.data || []);
    } catch {
      // ignore on initial load
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchChats();
    }
  }, [authLoading, fetchChats]);

  const startNewChat = () => {
    const id = crypto.randomUUID();
    setActiveChatId(id);
    setLoadedMessages([]);
  };

  const loadChat = async (chatId: string) => {
    if (chatId === activeChatId) return;
    setLoadingChat(true);
    try {
      const res = await api.get(`/chat/${chatId}`);
      const chat = res.data?.data;
      setActiveChatId(chatId);
      setLoadedMessages(normalizeMessages(chat?.messages || []));
    } catch {
      toast.error('Failed to load chat');
    } finally {
      setLoadingChat(false);
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/${chatId}`);
      setChatList((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        startNewChat();
      }
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete chat');
    }
  };

  const onChatCreated = () => {
    fetchChats();
  };

  useEffect(() => {
    if (!activeChatId && !authLoading) {
      startNewChat();
    }
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="flex flex-col h-screen fixed inset-0">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen fixed inset-0">
      <Header />
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div
          className={`border-r bg-muted/30 flex flex-col transition-all duration-200 ${
            sidebarOpen ? 'w-64' : 'w-0'
          } overflow-hidden`}
        >
          <div className="flex items-center justify-between p-3 border-b">
            <span className="text-sm font-medium truncate">Chats</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={startNewChat}
                title="New chat"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center p-4">No chats yet</p>
            ) : (
              chatList.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => loadChat(chat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs hover:bg-accent transition-colors group ${
                    activeChatId === chat.id ? 'bg-accent' : ''
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{chat.title}</span>
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Toggle sidebar button when closed */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-16 z-10 h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Main chat area */}
        {loadingChat ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          activeChatId && (
            <ChatArea
              key={activeChatId}
              chatId={activeChatId}
              initialMessages={loadedMessages}
              onChatCreated={onChatCreated}
            />
          )
        )}
      </div>
    </div>
  );
}
