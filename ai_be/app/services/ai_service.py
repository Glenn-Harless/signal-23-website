from langchain_community.llms import Ollama, HuggingFaceHub
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from app.core.config import settings
from typing import Optional

class AIService:
    def __init__(self, model_type: str = "ollama"):
        self.model_type = model_type
        self.llm = self._initialize_llm()
        
        # Customize the prompt for your music group
        self.prompt = PromptTemplate(
            input_variables=["query"],
            template="""You are an AI assistant for a music group. 
            Answer questions about music, the band, and related topics.
            Be engaging and enthusiastic in your responses.
            
            Query: {query}
            
            Assistant:"""
        )
        
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)
    
    def _initialize_llm(self):
        """Initialize the language model based on configuration"""
        if self.model_type == "ollama":
            return Ollama(
                model="llama2",
                base_url=settings.OLLAMA_BASE_URL,
                temperature=settings.TEMPERATURE
            )
        
        elif self.model_type == "huggingface":
            return HuggingFaceHub(
                repo_id=settings.HUGGINGFACE_MODEL_NAME,
                huggingfacehub_api_token=settings.HUGGINGFACE_API_TOKEN,
                temperature=settings.TEMPERATURE
            )
        
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
    
    async def generate_response(self, query: str) -> str:
        """Generate a response to the user's query"""
        try:
            response = self.chain.run(query=query)
            return response.strip()
        except Exception as e:
            raise Exception(f"Error generating AI response: {str(e)}")

    def get_embeddings(self):
        """Get embeddings for document search/RAG"""
        return HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

    @property
    def model_info(self):
        """Get information about the current model"""
        return {
            "type": self.model_type,
            "model": settings.OLLAMA_MODEL_NAME if self.model_type == "ollama" else settings.HUGGINGFACE_MODEL_NAME,
            "temperature": settings.TEMPERATURE,
            "status": "initialized"
        }