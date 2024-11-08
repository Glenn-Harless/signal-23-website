from pydantic_settings import BaseSettings
from typing import List, Literal
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Music AI Assistant"
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://your-netlify-site.netlify.app"
    ]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 30
    
    # AI Model Settings
    MODEL_TYPE: Literal["ollama", "huggingface"] = os.getenv("MODEL_TYPE", "ollama")
    
    # Ollama Settings
    OLLAMA_MODEL_NAME: str = os.getenv("OLLAMA_MODEL_NAME", "llama2")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
    
    # HuggingFace Settings
    HUGGINGFACE_MODEL_NAME: str = os.getenv(
        "HUGGINGFACE_MODEL_NAME", 
        "google/flan-t5-small"
    )
    HUGGINGFACE_API_TOKEN: str = os.getenv("HUGGINGFACE_API_TOKEN", "")
    
    # General Model Settings
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    MAX_LENGTH: int = int(os.getenv("MAX_LENGTH", "500"))

settings = Settings()