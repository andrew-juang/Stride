from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from ultralytics import YOLO
import logging
import io
import os
import base64

router = APIRouter()

# Enhanced logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check if model file exists and download if missing
model_path = "models/yolov8n-pose.pt"
if not os.path.exists(model_path):
    logger.info(f"Model file not found at {model_path}. Downloading...")
    try:
        # This will automatically download the model
        model = YOLO('yolov8n-pose.pt')
        # Save the model to the specified path
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        model.save(model_path)
        logger.info(f"Model downloaded and saved to {model_path}")
    except Exception as e:
        logger.error(f"Error downloading model: {e}")
        raise
else:
    model = YOLO(model_path)
    logger.info("YOLOv8 model loaded successfully")

def draw_skeleton(frame, results):
    """Draw the skeleton on the frame"""
    try:
        for result in results:
            if result.keypoints is None or len(result.keypoints.data) == 0:
                logger.warning("No keypoints detected in this frame")
                continue

            # Draw keypoints
            keypoints = result.keypoints.data[0].cpu().numpy()
            
            for kp in keypoints:
                x, y, conf = kp
                if conf > 0.5:  # Only draw keypoints above confidence threshold
                    cv2.circle(frame, (int(x), int(y)), 4, (0, 255, 0), -1)
            
            # Draw skeleton lines
            skeleton = [[16,14],[14,12],[17,15],[15,13],[12,13],[6,12],[7,13],[6,7],
                       [6,8],[7,9],[8,10],[9,11],[2,3],[1,2],[1,3],[2,4],[3,5],[4,6],[5,7]]
            
            for line in skeleton:
                try:
                    pt1 = keypoints[line[0]]
                    pt2 = keypoints[line[1]]
                    if pt1[2] > 0.5 and pt2[2] > 0.5:  # Check confidence
                        cv2.line(frame, 
                                (int(pt1[0]), int(pt1[1])), 
                                (int(pt2[0]), int(pt2[1])), 
                                (0, 255, 0), 2)
                except IndexError:
                    logger.warning(f"Invalid keypoint index in skeleton line: {line}")
                    continue
                
        return frame
    except Exception as e:
        logger.error(f"Error in draw_skeleton: {str(e)}")
        # Return original frame if drawing fails
        return frame

@router.post("/estimate")
async def estimate_pose(file: UploadFile = File(...)):
    """
    Receives a video frame, runs YOLOv8 pose estimation, and returns the annotated frame
    """
    try:
        # Read and process the image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Run YOLOv8 inference
        results = model(frame, conf=0.8)
        
        # Extract keypoints
        keypoints_list = []
        if len(results) > 0 and results[0].keypoints is not None:
            keypoints = results[0].keypoints.data[0].cpu().numpy().tolist()
            keypoints_list = keypoints

        # Draw skeleton on frame
        annotated_frame = draw_skeleton(frame, results)

        # Convert the frame to base64
        _, buffer = cv2.imencode('.jpg', annotated_frame)
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        # Return both image and keypoints as JSON
        return JSONResponse({
            "image": img_base64,
            "keypoints": keypoints_list
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))