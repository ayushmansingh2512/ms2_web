from fastapi import FastAPI, Depends, HTTPException, UploadFile, File,status
from fastapi.staticfiles import StaticFiles
import shutil
from pathlib import Path
import uuid
import os
import cloudinary
import cloudinary.uploader
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, timedelta
from . import crud
from . import models
from . import schemas
from . import auth
from .database import SessionLocal, engine, get_db
from .email_utils import send_verification_email
import secrets
from typing import List
from .schemas import BookmarkCreate, Bookmark
from .crud import create_bookmark, get_bookmark_by_user_and_post, delete_bookmark, get_bookmarks_by_user

# This command creates all the tables defined in models.py in the database 
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

from dotenv import load_dotenv

load_dotenv()

# ... existing code ...

# CORS Configuration
origins = [
    "http://localhost:5173",  # Default Vite port, adjust if you use a different one
]

# Get the production origin from an environment variable
prod_origin = os.getenv("PROD_ORIGIN")
if prod_origin:
    origins.append(prod_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"DEBUG: Incoming request headers: {request.headers}")
    response = await call_next(request)
    return response

# Get the directory of the current file (main.py)
BASE_DIR = Path(__file__).resolve().parent

# Cloudinary Configuration
cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET") 
)

# Mount the static files directory relative to BASE_DIR
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static") 
app.include_router(auth.router)

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = crud.get_user_by_email(db, email=user.email)
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = auth.get_password_hash(user.password)
        db_user = models.User(
            email=user.email, 
            hashed_password=hashed_password,
            username=user.username,
            is_verified=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    except Exception as e:
        print(f"ERROR creating user: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# ---- FIXED POST ENDPOINT ----
@app.post("/uploadfile")
async def create_upload_file(file: UploadFile = File(...)):
    try:
        # Upload the file to Cloudinary
        result = cloudinary.uploader.upload(file.file)
        return {"filename": result.get("public_id"), "url": result.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

@app.post("/posts/", response_model=schemas.Post)
def create_post_for_user(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_user_post(db=db, post=post, user_id=current_user.id)

@app.post("/post-categories/", response_model=schemas.PostCategory)
def create_post_category(
    category: schemas.PostCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_category = crud.get_post_category_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(status_code=400, detail="Post category with this name already exists")
    return crud.create_post_category(db=db, category=category)

@app.get("/post-categories/", response_model=List[schemas.PostCategory])
def read_post_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = crud.get_post_categories(db, skip=skip, limit=limit)
    return categories


@app.get("/users/me", response_model=schemas.User)
async def read_user_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
@app.put("/users/me/username", response_model=schemas.User)
def update_my_username(
    username_update: schemas.UserUpdateUsername,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    updated_user = crud.update_user_username(
        db=db,
        user_id=current_user.id,
        username=username_update.username
    )
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found") # Should not happen with current_user
    return updated_user

@app.get("/users/{user_id}", response_model=schemas.UserProfileDisplay)
def read_user_public(user_id: int, db: Session = Depends(get_db)):
    print(f"DEBUG: Requesting user_id={user_id}")
    db_user = crud.get_user_by_id(db, user_id=user_id)
    print(f"DEBUG: Found user: {db_user}")
    if db_user:
        print(f"DEBUG: User ID: {db_user.id}, Username: {db_user.username}")
    else:
        print("DEBUG: User is None")
        
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.put("/posts/{post_id}", response_model=schemas.Post)
def update_post(
    post_id: int,
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_post = crud.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found") 
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this post")
    return crud.update_post(db=db, post_id=post_id, post=post)

@app.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_post = crud.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found") 
    if db_post.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    crud.delete_post(db=db, post_id=post_id)
    return {"message": "Post Deleted Successfully"}    

@app.get("/posts/", response_model=List[schemas.Post])
def read_posts(skip: int = 0, limit: int = 100, category_id: Optional[int] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    posts = crud.get_posts(db, skip=skip, limit=limit, category_id=category_id, start_date=start_date, end_date=end_date, search=search)
    return posts

@app.get("/posts/{post_id}", response_model=schemas.Post)
def read_post(post_id: int, db: Session = Depends(get_db)):
    db_post = crud.get_post(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return db_post

 
@app.post("/bookmarks/", response_model=schemas.Bookmark, status_code=status.HTTP_201_CREATED)
def create_user_bookmark(
    bookmark: schemas.BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_bookmark = crud.get_bookmark_by_user_and_post(db, user_id=current_user.id, post_id=bookmark.post_id)
    if db_bookmark:
        raise HTTPException(status_code=400, detail="Bookmark already exists")
    return crud.create_bookmark(db=db, user_id=current_user.id, post_id=bookmark.post_id)



@app.get("/bookmarks/", response_model=List[schemas.Bookmark])
def read_user_bookmarks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    bookmarks = crud.get_bookmarks_by_user(db, user_id=current_user.id)
    return bookmarks


@app.delete("/bookmarks/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_bookmark = crud.get_bookmark(db, bookmark_id=bookmark_id)
    if not db_bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    if db_bookmark.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this bookmark")
    crud.delete_bookmark(db=db, bookmark_id=db_bookmark.id)


@app.post("/resources/", response_model=schemas.Resource)
def create_resource(
    resource: schemas.ResourceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_resource(db=db, resource=resource)

@app.get("/resources/", response_model=List[schemas.Resource])
def read_resources(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    resources = crud.get_resources(db, skip=skip, limit=limit, category_id=category_id, start_date=start_date, end_date=end_date, search=search)
    return resources

@app.get("/resources/{resource_id}", response_model=schemas.Resource)
def read_resource(resource_id: int, db: Session = Depends(get_db)):
    db_resource = crud.get_resource(db, resource_id=resource_id)
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return db_resource

@app.put("/resources/{resource_id}", response_model=schemas.Resource)
def update_resource(
    resource_id: int,
    resource: schemas.ResourceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_resource = crud.get_resource(db, resource_id=resource_id)
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return crud.update_resource(db=db, resource_id=resource_id, resource=resource)

@app.delete("/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_resource = crud.get_resource(db, resource_id=resource_id)
    if db_resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    crud.delete_resource(db=db, resource_id=resource_id)
    return {"message": "Resource Deleted Successfully"}

@app.post("/resource-categories/", response_model=schemas.ResourceCategory)
def create_resource_category(
    category: schemas.ResourceCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_category = crud.get_resource_category_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(status_code=400, detail="Resource category with this name already exists")
    return crud.create_resource_category(db=db, category=category)

@app.get("/resource-categories/", response_model=List[schemas.ResourceCategory])
def read_resource_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = crud.get_resource_categories(db, skip=skip, limit=limit)
    return categories


@app.post("/clubs/", response_model=schemas.Club)
def create_club(
    club: schemas.ClubCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return crud.create_club(db=db, club=club)

@app.get("/clubs/", response_model=List[schemas.Club])
def read_clubs(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    clubs = crud.get_clubs(db, skip=skip, limit=limit, category_id=category_id, start_date=start_date, end_date=end_date, search=search)
    return clubs

@app.get("/clubs/{club_id}", response_model=schemas.Club)
def read_club(club_id: int, db: Session = Depends(get_db)):
    db_club = crud.get_club(db, club_id=club_id)
    if db_club is None:
        raise HTTPException(status_code=404, detail="Club not found")
    return db_club

@app.put("/clubs/{club_id}", response_model=schemas.Club)
def update_club(
    club_id: int,
    club: schemas.ClubCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_club = crud.get_club(db, club_id=club_id)
    if db_club is None:
        raise HTTPException(status_code=404, detail="Club not found")
    return crud.update_club(db=db, club_id=club_id, club=club)

@app.delete("/clubs/{club_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_club(
    club_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_club = crud.get_club(db, club_id=club_id)
    if db_club is None:
        raise HTTPException(status_code=404, detail="Club not found")
    crud.delete_club(db=db, club_id=club_id)
    return {"message": "Club Deleted Successfully"}

@app.post("/club-categories/", response_model=schemas.ClubCategory)
def create_club_category(
    category: schemas.ClubCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_category = crud.get_club_category_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(status_code=400, detail="Club category with this name already exists")
    return crud.create_club_category(db=db, category=category)

@app.get("/club-categories/", response_model=List[schemas.ClubCategory])
def read_club_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    categories = crud.get_club_categories(db, skip=skip, limit=limit)
    return categories