# Alternative Data Intelligence Dashboard

A Next.js application for analyzing correlations between alternative data signals (job postings, social media sentiment, employee growth) and stock performance. Built for hedge fund interview demonstration.

## 🌟 Key Features

### 📊 Correlation Analysis
- Interactive scatter plots with Chart.js
- Pearson correlation coefficient calculation
- 12 tickers: AAPL, AMZN, DELL, GOOGL, JNJ, META, MSFT, NKE, NVDA, TSLA, UBER, V
- 11 alternative data metrics: job_posts, reddit_mentions, twitter_sentiment, and more

### 🤖 Natural Language Queries (NEW)
- **Ask questions in plain English**: "Show correlation between job postings and price for AAPL"
- **AI-powered parsing**: Claude Sonnet 4 extracts structured parameters
- **Example queries**: Clickable suggestions for quick exploration
- **Smart error handling**: Helpful messages when queries fail
- **Real-time feedback**: Loading states and parsed query display

## 🚀 Quick Start

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env.local` file:
```bash
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
npm start
```

## 📖 Documentation

Comprehensive documentation is available in the [`docs/`](./docs) directory:

- **[NATURAL_LANGUAGE_QUERIES.md](./docs/NATURAL_LANGUAGE_QUERIES.md)** - Feature overview and API documentation
- **[USAGE_GUIDE.md](./docs/USAGE_GUIDE.md)** - User guide with query examples
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical architecture and data flow
- **[IMPLEMENTATION_SUMMARY.md](./docs/IMPLEMENTATION_SUMMARY.md)** - Complete implementation details
- **[DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification
- **[DEMO_CHEAT_SHEET.md](./docs/DEMO_CHEAT_SHEET.md)** - Quick reference for interviews

## 🧪 Testing

Run the API test suite:
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
node test-api.js
```

## 💡 Example Queries

Try these natural language queries:

```
Show correlation between job postings and price for AAPL
Compare Reddit sentiment vs stock price for TSLA
Does Twitter engagement predict NVDA stock movement?
Show me employment signals vs price for META since 2024
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.1 with App Router
- **Language**: TypeScript 5
- **UI**: React 19.2.0 + Tailwind CSS 4
- **Charts**: Chart.js 4.5.1 + react-chartjs-2
- **AI**: Anthropic Claude Sonnet 4 (@anthropic-ai/sdk 0.68.0)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
alt-data-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── parse-query/route.ts    # Natural language parser
│   │   │   └── correlation/route.ts     # Correlation calculator
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
3. Claude AI extracts: ticker, metricX, metricY, dates
4. Validation against whitelists
5. Structured parameters sent to `/api/correlation`
6. Chart updates with correlation data

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
- `price` - Stock price
- `job_posts` - Job postings count
- `reddit_mentions` - Reddit mentions
- `twitter_mentions` - Twitter mentions
- `reddit_sentiment` - Reddit sentiment score
- `twitter_followers` - Twitter followers
- `employees_linkedin` - LinkedIn employee count
- `ai_score_employment` - AI employment score
- `ai_score_overall` - Overall AI score
- `stocktwits_sentiment` - StockTwits sentiment
- `news_mentions` - News mentions

## 🔐 Security

- API keys never exposed to client
- Server-side validation of all inputs
- Supabase Row Level Security (RLS)
- TypeScript for type safety
- Input sanitization

## 🎤 Interview Demo

Quick demo flow (< 2 minutes):
1. Show default chart
2. Execute natural language query
3. Click example query
4. Demonstrate error handling
5. Explain architecture

See [DEMO_CHEAT_SHEET.md](./docs/DEMO_CHEAT_SHEET.md) for complete demo guide.

## 🚀 Future Enhancements

- [ ] Multi-ticker comparison
- [ ] Query history and favorites
- [ ] Voice input support
- [ ] Advanced statistical analysis (R², p-values)
- [ ] Export results (CSV, PNG)
- [ ] Query caching with Redis
- [ ] Real-time data updates

## 📝 License

MIT License - Built for educational/interview purposes.

## 🙏 Acknowledgments

- Next.js team for the excellent framework
- Anthropic for Claude AI
- Supabase for easy database setup
- Chart.js for visualization
- Tailwind CSS for styling

---

**Built with**: Next.js + React + TypeScript + Claude AI  
**Purpose**: Hedge Fund Interview - Alternative Data Analysis  
**Status**: ✅ Production Ready
