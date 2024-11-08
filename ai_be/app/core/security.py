from fastapi import HTTPException, Request
import time
from app.core.config import settings
from collections import defaultdict
import threading

class RateLimiter:
    def __init__(self, requests_per_minute):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
        self.lock = threading.Lock()

    def is_rate_limited(self, client_ip: str) -> bool:
        now = time.time()
        minute_ago = now - 60

        with self.lock:
            # Clean old requests
            self.requests[client_ip] = [
                req_time for req_time in self.requests[client_ip]
                if req_time > minute_ago
            ]

            # Check if rate limit is exceeded
            if len(self.requests[client_ip]) >= self.requests_per_minute:
                return True

            # Add new request
            self.requests[client_ip].append(now)
            return False

# Create a global rate limiter instance
rate_limiter = RateLimiter(settings.RATE_LIMIT_PER_MINUTE)

async def rate_limit(request: Request):
    client_ip = request.client.host
    if rate_limiter.is_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "limit": settings.RATE_LIMIT_PER_MINUTE,
                "per": "minute"
            }
        )