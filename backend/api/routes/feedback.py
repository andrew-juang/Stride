from fastapi import APIRouter
from pydantic import BaseModel
import math
import numpy as np

router = APIRouter()

class PoseData(BaseModel):
    keypoints: list
    exerciseType: str

def calculate_angle(A, B, C):
    """
    Calculate the angle at joint B using three keypoints.
    """
    a = np.linalg.norm(B - C)
    b = np.linalg.norm(A - C)
    c = np.linalg.norm(A - B)
    return math.degrees(math.acos((b**2 + c**2 - a**2) / (2 * b * c)))

def analyze_squat(keypoints):
    """Analyze squat form using keypoints"""
    if not keypoints or len(keypoints) < 17:  # YOLO pose has 17 keypoints
        return "No pose detected. Please make sure your full body is visible."
        
    try:
        hip, knee, ankle = keypoints[11], keypoints[13], keypoints[15]
        knee_angle = calculate_angle(hip, knee, ankle)

        if knee_angle < 90:
            return "Your squat is too deep!"
        elif knee_angle > 160:
            return "Bend your knees more!"
        return "Good squat form!"
    except Exception as e:
        return "Unable to analyze squat form. Please ensure your legs are visible."

def analyze_lunge(keypoints):
    """Analyze lunge form using keypoints"""
    if not keypoints or len(keypoints) < 17:
        return "No pose detected. Please make sure your full body is visible."
        
    try:
        hip, knee, ankle = keypoints[11], keypoints[13], keypoints[15]
        knee_angle = calculate_angle(hip, knee, ankle)

        if knee_angle < 85:
            return "Front knee is bending too much!"
        elif knee_angle > 120:
            return "Bend your front knee more!"
        return "Good lunge form!"
    except Exception as e:
        return "Unable to analyze lunge form. Please ensure your legs are visible."

def analyze_arm_raise(keypoints):
    """Analyze arm raise form using keypoints"""
    if not keypoints or len(keypoints) < 17:
        return "No pose detected. Please make sure your full body is visible."
        
    try:
        shoulder, elbow, wrist = keypoints[5], keypoints[7], keypoints[9]
        arm_angle = calculate_angle(shoulder, elbow, wrist)

        if arm_angle < 160:
            return "Raise your arms higher!"
        elif arm_angle > 180:
            return "Don't overextend your arms!"
        return "Good arm raise form!"
    except Exception as e:
        return "Unable to analyze arm raise. Please ensure your arms are visible."

@router.post("/analyze")
async def analyze_pose(data: PoseData):
    """Analyze the pose keypoints based on exercise type"""
    if not data.keypoints:
        return {"feedback": "No pose detected. Please make sure you're visible in the camera."}
        
    analysis_functions = {
        "squat": analyze_squat,
        "lunge": analyze_lunge,
        "armRaise": analyze_arm_raise
    }
    
    analyze_function = analysis_functions.get(data.exerciseType)
    if not analyze_function:
        return {"feedback": "Unknown exercise type"}
        
    feedback = analyze_function(data.keypoints)
    return {"feedback": feedback}
