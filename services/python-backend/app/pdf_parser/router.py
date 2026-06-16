from fastapi import APIRouter, HTTPException, status
import app.pdf_parser.lib.utilities as utilities
import app.pdf_parser.wallets.gcash as gcash
from pydantic import BaseModel
from pathlib import Path
import logging
import pandas as pd

router = APIRouter()
logger = logging.getLogger(__name__)

class PDFFile(BaseModel):
    path: str
    password: str
    wallet: str

@router.post("/parse")
def parse_pdf_file(pdf_file: PDFFile):
    pdf_path = Path(pdf_file.path)
    logger.info(f"Starting PDF extraction for file path: {pdf_file}")

    if not pdf_path.exists():
        raise HTTPException(status_code=400, detail="File not found on server disk.")
    
    try:
        dataframes = utilities.get_dataframes_from_pdf(pdf_path, pdf_file.password)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    
    match pdf_file.wallet:
        case "g-cash":
            # If mutation fails, let it throw a 500 automatically so logs will capture the real bug
            mutated_df = gcash.mutate(dataframes)
            mutated_df = mutated_df.replace({pd.NA: None, float('nan'): None})
            data = mutated_df.to_dict(orient='records')
            return data
        case _:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No wallet"
            )
        
