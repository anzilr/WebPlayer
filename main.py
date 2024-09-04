from fastapi import FastAPI, HTTPException, Request, Depends, status, Response
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
import os

MONGODB_URI = os.environ.get("MONGODB_URI")


app = FastAPI()

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize Jinja2Templates for HTML templates
templates = Jinja2Templates(directory="templates")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = AsyncIOMotorClient(MONGODB_URI)
db = client['botdb']
collection = db['subtitles']

class DataModel(BaseModel):
    text: str
    index: int
    subtitle_id: str


@app.get("/subtitles/{subtitle_id}")
async def fetch_subtitles(subtitle_id: str):
    subtitles = await fetch_db(subtitle_id=subtitle_id)
    return subtitles

@app.get("/player/{subtitle_id}/{index}", response_class=HTMLResponse)
async def web_player(request: Request,subtitle_id: str, index: int):
    data = {"subtitle_id": subtitle_id, "index": index}
    return templates.TemplateResponse("index.html", {"request": request, **data})


@app.post("/submit-edited")
async def submit_edit(data: DataModel):
    response = await update_subtitle_edited(data.subtitle_id, data.index, data.text)
    return response


@app.get("/last-index/{subtitle_id}")
async def last_index(subtitle_id: str):
    data = await fetch_last_line(subtitle_id)
    return data


async def fetch_db(subtitle_id):
    # Read the subtitles array from a document
    document = await collection.find_one(
        {"_id": subtitle_id},
        {
            "subtitles": 1,
            "_id": 0,
        },  # Projecting to only include the subtitles array
    )
    result = document.get("subtitles") if document else None
    return result


async def update_subtitle_edited(subtitle_id, index, edited_text):
        result = await collection.update_one(
            {"_id": subtitle_id, "subtitles.index": index},
            {"$set": {"subtitles.$.edited": edited_text}},
        )
        return result.modified_count
    
    
async def fetch_last_line(subtitle_id):
    document = await collection.find_one(
        {"_id": subtitle_id},
        {
            "last_edited_line": 1,
            "_id": 0,
        },
    )
    result = document.get("last_edited_line") if document else None
    return result
    