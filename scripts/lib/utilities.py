from io import BytesIO
from pypdf import PdfReader
import pandas as pd
import io
import json
import numpy as np
from pypdf import PdfReader, PdfWriter
import sys, os, tabula.io, io
from typing import Callable

def get_json_from_buffer(pdf_file_buffer: BytesIO, pdf_password: str, mutate: Callable[[pd.DataFrame], pd.DataFrame]):
    try:
        reader = PdfReader(pdf_file_buffer, password=pdf_password)
        
        if not reader:
            return None

        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        decrypted_pdf_stream = io.BytesIO()
        writer.write(decrypted_pdf_stream)

        # Reset the stream's position to the beginning before passing to tabula
        decrypted_pdf_stream.seek(0)

        try:
            dfs = tabula.io.read_pdf(decrypted_pdf_stream, pages='all', multiple_tables=True, stream=True)

            if not dfs:
                sys.stderr.write("No tables found in the PDF. Please check the PDF structure or parameters.")
                return None

            combined_df = pd.concat(dfs, ignore_index=True)

            mutated_df = mutate(combined_df)

            # Leverage pandas' native JSON serializer (to_json) for robust
            # handling of Timestamp, NaT, and NaN, then load the resulting JSON string
            # back into a native Python object (list of dicts) before returning.
            return mutated_df.to_json(orient='records', date_format='iso')

        except Exception as e:
            sys.stderr.write(f"Error extracting tables from PDF: {e}")
            return None

    except Exception as e:
        sys.stderr.write(f"Error reading PDF: {e}")
        return None
    
