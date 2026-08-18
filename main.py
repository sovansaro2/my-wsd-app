from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import json
from typing import List

app = FastAPI()

# 1. Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Supabase Client Setup
SUPABASE_URL = "https://vstwhhuqgeimssqxfmij.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHdoaHVxZ2VpbXNzcXhmbWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MjU2NjEsImV4cCI6MjEwMjUwMTY2MX0.QVzdZkx3kNw3sGvnAK8E8My1szvDpz3Qario2XuPmmI"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 3. Data Models
class LoginRequest(BaseModel):
    full_name: str
    password: str

class PostCreateRequest(BaseModel):
    author_name: str
    content: str
    image_urls: List[str] = []

# 4. Authentication Endpoint
@app.post("/api/auth/login")
def login(request: LoginRequest):
    try:
        # Query the profiles table in Supabase
        response = supabase.table("profiles").select("*").eq("full_name", request.full_name).eq("password", request.password).execute()
        
        data = response.data
        if not data or len(data) == 0:
            raise HTTPException(status_code=401, detail="ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ")
            
        # Return the user object (first match)
        return {"user": data[0]}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        # Catch unexpected errors to prevent server crash
        raise HTTPException(status_code=500, detail="មានបញ្ហាបច្ចេកទេស សូមព្យាយាមម្តងទៀត។")

# 5. Feed Endpoints
@app.get("/api/posts")
def get_posts():
    try:
        # Fetch posts and join the profiles table to get the author's full_name
        response = supabase.table("posts").select("*, profiles(full_name)").order("created_at", desc=True).execute()
        return {"posts": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/posts")
def create_post(request: PostCreateRequest):
    try:
        # Find author_id from full_name
        prof_resp = supabase.table("profiles").select("id").eq("full_name", request.author_name).execute()
        if not prof_resp.data:
            raise HTTPException(status_code=404, detail="រកមិនឃើញគណនីអ្នកបង្ហោះទេ")
        
        author_id = prof_resp.data[0]["id"]
        
        # Serialize list of base64 images into a JSON string
        image_url_str = json.dumps(request.image_urls)
        
        post_data = {
            "author_id": author_id,
            "content": request.content,
            "image_url": image_url_str
        }
        
        res = supabase.table("posts").insert(post_data).execute()
        return {"post": res.data[0] if res.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

