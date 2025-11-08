# Natural Language Query Interface

## Overview
The Alternative Data Intelligence Dashboard supports natural language queries powered by Claude (Anthropic API). Users can ask questions in plain English instead of manually selecting parameters. Results can be viewed in two modes: Correlation View (scatter plot) or Trend View (time-series with dual Y-axes).

## Features

### 1. Natural Language Input
- **Search Box**: Large, prominent search input at the top of the dashboard
- **Example Queries**: Clickable buttons with pre-written examples
- **Real-time Parsing**: Queries are parsed using Claude Haiku 4.5
- **Loading States**: Visual feedback during parsing and data fetching

### 2. Query Parsing
- Extracts ticker symbols (single: AAPL, or multiple: TSLA, NVDA)
- **Multi-stock support**: Compare up to 3 stocks simultaneously
- Identifies metrics to correlate (job_posts, price, sentiment, etc.)
- Detects date ranges ("since 2024", "from January 2024")
- Validates all parameters against available data

### 3. Dual Visualization Modes (NEW)
- **Correlation View**: Scatter plot showing metric relationships
- **Trend View**: Time-series with dual Y-axes for temporal analysis
- Toggle between views with pill-shaped buttons
- Trend View requires price as one of the metrics
- View mode persists across query changes

### 4. Error Handling
- Clear error messages for invalid queries
- Suggestions for rephrasing
- **3-ticker limit enforcement**: Helpful error when exceeding limit
- Graceful fallback to default view

## Available Tickers
AAPL, AMZN, DELL, GOOGL, JNJ, META, MSFT, NKE, NVDA, TSLA, UBER, V

## Available Metrics
- `price` - Stock price
- `job_posts` - Job postings count
- `reddit_mentions` - Reddit mentions
- `twitter_mentions` - Twitter/X mentions  
- `reddit_sentiment` - Reddit sentiment score
- `twitter_followers` - Twitter follower count
- `employees_linkedin` - LinkedIn employee count
- `ai_score_employment` - AI employment signal
- `ai_score_overall` - Overall AI score
- `stocktwits_sentiment` - StockTwits sentiment
- `news_mentions` - News article mentions

## Example Queries

### Single Stock Correlations
```
Show correlation between job postings and price for AAPL
Does Twitter engagement predict NVDA stock movement?
How do job posts relate to AAPL stock price?
Show NVDA employee count vs stock price
```

### Multi-Stock Comparisons (NEW)
```
Compare TSLA vs NVDA Reddit sentiment
Compare AAPL, MSFT, and GOOGL job postings vs price
How do TSLA and NVDA differ on Twitter mentions?
Compare hiring trends for META vs GOOGL
```

### With Date Filters
```
Show me employment signals vs price for META since 2024
GOOGL job postings correlation with price from January 2024
Compare TSLA vs NVDA Reddit sentiment since 2024
Analyze UBER Twitter sentiment vs price since 2023
```

### Natural Language Variations
```
Is there a connection between Reddit buzz and TSLA price?
Do hiring trends predict META stock performance?
Which has better Twitter engagement: AAPL or MSFT?
```

## API Endpoints

### POST /api/parse-query
Parses natural language queries into structured parameters.

**Single Stock Request:**
```json
{
  "query": "Show correlation between job postings and price for AAPL"
}
```

**Single Stock Response:**
```json
{
  "success": true,
  "parsed": {
    "ticker": "AAPL",
    "metricX": "job_posts",
    "metricY": "price",
    "startDate": "2024-01-01"
  },
  "confidence": "high"
}
```

**Multi-Stock Request:**
```json
{
  "query": "Compare TSLA vs NVDA Reddit sentiment"
}
```

**Multi-Stock Response:**
```json
{
  "success": true,
  "parsed": {
    "tickers": ["TSLA", "NVDA"],
    "metricX": "reddit_sentiment",
    "metricY": "price"
  },
  "confidence": "high"
}
```

### POST /api/correlation
Fetches correlation data for a single stock.

**Request:**
```json
{
  "ticker": "AAPL",
  "metricX": "job_posts",
  "metricY": "price",
  "startDate": "2024-01-01"
}
```

### POST /api/compare (NEW)
Fetches correlation data for multiple stocks in parallel.

**Request:**
```json
{
  "tickers": ["TSLA", "NVDA"],
  "metricX": "reddit_sentiment",
  "metricY": "price",
  "startDate": "2024-01-01"
}
```

**Response:**
```json
{
  "success": true,
  "metricX": "reddit_sentiment",
  "metricY": "price",
  "results": [
    {
      "ticker": "NVDA",
      "correlation": 0.7234,
      "dataPoints": 245,
      "data": [...]
    },
    {
      "ticker": "TSLA",
      "correlation": 0.5612,
      "dataPoints": 248,
      "data": [...]
    }
  ]
}
```

## Architecture

### Components
- **CorrelationChart** (`src/app/components/CorrelationChart.tsx`)
  - Search input with form submission
  - Example query buttons
  - Current query display
  - Error messaging
  - Loading states for both parsing and data fetching
  - Chart visualization with Chart.js

### API Routes
- **parse-query** (`src/app/api/parse-query/route.ts`)
  - Anthropic API integration
  - Query validation
  - Metric mapping and aliasing
  - Date extraction

- **correlation** (`src/app/api/correlation/route.ts`)
  - Supabase data fetching
  - Pearson correlation calculation
  - Data transformation for Chart.js

### Type Definitions
- **query.ts** (`src/types/query.ts`)
  - TypeScript interfaces for parsed queries
  - Valid tickers and metrics constants
  - Metric aliases for natural language mapping

## Environment Variables
Required in `.env.local`:
```bash
ANTHROPIC_API_KEY=your_anthropic_key
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Prompt Engineering

The system prompt for Claude includes:
1. List of valid tickers and metrics
2. Metric descriptions and aliases
3. Expected JSON output format
4. Rules for mapping natural language to database columns
5. Date parsing guidelines
6. Confidence scoring logic

## Error Recovery

The interface handles:
- **Invalid tickers**: Suggests valid tickers
- **Unknown metrics**: Shows available metrics
- **Ambiguous queries**: Requests clarification
- **Missing data**: Falls back to default view
- **API failures**: User-friendly error messages

## User Experience Highlights

1. **Progressive Enhancement**: Default chart loads immediately, search enhances functionality
2. **Dual Visualization Modes**: Toggle between Correlation and Trend views
3. **Visual Feedback**: Loading spinners during both parsing and data fetching
4. **Current Query Display**: Shows parsed parameters in blue badge
5. **Correlation Interpretation**: Emoji indicators for correlation strength
6. **Temporal Analysis**: Trend View shows how metrics evolve over time
7. **Smart Validation**: Trend View automatically disabled when price not included
8. **Responsive Design**: Works on desktop and mobile

## Visualization Features

### Correlation View
- Scatter plot with each point representing one day
- X-axis: First metric (e.g., job_posts)
- Y-axis: Second metric (e.g., price)
- Shows strength of relationship between metrics
- Available for all metric combinations

### Trend View (NEW)
- Time-series line chart with dual Y-axes
- **Left Y-axis**: Stock price (blue line for single stock)
- **Right Y-axis**: Alternative metric (green line for single stock)
- **X-axis**: Date (chronological)
- **Multi-Stock**: Different colors per stock
  - Price lines: Blue, Red, Purple
  - Metric lines: Green, Yellow, Teal
- **Requirement**: One metric must be `price`
- Shows temporal patterns and trends
- Interactive tooltip with date and values

## Limitations

### 3-Ticker Maximum
For chart readability, multi-stock comparisons are limited to 3 tickers. Queries with more than 3 tickers will return a helpful error message suggesting the first 3.

### Backwards Compatibility
Single-stock queries use the existing `/api/correlation` endpoint, while multi-stock queries use the new `/api/compare` endpoint. This ensures no breaking changes to existing functionality.

## Future Enhancements

Potential improvements:
- Voice input support
- Query history and favorites
- More than 3 stocks (with tabbed or paginated interface)
- Advanced statistical analysis requests
- Export/share query results
- Query auto-suggestions as you type
- Comparative analysis insights (e.g., "TSLA has stronger correlation than NVDA")
