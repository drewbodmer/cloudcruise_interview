from fastapi import FastAPI, UploadFile, File, HTTPException
from har_parser import retrieve_best_curl 
import os
import tempfile
from typing import List
from pydantic import BaseModel
import logging
import json
logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

class QueryRequest(BaseModel):
    query: str
    filename: str

app = FastAPI()
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "har_files")

os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    uploaded_files = []
    try:
        if (file.filename or "").endswith('.har'):
            file_path = os.path.join(UPLOAD_DIR, file.filename or "no_name")
            contents = await file.read()
            
            with open(file_path, "wb") as f:
                f.write(contents)
            uploaded_files.append(file.filename)
        
        return {
            "message": "Upload successful",
            "files": uploaded_files
        }
    except Exception as e:
        return {"error": str(e)}, 500

@app.get("/api/available-files")
def get_files():
    try:
        files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith('.har')]
        return {
            "files": files
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail="Files not found")   

@app.post("/api/query")
async def run_query(request: QueryRequest):
    try:
        fp = os.path.join(UPLOAD_DIR, request.filename)
        if not os.path.exists(fp) or os.path.isdir(fp):
            raise HTTPException(status_code=404, detail="File not found")   

        with open(fp, 'r', encoding='utf-8') as f:
            result, message = retrieve_best_curl(request.query, fp)
            logger.debug(result)
            logger.debug(message)
            if result:
                logger.debug(message)
                return {"message": message}
            else:
                raise HTTPException(status_code=500, detail=message)
    except Exception as e:
        if type(e) == HTTPException:
            raise e
        # logger.debug(e)
        raise e
        raise HTTPException(status_code=404, detail="Unable to query file")   

@app.delete("/api/files/{filename}")
async def delete_file(filename: str):
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return {"message": f"File {filename} deleted"}
        raise HTTPException(status_code=500, detail="File not found")   
    except Exception as e:
        raise HTTPException(status_code=500, detail="File not found")   