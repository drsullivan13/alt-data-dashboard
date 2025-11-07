# Demo Cheat Sheet - Quick Reference

## 🎯 One-Liner Pitch
"I built a natural language interface using Claude AI that lets users query stock correlations in plain English instead of selecting parameters manually."

---

## 🚀 Quick Demo (< 2 minutes)

### Step 1: Show Default (5 sec)
- Point to search bar
- "Users can ask questions in natural language"

### Step 2: Execute Query (30 sec)
```
Type: "Show correlation between job postings and price for AAPL"
```
- Watch "Analyzing..." → Parsed query badge → Chart updates
- Point out: Correlation score, data points, emoji indicator

### Step 3: Example Query (15 sec)
```
Click: "Compare Reddit sentiment vs stock price for TSLA"
```
- "Pre-built examples help users discover features"

### Step 4: Error Handling (20 sec)
```
Type: "Show data for XYZ"
```
- "Clear error messages with actionable suggestions"

### Step 5: Technical Highlight (30 sec)
- Open `parse-query/route.ts`
- Show system prompt
- "Claude extracts structured data, I validate it"

---

## 🎤 Key Talking Points

### 1. Problem → Solution
- **Problem**: Manual parameter selection is tedious
- **Solution**: Natural language interface powered by AI

### 2. Technical Choices
- **Claude Sonnet 4**: Reliable JSON output, fast, cost-effective
- **Next.js API Routes**: Serverless, easy deployment
- **TypeScript**: Type safety throughout
- **Multi-layer validation**: Don't trust AI blindly

### 3. UX Focus
- Loading states for feedback
- Example queries for discovery
- Error messages with suggestions
- Progressive enhancement (default view works)

### 4. Production Ready
- Error handling at every layer
- Input validation
- TypeScript types
- Comprehensive docs

---

## 💬 Answer These Questions Confidently

### "How does it work?"
```
1. User types query
2. Sent to Claude API with structured prompt
3. Claude returns JSON with ticker/metrics
4. I validate against whitelists
5. Fetch correlation data from Supabase
6. Render chart
```

### "What if Claude returns garbage?"
```
- Validation layer catches invalid tickers/metrics
- User gets helpful error message
- Falls back to default view
- Suggestions guide them to valid queries
```

### "How would you prevent prompt injection?"
```
- Input length limits
- Whitelist validation AFTER parsing
- Claude has no database access
- System prompt doesn't expose sensitive data
```

### "How would you scale this?"
```
- Cache common queries (Redis)
- Rate limiting per user
- Batch Claude API calls
- Monitor costs with usage analytics
- Consider fine-tuned model for cheaper inference
```

### "What metrics would you track?"
```
- Query success rate
- Parse time (should be <3s)
- Common query patterns
- Error types
- User engagement
```

---

## 🛠️ Technical Deep Dive

### Files to Show
1. **`src/app/api/parse-query/route.ts`**
   - System prompt design
   - Anthropic SDK usage
   - Validation logic

2. **`src/app/components/CorrelationChart.tsx`**
   - State management
   - Loading states
   - Error handling

3. **`src/types/query.ts`**
   - TypeScript types
   - Constants
   - Metric aliases

### Architecture Diagram (Verbal)
```
User Input → Parse API → Claude AI → Validation
  → Correlation API → Supabase → Chart Render
```

### Key Code Snippets

**System Prompt (lines 13-72 in parse-query/route.ts)**
- Lists valid tickers/metrics
- Defines output format
- Handles ambiguity

**Validation (lines 142-189 in parse-query/route.ts)**
- Checks ticker against VALID_TICKERS
- Validates both metrics
- Validates date formats

**Search Interface (lines 128-180 in CorrelationChart.tsx)**
- Form submission
- Loading states
- Error display
- Example queries

---

## 🎨 UI/UX Highlights

### Visual Elements
- **Search Bar**: Large, prominent, placeholder text
- **Blue Button**: Disabled when empty/loading
- **Example Pills**: Gray, rounded, clickable
- **Blue Badge**: Shows parsed parameters
- **Red Error Box**: Clear, actionable
- **Emoji Indicators**: 🟢🟡⚪ for correlation strength

### Loading States
1. **"Analyzing..."**: During Claude API call
2. **"Updating chart..."**: During data fetch
3. Button shows "Analyzing..." instead of "Search"

### Error Messages
```
❌ Invalid ticker. Available: AAPL, AMZN, DELL...
✅ Try: "Show correlation between job postings and price for AAPL"
```

---

## 📊 Data Points to Mention

- **12 tickers**: AAPL, AMZN, DELL, GOOGL, JNJ, META, MSFT, NKE, NVDA, TSLA, UBER, V
- **11 metrics**: price, job_posts, reddit_mentions, etc.
- **~12,080 records**: ~1,000 per ticker
- **Date range**: 2024-present
- **Correlation**: Pearson coefficient (-1 to +1)

---

## 🚫 Don't Say

- ❌ "It's perfect" (discuss limitations)
- ❌ "AI does everything" (emphasize validation)
- ❌ "It always works" (show error handling)
- ❌ "I didn't test it" (show test script)

## ✅ Do Say

- ✅ "I validated AI output against whitelists"
- ✅ "Error handling at every layer"
- ✅ "TypeScript for type safety"
- ✅ "Future: cache queries, add more metrics"
- ✅ "Tested with example queries and edge cases"

---

## 🎯 If They Want More Detail

### Prompt Engineering
```
Show SYSTEM_PROMPT in parse-query/route.ts
- Structured instructions for Claude
- Examples of input → output
- Confidence scoring logic
```

### Error Handling Strategy
```
Layer 1: Client validation (empty query)
Layer 2: API validation (request structure)
Layer 3: Claude output parsing
Layer 4: Whitelist validation
Layer 5: Supabase error handling
```

### TypeScript Benefits
```
- ParsedQuery interface
- Type-safe API responses
- Auto-completion in IDE
- Catch errors at compile time
```

---

## 🔮 Future Enhancements to Mention

1. **Multi-ticker comparison**: "Compare AAPL vs TSLA"
2. **Query history**: Save and recall past queries
3. **Voice input**: Speech-to-text
4. **Advanced stats**: R², p-values
5. **Export results**: Download CSV/PNG
6. **Query caching**: Redis for common queries
7. **Auto-suggestions**: As-you-type predictions

---

## 🧪 If They Want to See Testing

### Run Test Script
```bash
# Terminal 1
npm run dev

# Terminal 2
node test-api.js
```

Shows:
- ✅ Parse query works
- ✅ Correlation API works
- ✅ End-to-end flow succeeds

---

## 📈 If Asked About Metrics

### Success Metrics
- Query success rate: >90%
- Parse time: <3 seconds
- User satisfaction: NPS score
- Error rate: <10%

### Business Metrics
- Time saved per query
- Increase in dashboard usage
- User engagement rate
- Feature adoption

### Technical Metrics
- API response times
- Claude API costs
- Database query performance
- Error types distribution

---

## 🎬 Closing Statement

"This feature demonstrates my ability to:
1. Integrate AI effectively with proper validation
2. Design intuitive user interfaces
3. Write production-ready TypeScript code
4. Handle errors gracefully
5. Think about scalability

I'd love to extend this with multi-ticker comparisons and query caching if given more time."

---

## ⚡ Emergency Backup

### If Demo Breaks
1. Show code instead
2. Walk through architecture
3. Explain what SHOULD happen
4. Show test results from earlier

### If Claude API Fails
"This is why validation is critical. In production I'd:
- Implement retry logic
- Show cached results
- Gracefully degrade to manual selection"

### If They Skip Demo
"Here's the code walkthrough..." (go to parse-query/route.ts)

---

## 🎯 Remember

- **Be confident**: You built something impressive
- **Show enthusiasm**: Talk about what you learned
- **Admit limitations**: Shows maturity
- **Suggest improvements**: Shows product thinking
- **Ask questions**: Show curiosity about their use case

---

## 📱 Quick Commands

```bash
# Start dev server
npm run dev

# Run tests
node test-api.js

# Build for production
npm run build

# Check environment
cat .env.local

# View types
cat src/types/query.ts
```

---

**You got this! 🚀**
