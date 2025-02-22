'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider";

interface ExerciseSession {
  exercise_type: string;
  feedback: string;
  created_at: string;
}

export default function Dashboard() {
  const [recentSessions, setRecentSessions] = useState<ExerciseSession[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecentSessions = async () => {
      if (!user?.email) return;
      
      try {
        const response = await fetch(`http://localhost:8000/exercise/recent-sessions/${user.email}`);
        const data = await response.json();
        setRecentSessions(data.sessions);
      } catch (error) {
        console.error('Error fetching recent sessions:', error);
      }
    };

    fetchRecentSessions();
  }, [user?.email]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  if (!user) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Please log in to view your dashboard</h1>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Your Physiotherapy Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Exercise Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="space-y-4">
                {recentSessions.map((session, index) => (
                  <div key={index} className="border-b pb-2">
                    <p className="font-medium">{session.exercise_type}</p>
                    <p className="text-sm text-gray-500">{session.feedback}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(session.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent exercise sessions</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Placeholder for upcoming sessions list</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Placeholder for recent AI feedback</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

