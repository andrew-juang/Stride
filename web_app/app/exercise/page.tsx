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
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState as useExpandState } from "react"

export default function Exercise() {
  const [isExercising, setIsExercising] = useState(false)
  const [feedback, setFeedback] = useState<string[]>(["Select an exercise and click Start Exercise"])
  const [exerciseType, setExerciseType] = useState("squat")
  const [sessionFeedback, setSessionFeedback] = useState<Set<string>>(new Set())
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()
  const { user } = useAuth()
  const router = useRouter()
  const [expandedFeedback, setExpandedFeedback] = useExpandState<Record<string, boolean>>({})

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

  const startPoseEstimation = async () => {
    let lastAnalyzeRequest = 0
    const ANALYZE_INTERVAL = 1500

    const analyzePose = async () => {
      if (!videoRef.current || !streamRef.current) return;

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

        // Get feedback
        const currentTime = Date.now()
        if (currentTime - lastAnalyzeRequest >= ANALYZE_INTERVAL) {
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

          if (feedbackData.feedback && 
            feedbackData.feedback !== "Error processing video frame" &&
            feedbackData.feedback !== "Select an exercise and click Start Exercise") {
            console.log("Adding feedback to session:", feedbackData.feedback);
            setSessionFeedback(prev => new Set([...prev, feedbackData.feedback]));
          }

          lastAnalyzeRequest = currentTime;
        }
        

        // Continue the loop
        if (isExercising && streamRef.current) {
          animationFrameRef.current = requestAnimationFrame(analyzePose);
        }

      } catch (err) {
        console.error("Error analyzing pose:", err);
        setFeedback(["Error processing video frame"]);
      }
    };

    // Start the analysis loop
    analyzePose();
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
      // Cleanup function
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log("Output image element exists:", !!document.getElementById('output-frame'));
  }, [isExercising]);

  const stopWebcam = async () => {
    console.log("Stop button clicked");
    console.log("Current user:", user);
    console.log("Current feedback:", sessionFeedback);

    // Clean up resources first
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
          feedback: uniqueFeedback.split(" | "), // Convert to array for backend
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

        // Show success message
        toast({
          title: "Session Completed!",
          description: "Great work! Your exercise session has been saved.",
          duration: 3000,
        });

        // Delay redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);

      } catch (err) {
        console.error("Error saving exercise session:", err);
        toast({
          title: "Error",
          description: "Failed to save exercise session",
          variant: "destructive",
        });
      }
    } else {
      console.log('Cannot save session:', {
        hasFeedback: sessionFeedback.size > 0,
        isUserLoggedIn: !!user?.email
      });
    }

    setIsExercising(false)
    setFeedback(["Select an exercise and click \"Start Exercise\"."])
  }

  const toggleFeedbackExpand = (index: number) => {
    setExpandedFeedback(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 ml-16">Exercise Session</h1>
      <div className="flex gap-6 ml-16 mr-4">
        <div className="w-[65%]">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Video Feed</CardTitle>
                <div className="w-64">
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
                      <SelectItem value="armRaise">Arm Raise</SelectItem>
                      <SelectItem value="plank">Plank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full bg-gray-200 flex items-center justify-center relative overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ 
                    display: isExercising ? 'block' : 'none',
                    transform: 'scaleX(-1)'
                  }}
                />
                {isExercising && (
                  <img
                    id="output-frame"
                    className="absolute inset-0 w-full h-full object-contain z-10"
                    alt="Pose Detection"
                    style={{ transform: 'scaleX(-1)' }}
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
        </div>

        <div className="w-[35%]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Real-time Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {feedback.map((message, index) => {
                  const isLongFeedback = feedback.length > 1
                  const shouldCollapse = index >= 1
                  const isExpanded = expandedFeedback[index]

                  return (
                    <div key={`${message}-${index}`}>
                      {(!shouldCollapse || isExpanded) && (
                        <div 
                          className="p-4 bg-muted rounded-lg border border-border animate-fade-in"
                        >
                          <p className="text-lg font-medium leading-relaxed">
                            {message}
                          </p>
                        </div>
                      )}
                      
                      {isLongFeedback && index === 0 && !isExpanded && (
                        <Button
                          variant="ghost"
                          className="w-full mt-2 flex items-center justify-center text-muted-foreground hover:text-primary"
                          onClick={() => {
                            feedback.slice(1).forEach((_, i) => {
                              toggleFeedbackExpand(i + 1)
                            })
                          }}
                        >
                          <ChevronDown className="h-4 w-4 mr-2" />
                          See {feedback.length - 1} more items
                        </Button>
                      )}
                      
                      {isLongFeedback && index === feedback.length - 1 && isExpanded && (
                        <Button
                          variant="ghost"
                          className="w-full mt-2 flex items-center justify-center text-muted-foreground hover:text-primary"
                          onClick={() => {
                            feedback.slice(1).forEach((_, i) => {
                              toggleFeedbackExpand(i + 1)
                            })
                          }}
                        >
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Show less
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

