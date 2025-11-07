# Natural Language Query Interface

## Overview
The Alternative Data Intelligence Dashboard now supports natural language queries powered by Claude (Anthropic API). Users can ask questions in plain English instead of manually selecting parameters.

## Features

### 1. Natural Language Input
- **Search Box**: Large, prominent search input at the top of the dashboard
- **Example Queries**: Clickable buttons with pre-written examples
- **Real-time Parsing**: Queries are parsed using Claude Sonnet 4
- **Loading States**: Visual feedback during parsing and data fetching

### 2. Query Parsing
- Extracts ticker symbols (AAPL, TSLA, etc.)
- Identifies metrics to correlate (job_posts, price, sentiment, etc.)
- Detects date ranges ("since 2024", "from January 2024")
- Validates all parameters against available data

### 3. Error Handling
- Clear error messages for invalid queries
- Suggestions for rephrasing
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

### Basic Correlations
```
Show correlation between job postings and price for AAPL
Compare Reddit sentiment vs stock price for TSLA
Does Twitter engagement predict NVDA stock movement?
```

### With Date Filters
```
Show me employment signals vs price for META since 2024
GOOGL job postings correlation with price from January 2024
Analyze UBER Twitter sentiment vs price since 2023
```

### Natural Language Variations
```
How do job posts relate to AAPL stock price?
Is there a connection between Reddit buzz and TSLA price?
Do hiring trends predict META stock performance?
Show NVDA employee count vs stock price
```

## API Endpoints

### POST /api/parse-query
Parses natural language queries into structured parameters.

**Request:**
```json
{
  "query": "Show correlation between job postings and price for AAPL"
}
```

**Response:**
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

### POST /api/correlation
Fetches correlation data (existing endpoint, now used by NL interface).

**Request:**
```json
{
  "ticker": "AAPL",
  "metricX": "job_posts",
  "metricY": "price",
  "startDate": "2024-01-01"
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
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
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
2. **Visual Feedback**: Loading spinners during both parsing and data fetching
3. **Current Query Display**: Shows parsed parameters in blue badge
4. **Correlation Interpretation**: Emoji indicators for correlation strength
5. **Responsive Design**: Works on desktop and mobile

## Future Enhancements

Potential improvements:
- Voice input support
- Query history and favorites
- Multi-ticker comparisons
- Advanced statistical analysis requests
- Export/share query results
- Query auto-suggestions as you type
