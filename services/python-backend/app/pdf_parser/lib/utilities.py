import io
import logging
from typing import Callable
import pandas as pd
import tabula
from pypdf import PdfReader, PdfWriter
from pathlib import Path

logger = logging.getLogger(__name__)

def get_dataframes_from_pdf(path: Path, password: str) -> pd.DataFrame:
    try:
        with path.open('rb') as f:
            reader = PdfReader(f)
            if reader.is_encrypted:
                reader.decrypt(password)
                
            writer = PdfWriter()
            for page in reader.pages:
                writer.add_page(page)

            decrypted_pdf_stream = io.BytesIO()
            writer.write(decrypted_pdf_stream)
            decrypted_pdf_stream.seek(0)
            
    except Exception as e:
        logger.exception("PDF decryption/reading failed")
        raise ValueError("The PDF file could not be read or decrypted. Please check your password.") from e

    try:
        dfs = tabula.io.read_pdf(decrypted_pdf_stream, pages='all', multiple_tables=True, stream=True)
        
        if not dfs:
            raise ValueError("No tables found in the PDF. Please check the PDF structure.")
            
        combined_df = pd.concat(dfs, ignore_index=True)
        
    except Exception as e:
        logger.exception("Tabula extraction crashed")
        raise RuntimeError("Something went wrong when extracting tables from the PDF.") from e
    
    return combined_df