import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Add FRONTEND_URL from env if set and not already present
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
)

# Include Routers
app.include_router(auth_routes.router)
app.include_router(post_routes.router)
app.include_router(tag_routes.router)


@app.get("/")
def root():
    return {"message": "FastAPI Server is live and running!"}