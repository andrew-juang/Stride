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
    A, B, C = np.array(A[0:2]), np.array(B[0:2]), np.array(C[0:2])
    a = np.linalg.norm(B - C)
    b = np.linalg.norm(A - C)
    c = np.linalg.norm(A - B)
    return math.degrees(math.acos((a**2 + c**2 - b**2) / (2 * a * c)))

def analyze_squat(keypoints):
    """Analyze squat form using keypoints"""
    if not keypoints or len(keypoints) < 17:
        return ["Let's make sure your full body is visible in the camera."]
        
    try:
        feedback = ["❕ Note: Please position yourself so that your side is facing the camera."]
        rhip, rknee, rankle = keypoints[11], keypoints[13], keypoints[15]
        lhip, lknee, lankle = keypoints[12], keypoints[14], keypoints[16]
        rknee_angle = calculate_angle(rhip, rknee, rankle)
        lknee_angle = calculate_angle(lhip, lknee, lankle)


        if any(keypoint[0:2] == [0, 0] for keypoint in [rhip, rknee, rankle, lhip, lknee, lankle]):
            feedback.append("Try adjusting your position so I can see your legs better.")
            return feedback

        # Analyze squat depth - adjusted for proper squat form
        # Parallel squat is around 90°, quarter squat ~120°, deep squat ~70°
        if rknee_angle > 150 and lknee_angle > 150:
            pass
        elif rknee_angle < 60 or lknee_angle < 60:
            feedback.append("❌ Try coming up a bit to protect your knees.")
        elif rknee_angle > 120 or lknee_angle > 120:
            feedback.append("❌ You're doing great! Try bending your knees a bit more for better form.")
        else:
            feedback.append("✅ Perfect squat depth! Keep it up! 💪")

        # check hip angle - adjusted for proper hip hinge
        # Neutral spine ~45°, excessive forward lean >60°, too upright <30°
        rshoulder = keypoints[6]
        hip_angle = calculate_angle(rshoulder, rhip, [rhip[0], rhip[1] - 100, 0])
        if hip_angle < 15:
            pass
        elif hip_angle > 50:
            feedback.append("❌ Try lifting your chest while keeping your core tight")
        elif hip_angle < 25:
            feedback.append("❌ Nice core engagement! Try hinging at your hips a bit more")
        else:
            feedback.append("✅ Excellent back position! 👍")

        # Check shin angle - adjusted for proper knee tracking
        # Vertical shin is ~0°, forward knee travel ~22-25° is typical
        shin_angle = calculate_angle(rankle, rknee, [rknee[0], rknee[1] + 100, 0])
        if shin_angle < 10:
            pass
        if shin_angle > 40:
            feedback.append("❌ Small adjustment needed - try keeping your shins more vertical")
        elif shin_angle < 25:
            feedback.append("❌ Allow your knees to track forward a bit more")
        else:
            feedback.append("✅ Perfect shin angle - you've got this! ⭐")

        return feedback
    except Exception as e:
        return ["Let's adjust your position so I can see your form better."]

def analyze_plank(keypoints):
    """Analyze plank form using keypoints"""
    if not keypoints or len(keypoints) < 17:
        return ["Let's make sure your full body is visible in the camera."]
        
    try:
        feedback = []
        # Get keypoints for body alignment
        shoulder = keypoints[5]  # right shoulder
        hip = keypoints[11]      # right hip
        knee = keypoints[13]     # right knee
        ankle = keypoints[15]    # right ankle
        
        if any(keypoint[0:2] == [0, 0] for keypoint in [shoulder, hip, knee, ankle]):
            return ["Try adjusting your position so I can see your full body better."]

        # Check body alignment (should be straight line from shoulders to ankles)
        leg_angle = calculate_angle(hip, knee, ankle)
        if leg_angle < 150:
            feedback.append("❌ Try to keep your legs in a straight line.")
        else:
            feedback.append("✅ Perfect leg alignment! Keep that core tight! 💪")

        # Check hip position (shouldn't sag or pike)
        hip_angle = calculate_angle(shoulder, hip, knee)
        if hip_angle < 150:
            feedback.append("❌ Adjust your hips slightly to maintain a straight line.")
        else:
            feedback.append("✅ Great hip position! Excellent control! ⭐")

        return feedback
    except Exception as e:
        return ["Let's adjust your position so I can see your form better."]

def analyze_arm_raise(keypoints):
    """Analyze arm raise form using keypoints"""
    if not keypoints or len(keypoints) < 17:
        return ["Let's make sure your full body is visible in the camera."]
    try:
        feedback = []
        # Get keypoints for both arms and shoulders
        rshoulder, relbow, rwrist = keypoints[5], keypoints[7], keypoints[9]
        lshoulder, lelbow, lwrist = keypoints[6], keypoints[8], keypoints[10]
        neck = keypoints[0]  # Use neck as reference for shoulder alignment
        
        if any(keypoint[0:2] == [0, 0] for keypoint in [rshoulder, relbow, rwrist, lshoulder, lelbow, lwrist]):
            return ["Try adjusting your position so I can see your arms better."]

        # Check arm extension angles
        relbow_angle = calculate_angle(rshoulder, relbow, rwrist)
        lelbow_angle = calculate_angle(lshoulder, lelbow, lwrist)
        
        # Full shoulder flexion is ~180°
        if relbow_angle < 160 or lelbow_angle < 160:
            feedback.append("❌ You're getting there! Try reaching a bit higher 💪")
        else:
            feedback.append("✅ Perfect arm extension! Excellent control! ⭐")

        lhip, rhip = keypoints[12], keypoints[11]

        rarm_angle = calculate_angle(relbow, rshoulder, rhip)
        larm_angle = calculate_angle(lelbow, lshoulder, lhip)
        if rarm_angle < 45 and larm_angle < 45:
            pass
        elif rarm_angle < 70 or larm_angle < 70:
            feedback.append("❌ Try raising your arms closer to your ears.")
        elif rarm_angle > 120 or larm_angle > 120:
            feedback.append("❌ Try lowering your arms a bit.")
        else:
            feedback.append("✅ Perfect arm positioning! Excellent control! ⭐")
        return feedback
    except Exception as e:
        return ["❌ Let's adjust your position so I can see your form better."]

@router.post("/analyze")
async def analyze_pose(data: PoseData):
    """Analyze the pose keypoints based on exercise type"""
    if not data.keypoints:
        return {"feedback": ["Let's make sure you're visible in the camera."]}
        
    analysis_functions = {
        "squat": analyze_squat,
        "armRaise": analyze_arm_raise,
        "plank": analyze_plank
    }
    
    analyze_function = analysis_functions.get(data.exerciseType)
    if not analyze_function:
        return {"feedback": ["I'm not familiar with that exercise yet."]}
        
    feedback = analyze_function(data.keypoints)
    return {"feedback": feedback}
