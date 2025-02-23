'use client';

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider";
import { Message } from "@/types/chat";
import ReactMarkdown from 'react-markdown';
import { capitalizeExercise } from "@/lib/utils"
import { formatDate } from "@/lib/utils"

interface ExerciseSession {
  exercise_type: string;
  summary: string;
  created_at: string;
}

export default function Dashboard() {
  const [recentSessions, setRecentSessions] = useState<ExerciseSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      
      content: "Hi! I'm your AI Physical Therapy assistant. I can help with exercises, injuries, and rehab guidance. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchRecentSessions = async () => {
      if (!user?.email) return;
      
      setIsLoadingHistory(true);
      try {
        const response = await fetch(`http://localhost:8000/exercise/recent-sessions/${user.email}`);
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }
        const data = await response.json();
        setRecentSessions(data.sessions || []);
      } catch (error) {
        console.error('Error fetching recent sessions:', error);
        setRecentSessions([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchRecentSessions();
  }, [user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an error processing your request.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Please log in to view your dashboard</h1>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-8 mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6 ml-16">Your Physiotherapy Dashboard</h1>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 ml-16">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Exercise History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading exercise history...</p>
              </div>
            ) : recentSessions && recentSessions.length > 0 ? (
              <div className="space-y-6">
                {recentSessions.map((session, index) => (
                  <div key={index} className="border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-primary">
                        {capitalizeExercise(session.exercise_type)}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(session.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {session.summary}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No exercise sessions yet</p>
                <p className="text-sm mt-2">Complete an exercise to see your history</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chat with AI Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col h-[500px]">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
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
                  className="flex-1 p-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

