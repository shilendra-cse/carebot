'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';
import Header from '@/components/header';
import { Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Page() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col h-screen fixed inset-0">
      <Header />

      {/* Chat Container */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="w-full max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Welcome to CareBot</h2>
                  <p className="text-muted-foreground">Your personal healthcare assistant</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    {message.parts.map((part, index) =>
                      part.type === 'text' ? (
                        <div key={index} className="text-sm leading-relaxed">
                          {message.role === 'assistant' ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({children}) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
                                h2: ({children}) => <h2 className="text-base font-semibold mb-2 mt-2">{children}</h2>,
                                h3: ({children}) => <h3 className="text-sm font-medium mb-1 mt-2">{children}</h3>,
                                p: ({children}) => <p className="mb-2">{children}</p>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="text-sm">{children}</li>,
                                strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                em: ({children}) => <em className="italic">{children}</em>,
                                code: (props) => {
                                const {children, ...rest} = props;
                                const isInline = !children?.toString().includes('\n');
                                return isInline ? (
                                  <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs" {...rest}>{children}</code>
                                ) : (
                                  <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto" {...rest}>{children}</code>
                                );
                              },
                                blockquote: ({children}) => (
                                  <blockquote className="border-l-4 border-gray-300 pl-4 italic">{children}</blockquote>
                                ),
                              }}
                            >
                              {part.text}
                            </ReactMarkdown>
                          ) : (
                            <p>{part.text}</p>
                          )}
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input Form */}
        <div className="border-t bg-black p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage({ text: input });
                setInput('');
              }
            }}
            className="flex space-x-2 max-w-4xl mx-auto"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={status !== 'ready'}
              placeholder="Ask me anything about your health..."
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={status !== 'ready' || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}