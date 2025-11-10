# Architecture - Alternative Data Intelligence Dashboard

## System Overview

This document provides a comprehensive technical architecture overview of the Alternative Data Intelligence Dashboard, covering all features, data flows, and system components.

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Login/Signup   │  │ Main Dashboard│  │ Admin Panel     │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└───────────────┬─────────────────────────────────────────────┘
                │
     ┌──────────┴──────────────┐
     │   Middleware (Auth)     │ Protects all routes except
     │  - Cookie-based auth    │ /login, /signup, /api/*
     └──────────┬──────────────┘
                │
┌───────────────┴──────────────────────────────────────────────┐
│               Core Application Features                       │
│                                                               │
│  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ NL Query Parser  │  │ Discovery Engine│  │ Interactive │ │
│  │ (Claude Haiku)   │  │ (Auto-Correlate)│  │ Query Edit  │ │
│  └────────┬─────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                     │                   │         │
│           └─────────────┬───────┴───────────────────┘         │
│                         │                                     │
│           ┌─────────────┴──────────────┐                     │
│           │   API Routes Layer         │                     │
│           │  /api/parse-query          │                     │
│           │  /api/correlation          │                     │
│           │  /api/compare              │                     │
│           │  /api/discover             │                     │
│           │  /api/admin/approve        │                     │
│           │  /api/notify-admin         │                     │
│           └─────────────┬──────────────┘                     │
└─────────────────────────┼────────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                  │
    ┌────┴─────┐                   ┌───────┴────────┐
    │ Supabase │                   │ Anthropic API  │
    │          │                   │ Claude Haiku   │
    │ - Auth   │                   │ 4.5            │
    │ - DB     │                   └────────────────┘
    │ - RLS    │
    │ - Edge   │
    │   Funcs  │
    └──────────┘
```

## Natural Language Query Flow

```
1. User Input
   │
   ├─ Types natural language query
   │  "Show correlation between job postings and price for AAPL"
   │
   ▼
2. CorrelationChart Component
   │
   ├─ State management (query, loading, error, pending changes)
   ├─ Abort controller (cancel previous requests)
   ├─ Form submission handling
   │
   ▼
3. POST /api/parse-query
   │
   ├─ Input validation (length, content)
   ├─ Calls Anthropic Claude Haiku 4.5
   ├─ Structured system prompt with examples
   ├─ Temperature: 0 (deterministic)
   ├─ Max tokens: 500
   │
   ▼
4. Claude AI Processing
   │
   ├─ Analyzes natural language
   ├─ Extracts: ticker(s), metricX, metricY, dates
   ├─ Returns JSON with confidence score
   │
   ▼
5. Response Validation
   │
   ├─ Parse JSON response
   ├─ Validate ticker(s) against VALID_TICKERS
   ├─ Validate metrics against VALID_METRICS
   ├─ Check 3-ticker limit
   ├─ Return structured parameters or error
   │
   ▼
6. Component Updates
   │
   ├─ Display parsed parameters (pills UI)
   ├─ Enable interactive editing
   ├─ Set pending changes state
   │
   ▼
7. Data Fetching
   │
   ├─ Single stock → POST /api/correlation
   ├─ Multi stock → POST /api/compare
   ├─ Discovery → POST /api/discover
   │
   ▼
8. Supabase Query
   │
   ├─ SELECT metrics from stock_metrics
   ├─ Filter by ticker(s) and date range
   ├─ Remove null values
   │
   ▼
9. Correlation Calculation
   │
   ├─ O(n) Pearson coefficient algorithm
   ├─ Single-pass calculation
   ├─ Minimal memory allocation
   │
   ▼
10. Visualization
    │
    ├─ Format data for Chart.js
    ├─ Render scatter plot (Correlation View)
    ├─ OR render time-series (Trend View)
    ├─ Display correlation coefficient
    └─ Interactive tooltips
```

## Component Hierarchy

```
App Root
├── middleware.ts (Auth protection)
├── AuthContext (Global auth state)
│
├── Public Routes
│   ├── /login (LoginPage)
│   ├── /signup (SignupPage)
│   └── /auth/callback (OAuth callback)
│
└── Protected Routes
    ├── / (Dashboard - page.tsx)
    │   └── CorrelationChart.tsx
    │       ├── Search Interface
    │       │   ├── Text input field
    │       │   ├── Search button
    │       │   ├── Example query pills
    │       │   └── Discover button
    │       │
    │       ├── Query Display & Editing
    │       │   ├── Current query pills (tickers, metrics)
    │       │   ├── Interactive ticker pills (click to edit)
    │       │   ├── Add ticker button (+)
    │       │   ├── Delete ticker button (×)
    │       │   ├── Metric selector dropdowns
    │       │   └── Update button (for pending changes)
    │       │
    │       ├── View Mode Toggle
    │       │   ├── Correlation View button
    │       │   └── Trend View button (with validation)
    │       │
    │       ├── Discovery Sidebar
    │       │   ├── Ranked correlation list
    │       │   ├── Clickable result items
    │       │   ├── Expand/collapse toggle
    │       │   └── Strength indicators (🟢🟡⚪)
    │       │
    │       ├── Chart Display
    │       │   ├── Chart.js Scatter Plot (Correlation View)
    │       │   ├── Chart.js Line Chart (Trend View)
    │       │   └── Correlation coefficient display
    │       │
    │       ├── Error Message Display
    │       └── Loading States
    │           ├── Parsing indicator
    │           ├── Data fetching indicator
    │           └── Discovery progress
    │
    └── /admin (Admin Panel)
        └── User approval interface
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
- **React 19.2.0**: UI components with experimental React Compiler
- **Next.js 16.0.1**: Framework with App Router and API routes
- **TypeScript 5**: Strict type safety throughout
- **Tailwind CSS 4**: Utility-first styling
- **Chart.js 4.5.1**: Flexible data visualization
- **react-chartjs-2 5.3.1**: React wrapper for Chart.js
- **date-fns 4.1.0**: Date manipulation and formatting
- **lodash 4.17.21**: Utility functions

### Backend & Runtime
- **Bun 1.x** (recommended): High-performance JavaScript runtime (3-4x faster than Node.js)
- **Next.js API Routes**: Serverless functions
- **Anthropic SDK 0.68.0**: Claude AI integration
- **Supabase**: Multi-client architecture
  - `supabase.ts`: Service role (bypasses RLS for API routes)
  - `supabase-server.ts`: SSR with cookie-based auth
  - `supabase-browser.ts`: Client-side with cookie-based auth
- **PostgreSQL**: Primary data storage with RLS

### AI/ML
- **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`): Natural language parsing
  - 90% cheaper than Sonnet 4
  - 3-5x faster response times
  - Reliable JSON output
  - Temperature: 0 for deterministic results
- **Pearson Correlation**: O(n) time complexity statistical analysis

### Authentication & Email
- **Supabase Auth**: Email/password authentication with SSR support
- **Supabase Edge Functions**: Email notifications
- **Resend API**: Transactional email delivery

### Development & Build Tools
- **babel-plugin-react-compiler 1.0.0**: Automatic React optimizations
- **ESLint 9**: Code quality and consistency
- **Bruno**: API testing and documentation

## API Contracts

### Complete API Reference

This section documents all API endpoints, their request/response schemas, and behavior.

---

### POST /api/parse-query

Parses natural language queries into structured parameters using Claude Haiku 4.5.

**Request:**
```typescript
{
  query: string  // Natural language query (max 500 chars)
}
```

**Success Response (200) - Single Stock:**
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

**Success Response (200) - Multi Stock:**
```typescript
{
  success: true,
  parsed: {
    tickers: string[],     // e.g., ["TSLA", "NVDA"]
    metricX: string,       // e.g., "reddit_sentiment"
    metricY: string,       // e.g., "price"
    startDate?: string,
    endDate?: string
  },
  confidence: "high" | "medium" | "low"
}
```

**Error Response (400/500):**
```typescript
{
  success: false,
  error: string,           // Human-readable error message
  suggestions?: string[]   // Actionable suggestions for fixing query
}
```

**Validation:**
- Query length: 1-500 characters
- Tickers validated against VALID_TICKERS whitelist
- Metrics validated against VALID_METRICS whitelist
- Maximum 3 tickers per query
- Claude API timeout: 30 seconds

---

### POST /api/correlation

Fetches correlation data for a single stock and metric pair.

**Request:**
```typescript
{
  ticker: string,          // Must be in VALID_TICKERS
  metricX: string,         // Must be in VALID_METRICS
  metricY: string,         // Must be in VALID_METRICS
  startDate?: string,      // ISO 8601 format
  endDate?: string         // ISO 8601 format
}
```

**Success Response (200):**
```typescript
{
  success: true,
  ticker: string,
  metricX: string,
  metricY: string,
  correlation: number,     // Pearson coefficient: -1 to +1
  dataPoints: number,      // Number of valid data points used
  data: Array<{
    date: string,          // ISO 8601 date
    x: number,             // metricX value
    y: number              // metricY value
  }>
}
```

**Error Response (400/500):**
```typescript
{
  success: false,
  error: string
}
```

**Algorithm:**
- Pearson correlation coefficient
- O(n) time complexity
- O(1) space complexity
- Filters null values automatically
- Requires minimum 2 data points

---

### POST /api/compare

Fetches correlation data for multiple stocks in parallel.

**Request:**
```typescript
{
  tickers: string[],       // 1-3 tickers from VALID_TICKERS
  metricX: string,         // Must be in VALID_METRICS
  metricY: string,         // Must be in VALID_METRICS
  startDate?: string,      // ISO 8601 format
  endDate?: string         // ISO 8601 format
}
```

**Success Response (200):**
```typescript
{
  success: true,
  metricX: string,
  metricY: string,
  results: Array<{
    ticker: string,
    correlation: number,   // -1 to +1
    dataPoints: number,
    data: Array<{
      date: string,
      x: number,
      y: number
    }>
  }>  // Sorted alphabetically by ticker
}
```

**Implementation:**
- Uses `Promise.all()` for parallel data fetching
- Results sorted alphabetically for consistency
- Each ticker's correlation calculated independently

---

### POST /api/discover

Auto-discovers all metric correlations with price for a given stock.

**Request:**
```typescript
{
  ticker: string,          // Must be in VALID_TICKERS
  metricY: string,         // Typically "price"
  startDate?: string,
  endDate?: string
}
```

**Success Response (200):**
```typescript
{
  success: true,
  ticker: string,
  metricY: string,
  topResult: {
    metricX: string,       // Metric with strongest correlation
    correlation: number,
    dataPoints: number,
    data: Array<{
      date: string,
      x: number,
      y: number
    }>
  },
  rankings: Array<{
    metricX: string,       // All metrics except metricY
    correlation: number,   // Sorted by absolute value (strongest first)
    dataPoints: number
  }>
}
```

**Algorithm:**
- Tests all metrics except the target metric (typically price)
- Parallel correlation calculations using `Promise.all()`
- Sorts by absolute correlation strength
- Returns full data for top result only
- Rankings include all metrics for UI display

---

### GET /api/admin/approve

Approves a pending user and sends welcome email.

**Request (Query Parameters):**
```typescript
{
  userId: string,          // UUID of user to approve
  token: string            // HMAC-SHA256 signed token
}
```

**Success Response (200):**
```html
<!-- HTML page confirming approval -->
<html>
  <body>
    <h1>User Approved Successfully</h1>
    <p>Email: user@example.com</p>
  </body>
</html>
```

**Error Response (400/500):**
```html
<!-- HTML error page -->
<html>
  <body>
    <h1>Approval Failed</h1>
    <p>{error message}</p>
  </body>
</html>
```

**Security:**
- Token validation using HMAC-SHA256
- Secret key from environment (APPROVAL_SECRET)
- Updates `user_profiles.approved` to `true`
- Triggers `send-user-approved-email` edge function

---

### POST /api/notify-admin

Triggers admin notification email for new user signup.

**Request:**
```typescript
{
  userId: string,          // UUID of new user
  email: string            // User's email address
}
```

**Success Response (200):**
```typescript
{
  success: true,
  message: string
}
```

**Implementation:**
- Calls Supabase `send-approval-email` edge function
- Edge function uses Resend API
- Contains approval link with signed token

## State Management

### Component State (CorrelationChart)
```typescript
{
  // Core Data
  data: CorrelationData | CompareData | DiscoverData | null,  // Chart data
  loading: boolean,                      // Data fetching state
  error: string | null,                  // Error messages

  // Query State
  query: string,                         // Search input value
  isParsingQuery: boolean,               // AI parsing in progress
  currentQuery: ParsedQuery | null,      // Active query parameters
  pendingQuery: ParsedQuery | null,      // Unsaved edits to query

  // UI State
  viewMode: 'correlation' | 'trend',     // Active visualization mode
  showDiscoveryResults: boolean,         // Discovery sidebar visibility
  discoveryData: DiscoveryResult | null, // Ranked correlations
  isExpanded: boolean,                   // Expand all discovery results

  // User Selection State
  selectedTicker: string | null,         // Currently editing ticker
  selectedMetric: 'X' | 'Y' | null,      // Currently editing metric

  // Abort Control
  abortController: AbortController | null // Cancel in-flight requests
}
```

### Global State (AuthContext)
```typescript
{
  user: User | null,                     // Authenticated user
  profile: UserProfile | null,           // User profile with approval status
  loading: boolean,                      // Auth check in progress
  signIn: (email, password) => Promise<void>,
  signUp: (email, password) => Promise<void>,
  signOut: () => Promise<void>
}
```

### Real-time Subscriptions
```typescript
// Subscribe to profile changes (approval status)
const subscription = supabase
  .channel('profile-changes')
  .on('postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_profiles',
      filter: `id=eq.${user.id}`
    },
    (payload) => {
      // Update profile state when approved
      setProfile(payload.new)
    }
  )
  .subscribe()
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

### Why Claude Haiku 4.5?
- Reliable JSON output with structured prompts
- Excellent instruction following
- Fast response times (<1 second typically)
- 90% cheaper than Sonnet 4 ($0.25 vs $3 per 1M input tokens)
- 3-5x faster than Sonnet
- Sufficient capability for structured parameter extraction

### Why Next.js API Routes?
- Serverless deployment ready (Vercel)
- Simple setup with file-based routing
- Full TypeScript support
- Co-located with frontend code
- Easy environment variable management
- Built-in request/response handling

### Why Chart.js?
- Battle-tested visualization library
- Excellent React integration (react-chartjs-2)
- Dual Y-axis support for trend view
- Scatter plot and line chart support
- Responsive and interactive
- Extensive customization options
- Good TypeScript definitions

### Why Supabase?
- PostgreSQL backend with excellent performance
- Built-in authentication with SSR support
- Row Level Security for data protection
- Real-time subscriptions (used for approval status)
- Edge functions for email notifications
- Good TypeScript client
- Free tier suitable for development

### Why Bun Runtime?
- 3-4x faster than Node.js for most operations
- Native TypeScript support (no transpilation)
- Faster install times (3-4x)
- Better developer experience
- Built-in test runner
- Smaller bundle sizes
- Compatible with Node.js ecosystem

---

## Key Feature Implementations

This section provides detailed implementation insights for the dashboard's major features.

### 1. Auto-Discovery Engine

**Purpose:** Automatically find the strongest correlations between a stock and all available metrics.

**Flow:**
```
1. User clicks "Discover" button
2. CorrelationChart calls /api/discover with current ticker
3. API fetches data for all metrics except price
4. Parallel correlation calculations (Promise.all)
5. Sort by absolute correlation strength
6. Return top result + rankings
7. Display in sidebar with click-to-view functionality
```

**Implementation Details:**
```typescript
// lib/discovery.ts
export async function discoverCorrelations(
  ticker: string,
  metricY: string,
  supabase: SupabaseClient,
  startDate?: string,
  endDate?: string
): Promise<DiscoveryResult> {
  // Get all metrics except metricY
  const metricsToTest = VALID_METRICS.filter(m => m !== metricY)

  // Calculate correlations in parallel
  const correlations = await Promise.all(
    metricsToTest.map(async (metricX) => {
      const result = await calculateCorrelation(
        ticker, metricX, metricY, supabase, startDate, endDate
      )
      return {
        metricX,
        correlation: result.correlation,
        dataPoints: result.dataPoints
      }
    })
  )

  // Sort by absolute correlation strength
  const ranked = correlations.sort((a, b) =>
    Math.abs(b.correlation) - Math.abs(a.correlation)
  )

  // Fetch full data for top result
  const topResult = await calculateCorrelation(
    ticker, ranked[0].metricX, metricY, supabase, startDate, endDate
  )

  return { topResult, rankings: ranked }
}
```

**UI Features:**
- Sidebar slides in with ranked results
- Color-coded strength indicators (🟢 >0.7, 🟡 0.3-0.7, ⚪ <0.3)
- Click any result to visualize
- Expand/collapse to show all or top 5
- Loading state during discovery

---

### 2. Interactive Query Editing

**Purpose:** Allow users to modify query parameters without re-typing natural language.

**Flow:**
```
1. User executes query via natural language or example
2. Parsed parameters displayed as interactive pills
3. User clicks ticker pill → dropdown to change ticker
4. User clicks "+ Add Ticker" → adds another ticker (max 3)
5. User clicks "×" on ticker → removes ticker
6. User changes metricX or metricY via dropdowns
7. "Update" button appears when pending changes exist
8. Click "Update" → fetch new data without AI parsing
```

**State Management:**
```typescript
// Current query (displayed in chart)
const [currentQuery, setCurrentQuery] = useState<ParsedQuery | null>(null)

// Pending changes (not yet applied)
const [pendingQuery, setPendingQuery] = useState<ParsedQuery | null>(null)

// When user clicks a ticker pill
const handleTickerClick = (index: number) => {
  setSelectedTicker(index)
  // Show dropdown with all tickers
}

// When user selects new ticker
const handleTickerChange = (index: number, newTicker: string) => {
  setPendingQuery({
    ...currentQuery,
    tickers: currentQuery.tickers.map((t, i) => i === index ? newTicker : t)
  })
}

// When user clicks "Update"
const handleUpdate = async () => {
  setCurrentQuery(pendingQuery)  // Apply pending changes
  setPendingQuery(null)          // Clear pending state
  await fetchData(pendingQuery)  // Fetch new data
}
```

**UI Features:**
- Pill-based UI for visual clarity
- Hover effects show edit affordances
- "+" button pulses to indicate add capability
- "×" button appears on hover for deletion
- "Update" button only visible when changes pending
- Prevents accidental overwrites

---

### 3. Metric Obfuscation System

**Purpose:** Display user-friendly metric names while hiding internal data sources.

**Implementation:**
```typescript
// types/query.ts
export const METRIC_DISPLAY_NAMES: Record<string, string> = {
  price: 'Stock Price',
  job_posts: 'Job Postings',
  reddit_mentions: 'Community Activity Index',
  twitter_mentions: 'Social Velocity',
  reddit_sentiment: 'Sentiment Alpha',
  twitter_followers: 'Social Reach Metric',
  employees_linkedin: 'Workforce Index',
  ai_score_employment: 'Hiring Momentum Score',
  ai_score_overall: 'Composite Signal',
  stocktwits_sentiment: 'Investor Sentiment Index',
  news_mentions: 'News Mentions'
}

// Usage in component
const displayName = METRIC_DISPLAY_NAMES[metricX] || metricX
```

**Benefits:**
- Hides data sources from end users
- Professional naming convention
- Maintains backward compatibility at API level
- Centralized configuration

---

### 4. Authentication & Approval Workflow

**Architecture:**
```
1. User Signup
   ├─ Email/password via Supabase Auth
   ├─ Email verification required
   └─ Profile created with approved=false

2. Email Verification
   ├─ User clicks verification link
   ├─ Supabase marks email_confirmed=true
   └─ Database trigger fires

3. Admin Notification (Edge Function)
   ├─ send-approval-email triggered
   ├─ Generates HMAC-SHA256 token
   ├─ Sends email via Resend API
   └─ Contains approval link

4. Admin Approval
   ├─ Admin clicks approval link
   ├─ /api/admin/approve validates token
   ├─ Updates user_profiles.approved=true
   └─ Calls send-user-approved-email

5. User Notification (Edge Function)
   ├─ send-user-approved-email triggered
   ├─ Sends welcome email via Resend
   └─ User receives access confirmation

6. Real-time Update
   ├─ User's browser subscribed to profile changes
   ├─ Supabase real-time fires UPDATE event
   └─ UI updates instantly (removes "pending" banner)
```

**Security Considerations:**
- HMAC-SHA256 token prevents unauthorized approvals
- RLS policies protect user data
- Email verification required before approval workflow
- Service role client bypasses RLS only in API routes
- Cookies for SSR auth prevent token exposure

---

### 5. Abort Controller Pattern

**Purpose:** Prevent race conditions when users rapidly change queries.

**Problem:**
- User executes query A
- Before response arrives, user executes query B
- Response A arrives after response B
- Chart shows stale data from query A

**Solution:**
```typescript
const [abortController, setAbortController] = useState<AbortController | null>(null)

const handleSearch = async () => {
  // Cancel previous request if still in flight
  if (abortController) {
    abortController.abort()
  }

  // Create new abort controller
  const newController = new AbortController()
  setAbortController(newController)

  try {
    const response = await fetch('/api/parse-query', {
      method: 'POST',
      body: JSON.stringify({ query }),
      signal: newController.signal  // Pass abort signal
    })

    // Handle response...
  } catch (error) {
    if (error.name === 'AbortError') {
      // Request was cancelled, ignore
      return
    }
    // Handle other errors...
  }
}
```

**Benefits:**
- No stale data displayed
- Reduced server load (cancelled requests)
- Better UX for rapid query changes
- Prevents memory leaks

---

### 6. Pearson Correlation Algorithm Optimization

**Challenge:** Calculate correlation coefficient efficiently for large datasets.

**Standard Approach (Two-Pass):**
```typescript
// Pass 1: Calculate means
const meanX = sum(x) / n
const meanY = sum(y) / n

// Pass 2: Calculate covariance and standard deviations
// Time: O(2n), Space: O(n) for storing data
```

**Optimized Approach (Single-Pass):**
```typescript
// lib/correlation.ts
export function calculatePearsonCorrelation(
  dataPoints: Array<{ x: number; y: number }>
): number {
  let n = 0
  let sumX = 0, sumY = 0
  let sumX2 = 0, sumY2 = 0
  let sumXY = 0

  // Single pass through data
  for (const point of dataPoints) {
    n++
    sumX += point.x
    sumY += point.y
    sumX2 += point.x * point.x
    sumY2 += point.y * point.y
    sumXY += point.x * point.y
  }

  // Calculate correlation from sums
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) *
    (n * sumY2 - sumY * sumY)
  )

  return denominator === 0 ? 0 : numerator / denominator
}
```

**Performance:**
- Time complexity: O(n) single-pass
- Space complexity: O(1) constant space
- No intermediate arrays
- Numerical stability maintained
