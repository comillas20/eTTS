import pandas as pd
import numpy as np
import math
from pypdf import PdfReader, PdfWriter
import sys, os, tabula, io

def remove_pdf_password(input_pdf_path, pdf_password):
    """
    Removes password protection from a PDF file and saves an unprotected copy.

    Args:
        input_pdf_path (str): The path to the password-protected PDF file.
        pdf_password (str): The password to decrypt the PDF.
    """
    try:
        reader = PdfReader(input_pdf_path)

        if reader.is_encrypted:
            print("[Decryption attempt]")
            try:
                reader.decrypt(pdf_password)
                print("[Decryption successful]")
            except Exception as e:
                print(f"Error: Could not decrypt PDF. Incorrect password or PDF is corrupted. Details: {e}", file=sys.stderr)
                return False
        return reader

    except FileNotFoundError:
        print(f"Error: Input PDF file not found at '{input_pdf_path}'")
        return False
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return False

def convert_pdf_to_json(reader, output_json_path):
    """
    Converts a PDF file to a JSON file.

    Args:
        reader (PdfReader): The PDF to convert.
        output_json_path (str): The path where the JSON file will be saved.
    """
    if not reader:
        print("Invalid PDF reader provided. Cannot convert to JSON.")
        return

    writer = PdfWriter()

    print("[Write attempt]")
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
            print("No tables found in the PDF. Please check the PDF structure or parameters.")
            return

        combined_df = pd.concat(dfs, ignore_index=True)

        if 'Date and Time' in combined_df.columns:
            combined_df['date'] = pd.to_datetime(combined_df['Date and Time'], errors='coerce')
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

        # 3. Save file to JSON
        print(f"Saving DataFrame to JSON: {output_json_path}...")
        # 'orient' parameter controls the JSON format:
        # 'records': List of dictionaries, one per row (common and readable). Default.
        # 'columns': Dictionary of lists, one list per column.
        # 'index': Dictionary of dictionaries, indexed by row label.
        # 'split': Dictionary with 'index', 'columns', 'data' keys.
        # 'values': Just a list of lists (rows).
        # 'table': JSON Table Schema format.
        final_df = combined_df[['date', 'referenceNumber', 'debit', 'credit', 'description']]
        final_df.to_json(output_json_path, orient='records', indent=4) # indent for pretty printing
        decrypted_pdf_stream.close()
        print("JSON file created and saved successfully!")

    except Exception as e:
        print(f"An error occurred: {e}")

def get_input(prompt):
    print(prompt)
    sys.stdout.flush() # Ensure prompt is displayed before waiting for input
    return sys.stdin.readline().strip()

if __name__ == "__main__":
    original_path = get_input("[ORIGINAL]")

    if not os.path.exists(original_path):
        print(f"Error: The file '{original_path}' does not exist. Please check the path and try again.", file=sys.stderr)
    else:
        password = get_input("[PASSWORD]")

        file_name, file_extension = os.path.splitext(original_path)

        # Ensure 'output' directory exists
        output_dir = "output"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        output_path_base = os.path.join(output_dir, "decrypted")
        output_path = f"{output_path_base}.json"

        # Handle existing output files by appending a number
        counter = 0
        while os.path.exists(output_path):
            counter += 1
            output_path = f"{output_path_base} ({counter}).json"

        pdf_reader = remove_pdf_password(original_path, password)
        convert_pdf_to_json(pdf_reader, output_path)
