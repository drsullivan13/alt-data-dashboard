# Natural Language Query - Usage Guide

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to http://localhost:3000

3. **Try a query:**
   - Type in the search box: "Show correlation between job postings and price for AAPL"
   - Click "Search" or press Enter
   - Watch as the AI parses your query and updates the chart

## UI Components

### Search Bar
```
┌─────────────────────────────────────────────────────┐
│ Ask a question in natural language...       [Search]│
└─────────────────────────────────────────────────────┘
```
- Large input field at the top
- Blue "Search" button (disabled when empty)
- Shows "Analyzing..." while processing

### Example Queries
```
Try: [Show correlation between job...] [Compare Reddit sentiment...]
     [Does Twitter engagement...] [Show me employment signals...]
```
- Clickable pill-shaped buttons
- Auto-fills and submits the query
- Helps users understand query format

### Current Query Display
```
┌─────────────────────────────────────────────────────┐
│ Current query: AAPL | job_posts vs price | Since... │
└─────────────────────────────────────────────────────┘
```
- Blue background badge
- Shows parsed parameters
- Appears after successful query

### Error Messages
```
┌─────────────────────────────────────────────────────┐
│ Error:                                              │
│ Invalid ticker. Available: AAPL, AMZN, DELL...     │
└─────────────────────────────────────────────────────┘
```
- Red background for visibility
- Clear error explanation
- Suggestions for fixing the issue

## Query Examples by Use Case

### 1. Job Market Signals (Single Stock)
```
Show correlation between job postings and price for AAPL
Do hiring trends predict META stock performance?
GOOGL job posts vs stock price since 2024
```

### 2. Job Market Signals (Multi-Stock) NEW
```
Compare AAPL, MSFT, and GOOGL job postings vs price
Which has stronger hiring signals: META or GOOGL?
Compare hiring trends for TSLA vs NVDA
```

### 3. Social Media Sentiment (Single Stock)
```
Does Twitter engagement predict NVDA stock movement?
Show me stocktwits sentiment correlation with UBER price
```

### 4. Social Media Sentiment (Multi-Stock) NEW
```
Compare TSLA vs NVDA Reddit sentiment
How do AAPL and MSFT differ on Twitter mentions?
Compare Reddit buzz: META vs GOOGL
```

### 5. Employee Growth
```
Show employee count vs price for META
Does LinkedIn headcount predict stock price for MSFT?
Compare employee growth for AAPL vs GOOGL
```

### 6. AI Scores
```
Show AI employment score vs price for TSLA
Does overall AI score correlate with AAPL stock?
Compare employment AI signals: TSLA vs NVDA
```

### 7. News and Media
```
Show news mentions correlation with NVDA price
Compare news coverage for AAPL vs MSFT
News mentions vs price for multiple tech stocks
```

## Tips for Better Results

### ✅ Good Queries
- **Specific**: "Show AAPL job postings vs price"
- **Clear metrics**: "Compare Reddit sentiment and stock price for TSLA"
- **Include ticker**: "Does Twitter engagement predict NVDA stock?"
- **Date ranges**: "META employment vs price since 2024"
- **Multi-stock (2-3 tickers)**: "Compare TSLA vs NVDA Reddit sentiment"
- **Up to 3 stocks**: "Compare AAPL, MSFT, and GOOGL job postings"

### ❌ Queries to Avoid
- **Too vague**: "Show me some data"
- **Too many tickers**: "Compare AAPL, TSLA, NVDA, and MSFT" (max 3)
- **Invalid metrics**: "Show market cap vs volume" (market cap not in metrics)
- **Typos in tickers**: "AAL" instead of "AAPL"

## Understanding the Results

### Correlation Score
- **+0.7 to +1.0**: 🟢 Strong positive correlation
- **+0.3 to +0.7**: 🟡 Moderate positive correlation
- **-0.3 to +0.3**: ⚪ Weak/no correlation
- **-0.7 to -0.3**: 🟡 Moderate negative correlation
- **-1.0 to -0.7**: 🔴 Strong negative correlation

### Single-Stock Chart
- **X-axis**: First metric (e.g., job_posts)
- **Y-axis**: Second metric (e.g., price)
- **Each point**: One day's data
- **Hover**: Shows date and exact values
- **Color**: Blue points

### Multi-Stock Chart (NEW)
- **X-axis**: First metric (e.g., reddit_sentiment)
- **Y-axis**: Second metric (e.g., price)
- **Colors**: Blue, Red, Green (one per stock)
- **Legend**: Shows each ticker with its correlation coefficient
- **Hover**: Shows ticker, date, and exact values
- **Correlation per stock**: Displayed below chart for easy comparison

## Troubleshooting

### "Failed to parse query"
**Problem**: AI couldn't understand the query
**Solution**: Try an example query or rephrase using simpler language

### "Invalid ticker"
**Problem**: Ticker not in database
**Solution**: Use one of: AAPL, AMZN, DELL, GOOGL, JNJ, META, MSFT, NKE, NVDA, TSLA, UBER, V

### "For chart readability, please limit comparisons to 3 stocks" (NEW)
**Problem**: Query requested more than 3 tickers
**Solution**: The error message will suggest the first 3 tickers. Use those or choose a different set of 3.

### "No data found"
**Problem**: Date range has no data or metrics are null
**Solution**: Try a different date range or remove date filters

### "Insufficient data points"
**Problem**: Less than 2 valid data points
**Solution**: Check if the metrics have data for this ticker

## Advanced Features

### Date Filtering
```
"since 2024"           → startDate: 2024-01-01
"from January 2024"    → startDate: 2024-01-01
"until December 2024"  → endDate: 2024-12-31
"from 2023 to 2024"    → both dates set
```

### Metric Aliases
The AI understands various phrasings:
- "job posts" / "jobs" / "hiring" → `job_posts`
- "stock price" / "share price" → `price`
- "reddit" / "reddit mentions" → `reddit_mentions`
- "employees" / "headcount" → `employees_linkedin`
- "sentiment" (from reddit) → `reddit_sentiment`

### Confidence Levels
- **High**: Clear, unambiguous query
- **Medium**: Some interpretation needed
- **Low**: Query is ambiguous (may need refinement)

## Testing

Run the test suite:
```bash
npm run dev  # In one terminal
node test-api.js  # In another terminal
```

This tests all example queries end-to-end.

## For Developers

### Adding New Metrics
1. Add to `VALID_METRICS` in `src/types/query.ts`
2. Add aliases to `METRIC_ALIASES`
3. Update prompt in `src/app/api/parse-query/route.ts`
4. Update this guide

### Adding New Tickers
1. Import data to Supabase (see `scripts/import_data.py`)
2. Add to `VALID_TICKERS` in `src/types/query.ts`
3. Tickers are automatically available

### Customizing the Prompt
Edit `SYSTEM_PROMPT` in `src/app/api/parse-query/route.ts` to:
- Change parsing behavior
- Add new metric mappings
- Adjust confidence scoring
- Support new query types

## Interview Talking Points

When presenting this feature:

1. **Technical Skills**:
   - LLM integration (Anthropic Claude)
   - API design and error handling
   - React state management
   - TypeScript type safety

2. **User Experience**:
   - Progressive enhancement
   - Loading states
   - Error recovery
   - Visual feedback

3. **Product Thinking**:
   - Example queries for discoverability
   - Graceful degradation
   - Clear error messages
   - Accessible interface

4. **Future Roadmap**:
   - Voice input
   - Query history
   - Multi-ticker analysis
   - Saved favorites
