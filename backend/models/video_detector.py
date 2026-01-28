import cv2
import numpy as np
import os
from .image_detector import ImageDetector

class VideoDetector:
    def __init__(self):
        self.image_detector = ImageDetector()
        # You might need to adjust this path or download the xml if not present
        # For this environment, we'll try to load it from cv2 data or a local file
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    def process_video(self, video_path, frame_skip=60):
        """
        Extracts frames from video, runs image detection on them, and aggregates results.
        frame_skip: Process every Nth frame to save time.
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": "Could not open video file"}

        frames_analyzed = 0
        fake_frames = 0
        total_score = 0
        
        scores = []

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # Process every Nth frame
                if frames_analyzed % frame_skip == 0:
                    # Convert BGR to RGB
                    # frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Save frame temporarily to reuse image_detector logic
                    # A more optimized way would be to pass the numpy array directly to image_detector if supported
                    # But for now, let's just write it to disk for simplicity/safety with current ImageDetector
                    temp_frame_path = f"{video_path}_temp_frame.jpg"
                    cv2.imwrite(temp_frame_path, frame)
                    
                    try:
                        result = self.image_detector.predict(temp_frame_path)
                        score = result.get('score', 0)
                        scores.append(score)
                        total_score += score
                        if score > 0.5:
                            fake_frames += 1
                    except Exception as e:
                        print(f"Frame analysis error: {e}")
                    finally:
                        if os.path.exists(temp_frame_path):
                            os.remove(temp_frame_path)

                frames_analyzed += 1

        finally:
            cap.release()

        count = len(scores)
        if count == 0:
            return {"error": "No frames analyzed"}

        avg_score = total_score / count
        confidence = int(avg_score * 100)
        label = "FAKE" if avg_score > 0.5 else "REAL"
        
        # Simple heuristic: If > 30% of analyzed frames are fake, call it fake (videos often have flickering artifacts)
        # Or just use average.
        
        return {
            "label": label,
            "score": avg_score,
            "details": f"Analyzed {count} frames. {fake_frames} detected as manipulated. Average anomaly score: {confidence}%"
        }
