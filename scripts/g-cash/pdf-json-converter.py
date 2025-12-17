import pandas as pd
import io
import json
import numpy as np
from pypdf import PdfReader, PdfWriter
import sys, os, tabula, io

def get_decrypted_pdf_reader(pdf_file_object, pdf_password):
    """
    Decrypts a password-protected PDF file-like object and returns the reader.

    Args:
        pdf_file_object: A file-like object (e.g., io.BytesIO) containing 
                         the PDF data.
        pdf_password (str): The password to decrypt the PDF.

    Returns:
        PdfReader: The decrypted PdfReader object if successful.
        False: If decryption fails or another error occurs.
    """
    try:
        reader = PdfReader(pdf_file_object)

        if reader.is_encrypted:
            # print("[Decryption attempt]")
            try:
                reader.decrypt(pdf_password)
                # print("[Decryption successful]")
            except Exception as e:
                sys.stderr.write(f"Error: Could not decrypt PDF. Incorrect password or PDF is corrupted. Details: {e}", file=sys.stderr)
                return False
        return reader

    except Exception as e:
        sys.stderr.write(f"An unexpected error occurred: {e}")
        return False

def convert_pdf_to_json(reader):
    """
    Converts a PDF file to a JSON file.

    Args:
        reader (PdfReader): The PDF to convert.
    """
    if not reader:
        sys.stderr.write("Invalid PDF reader provided. Cannot convert to JSON.")
        return

    writer = PdfWriter()

    # print("[Write attempt]")
    # Add all pages to the writer
    for page in reader.pages:
        writer.add_page(page)

    decrypted_pdf_stream = io.BytesIO()
    writer.write(decrypted_pdf_stream)

    # IMPORTANT: Reset the stream's position to the beginning before passing to tabula
    decrypted_pdf_stream.seek(0)

    try:
        dfs = tabula.read_pdf(decrypted_pdf_stream, pages='all', multiple_tables=True, stream=True)

        if not dfs:
            sys.stderr.write("No tables found in the PDF. Please check the PDF structure or parameters.")
            return

        combined_df = pd.concat(dfs, ignore_index=True)
       
        if 'Date and Time' in combined_df.columns:
            combined_df['date'] = pd.to_datetime(
                combined_df['Date and Time'],
                format='%Y-%m-%d %I:%M %p',
                errors='coerce'
            ).dt.tz_localize('Asia/Manila')
        else:
            combined_df['date'] = pd.NaT

        if "Reference No." in combined_df.columns:
            def format_float_to_int_string(value):
                if pd.isna(value):
                    return 'N/A'
                s_value = str(value)
                try:
                    float_value = float(s_value)
                    if float_value == int(float_value):
                        return str(int(float_value)).zfill(13)
                    else:
                        return s_value
                except ValueError:
                    return s_value

            combined_df["referenceNumber"] = combined_df["Reference No."].apply(format_float_to_int_string)
        else:
            combined_df['referenceNumber'] = 'N/A'

        for col in ['Debit', 'Credit']:
            if col not in combined_df.columns:
                combined_df[col.lower()] = combined_df.nan
            else:
                combined_df[col.lower()] = pd.to_numeric(combined_df[col], errors='coerce')

        combined_df['description'] = ''
        if 'Unnamed: 0' in combined_df.columns:
            combined_df['description'] = combined_df['Unnamed: 0'].fillna(combined_df['Unnamed: 0'])
        if 'Description' in combined_df.columns:
            combined_df['description'] = combined_df['description'].fillna(combined_df['Description'])
        combined_df['description'] = combined_df['description'].replace({np.nan: ''})

        final_df = combined_df[['date', 'referenceNumber', 'debit', 'credit', 'description']]
        
        # CRITICAL FIX: Leverage pandas' native JSON serializer (to_json) for robust
        # handling of Timestamp, NaT, and NaN, then load the resulting JSON string
        # back into a native Python object (list of dicts) before returning.
        json_string = final_df.to_json(orient='records', date_format='iso')
        
        # print("[Write successful]")
        return json_string


        # return final_df.to_dict(orient='records')
    except Exception as e:
        sys.stderr.write(f"An error occurred: {e}")
        return "[]"
    finally:
        decrypted_pdf_stream.close()

if __name__ == "__main__":
    try:
        print("[FILE_PASSWORD]")
        sys.stdout.flush()
        pdf_password = sys.stdin.readline().strip()

        print("[PDF_BUFFER]")
        sys.stdout.flush()
        pdf_data_bytes = sys.stdin.buffer.read()
    except Exception as e:
        # Handle case where no data was piped
        sys.stderr.write(f"Error reading stdin: {e}\n")
        sys.exit(1)

    try:
        # Process the PDF data from memory
        pdf_file_object = io.BytesIO(pdf_data_bytes)
        pdf_reader = get_decrypted_pdf_reader(pdf_file_object, pdf_password)
        
        # Convert the reader content to a data structure, serialize, and print
        final_records = convert_pdf_to_json(pdf_reader)
        
        # Print the raw JSON string using write and flush for reliability
        sys.stdout.write(final_records)
        sys.stdout.flush() 
        
    except Exception as e:
        # Catch any errors during PDF processing or output not caught in convert_pdf_to_json
        sys.stderr.write(f"FATAL PYTHON PROCESSING ERROR (UNHANDLED): {e}\n")
        sys.stderr.flush()
        sys.exit(1)
        
    sys.exit(0)
