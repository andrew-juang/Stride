"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"

export default function Exercise() {
  const [isExercising, setIsExercising] = useState(false)
  const [feedback, setFeedback] = useState<string[]>(["Select an exercise and click Start Exercise"])
  const [exerciseType, setExerciseType] = useState("squat")
  const [sessionFeedback, setSessionFeedback] = useState<Set<string>>(new Set())
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()
  const { user } = useAuth()

  // Start webcam feed
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 850 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadeddata = () => {
              videoRef.current?.play();
              resolve();
            };
          }
        });
        
        setIsExercising(true);
        setSessionFeedback(new Set()); // Clear feedback when starting new session
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setFeedback(["Error accessing webcam. Please make sure you have granted camera permissions."]);
    }
  }

  // Stop webcam feed and save session
  const stopWebcam = async () => {
    console.log("Stop button clicked");
    console.log("Current user:", user);
    console.log("Current feedback:", sessionFeedback);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }

    // Only save session if we have feedback and user is logged in
    if (sessionFeedback.size > 0 && user?.email) {
      try {
        const uniqueFeedback = Array.from(sessionFeedback).join(" | ");
        console.log("Sending feedback:", uniqueFeedback);

        const requestData = { 
          exerciseType,
          feedback: uniqueFeedback,
          userEmail: user.email
        };
        
        console.log('Sending session data:', requestData);

        const response = await fetch('http://localhost:8000/exercise/session', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (!response.ok) {
          throw new Error(responseData.detail || 'Failed to save session');
        }
      } catch (err) {
        console.error("Error saving exercise session:", err);
      }
    } else {
      console.log('Cannot save session:', {
        hasFeedback: sessionFeedback.size > 0,
        isUserLoggedIn: !!user?.email
      });
    }

    setIsExercising(false)
    setFeedback(["Select an exercise and click Start Exercise"])
  }

  const startPoseEstimation = async () => {
    const captureAndAnalyze = async () => {
      if (!videoRef.current || !streamRef.current) {
        stopWebcam();
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0);
        
        const blob = await new Promise<Blob>((resolve) => 
          canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.8)
        );

        const formData = new FormData();
        formData.append('file', blob);

        const poseResponse = await fetch('http://localhost:8000/pose/estimate', {
          method: 'POST',
          body: formData,
        });

        if (!poseResponse.ok) {
          throw new Error(`HTTP error! status: ${poseResponse.status}`);
        }

        const poseData = await poseResponse.json();
        
        // Update pose overlay
        const outputImage = document.getElementById('output-frame') as HTMLImageElement;
        if (outputImage) {
          outputImage.src = `data:image/jpeg;base64,${poseData.image}`;
        }

        // Get feedback from API
        const feedbackResponse = await fetch('http://localhost:8000/feedback/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            keypoints: poseData.keypoints,
            exerciseType: exerciseType 
          }),
        });

        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData.feedback);
        
        // Add new feedback to Set if it's meaningful
        if (feedbackData.feedback && 
            feedbackData.feedback !== "Error processing video frame" &&
            feedbackData.feedback !== "Select an exercise and click Start Exercise") {
          console.log("Adding feedback to session:", feedbackData.feedback);
          setSessionFeedback(prev => new Set([...prev, feedbackData.feedback]));
        }

      } catch (err) {
        console.error("Error analyzing pose:", err);
        setFeedback(["Error processing video frame"]);
      }


      // Continue the loop
      if (isExercising && streamRef.current) {
        animationFrameRef.current = requestAnimationFrame(captureAndAnalyze);
      }
    };

    captureAndAnalyze();
  };

  // Start pose estimation when isExercising changes
  useEffect(() => {
    if (isExercising) {
      startPoseEstimation();
    }
  }, [isExercising]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  useEffect(() => {
    console.log("Output image element exists:", !!document.getElementById('output-frame'));
  }, [isExercising]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Exercise Session</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Video Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select
                value={exerciseType}
                onValueChange={setExerciseType}
                disabled={isExercising}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Exercise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="squat">Squat</SelectItem>
                  <SelectItem value="lunge">Lunge</SelectItem>
                  <SelectItem value="armRaise">Arm Raise</SelectItem>
                  <SelectItem value="pushup">Push-up</SelectItem>
                  <SelectItem value="plank">Plank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="aspect-video bg-gray-200 flex items-center justify-center relative overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-contain"
                style={{ 
                  display: isExercising ? 'block' : 'none',
                  transform: 'scaleX(-1)' // Mirror the video
                }}
              />
              {isExercising && (
                <img
                  id="output-frame"
                  className="absolute inset-0 w-full h-full object-contain z-10"
                  alt="Pose Detection"
                  style={{ transform: 'scaleX(-1)' }} // Mirror the overlay
                />
              )}
              {!isExercising && (
                <Button onClick={startWebcam}>Start Exercise</Button>
              )}
            </div>
            {isExercising && (
              <Button 
                onClick={stopWebcam} 
                variant="destructive" 
                className="mt-4"
              >
                Stop Exercise
              </Button>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Real-time Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {feedback.map((message, index) => (
                <div 
                  key={`${message}-${index}`}
                  className="p-3 bg-muted rounded-lg border border-border animate-fade-in"
                >
                  <p>{message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

