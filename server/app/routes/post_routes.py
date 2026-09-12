from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime, timezone
import re
from app.auth import get_current_user
from app.database import post_collection,user_collection


router = APIRouter(prefix="/api/posts", tags=["Posts"])


class PostCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = ""
    status: Optional[str] = "published"
    tags: Optional[List[Any]] = []
    coverImage: Optional[str] = ""


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[Any]] = None
    coverImage: Optional[str] = None


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text)


def format_post(post: dict) -> dict:
    if not post:
        return {}

    post_id = str(post.get("_id", ""))

    author_data = post.get("author") or {}
    if isinstance(author_data, dict):
        clean_author = {
            "id": str(author_data.get("id") or author_data.get("_id", "")),
            "_id": str(author_data.get("_id") or author_data.get("id", "")),
            "name": author_data.get("name", "Author"),
            "email": author_data.get("email", ""),
            "avatarUrl": author_data.get("avatarUrl", ""),
            "bio": author_data.get("bio", ""),
        }
    else:
        clean_author = {}

    created_at = post.get("createdAt")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()

    updated_at = post.get("updatedAt")
    if isinstance(updated_at, datetime):
        updated_at = updated_at.isoformat()

    return {
        "id": post_id,
        "_id": post_id,
        "title": post.get("title", ""),
        "slug": post.get("slug", ""),
        "content": post.get("content", ""),
        "excerpt": post.get("excerpt", ""),
        "coverImage": post.get("coverImage", ""),
        "status": post.get("status", "published"),
        "tags": post.get("tags", []),
        "author": clean_author,
        "authorId": str(post.get("authorId") or clean_author.get("id", "")),
        "createdAt": created_at,
        "updatedAt": updated_at,
    }


# 1. Public Feed: GET /api/posts and GET /api/posts/
@router.get("", include_in_schema=False)
@router.get("/")
async def get_published_posts(
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None)
):
    conditions = [
        {"$or": [{"status": "published"}, {"status": {"$exists": False}}]}
    ]

    if tag and tag.strip():
        clean_tag = tag.strip().lower()
        conditions.append({
            "$or": [
                {"tags.slug": clean_tag},
                {"tags.name": {"$regex": f"^{clean_tag}$", "$options": "i"}},
                {"tags": clean_tag}
            ]
        })

    if search and search.strip():
        search_term = search.strip()
        conditions.append({
            "$or": [
                {"title": {"$regex": search_term, "$options": "i"}},
                {"content": {"$regex": search_term, "$options": "i"}}
            ]
        })

    query = {"$and": conditions}

    cursor = post_collection.find(query).sort("createdAt", -1)
    posts = await cursor.to_list(100)
    return [format_post(p) for p in posts]


# 2. My Dashboard Posts: GET /api/posts/mine
@router.get("/mine")
async def get_my_posts(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user.get("id") or current_user.get("_id", ""))

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    query_conditions = [
        {"author.id": user_id},
        {"author._id": user_id},
        {"authorId": user_id},
    ]

    if ObjectId.is_valid(user_id):
        obj_id = ObjectId(user_id)
        query_conditions.extend([
            {"author.id": obj_id},
            {"author._id": obj_id},
            {"authorId": obj_id},
        ])

    cursor = post_collection.find({"$or": query_conditions}).sort("createdAt", -1)
    posts = await cursor.to_list(100)
    return [format_post(p) for p in posts]


# 3. Dynamic Tags Aggregation: GET /api/posts/tags
@router.get("/tags")
async def get_popular_tags():
    pipeline = [
        {"$match": {"$or": [{"status": "published"}, {"status": {"$exists": False}}]}},
        {"$unwind": "$tags"},
        {
            "$project": {
                "tag_name": {
                    "$cond": {
                        "if": {"$eq": [{"$type": "$tags"}, "string"]},
                        "then": "$tags",
                        "else": "$tags.name"
                    }
                }
            }
        },
        {"$match": {"tag_name": {"$ne": None, "$ne": ""}}},
        {
            "$group": {
                "_id": {"$toLower": "$tag_name"},
                "name": {"$first": "$tag_name"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ]

    results = await post_collection.aggregate(pipeline).to_list(20)

    tags = []
    for r in results:
        name = r.get("name", "").strip()
        if not name:
            continue
        slug = slugify(name)
        tags.append({
            "id": r["_id"],
            "name": name,
            "slug": slug,
            "postCount": r.get("count", 0)
        })

    return tags


# 4. Create Post: POST /api/posts
@router.post("", include_in_schema=False, status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_post(post_data: PostCreate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user.get("id") or current_user.get("_id", ""))

    base_slug = slugify(post_data.title) or "post"
    slug = f"{base_slug}-{int(datetime.now().timestamp())}"

    excerpt = post_data.excerpt
    if not excerpt and post_data.content:
        clean_text = re.sub(r'<[^>]*>', '', post_data.content)
        excerpt = clean_text[:150] + "..." if len(clean_text) > 150 else clean_text

    formatted_tags = []
    for tag in (post_data.tags or []):
        if isinstance(tag, str) and tag.strip():
            clean_name = tag.strip()
            formatted_tags.append({
                "name": clean_name,
                "slug": slugify(clean_name)
            })
        elif isinstance(tag, dict) and tag.get("name"):
            clean_name = str(tag["name"]).strip()
            formatted_tags.append({
                "name": clean_name,
                "slug": tag.get("slug") or slugify(clean_name)
            })

    new_post = {
        "title": post_data.title.strip(),
        "slug": slug,
        "content": post_data.content,
        "excerpt": excerpt,
        "coverImage": post_data.coverImage or "",
        "status": post_data.status or "published",
        "tags": formatted_tags,
        "author": {
            "_id": user_id,
            "id": user_id,
            "name": current_user.get("name", "Author"),
            "email": current_user.get("email", ""),
            "avatarUrl": current_user.get("avatarUrl", ""),
            "bio": current_user.get("bio", ""),  # Saved bio into embedded author
        },
        "authorId": user_id,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }

    result = await post_collection.insert_one(new_post)
    new_post["_id"] = result.inserted_id
    return format_post(new_post)


# 5. Update Post: PUT /api/posts/{post_id}
@router.put("/{post_id}")
async def update_post(
    post_id: str,
    post_data: PostUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user.get("id") or current_user.get("_id", ""))

    query = {"_id": ObjectId(post_id)} if ObjectId.is_valid(post_id) else {"_id": post_id}
    post = await post_collection.find_one(query)

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    author_id = str(post.get("authorId") or post.get("author", {}).get("id") or post.get("author", {}).get("_id", ""))
    if author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")

    update_fields = {"updatedAt": datetime.now(timezone.utc)}
    data_dict = post_data.model_dump(exclude_unset=True)

    if "tags" in data_dict and data_dict["tags"] is not None:
        formatted_tags = []
        for tag in data_dict["tags"]:
            if isinstance(tag, str) and tag.strip():
                clean_name = tag.strip()
                formatted_tags.append({"name": clean_name, "slug": slugify(clean_name)})
            elif isinstance(tag, dict) and tag.get("name"):
                clean_name = str(tag["name"]).strip()
                formatted_tags.append({"name": clean_name, "slug": tag.get("slug") or slugify(clean_name)})
        update_fields["tags"] = formatted_tags
        del data_dict["tags"]

    for key, value in data_dict.items():
        if value is not None:
            update_fields[key] = value

    await post_collection.update_one(query, {"$set": update_fields})
    updated = await post_collection.find_one(query)
    return format_post(updated)


# 6. Delete Post: DELETE /api/posts/{post_id}
@router.delete("/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user.get("id") or current_user.get("_id", ""))

    query = {"_id": ObjectId(post_id)} if ObjectId.is_valid(post_id) else {"_id": post_id}
    post = await post_collection.find_one(query)

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    author_id = str(post.get("authorId") or post.get("author", {}).get("id") or post.get("author", {}).get("_id", ""))
    if author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    await post_collection.delete_one(query)
    return {"message": "Post deleted successfully", "id": post_id}


# 7. Single Post Detail by Slug or ObjectId: GET /api/posts/{slug}
@router.get("/{slug}", include_in_schema=False)
@router.get("/{slug}/")
async def get_post_detail(slug: str):
    # Try finding by slug first
    post = await post_collection.find_one({"slug": slug})

    # Fallback to ObjectId lookup if not found or if the parameter is a valid 24-char ObjectId
    if not post and ObjectId.is_valid(slug):
        post = await post_collection.find_one({"_id": ObjectId(slug)})

    if not post:
        raise HTTPException(status_code=404, detail="Article not found")

    return format_post(post)

# 7. Single Post Detail by Slug or ObjectId: GET /api/posts/{slug}
@router.get("/{slug}", include_in_schema=False)
@router.get("/{slug}/")
async def get_post_detail(slug: str):
    # Try finding by slug first
    post = await post_collection.find_one({"slug": slug})

    # Fallback to ObjectId lookup if not found
    if not post and ObjectId.is_valid(slug):
        post = await post_collection.find_one({"_id": ObjectId(slug)})

    if not post:
        raise HTTPException(status_code=404, detail="Article not found")

    # Fetch fresh author profile so bio and avatar always show on older posts
    author_id = (
        post.get("authorId")
        or post.get("author", {}).get("id")
        or post.get("author", {}).get("_id")
    )

    if author_id and ObjectId.is_valid(str(author_id)):
        user = await user_collection.find_one({"_id": ObjectId(str(author_id))})
        if user:
            post["author"] = {
                "id": str(user["_id"]),
                "_id": str(user["_id"]),
                "name": user.get("name", "Author"),
                "email": user.get("email", ""),
                "avatarUrl": user.get("avatarUrl", ""),
                "bio": user.get("bio", ""),
            }

    return format_post(post)