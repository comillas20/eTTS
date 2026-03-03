import pandas as pd
import io
import numpy as np
import sys, io
import lib.utilities as utilities

def mutate(df: pd.DataFrame) -> pd.DataFrame:
    if 'Date and Time' in df.columns:
        try:
            df['date'] = pd.to_datetime(
                df['Date and Time'],
                format='%Y-%m-%d %I:%M %p',
            ).dt.tz_localize('Asia/Manila')
        except Exception as e:
            df['date'] = pd.to_datetime(
                df['Date and Time'],
                format='%Y-%m-%d %I:%M',
                errors='coerce'
            ).dt.tz_localize('Asia/Manila')
    else:
        df['date'] = pd.NaT

    if "Reference No." in df.columns:
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

        df["referenceNumber"] = df["Reference No."].apply(format_float_to_int_string)
    else:
        df['referenceNumber'] = 'N/A'

    for col in ['Debit', 'Credit']:
        if col not in df.columns:
            df[col.lower()] = df.nan
        else:
            df[col.lower()] = pd.to_numeric(df[col], errors='coerce')

    df['description'] = ''
    if 'Unnamed: 0' in df.columns:
        df['description'] = df['Unnamed: 0'].fillna(df['Unnamed: 0'])
    if 'Description' in df.columns:
        df['description'] = df['description'].fillna(df['Description'])
    df['description'] = df['description'].replace({np.nan: ''})

    return df[['date', 'referenceNumber', 'debit', 'credit', 'description']]

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
        pdf_file_buffer = io.BytesIO(pdf_data_bytes)
        final_records = utilities.get_json_from_buffer(pdf_file_buffer, pdf_password, mutate)
        
        if final_records is None:
            sys.stderr.write("Failed to extract data from PDF. No output generated.\n")
            sys.exit(1)

        # Print the raw JSON string using write and flush for reliability
        sys.stdout.write(final_records)
        sys.stdout.flush() 
        
    except Exception as e:
        # Catch any errors during PDF processing or output not caught in convert_pdf_to_json
        sys.stderr.write(f"FATAL PYTHON PROCESSING ERROR (UNHANDLED): {e}\n")
        sys.stderr.flush()
        sys.exit(1)
        
    sys.exit(0)