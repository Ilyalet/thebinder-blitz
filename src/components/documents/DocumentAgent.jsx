import React, { useState, useRef, useEffect } from 'react';
import { Document } from '@/entities/all';
import { InvokeLLM } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Send, Bot, Loader2, User as UserIcon } from 'lucide-react';

export default function DocumentAgent({ onClose, dailyInsight }) {
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      content: dailyInsight
        ? `Hi! ${dailyInsight}\n\nAsk me anything about your documents, tasks, or reminders.`
        : "Hi! I'm your document assistant. Ask me anything about your documents, tasks, or reminders.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isSending) return;

    const nextMessages = [...messages, { role: 'user', content: question }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const docs = await Document.list('-upload_date', 50);
      const context = docs
        .filter((d) => d.extracted_text)
        .map((d) => `Document "${d.name}":\n${d.extracted_text.substring(0, 1500)}`)
        .join('\n\n---\n\n')
        .substring(0, 12000);

      const transcript = nextMessages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

      const result = await InvokeLLM({
        prompt: `You are a helpful assistant for a personal document-management app called TheBinder. Answer the user's question using the document context below when relevant. Be concise and conversational.

Document context:
"""
${context || 'No documents with extracted text yet.'}
"""

Conversation so far:
${transcript}

Respond to the last user message only, as the Assistant.`,
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: String(result) }]);
    } catch (error) {
      console.error('DocumentAgent error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
      <Card className="w-full max-w-sm h-[32rem] flex flex-col shadow-2xl pointer-events-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-sm">Document Assistant</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <Bot className="h-5 w-5 text-blue-500 shrink-0 mt-1" />}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && <UserIcon className="h-5 w-5 text-gray-400 shrink-0 mt-1" />}
            </div>
          ))}
          {isSending && (
            <div className="flex gap-2 justify-start">
              <Bot className="h-5 w-5 text-blue-500 shrink-0 mt-1" />
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t flex items-center gap-2">
          <Input
            placeholder="Ask about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isSending}
          />
          <Button size="icon" onClick={handleSend} disabled={isSending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
