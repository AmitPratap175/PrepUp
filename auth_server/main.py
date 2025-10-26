from fastapi import FastAPI
from auth_server.api import auth, users, api

app = FastAPI()

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/auth", tags=["users"])
app.include_router(api.router, prefix="/api", tags=["api"])


@app.get("/")
def read_root():
    return {"Hello": "World"}
