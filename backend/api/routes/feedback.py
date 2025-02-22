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
        return ["No pose detected. Please make sure your full body is visible."]
        
    try:
        feedback = []
        # Check both legs for squat form
        rhip, rknee, rankle = keypoints[11], keypoints[13], keypoints[15]
        lhip, lknee, lankle = keypoints[12], keypoints[14], keypoints[16]
        rknee_angle = calculate_angle(rhip, rknee, rankle)
        lknee_angle = calculate_angle(lhip, lknee, lankle)

        # Analyze squat depth
        if rknee_angle < 80 or lknee_angle < 80:
            feedback.append("Your squat is too deep!")
        elif rknee_angle > 140 or lknee_angle > 140:
            feedback.append("Bend your knees more!")
        else:
            feedback.append("Good squat depth!")

        # Check knee alignment
        if abs(rknee_angle - lknee_angle) > 15:
            feedback.append("Keep your knees equally bent")

        # Check if knees are tracking over toes
        if any(angle > 170 for angle in [rknee_angle, lknee_angle]):
            feedback.append("Keep your knees over your toes")

        return feedback
    except Exception:
        return ["Unable to analyze squat form. Please ensure your legs are visible."]

def analyze_lunge(keypoints):
    """Analyze lunge form using keypoints"""
    if not keypoints or len(keypoints) < 17:
        return ["No pose detected. Please make sure your full body is visible."]
        
    try:
        feedback = []
        hip, knee, ankle = keypoints[11], keypoints[13], keypoints[15]
        knee_angle = calculate_angle(hip, knee, ankle)

        if knee_angle < 85:
            feedback.append("Front knee is bending too much!")
        elif knee_angle > 120:
            feedback.append("Bend your front knee more!")
        else:
            feedback.append("Good knee angle!")

        # Check torso position
        if hip[1] > knee[1]:  # y-coordinate comparison
            feedback.append("Keep your torso upright")

        return feedback
    except Exception as e:
        return ["Unable to analyze lunge form. Please ensure your legs are visible."]

def analyze_arm_raise(keypoints):
    """Analyze arm raise form using keypoints"""
    if not keypoints or len(keypoints) < 17:
        return ["No pose detected. Please make sure your full body is visible."]
        
    try:
        feedback = []
        rshoulder, relbow, rwrist = keypoints[5], keypoints[7], keypoints[9]
        lshoulder, lelbow, lwrist = keypoints[6], keypoints[8], keypoints[10]
        
        rarm_angle = calculate_angle(rshoulder, relbow, rwrist)
        larm_angle = calculate_angle(lshoulder, lelbow, lwrist)

        # Check arm extension
        if rarm_angle < 160 or larm_angle < 160:
            feedback.append("Raise your arms higher!")
        elif rarm_angle > 180 or larm_angle > 180:
            feedback.append("Don't overextend your arms!")
        else:
            feedback.append("Good arm position!")

        # Check symmetry
        if abs(rarm_angle - larm_angle) > 15:
            feedback.append("Keep your arms equally raised")

        return feedback
    except Exception as e:
        return ["Unable to analyze arm raise. Please ensure your arms are visible."]

@router.post("/analyze")
async def analyze_pose(data: PoseData):
    """Analyze the pose keypoints based on exercise type"""
    if not data.keypoints:
        return {"feedback": ["No pose detected. Please make sure you're visible in the camera."]}
        
    analysis_functions = {
        "squat": analyze_squat,
        "lunge": analyze_lunge,
        "armRaise": analyze_arm_raise
    }
    
    analyze_function = analysis_functions.get(data.exerciseType)
    if not analyze_function:
        return {"feedback": ["Unknown exercise type"]}
        
    feedback = analyze_function(data.keypoints)
    return {"feedback": feedback}
