from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from support import router as support_router

app = FastAPI()

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(support_router, prefix="/api")