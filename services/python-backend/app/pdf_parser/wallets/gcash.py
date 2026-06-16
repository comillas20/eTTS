import pandas as pd
import numpy as np

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
            df[col.lower()] = None
        else:
            try:
                df[col.lower()] = pd.to_numeric(df[col])
            except ValueError:
                df[col.lower()] = None

    df['description'] = ''
    if 'Unnamed: 0' in df.columns:
        df['description'] = df['Unnamed: 0'].fillna(df['Unnamed: 0'])
    if 'Description' in df.columns:
        df['description'] = df['description'].fillna(df['Description'])
    df['description'] = df['description'].replace({np.nan: ''})

    return df[['date', 'referenceNumber', 'debit', 'credit', 'description']]