import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import init_db
from app.routes import auth_routes, post_routes, tag_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB indexes on startup
    await init_db()
    yield


app = FastAPI(
    title="Hashnode Clone API",
    description="Python FastAPI backend with MongoDB Atlas for Developer Blogging Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Explicitly list all allowed frontend origins
origins = [
    "https://hashnodedev-frontend.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

frontend_env = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if frontend_env and frontend_env not in origins:
    origins.append(frontend_env)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global Exception Handler to maintain CORS headers on 500 errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin")
    allowed_origin = origin if origin in origins else origins[0]
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )

# Include Routers
app.include_router(auth_routes.router)
app.include_router(post_routes.router)
app.include_router(tag_routes.router)


@app.get("/")
def root():
    return {"message": "FastAPI Server is live and running!"}