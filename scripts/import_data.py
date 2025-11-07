"""
Alternative Data Import Pipeline
Loads Excel files into Supabase for the Alternative Data Intelligence Dashboard
"""

import pandas as pd
import os
from supabase import create_client, Client
from datetime import datetime
import sys
import numpy as np


# Configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_KEY environment variables")
    print("Example: export SUPABASE_URL='https://your-project.supabase.co'")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Stock tickers to process
TICKERS = ['AAPL', 'AMZN', 'DELL', 'GOOGL', 'JNJ', 'META', 'MSFT', 'NKE', 'NVDA', 'TSLA', 'UBER', 'V']

# Directory containing Excel files
DATA_DIR = os.environ.get('DATA_DIRECTORY')

# Column mapping from Excel to database
COLUMN_MAPPING = {
    'date': 'date',
    'financials_price': 'price',
    'financials_market_cap': 'market_cap',
    'financials_pe_ratio': 'pe_ratio',
    'financials_analyst_target_price': 'analyst_target_price',
    'financials_target_price': 'target_price',
    'financials_buy_ratio': 'buy_ratio',
    'financials_shares_outstanding': 'shares_outstanding',
    'reddit_mentions': 'reddit_mentions',
    'reddit_sentiment': 'reddit_sentiment',
    'twitter_mentions': 'twitter_mentions',
    'twitter_followers': 'twitter_followers',
    'stocktwits_mentions': 'stocktwits_mentions',
    'stocktwits_sentiment': 'stocktwits_sentiment',
    'stocktwits_subscribers': 'stocktwits_subscribers',
    '4chan_mentions': 'mentions_4chan',
    'news_mentions': 'news_mentions',
    'instagram_followers': 'instagram_followers',
    'youtube_subscribers': 'youtube_subscribers',
    'total_followers': 'total_followers',
    'job_posts': 'job_posts',
    'jobs_linkedin': 'jobs_linkedin',
    'jobs_glassdoor': 'jobs_glassdoor',
    'employees': 'employees',
    'employees_linkedin': 'employees_linkedin',
    'ai_scores_score': 'ai_score_overall',
    'ai_scores_customer': 'ai_score_customer',
    'ai_scores_employment': 'ai_score_employment',
    'ai_scores_fundamental': 'ai_score_fundamental',
    'ai_scores_audience': 'ai_score_audience',
    'sentiment': 'sentiment',
    'google_trend': 'google_trend',
    'customer_reviews': 'customer_reviews',
    'bitrank': 'bitrank',
    'tipranks_score': 'tipranks_score',
    'tipranks_sentiment': 'tipranks_sentiment',
    'tipranks_followers_total': 'tipranks_followers_total',
    'price_prediction': 'price_prediction',
}

INTEGER_COLUMNS = [
    'reddit_mentions', 'twitter_mentions', 'stocktwits_mentions', 
    'mentions_4chan', 'news_mentions', 'stocktwits_subscribers',
    'job_posts', 'jobs_linkedin', 'jobs_glassdoor', 'employees', 'employees_linkedin'
]

BIGINT_COLUMNS = [
    'market_cap', 'shares_outstanding', 'twitter_followers', 
    'instagram_followers', 'youtube_subscribers', 'total_followers', 
    'tipranks_followers_total'
]

def process_ticker(ticker: str) -> int:
    """Process a single ticker's Excel file and upload to Supabase"""
    print(f"\n{'='*60}")
    print(f"Processing {ticker}...")
    print(f"{'='*60}")
    
    file_path = os.path.join(DATA_DIR, f'{ticker}.xlsx')
    
    if not os.path.exists(file_path):
        print(f"  ❌ File not found: {file_path}")
        return 0
    
    # Load Excel file
    df = pd.read_excel(file_path)
    print(f"  📊 Loaded {len(df)} rows from Excel")
    
    # Build clean dataframe - add mapped columns FIRST
    df_clean = pd.DataFrame()
    
    for excel_col, db_col in COLUMN_MAPPING.items():
        if excel_col in df.columns:
            df_clean[db_col] = df[excel_col].values
    
    # Add ticker LAST (broadcasts to all rows)
    df_clean['ticker'] = ticker
    
    # Convert date
    df_clean['date'] = pd.to_datetime(df_clean['date']).dt.strftime('%Y-%m-%d')
    
    # Remove duplicates - keep the last occurrence for each ticker+date combination
    initial_count = len(df_clean)
    df_clean = df_clean.drop_duplicates(subset=['ticker', 'date'], keep='last')
    if len(df_clean) < initial_count:
        print(f"  ⚠️  Removed {initial_count - len(df_clean)} duplicate date entries")
    
    # Cast integer columns - convert to nullable Int64 dtype
    for col in INTEGER_COLUMNS:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').astype('Int64')
    
    for col in BIGINT_COLUMNS:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').astype('Int64')
    
    # Clip decimal values
    if 'buy_ratio' in df_clean.columns:
        df_clean['buy_ratio'] = pd.to_numeric(df_clean['buy_ratio'], errors='coerce').clip(upper=99.9999)
    
    sentiment_cols = ['reddit_sentiment', 'stocktwits_sentiment', 'ai_score_overall', 
                      'ai_score_customer', 'ai_score_employment', 'ai_score_fundamental', 
                      'ai_score_audience', 'sentiment', 'tipranks_score', 'tipranks_sentiment']
    for col in sentiment_cols:
        if col in df_clean.columns:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').clip(upper=99.999999)
    
    # Convert to records FIRST
    records = df_clean.to_dict('records')
    
    # CRITICAL FIX: Convert ALL NaN/inf/pd.NA values to None in the records
    # This must happen after to_dict to catch all problematic values
    for record in records:
        for key, value in list(record.items()):
            # Handle pandas NA (from Int64 dtype)
            if pd.isna(value):
                record[key] = None
            # Handle float NaN and inf
            elif isinstance(value, float) and (np.isnan(value) or np.isinf(value)):
                record[key] = None
            # Handle numpy int64 - convert to Python int
            elif isinstance(value, (np.integer, np.int64)):
                record[key] = int(value)
    
    print(f"  🔄 Prepared {len(records)} records for upload")
    
    # Upload in batches
    BATCH_SIZE = 1000
    total_uploaded = 0
    
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i+BATCH_SIZE]
        try:
            response = supabase.table('stock_metrics').upsert(
                batch,
                on_conflict='ticker,date'
            ).execute()
            total_uploaded += len(batch)
            print(f"  ✅ Uploaded batch {i//BATCH_SIZE + 1} ({len(batch)} records)")
        except Exception as e:
            print(f"  ❌ Error uploading batch: {str(e)}")
            raise
    
    print(f"  🎉 Successfully uploaded {total_uploaded} records for {ticker}")
    return total_uploaded

def main():
    """Main import pipeline"""
    print("\n" + "="*60)
    print("ALTERNATIVE DATA IMPORT PIPELINE")
    print("="*60)
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Tickers to process: {', '.join(TICKERS)}")
    print(f"Data directory: {DATA_DIR}")
    
    total_records = 0
    successful_tickers = []
    failed_tickers = []
    
    for ticker in TICKERS:
        try:
            records = process_ticker(ticker)
            total_records += records
            successful_tickers.append(ticker)
        except Exception as e:
            print(f"\n❌ FAILED to process {ticker}: {str(e)}")
            failed_tickers.append(ticker)
    
    # Summary
    print("\n" + "="*60)
    print("IMPORT SUMMARY")
    print("="*60)
    print(f"✅ Successful: {len(successful_tickers)}/{len(TICKERS)} tickers")
    print(f"   {', '.join(successful_tickers)}")
    if failed_tickers:
        print(f"❌ Failed: {len(failed_tickers)} tickers")
        print(f"   {', '.join(failed_tickers)}")
    print(f"📊 Total records imported: {total_records:,}")
    print("\n🎉 Data pipeline complete!")
    
    # Verification query
    print("\n" + "="*60)
    print("VERIFICATION")
    print("="*60)
    result = supabase.table('stock_metrics').select('ticker', count='exact').execute()
    print(f"Records in database: {result.count:,}")

if __name__ == '__main__':
    main()