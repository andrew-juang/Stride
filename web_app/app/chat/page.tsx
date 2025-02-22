'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Physical Therapist assistant. I can help you with exercise recommendations, injury prevention, and rehabilitation guidance. While I can provide general advice, please remember to consult with a licensed physical therapist for personalized treatment. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: Message = {
      role: 'user',
      content: input
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-black fixed inset-0 top-16">
      <div className="flex h-full">
        {/* Left side - Image placeholder */}
        <div className="w-1/2 p-4 flex items-center justify-center">
          <div className="bg-gray-900/50 rounded-lg w-full h-full flex items-center justify-center">
            <span className="text-gray-500">Image Placeholder</span>
          </div>
        </div>

        {/* Right side - Chat */}
        <div className="w-1/2 p-4">
          <div className="bg-gray-900/50 rounded-lg shadow-lg p-4 h-full flex flex-col">
            <div 
              className="flex-1 space-y-4 mb-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 max-w-sm ${
                      message.role === 'user'
                        ? 'bg-gray-800 text-gray-200'
                        : 'bg-gray-800/50 text-gray-300'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800/50 text-gray-300 rounded-lg p-3">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your physical therapy question..."
                className="flex-1 p-2 bg-gray-800/50 text-gray-200 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gray-800 text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
