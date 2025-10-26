from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from auth_server.api import auth, users, api
import os

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "a_super_secret_key"))

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/auth", tags=["users"])
app.include_router(api.router, prefix="/api", tags=["api"])


@app.get("/")
def read_root():
    return {"Hello": "World"}
