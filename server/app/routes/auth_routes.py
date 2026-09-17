import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from bson import ObjectId
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
import resend

from app.models import UserRegister, UserLogin, UserResponse, UserProfileUpdate
from app.database import user_collection, post_collection
from app.auth import hash_password, verify_password, create_access_token, get_current_user

# Ensure environment variables are loaded
load_dotenv()

# Initialize Resend
resend.api_key = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@hashnodedev.work.gd")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://hashnodedev-frontend.onrender.com").rstrip("/")

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Existing password")
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")


def format_post(post: dict) -> dict:
    return {
        "id": str(post.get("_id", "")),
        "_id": str(post.get("_id", "")),
        "title": post.get("title", ""),
        "slug": post.get("slug", ""),
        "content": post.get("content", ""),
        "excerpt": post.get("excerpt", ""),
        "coverImage": post.get("coverImage", ""),
        "status": post.get("status", "published"),
        "tags": post.get("tags", []),
        "author": post.get("author", {}),
        "createdAt": post.get("createdAt"),
        "updatedAt": post.get("updatedAt"),
    }


def format_user_response(user: dict, token: Optional[str] = None) -> UserResponse:
    user_id = str(user.get("_id") or user.get("id", ""))
    return UserResponse(
        id=user_id,
        name=user.get("name", ""),
        email=user.get("email", ""),
        bio=user.get("bio", ""),
        avatarUrl=user.get("avatarUrl", ""),
        token=token
    )


# --- Register ---
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    email = user_data.email.strip().lower()
    existing_user = await user_collection.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists with this email"
        )

    new_user = {
        "name": user_data.name.strip(),
        "email": email,
        "password": hash_password(user_data.password),
        "bio": "",
        "avatarUrl": "",
        "website": "",
        "github": "",
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }

    result = await user_collection.insert_one(new_user)
    user_id = str(result.inserted_id)
    new_user["_id"] = result.inserted_id

    return format_user_response(new_user, token=create_access_token(user_id))


# --- Login ---
@router.post("/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    email = credentials.email.strip().lower()
    user = await user_collection.find_one({"email": email})
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    user_id = str(user["_id"])
    return format_user_response(user, token=create_access_token(user_id))


# --- Forgot Password (Public - Resend Connected) ---
@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    clean_email = payload.email.strip().lower()
    print(f"\n[FORGOT-PASSWORD] Request received for: {clean_email}")

    user = await user_collection.find_one({"email": clean_email})

    if not user:
        print("[FORGOT-PASSWORD] User not found in DB. Skipping email dispatch.")
        return {"message": "If this email is registered, a password reset link has been generated."}

    reset_token = secrets.token_urlsafe(32)
    token_expiry = datetime.now(timezone.utc) + timedelta(minutes=15)

    await user_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "resetPasswordToken": reset_token,
                "resetPasswordExpires": token_expiry,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    # Strip any trailing slash to prevent double-slash routing issues
    base_frontend_url = FRONTEND_URL.rstrip("/")
    reset_url = f"{base_frontend_url}/reset-password?token={reset_token}"

    print("\n" + "=" * 60)
    print("PASSWORD RESET LINK (Dev Mode):")
    print(reset_url)
    print("=" * 60 + "\n")

    sender = "HashnodeDev <" + EMAIL_FROM + ">"

    try:
        email_result = resend.Emails.send({
            "from": sender,
            "to": [clean_email],
            "subject": "Reset your password - HashnodeDev",
            "html": f"""
            <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0f172a;">Reset Your Password</h2>
                <p style="color: #334155; font-size: 15px;">You requested a password reset for your HashnodeDev account.</p>
                <div style="margin: 20px 0;">
                    <a href="{reset_url}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #64748b; font-size: 13px;">This link will expire in 15 minutes.</p>
            </div>
            """
        })
        print("[FORGOT-PASSWORD] Resend Response:", email_result)
    except Exception as e:
        print("[FORGOT-PASSWORD] Resend Email Send Failed:", repr(e))

    return {"message": "If this email is registered, a password reset link has been generated."}


# --- Reset Password with Token (Public) ---
@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    now = datetime.now(timezone.utc)

    user = await user_collection.find_one(
        {
            "resetPasswordToken": payload.token,
            "resetPasswordExpires": {"$gt": now},
        }
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    hashed_pw = hash_password(payload.new_password)

    await user_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password": hashed_pw,
                "updatedAt": datetime.now(timezone.utc),
            },
            "$unset": {
                "resetPasswordToken": "",
                "resetPasswordExpires": "",
            },
        },
    )

    return {"message": "Password reset successfully. You can now log in."}


# --- Current Authenticated User ---
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user.get("id") or current_user.get("_id", ""))
    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {
        "id": str(user["_id"]),
        "_id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "bio": user.get("bio", ""),
        "avatarUrl": user.get("avatarUrl", ""),
        "website": user.get("website", ""),
        "github": user.get("github", "")
    }


# --- Update Personal Profile (Protected) ---
@router.put("/me")
async def update_my_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user.get("id") or current_user.get("_id", ""))
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    update_fields = {
        "bio": profile_data.bio or "",
        "avatarUrl": profile_data.avatarUrl or "",
        "website": profile_data.website or "",
        "github": profile_data.github or "",
        "updatedAt": datetime.now(timezone.utc)
    }

    await user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )

    # Keep author metadata in sync on published posts
    await post_collection.update_many(
        {"$or": [{"author.id": user_id}, {"author._id": user_id}, {"authorId": user_id}]},
        {"$set": {
            "author.bio": update_fields["bio"],
            "author.avatarUrl": update_fields["avatarUrl"]
        }}
    )

    return {"message": "Profile updated successfully"}


# --- Change / Reset Password Authenticated (Protected) ---
@router.put("/change-password")
async def change_password(
    data: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user.get("id") or current_user.get("_id", ""))
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not verify_password(data.current_password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    await user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "password": hash_password(data.new_password),
                "updatedAt": datetime.now(timezone.utc)
            }
        }
    )

    return {"message": "Password changed successfully"}


# --- Public Author Profile with Published Articles ---
@router.get("/users/{user_id}")
async def get_author_profile(user_id: str):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID")

    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Author not found")

    obj_id = ObjectId(user_id)
    query_conditions = [
        {"author.id": user_id},
        {"author._id": user_id},
        {"authorId": user_id},
        {"author.id": obj_id},
        {"author._id": obj_id},
        {"authorId": obj_id},
    ]

    posts_cursor = post_collection.find({
        "$or": query_conditions,
        "status": "published"
    }).sort("createdAt", -1)

    posts = await posts_cursor.to_list(100)

    return {
        "author": {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "bio": user.get("bio", ""),
            "avatarUrl": user.get("avatarUrl", ""),
            "website": user.get("website", ""),
            "github": user.get("github", "")
        },
        "posts": [format_post(p) for p in posts]
    }