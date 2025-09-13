from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import auth, bookmarks, courses, mock_tests

# This will create the tables in the database
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(bookmarks.router, prefix="/api/bookmarks", tags=["bookmarks"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(mock_tests.router, prefix="/api/mock-tests", tags=["mock-tests"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the PrepUp API"}
