# Alternative Data Intelligence Dashboard

An AI-powered analytics platform for discovering correlations between alternative data signals (job postings, social media sentiment, employee growth) and stock performance. Features natural language queries, dual visualization modes, and an intelligent discovery engine for identifying predictive patterns.

---

## 🚀 Quick Links

**Deploy & Auth Setup** → [Complete Setup Guide](./COMPLETE_SETUP_GUIDE.md) - Production deployment  
**Demo Prep** → `docs/DEMO_CHEAT_SHEET.md` - Interview talking points  
**Architecture** → `docs/ARCHITECTURE.md` - Technical deep dive

---

## 🌟 Key Features

### 📊 Dual Visualization Modes
- **Correlation View**: Interactive scatter plots showing metric relationships with Pearson correlation coefficients
- **Trend View**: Time-series charts with dual Y-axes for temporal pattern analysis
- Toggle between visualization modes with one click
- Color-coded multi-stock comparisons (up to 3 stocks)
- Interactive tooltips with detailed data points
- 12 tickers: AAPL, AMZN, DELL, GOOGL, JNJ, META, MSFT, NKE, NVDA, TSLA, UBER, V
- 11 alternative data metrics with intelligent display names

### 🤖 Natural Language Query Interface
- **Plain English queries**: "Show correlation between job postings and price for AAPL"
- **Multi-stock comparison**: "Compare TSLA vs NVDA Reddit sentiment" (up to 3 stocks)
- **AI-powered parsing**: Claude Haiku 4.5 extracts structured parameters with 90% cost savings vs Sonnet
- **Interactive query editing**: Click pill-shaped tags to modify tickers and metrics
- **Pending changes system**: Preview and update queries before execution
- **Smart validation**: Multi-layer error handling with actionable suggestions
- **Real-time feedback**: Loading states, confidence scoring, and parsed parameter display

### 🔍 Auto-Discovery Engine
- **One-click discovery**: Automatically test all metrics against stock price
- **Correlation ranking**: Results sorted by predictive strength
- **Interactive results**: Click any discovery result to visualize the correlation
- **Expandable view**: Show top 5 or all correlations with strength indicators
- **Parallel processing**: Fast correlation calculations across all metrics

### 🎨 Interactive Query Builder
- **Visual query editing**: Pill-based UI for modifying tickers and metrics
- **Add/remove tickers**: Dynamic ticker management with visual feedback
- **Metric obfuscation**: User-friendly display names hide internal data sources
- **Pending changes preview**: See changes before applying them
- **Smart suggestions**: Context-aware recommendations for query improvements

### 🔐 Secure Authentication & Authorization
- **Email/password authentication**: Powered by Supabase Auth
- **Admin approval workflow**: New users require approval before accessing data
- **Real-time status updates**: Instant UI updates when approval status changes
- **Email notifications**: Automated admin alerts and user welcome emails via edge functions
- **Row Level Security**: Database-level access controls

## 🚀 Quick Start

### Prerequisites
```bash
bun >= 1.0.0  # Recommended: Fast JavaScript runtime
# OR node >= 18.0.0 (if you prefer npm)
```

### Installation
```bash
bun install  # Recommended (faster)
# OR: npm install
```

### Environment Variables
Create a `.env.local` file with the following variables:
```bash
# AI Features
ANTHROPIC_API_KEY=your_anthropic_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Approval Workflow
APPROVAL_SECRET=generate_random_string
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
```

See [CLAUDE.md](CLAUDE.md) for detailed environment variable documentation.

### Run Development Server
```bash
bun run dev  # Recommended (faster startup)
# OR: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
bun run build  # Recommended (faster builds)
bun run start
# OR: npm run build && npm start
```

## 📖 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) directory:

### For Users
- **[FEATURES.md](./docs/FEATURES.md)** - High-level feature overview and use cases
- **[USAGE_GUIDE.md](./docs/USAGE_GUIDE.md)** - Complete user guide with query examples

### For Developers
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical architecture and data flow
- **[NATURAL_LANGUAGE_QUERIES.md](./docs/NATURAL_LANGUAGE_QUERIES.md)** - API documentation and implementation details
- **[IMPLEMENTATION_SUMMARY.md](./docs/IMPLEMENTATION_SUMMARY.md)** - Complete implementation summary
- **[BUN_OPTIMIZATIONS.md](./docs/BUN_OPTIMIZATIONS.md)** - Bun runtime guide and performance benchmarks

### For Deployment
- **[DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification steps

### For Presentations
- **[DEMO_CHEAT_SHEET.md](./docs/DEMO_CHEAT_SHEET.md)** - Quick reference for product demonstrations

## 🧪 Testing

Run the API test suite:
```bash
# Terminal 1: Start dev server
bun run dev

# Terminal 2: Run tests
bun run test:api
# OR: node test-api.js
```

## 💡 Example Queries

Try these natural language queries:

### Single Stock Analysis
```
Show correlation between job postings and price for AAPL
Does Twitter engagement predict NVDA stock movement?
Show me employment signals vs price for META since 2024
```

### Multi-Stock Comparison (NEW)
```
Compare TSLA vs NVDA Reddit sentiment
Compare AAPL, MSFT, and GOOGL job postings vs price
How do TSLA and NVDA differ on Twitter mentions?
```

## 🛠️ Tech Stack

- **Runtime**: Bun 1.x (recommended) or Node.js 18+
- **Framework**: Next.js 16.0.1 with App Router
- **Language**: TypeScript 5
- **UI**: React 19.2.0 + Tailwind CSS 4
- **Charts**: Chart.js 4.5.1 + react-chartjs-2
- **AI**: Anthropic Claude Haiku 4.5 (@anthropic-ai/sdk 0.68.0)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
alt-data-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── parse-query/route.ts    # Natural language parser
│   │   │   ├── correlation/route.ts     # Single-stock correlation
│   │   │   └── compare/route.ts         # Multi-stock comparison (NEW)
│   │   ├── components/
│   │   │   └── CorrelationChart.tsx     # Main chart component
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── supabase.ts                  # Supabase client
│   └── types/
│       └── query.ts                      # TypeScript types
├── scripts/
│   └── import_data.py                    # Data import script
└── Documentation files (*.md)
```

## 🎯 Key Implementation Details

### Natural Language Processing
1. User enters query in search box
2. Query sent to `/api/parse-query`
3. Claude AI extracts: ticker(s), metricX, metricY, dates
4. Validation against whitelists (max 3 tickers enforced)
5. Structured parameters sent to `/api/correlation` (single) or `/api/compare` (multi)
6. Chart updates with correlation data (color-coded for multi-stock)

### Error Handling
- Multi-layer validation (client, API, AI response)
- User-friendly error messages
- Helpful suggestions for fixing queries
- Graceful fallback to default view

### Data Pipeline
- Python script imports Excel files to Supabase
- ~12,080 records across 12 tickers
- Date range: 2024-present
- Handles NaN values and duplicates

## 🚢 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables in Production
Set these in your deployment platform:
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📊 Available Data

### Tickers (12)
AAPL, AMZN, DELL, GOOGL, JNJ, META, MSFT, NKE, NVDA, TSLA, UBER, V

### Metrics (11)
Metrics are displayed with user-friendly names that hide internal data sources:

- **Stock Price** - Daily closing price
- **Job Postings** - Aggregated job posting counts
- **Community Activity Index** - Reddit post mentions (reddit_mentions)
- **Social Velocity** - Twitter/X mentions (twitter_mentions)
- **Sentiment Alpha** - Reddit sentiment score (reddit_sentiment)
- **Social Reach Metric** - Twitter follower count (twitter_followers)
- **Workforce Index** - LinkedIn employee count (employees_linkedin)
- **Hiring Momentum Score** - AI employment signal (ai_score_employment)
- **Composite Signal** - Overall AI score (ai_score_overall)
- **Investor Sentiment Index** - StockTwits sentiment (stocktwits_sentiment)
- **News Mentions** - News article mentions

### Data Volume
- **~12,080 total records** across all tickers
- **~1,000 data points per ticker**
- **Date range**: 2024-present
- **Daily granularity** with null value handling

## 🔐 Security

- API keys never exposed to client
- Server-side validation of all inputs
- Supabase Row Level Security (RLS)
- TypeScript for type safety
- Input sanitization

## 🎥 Feature Demonstration

Quick demonstration flow (< 3 minutes):
1. **Natural Language Query**: Execute a plain English query
2. **Discovery Engine**: Click "Discover" to find top correlations
3. **Interactive Editing**: Click pills to modify query parameters
4. **Dual Visualizations**: Toggle between Correlation and Trend views
5. **Multi-Stock Comparison**: Compare up to 3 stocks simultaneously
6. **Error Handling**: See intelligent error messages and suggestions

See [DEMO_CHEAT_SHEET.md](./docs/DEMO_CHEAT_SHEET.md) for detailed presentation guide.

## 📈 Visualization Modes

### Correlation View
- Scatter plot showing relationship between two metrics
- Each point represents one day's data
- Visual correlation strength with color coding
- Available for all metric combinations

### Trend View (NEW)
- Time-series line charts with dual Y-axes
- Left axis: Stock price (always)
- Right axis: Alternative data metric
- Track both metrics over time simultaneously
- **Requirement**: One metric must be `price`
- Supports both single-stock and multi-stock comparisons
- Color-coded lines for easy distinction

**Multi-Stock Trend View:**
- Price lines: Blue, Red, Purple (one per stock)
- Metric lines: Green, Yellow, Teal (one per stock)
- Legend clearly identifies each line
- All stocks shown on same timeline

## 🚀 Potential Enhancements

The following features could extend the platform's capabilities:

- **Query History & Favorites**: Save and recall frequently used queries
- **Voice Input**: Speech-to-text for hands-free query input
- **Advanced Statistics**: R², p-values, confidence intervals, and trend lines
- **Export Functionality**: Download results as CSV, PNG, or PDF reports
- **Query Caching**: Redis-based caching for improved performance
- **Real-time Data**: WebSocket integration for live data updates
- **Extended Comparison**: Support for more than 3 stocks with tabbed interface
- **Custom Alerts**: Notification system for correlation threshold breaches
- **API Access**: RESTful API for programmatic access to correlation engine

## 📝 License

MIT License

## 🙏 Acknowledgments

This project leverages best-in-class technologies:

- **Next.js & React 19** - Modern web framework with experimental compiler optimizations
- **Anthropic Claude Haiku 4.5** - Cost-effective AI with reliable JSON output
- **Supabase** - PostgreSQL database with real-time capabilities and authentication
- **Chart.js** - Flexible visualization library for correlation and time-series charts
- **Tailwind CSS 4** - Utility-first CSS framework
- **Bun Runtime** - High-performance JavaScript runtime (3-4x faster than Node.js)

## 🎯 Technical Highlights

- **O(n) Correlation Algorithm**: Optimized single-pass Pearson coefficient calculation
- **React 19 Compiler**: Experimental automatic memoization and optimization
- **Three-Tier Supabase Architecture**: Separate clients for service role, SSR, and browser contexts
- **Abort Controller Pattern**: Prevents race conditions in concurrent API requests
- **Real-time Subscriptions**: Instant UI updates via Supabase real-time
- **Multi-Layer Validation**: Client, API, AI, and database validation for robustness
- **Cost Optimization**: 90% savings using Haiku 4.5 vs Sonnet with comparable performance

---

**Tech Stack**: Next.js 16 • React 19 • TypeScript 5 • Claude Haiku 4.5 • Supabase • Bun
**Features**: AI-Powered NLP • Dual Visualizations • Auto-Discovery • Interactive Editing
**Status**: ✅ Production Ready
