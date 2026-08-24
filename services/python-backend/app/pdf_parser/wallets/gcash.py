import pandas as pd
import numpy as np
import logging
import pandas as pd
from pathlib import Path
import pdfplumber

logger = logging.getLogger(__name__)

def get_dataframes(path: Path, password: str) -> pd.DataFrame:
    all_rows = []

    # Define approximate column horizontal boundaries as percentages of total page width
    # Adjust these 5 thresholds if columns misalign (0.0 to 1.0)
    COLUMN_BOUNDS_PCT = [
        0.00,  # Date & Time (0% - 19.2%)
        0.192,  # Description (19.2% - 54.9%)
        0.549,  # Reference No (54.9% - 67.4%)
        0.674,  # Debit (67.4% - 76.4%)
        0.764,  # Credit (76.4% - 84.4%)
        0.844,  # Balance (84.4% - 100%)
        1.00
    ]

    try:
        with pdfplumber.open(path, password=password if password else None) as pdf:
            for page in pdf.pages:
                page_width = page.width
                # Calculate absolute X boundaries for this specific page width
                col_bounds = [pct * page_width for pct in COLUMN_BOUNDS_PCT]

                words = page.extract_words(
                    x_tolerance=3, 
                    y_tolerance=3, 
                    keep_blank_chars=False
                )

                if not words:
                    continue

                # 1. Group words into horizontal lines dynamically with Y-tolerance
                # Words within 6 vertical points of each other belong to the same visual line
                lines = []  # List of dicts: {'y': average_y, 'words': [word1, word2, ...]}
                Y_TOLERANCE = 6.0  # Adjust between 5.0 and 8.0 if lines still split/overlap

                for w in sorted(words, key=lambda x: (x['top'], x['x0'])):
                    word_top = w['top']

                    # Find an existing visual line that is vertically close
                    matched_line = None
                    for line in lines:
                        if abs(line['y'] - word_top) <= Y_TOLERANCE:
                            matched_line = line
                            break

                    if matched_line:
                        matched_line['words'].append(w)
                        # Update running average Y for the line
                        matched_line['y'] = sum(item['top'] for item in matched_line['words']) / len(
                            matched_line['words']
                        )
                    else:
                        lines.append({'y': word_top, 'words': [w]})

                # Sort lines from top to bottom of the page
                lines = sorted(lines, key=lambda l: l['y'])

                # 2. Process line by line and assign words to column buckets
                for line in lines:
                    line_words = sorted(line['words'], key=lambda w: w['x0'])

                    # Create 6-element row corresponding to percentage buckets
                    row_cells = [[] for _ in range(len(col_bounds) - 1)]

                    for w in line_words:
                        x_center = (w['x0'] + w['x1']) / 2

                        # Find which column bucket the word falls into
                        for i in range(len(col_bounds) - 1):
                            if col_bounds[i] <= x_center < col_bounds[i + 1]:
                                row_cells[i].append(w['text'])
                                break

                    str_row = [' '.join(cell_words).strip() for cell_words in row_cells]

                    if any(str_row):
                        all_rows.append(str_row)

    except Exception as e:
        logger.exception("Failed extracting text by bounding box")
        raise ValueError("Error parsing PDF document.") from e

    if not all_rows:
        raise ValueError("No text found in PDF.")

    # 3. Create DataFrame with standard 6 columns
    # (Matches: Date & Time, Description, Reference No., Debit, Credit, Balance)
    raw_df = pd.DataFrame(all_rows, columns=[
        'Date and Time', 'Description', 'Reference No.', 'Debit', 'Credit', 'Balance'
    ])

    # 1. Strip whitespace across all cells
    raw_df = raw_df.apply(lambda col: col.str.strip())

    # 2. Drop rows that are completely empty across all 6 columns
    has_content = raw_df.astype(str).sum(axis=1).str.strip() != ''
    clean_df = raw_df[has_content].copy()

    # 3. Exclude repeated table header rows (e.g., "Date and Time", "Description", etc.)
    is_header = (
        clean_df['Date and Time'].str.contains('Date', case=False, na=False) |
        clean_df['Description'].str.contains('Description', case=False, na=False)
    )

    # Apply mask: Keep content that is NOT a header and NOT page noise
    return clean_df[~is_header].reset_index(drop=True)

def mutate(df: pd.DataFrame) -> pd.DataFrame:
    # strip whitespace and collapse inner newlines of column names ONLY on actual string headers
    # df.columns = [' '.join(str(col).split()) if pd.notna(col) else col for col in df.columns]

    if 'Date and Time' in df.columns:
        date_series = pd.to_datetime(df['Date and Time'], format='%Y-%m-%d %I:%M %p', errors='coerce').dt.tz_localize('Asia/Manila')
    else:
        date_series = pd.NaT

    if "Reference No." in df.columns:
        # Strip trailing '.0' from float conversions, pad digits up to 13, set nulls/empty to 'N/A'
        ref = df["Reference No."].astype(str).str.replace(r'\.0$', '', regex=True).str.strip()
        ref = ref.replace({'nan': 'N/A', 'None': 'N/A', '': 'N/A'})
        
        # Apply zfill only to numeric strings
        is_numeric = ref.str.isnumeric()
        ref.loc[is_numeric] = ref.loc[is_numeric].str.zfill(13)
        ref_series = ref
    else:
        ref_series = pd.Series('N/A', index=df.index)

    financials = {}
    for col in ['Debit', 'Credit']:
        target_key = col.lower()
        if col in df.columns:
            financials[target_key] = pd.to_numeric(df[col], errors='coerce')
        else:
            financials[target_key] = None

    desc_series = pd.Series('', index=df.index)

    # There is two rows of headers, with the second row having only "Starting Balance"
    # and said header is placed  between "Date & Time" and "Description", but not on the same row as them
    # PDF Reader confuses the space beside "Description" as another column, hence "Unnamed: 0"
    if 'Unnamed: 0' in df.columns:
        desc_series = df['Unnamed: 0'].fillna('')
    if 'Description' in df.columns:
        # Combine or fallback to 'Description' column
        desc_series = desc_series.replace('', np.nan).fillna(df['Description']).fillna('')
        
    # Clean multi-line text artifacts inside description strings
    clean_desc = desc_series.astype(str).str.replace(r'\s+', ' ', regex=True).str.strip()

    # Construct final DataFrame at once to avoid fragmentation
    return pd.DataFrame({
        'date': date_series,
        'referenceNumber': ref_series,
        'debit': financials['debit'],
        'credit': financials['credit'],
        'description': clean_desc
    }, index=df.index)