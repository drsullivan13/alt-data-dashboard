# Architecture - Natural Language Query System

## System Overview

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ Types query
       ▼
┌──────────────────────────────────────────┐
│  CorrelationChart Component              │
│  - Search input                          │
│  - Example queries                       │
│  - Loading states                        │
│  - Error handling                        │
└──────┬───────────────────────────────────┘
       │
       │ POST { query }
       ▼
┌──────────────────────────────────────────┐
│  /api/parse-query                        │
│  - Validates input                       │
│  - Calls Anthropic API                   │
│  - Parses JSON response                  │
│  - Validates parameters                  │
└──────┬───────────────────────────────────┘
       │
       │ Calls Claude API
       ▼
┌──────────────────────────────────────────┐
│  Anthropic Claude Sonnet 4               │
│  - Receives system prompt                │
│  - Analyzes natural language             │
│  - Extracts structured data              │
│  - Returns JSON                          │
└──────┬───────────────────────────────────┘
       │
       │ Returns { ticker, metricX, metricY, dates }
       ▼
┌──────────────────────────────────────────┐
│  CorrelationChart Component              │
│  - Displays parsed params                │
│  - Calls correlation API                 │
└──────┬───────────────────────────────────┘
       │
       │ POST { ticker, metricX, metricY, startDate }
       ▼
┌──────────────────────────────────────────┐
│  /api/correlation                        │
│  - Validates parameters                  │
│  - Queries Supabase                      │
│  - Calculates correlation                │
│  - Returns chart data                    │
└──────┬───────────────────────────────────┘
       │
       │ SQL Query
       ▼
┌──────────────────────────────────────────┐
│  Supabase (PostgreSQL)                   │
│  - stock_metrics table                   │
│  - 12 tickers × 1000 rows                │
│  - 11 metrics per row                    │
└──────┬───────────────────────────────────┘
       │
       │ Returns data points
       ▼
┌──────────────────────────────────────────┐
│  CorrelationChart Component              │
│  - Formats data for Chart.js             │
│  - Renders scatter plot                  │
│  - Shows correlation score               │
└──────────────────────────────────────────┘
```

## Component Hierarchy

```
App (page.tsx)
└── CorrelationChart.tsx
    ├── Search Interface
    │   ├── Input field
    │   ├── Search button
    │   └── Example query buttons
    ├── Current Query Badge
    ├── Error Message Display
    └── Chart Display
        └── Chart.js Scatter Plot
```

## Data Flow Sequence

### Successful Query Flow
```
1. User types: "Show correlation between job postings and price for AAPL"

2. Component state:
   - setQuery("Show correlation...")
   - setIsParsingQuery(true)

3. POST /api/parse-query
   Request: { query: "Show correlation..." }

4. Anthropic API call
   System prompt + user query → Claude

5. Response from Claude:
   {
     "ticker": "AAPL",
     "metricX": "job_posts",
     "metricY": "price",
     "confidence": "high"
   }

6. Validation:
   - ticker in VALID_TICKERS? ✓
   - metricX in VALID_METRICS? ✓
   - metricY in VALID_METRICS? ✓

7. Response to client:
   { success: true, parsed: {...}, confidence: "high" }

8. Component state:
   - setIsParsingQuery(false)
   - setLoading(true)
   - setCurrentQuery(parsed)

9. POST /api/correlation
   Request: { ticker: "AAPL", metricX: "job_posts", metricY: "price" }

10. Supabase query:
    SELECT date, job_posts, price
    FROM stock_metrics
    WHERE ticker = 'AAPL'
    ORDER BY date ASC

11. Calculate correlation:
    Pearson coefficient from data points

12. Response to client:
    {
      success: true,
      ticker: "AAPL",
      metricX: "job_posts",
      metricY: "price",
      correlation: 0.85,
      dataPoints: 1020,
      data: [...]
    }

13. Component state:
    - setData(correlationResult)
    - setLoading(false)

14. Chart renders with new data
```

### Error Flow
```
1. User types: "Show data for XYZ"

2. POST /api/parse-query

3. Claude returns:
   { "ticker": "XYZ", "metricX": "price", "metricY": "job_posts" }

4. Validation fails:
   - "XYZ" not in VALID_TICKERS ✗

5. Response to client:
   {
     success: false,
     error: "Invalid ticker. Available: AAPL, AMZN...",
     suggestions: [...]
   }

6. Component state:
   - setError(errorMessage)
   - setIsParsingQuery(false)

7. Error displayed in red box
```

## File Structure

```
alt-data-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── parse-query/
│   │   │   │   └── route.ts          # NL query parser
│   │   │   └── correlation/
│   │   │       └── route.ts          # Data fetcher
│   │   ├── components/
│   │   │   └── CorrelationChart.tsx  # Main UI component
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── supabase.ts               # Supabase client
│   └── types/
│       └── query.ts                   # TypeScript types
├── .env.local                         # Environment variables
├── NATURAL_LANGUAGE_QUERIES.md        # Feature docs
├── USAGE_GUIDE.md                     # User guide
├── ARCHITECTURE.md                    # This file
├── DEPLOYMENT_CHECKLIST.md            # Pre-deployment checks
└── test-api.js                        # API test script
```

## Technology Stack

### Frontend
- **React 19.2.0**: UI components
- **Next.js 16.0.1**: Framework and API routes
- **TypeScript 5**: Type safety
- **Tailwind CSS 4**: Styling
- **Chart.js 4.5.1**: Data visualization
- **react-chartjs-2**: React wrapper for Chart.js

### Backend
- **Next.js API Routes**: Serverless functions
- **Anthropic SDK 0.68.0**: Claude AI integration
- **Supabase Client 2.80.0**: Database queries
- **PostgreSQL**: Data storage

### AI/ML
- **Claude Sonnet 4**: Natural language parsing
- **Pearson Correlation**: Statistical analysis

## API Contracts

### POST /api/parse-query

**Request:**
```typescript
{
  query: string  // Natural language query
}
```

**Success Response (200):**
```typescript
{
  success: true,
  parsed: {
    ticker: string,        // e.g., "AAPL"
    metricX: string,       // e.g., "job_posts"
    metricY: string,       // e.g., "price"
    startDate?: string,    // e.g., "2024-01-01"
    endDate?: string       // e.g., "2024-12-31"
  },
  confidence: "high" | "medium" | "low"
}
```

**Error Response (400/500):**
```typescript
{
  success: false,
  error: string,           // Human-readable error
  suggestions?: string[]   // Helpful suggestions
}
```

### POST /api/correlation

**Request:**
```typescript
{
  ticker: string,
  metricX: string,
  metricY: string,
  startDate?: string,
  endDate?: string
}
```

**Success Response (200):**
```typescript
{
  success: true,
  ticker: string,
  metricX: string,
  metricY: string,
  correlation: number,     // -1 to +1
  dataPoints: number,
  data: Array<{
    date: string,
    x: number,
    y: number
  }>
}
```

## State Management

### Component State (CorrelationChart)
```typescript
{
  data: CorrelationData | null,        // Chart data
  loading: boolean,                     // Data fetching
  error: string | null,                 // Error messages
  query: string,                        // Search input value
  isParsingQuery: boolean,              // Parsing in progress
  currentQuery: ParsedQuery | null      // Currently displayed query
}
```

## Environment Variables

### Development (.env.local)
```bash
ANTHROPIC_API_KEY=your_anthropic_key
NEXT_PUBLIC_SUPABASE_URL=https://...   # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Production (Vercel Dashboard)
Same variables, but managed through platform UI.

## Security Considerations

### API Key Protection
- ✅ `ANTHROPIC_API_KEY` only used server-side
- ✅ `SUPABASE_SERVICE_ROLE_KEY` only in API routes
- ✅ No keys exposed to client
- ✅ Keys in `.gitignore`

### Input Validation
- ✅ Query length limits
- ✅ Ticker whitelist
- ✅ Metric whitelist
- ✅ Date format validation
- ✅ SQL injection protection (Supabase client)

### Rate Limiting
- ⚠️ Not implemented (future enhancement)
- Consider: API route middleware
- Consider: Redis for rate limiting

## Performance Optimization

### Current
- Server-side rendering for initial page
- API routes run serverless
- Supabase connection pooling

### Future Optimizations
- [ ] Cache common queries
- [ ] Memoize chart data
- [ ] Debounce search input
- [ ] Lazy load Chart.js
- [ ] Optimize bundle size

## Error Handling Layers

1. **Client Input Validation**
   - Empty query check
   - Length limits

2. **API Route Validation**
   - Request body structure
   - Required fields present

3. **Claude Response Validation**
   - Valid JSON parsing
   - Required fields in response
   - Ticker/metric whitelists

4. **Supabase Query Validation**
   - Connection errors
   - No data found
   - Insufficient data points

5. **User-Facing Errors**
   - Friendly error messages
   - Actionable suggestions
   - Visual error indicators

## Testing Strategy

### Manual Testing
- Example queries
- Edge cases
- Error scenarios
- Mobile responsive

### Automated Testing (Future)
```javascript
// test-api.js (already created)
- Parse query tests
- Correlation API tests
- End-to-end flows
```

### Load Testing (Future)
- Concurrent requests
- API response times
- Claude API limits

## Deployment Pipeline

```
Local Development
  │
  ├─ npm run dev
  └─ Test on localhost:3000
  │
  ▼
Build & Test
  │
  ├─ npm run build
  └─ TypeScript compilation
  │
  ▼
Deploy to Vercel
  │
  ├─ Set environment variables
  ├─ Configure domain
  └─ Enable HTTPS
  │
  ▼
Production Monitoring
  │
  ├─ Check error logs
  ├─ Monitor API usage
  └─ Track user queries
```

## Scalability Considerations

### Current Scale
- 12 tickers
- ~12,000 data points
- Low query volume
- Single user

### Future Scale
- Add caching layer (Redis)
- Implement rate limiting
- Consider query queue
- Monitor Claude API costs
- Database indexing
- CDN for static assets

## Monitoring & Observability

### Logs to Track
- Query parse success rate
- Average parse time
- Common query patterns
- Error frequency by type
- API response times

### Metrics Dashboard (Future)
- Queries per day
- Most popular tickers
- Most used metrics
- Error rate trends
- User engagement

---

## Architecture Decision Records

### Why Claude Sonnet 4?
- Strong JSON output
- Good instruction following
- Fast response time
- Cost-effective for query parsing

### Why Next.js API Routes?
- Serverless deployment
- Simple setup
- TypeScript support
- Co-located with frontend

### Why Chart.js?
- Battle-tested
- React integration
- Scatter plot support
- Good documentation

### Why Supabase?
- PostgreSQL backend
- Easy setup
- Real-time capabilities (future)
- Good TypeScript support
