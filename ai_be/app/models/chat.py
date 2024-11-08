from pydantic import BaseModel, Field
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str = Field(..., description="The message from the user")
    context: Optional[str] = Field(None, description="Any additional context")
    
class ChatResponse(BaseModel):
    response: str = Field(..., description="The AI response")
    confidence: float = Field(..., description="Confidence score of the response")
    
class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None