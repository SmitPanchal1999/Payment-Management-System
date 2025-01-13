# db.py
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

# MongoDB URI
MONGODB_URI = os.getenv("MONGODB_URI")

# Async MongoClient setup using Motor
client = AsyncIOMotorClient(MONGODB_URI)
database = client.PMS  # Your database name
collection = database.payments  # Your collection name