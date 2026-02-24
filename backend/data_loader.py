"""
AeroStream Command Center — Dataset Downloader
Downloads Kaggle datasets, converts CSV → Parquet, and loads into DuckDB.
Parquet gives 5-10x faster reads and 70-80% smaller file size.
"""

import os
import glob
import duckdb

def download_and_locate_datasets() -> dict:
    """
    Download Kaggle datasets and return paths to data files.
    Converts CSV → Parquet on first load for optimal DuckDB performance.
    """
    paths = {
        "flight_delay_2024": None,
        "indian_domestic": None
    }
    
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # 1. Check for Parquet files first (fastest)
    parquet_files = glob.glob(os.path.join(data_dir, "*.parquet"))
    if parquet_files:
        print(f"[DATA] Found {len(parquet_files)} Parquet files (optimized):")
        for pf in parquet_files:
            print(f"  → {pf}")
            name = os.path.basename(pf).lower()
            if "delay" in name or "flight_data" in name or "2024" in name:
                paths["flight_delay_2024"] = pf
            elif "indian" in name or "domestic" in name:
                paths["indian_domestic"] = pf
        
        if paths["flight_delay_2024"] and paths["indian_domestic"]:
            return paths
    
    # 2. Check for CSV files and convert to Parquet
    local_csvs = glob.glob(os.path.join(data_dir, "*.csv"))
    if local_csvs:
        print(f"[DATA] Found {len(local_csvs)} CSV files. Converting to Parquet...")
        for csv_path in local_csvs:
            parquet_path = csv_path.replace(".csv", ".parquet")
            if not os.path.exists(parquet_path):
                _convert_csv_to_parquet(csv_path, parquet_path)
            
            name = os.path.basename(parquet_path).lower()
            if "delay" in name or "flight_data" in name or "2024" in name:
                paths["flight_delay_2024"] = parquet_path
            elif "indian" in name or "domestic" in name:
                paths["indian_domestic"] = parquet_path
        
        if paths["flight_delay_2024"] or paths["indian_domestic"]:
            return paths
    
    # 3. Download via kagglehub
    try:
        import kagglehub
        
        # Dataset 1: Flight Delay Dataset 2024
        try:
            print("[DATA] Downloading Flight Delay Dataset 2024...")
            path1 = kagglehub.dataset_download("hrishitpatil/flight-data-2024")
            print(f"[DATA] Downloaded to: {path1}")
            
            csvs = glob.glob(os.path.join(path1, "**/*.csv"), recursive=True)
            if csvs:
                # Convert to Parquet in our data/ directory
                parquet_path = os.path.join(data_dir, "flight_delay_2024.parquet")
                _convert_csv_to_parquet(csvs[0], parquet_path)
                paths["flight_delay_2024"] = parquet_path
        except Exception as e:
            print(f"[DATA] Error downloading Flight Delay 2024: {e}")
        
        # Dataset 2: Indian Domestic Airlines
        try:
            print("[DATA] Downloading Indian Domestic Airlines Dataset...")
            path2 = kagglehub.dataset_download("kabil007/indian-domestic-airline-dataset")
            print(f"[DATA] Downloaded to: {path2}")
            
            csvs = glob.glob(os.path.join(path2, "**/*.csv"), recursive=True)
            if csvs:
                parquet_path = os.path.join(data_dir, "indian_domestic.parquet")
                _convert_csv_to_parquet(csvs[0], parquet_path)
                paths["indian_domestic"] = parquet_path
        except Exception as e:
            print(f"[DATA] Error downloading Indian Domestic: {e}")
    
    except ImportError:
        print("[DATA] kagglehub not installed. Install with: pip install kagglehub")
    
    return paths


def _convert_csv_to_parquet(csv_path: str, parquet_path: str):
    """
    Convert a CSV file to Parquet using DuckDB.
    Parquet = columnar + compressed = much faster analytical reads.
    """
    try:
        csv_clean = csv_path.replace("\\", "/")
        parquet_clean = parquet_path.replace("\\", "/")
        
        conn = duckdb.connect()
        
        # Get original CSV size
        csv_size_mb = os.path.getsize(csv_path) / (1024 * 1024)
        
        # Convert using DuckDB (handles encoding/types automatically)
        conn.execute(f"""
            COPY (
                SELECT * FROM read_csv_auto('{csv_clean}', ignore_errors=true)
            ) TO '{parquet_clean}' (FORMAT PARQUET, COMPRESSION 'SNAPPY')
        """)
        
        conn.close()
        
        # Get parquet size
        parquet_size_mb = os.path.getsize(parquet_path) / (1024 * 1024)
        reduction = (1 - parquet_size_mb / csv_size_mb) * 100 if csv_size_mb > 0 else 0
        
        print(f"[DATA] ✅ Converted: {os.path.basename(csv_path)}")
        print(f"  CSV:     {csv_size_mb:.1f} MB")
        print(f"  Parquet: {parquet_size_mb:.1f} MB ({reduction:.0f}% smaller)")
        
    except Exception as e:
        print(f"[DATA] ⚠️ Parquet conversion failed for {csv_path}: {e}")
        print(f"[DATA] Will use CSV directly as fallback.")
