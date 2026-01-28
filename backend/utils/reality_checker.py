import os
import json
from PIL import Image
from PIL.ExifTags import TAGS
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration

class RealityChecker:
    def __init__(self, device='cpu'):
        self.device = device
        self.processor = None
        self.model = None
        try:
            print("Loading BLIP model for reality check...")
            self.processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
            self.model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(device)
            print("BLIP model loaded successfully!")
        except Exception as e:
            print(f"Error loading BLIP model: {e}")

    def check_metadata(self, image_path):
        """Analyzes EXIF data for signs of AI generation or editing."""
        try:
            image = Image.open(image_path)
            exif_data = image._getexif()
            if not exif_data:
                return {"status": "warning", "message": "No EXIF metadata found. This is common in AI-generated images or social media uploads."}
            
            metadata = {}
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                metadata[tag] = value
            
            # Check for AI-related software signatures
            software = str(metadata.get('Software', '')).lower()
            if any(x in software for x in ['stable diffusion', 'midjourney', 'dall-e', 'adobe firefly']):
                return {"status": "danger", "message": f"Generative AI signature found in metadata: {software}"}
            
            return {"status": "success", "message": "Metadata appears consistent with standard capture.", "details": metadata}
        except Exception as e:
            return {"status": "error", "message": f"Metadata analysis failed: {str(e)}"}

    def check_contextual_consistency(self, image_path):
        """Uses BLIP to generate a caption and check for semantic oddities."""
        if not self.model:
            return {"status": "error", "message": "Contextual model not loaded."}
            
        try:
            image = Image.open(image_path).convert('RGB')
            inputs = self.processor(image, return_tensors="pt").to(self.device)
            
            out = self.model.generate(**inputs)
            caption = self.processor.decode(out[0], skip_special_tokens=True)
            
            # Simple heuristic: AI often struggles with specific details
            # We look for vague or contradictory terms (placeholder logic)
            suspicious_terms = ['glitch', 'abstract', 'distorted', 'blur']
            reason = "Caption seems semantically sound."
            score_impact = 0
            
            if any(term in caption.lower() for term in suspicious_terms):
                reason = f"Caption contains suspicious terms indicating low coherence: {caption}"
                score_impact = 0.2
            
            return {
                "caption": caption,
                "status": "success" if score_impact == 0 else "warning",
                "message": reason,
                "impact": score_impact
            }
        except Exception as e:
            return {"status": "error", "message": f"Contextual check failed: {str(e)}"}

    def perform_full_check(self, image_path):
        metadata_res = self.check_metadata(image_path)
        context_res = self.check_contextual_consistency(image_path)
        
        # Aggregate scores/findings
        reality_score = 1.0 # 1.0 is "Very Real"
        
        if metadata_res['status'] == 'warning':
            reality_score -= 0.1
        elif metadata_res['status'] == 'danger':
            reality_score -= 0.5
            
        if context_res['status'] == 'warning':
            reality_score -= context_res['impact']
            
        return {
            "reality_score": max(0.0, reality_score),
            "metadata": metadata_res,
            "context": context_res
        }
