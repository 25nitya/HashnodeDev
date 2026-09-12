import os
import certifi
from dotenv import load_dotenv
import motor.motor_asyncio
import pymongo

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

# Pass tlsCAFile using certifi to resolve SSL certificate verification
client = motor.motor_asyncio.AsyncIOMotorClient(
    MONGO_URI,
    tlsCAFile=certifi.where()
)
db = client.get_database("hashnode_dev")

user_collection = db.get_collection("users")
post_collection = db.get_collection("posts")
tag_collection = db.get_collection("tags")

async def init_db():
    # Ensure unique indexes
    await user_collection.create_index("email", unique=True)
    await tag_collection.create_index("name", unique=True)
    await tag_collection.create_index("slug", unique=True)
    await post_collection.create_index("slug", unique=True)
    # Full-text search index on title and content
    await post_collection.create_index([("title", pymongo.TEXT), ("content", pymongo.TEXT)])