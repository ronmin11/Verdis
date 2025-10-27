import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import os
import logging

# Model architecture that matches your training code
class ImageClassifier(nn.Module):
    def __init__(self, num_classes=38, dropout_rate=0.3):
        super(ImageClassifier, self).__init__()
        
        # Use the same model as in your training code
        from transformers import AutoModel
        self.base_model = AutoModel.from_pretrained("microsoft/resnet-18")
        
        # Add additional MLP layers to extract more features (same as your code)
        self.classifier = nn.Sequential(
            nn.Linear(512, 256),  # Use the determined input size
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        outputs = self.base_model(pixel_values=x, return_dict=True)
        features = outputs.pooler_output
        # Flatten the features from (batch_size, 512, 1, 1) to (batch_size, 512)
        features = features.view(features.size(0), -1)
        logits = self.classifier(features)
        return logits

class PlantDiseaseModel:
    def __init__(self, model_weights_path, class_names_path=None):
        """
        Initialize the plant disease classification model.
        
        Args:
            model_weights_path (str): Path to the .pth model weights file
            class_names_path (str, optional): Path to file containing class names
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = self._load_model(model_weights_path)
        self.transform = self._get_transforms()
        self.class_names = self._load_class_names(class_names_path)
    
    def _load_model(self, model_path):
        try:
            # Load the entire model directly
            model = torch.load(model_path, map_location=torch.device(self.device))

            # If the model was saved as a state dict, we need to handle it differently
            if isinstance(model, dict):
                # Check if this is a custom model architecture
                if any(key.startswith('base_model.') for key in model.keys()):
                    # This is a custom model, try to load it directly
                    try:
                        # Try to load the entire model object if it was saved
                        model_obj = torch.load(model_path, map_location=torch.device(self.device))
                        if hasattr(model_obj, 'eval'):
                            model_obj = model_obj.to(self.device)
                            model_obj.eval()
                            logging.info(f"Successfully loaded custom model from {model_path}")
                            return model_obj
                    except:
                        pass
                
                # If the model was saved with DataParallel, remove 'module.' prefix
                if all(key.startswith('module.') for key in model.keys()):
                    from collections import OrderedDict
                    new_state_dict = OrderedDict()
                    for k, v in model.items():
                        name = k[7:]  # remove 'module.' prefix
                        new_state_dict[name] = v
                    model = new_state_dict
                
                # For custom model architectures, create the model instance and load the state dict
                logging.info("Custom model architecture detected, creating model instance...")
                model_instance = ImageClassifier(num_classes=38, dropout_rate=0.3)
                model_instance.load_state_dict(model)
                model_instance = model_instance.to(self.device)
                model_instance.eval()
                logging.info(f"Successfully loaded custom model from {model_path}")
                return model_instance
            
            model = model.to(self.device)
            model.eval()
            logging.info(f"Successfully loaded model from {model_path}")
            return model
            
        except Exception as e:
            logging.error(f"Error loading model: {str(e)}")
            raise RuntimeError(f"Failed to load model from {model_path}. Error: {str(e)}. Please ensure you have the correct model file and architecture.")
    
    def _load_class_names(self, class_names_path):
        try:
            with open(class_names_path, 'r') as f:
                classes = [line.strip() for line in f.readlines() if line.strip()]
            if not classes:
                raise ValueError("Class names file is empty")
            logging.info(f"Loaded {len(classes)} class names")
            return classes
        except Exception as e:
            logging.error(f"Error loading class names: {str(e)}")
            # Return default class names if file loading fails
            return [f'class_{i}' for i in range(38)]

    def _get_transforms(self):
        return transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                              std=[0.229, 0.224, 0.225])
        ])

    def predict(self, image_path):
        try:
            # Load and preprocess image
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found: {image_path}")
                
            img = Image.open(image_path).convert('RGB')
            img_tensor = self.transform(img)
            # Type assertion to help the type checker understand this is a tensor
            img_tensor = img_tensor.unsqueeze(0).to(self.device)  # type: ignore
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(img_tensor)
                _, preds = torch.max(outputs, 1)
                
            # Get class probabilities
            probs = torch.nn.functional.softmax(outputs, dim=1)
            confidence = torch.max(probs).item()
            predicted_class_idx = int(preds[0].item())
            
            # Ensure we have a valid class index
            if predicted_class_idx >= len(self.class_names):
                predicted_class = f"class_{predicted_class_idx}"
            else:
                predicted_class = self.class_names[predicted_class_idx]
            
            # Get top-5 predictions
            top5_probs, top5_indices = torch.topk(probs, 5)
            top5_predictions = [
                {
                    'class': self.class_names[int(i.item())] if int(i.item()) < len(self.class_names) else f"class_{int(i.item())}",
                    'probability': p.item()
                }
                for i, p in zip(top5_indices[0], top5_probs[0])
            ]
            
            return {
                'class': predicted_class,
                'class_index': predicted_class_idx,
                'confidence': confidence,
                'top5_predictions': top5_predictions,
                'timestamp': 'GPU' if torch.cuda.is_available() else 'CPU'
            }
            
        except Exception as e:
            logging.error(f"Prediction error: {str(e)}")
            return {
                'error': str(e),
                'class': 'unknown',
                'confidence': 0.0
            }
