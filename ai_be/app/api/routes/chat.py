from fastapi import APIRouter, HTTPException, Depends
from app.models.chat import ChatRequest, ChatResponse, ErrorResponse
from app.core.security import rate_limit
from transformers import pipeline
from app.core.config import settings

router = APIRouter()

# Initialize the model (using a small, free model)
try:
    generator = pipeline(
        'text-generation',
        model='TinyLlama/TinyLlama-1.1B-Chat-v1.0',  # Small, free model
        device="cpu"
    )
except Exception as e:
    print(f"Error loading model: {e}")
    generator = None

@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={400: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
    tags=["chat"]
)
async def chat_endpoint(
    request: ChatRequest,
    _: None = Depends(rate_limit)
):
    try:
        if not generator:
            raise HTTPException(
                status_code=500,
                detail="Model not initialized"
            )

        # Format the prompt
        prompt = f"""You are a helpful music assistant. 
        Context: {request.context or 'No additional context provided'}
        User: {request.message}
        Assistant:"""

        # Generate response
        result = generator(
            prompt,
            max_length=200,
            num_return_sequences=1,
            temperature=0.7
        )

        response_text = result[0]['generated_text'].split("Assistant:")[-1].strip()
        
        return ChatResponse(
            response=response_text,
            confidence=0.85  # Simplified confidence score
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating response: {str(e)}"
        )

@router.get("/models", tags=["chat"])
async def list_models():
    """List available models and their status"""
    return {
        "current_model": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        "status": "loaded" if generator else "not loaded",
        "type": "free/open-source"
    }