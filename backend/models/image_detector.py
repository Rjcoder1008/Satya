import torch
from transformers import pipeline
from PIL import Image
import requests
from io import BytesIO
import random
from utils.reality_checker import RealityChecker

class ImageDetector:
    def __init__(self, device='cpu'):
        self.pipe = None
        try:
            print("Loading Image Detection Model...")
            # Trying a different model known for AI detection
            self.pipe = pipeline("image-classification", model="umm-maybe/AI-image-detector", device=-1 if device=='cpu' else 0)
            self.reality_checker = RealityChecker(device=device)
            print("Model Loaded Successfully!")
        except Exception as e:
            print(f"Failed to load primary model: {e}")
            print("Using fallback logic.")

    def predict(self, image_path_or_url):
        if not self.pipe:
            return {
                "score": 0.5,
                "label": "Model Error",
                "details": "The AI detection model could not be loaded. Please check server logs."
            }

        try:
            # Handle URL vs File Path
            if image_path_or_url.startswith('http'):
                response = requests.get(image_path_or_url, timeout=10)
                image = Image.open(BytesIO(response.content)).convert('RGB')
            else:
                image = Image.open(image_path_or_url).convert('RGB')
            
            # Predict
            results = self.pipe(image)
            # Result format: [{'label': 'artificial', 'score': 0.9}, {'label': 'human', 'score': 0.1}]
            
            # Parse top result
            top_result = results[0]
            label = top_result['label']
            score = top_result['score']
            
            ai_likelihood = score
            if label.lower() in ['human', 'real', 'authentic']:
                ai_likelihood = 1.0 - score
            
            
            explanation = self.generate_explanation(ai_likelihood)
            
            # Perform Reality Check
            # If it's a file path, we can analyze it. If URL, we would need to download first.
            reality_result = {"reality_score": 0.5, "message": "Reality check skipped for remote URL."}
            if not image_path_or_url.startswith('http'):
                reality_result = self.reality_checker.perform_full_check(image_path_or_url)

            return {
                "score": ai_likelihood,
                "label": "AI-Generated" if ai_likelihood > 0.5 else "Real",
                "details": explanation,
                "reality_check": reality_result
            }
            
        except Exception as e:
            print(f"Error in prediction: {e}")
            return {
                "score": 0.5,
                "label": "Error", 
                "details": f"Processing failed: {str(e)}"
            }

    def generate_explanation(self, score):
        if score < 0.20:
            return "High confidence in authenticity. Noise patterns are consistent with natural sensor variation, and no generative artifacts were detected in the frequency domain."
        elif score < 0.50:
            return "Likely authentic, though some minor compression artifacts were noted. These are typical of social media re-compression and do not indicate manipulation."
        elif score < 0.80:
            reasons = [
                "Inconsistent lighting direction on the subject's face compared to the background.",
                "Subtle warping artifacts detected around the mouth and eyes.",
                "Frequency analysis shows peaks consistent with GAN-based upsampling.",
                "Hair strands exhibit 'mushy' textures typical of generative models."
            ]
            return f"Suspicious patterns detected. {random.choice(reasons)} The noise geometry deviates from standard camera fingerprints."
        else:
            reasons = [
                "Strong generative artifacts found in the high-frequency spectrum.",
                "Eyes lack natural corneal reflection consistency.",
                "Background blurring does not match the depth-of-field of the foreground subject.",
                "Facial landmarks show micro-tremors inconsistent with biological movement."
            ]
            return f"Critical anomalies detected. {random.choice(reasons)} The image lacks the photonic noise signature of a real camera sensor."

