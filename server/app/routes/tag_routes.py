from fastapi import APIRouter
from typing import List
from app.models import TagResponse
from app.database import tag_collection, post_collection
import re

router = APIRouter(prefix="/api/tags", tags=["Tags"])

async def find_or_create_tags(tag_names: List[str]) -> List[dict]:
    tag_docs = []
    if not tag_names:
        return tag_docs

    for name in tag_names:
        clean_name = name.strip().lower()
        if not clean_name:
            continue
        slug = re.sub(r'[^a-z0-9]+', '-', clean_name).strip('-')
        tag = await tag_collection.find_one({"name": clean_name})
        if not tag:
            new_tag = {"name": clean_name, "slug": slug}
            res = await tag_collection.insert_one(new_tag)
            tag_docs.append({"id": str(res.inserted_id), "name": clean_name, "slug": slug})
        else:
            tag_docs.append({"id": str(tag["_id"]), "name": tag["name"], "slug": tag["slug"]})
    return tag_docs

@router.get("", response_model=List[TagResponse])
async def get_all_tags():
    tags = await tag_collection.find().sort("name", 1).to_list(100)
    result = []
    for tag in tags:
        count = await post_collection.count_documents({
            "tags.id": str(tag["_id"]),
            "status": "published"
        })
        result.append(TagResponse(
            id=str(tag["_id"]),
            name=tag["name"],
            slug=tag["slug"],
            postCount=count
        ))
    return result