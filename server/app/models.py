from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime



# --- USER SCHEMAS ---
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    bio: Optional[str] = ""
    avatarUrl: Optional[str] = ""
    token: Optional[str] = None


class UserProfileUpdate(BaseModel):
    bio: Optional[str] = ""
    avatarUrl: Optional[str] = ""
    github: Optional[str] = ""
    website: Optional[str] = ""

# --- TAG SCHEMAS ---
class TagResponse(BaseModel):
    id: str
    name: str
    slug: str
    postCount: Optional[int] = 0

# --- POST SCHEMAS ---
class PostCreate(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = []
    coverImage: Optional[str] = ""
    status: Optional[str] = "draft"
    excerpt: Optional[str] = ""

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    coverImage: Optional[str] = None
    status: Optional[str] = None
    excerpt: Optional[str] = None

class PostResponse(BaseModel):
    id: str
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = ""
    coverImage: Optional[str] = ""
    status: str
    author: dict
    tags: List[dict]
    createdAt: datetime
    updatedAt: datetime


                                  # for author profile #

# Stored in MongoDB
class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    avatarUrl: Optional[str] = None
    website: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None

# Public Author Profile Response
class AuthorProfileResponse(BaseModel):
    id: str
    name: str
    email: Optional[EmailStr] = None
    bio: Optional[str] = ""
    avatarUrl: Optional[str] = ""
    website: Optional[str] = ""
    github: Optional[str] = ""
    twitter: Optional[str] = ""