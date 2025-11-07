# Deployment Checklist - Natural Language Query Feature

## Pre-Deployment Verification

### ✅ Environment Variables
- [ ] `ANTHROPIC_API_KEY` is set in `.env.local`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] All keys are valid and not expired

### ✅ Code Quality
- [ ] TypeScript compilation passes (`npm run build`)
- [ ] No console errors in browser
- [ ] All imports resolve correctly
- [ ] Types are properly defined

### ✅ API Routes
- [ ] `/api/parse-query` responds to POST requests
- [ ] `/api/correlation` works with parsed parameters
- [ ] Error responses include helpful messages
- [ ] Validation catches invalid inputs

### ✅ UI Components
- [ ] Search bar renders correctly
- [ ] Example queries are clickable
- [ ] Loading states display properly
- [ ] Error messages are user-friendly
- [ ] Chart updates with new data
- [ ] Current query badge shows parsed params

### ✅ Functionality Tests

#### Test 1: Basic Query
1. Enter: "Show correlation between job postings and price for AAPL"
2. Expected: Chart updates with AAPL data, job_posts vs price
3. Status: [ ] Pass / [ ] Fail

#### Test 2: Date Filter
1. Enter: "Show me employment signals vs price for META since 2024"
2. Expected: Chart shows META data from 2024-01-01 onwards
3. Status: [ ] Pass / [ ] Fail

#### Test 3: Example Query Click
1. Click any example query button
2. Expected: Query auto-fills and submits, chart updates
3. Status: [ ] Pass / [ ] Fail

#### Test 4: Invalid Ticker
1. Enter: "Show data for XYZ"
2. Expected: Error message with list of valid tickers
3. Status: [ ] Pass / [ ] Fail

#### Test 5: Empty Query
1. Click Search with empty input
2. Expected: Button is disabled or shows error
3. Status: [ ] Pass / [ ] Fail

## Performance Checks

### API Response Times
- [ ] Parse query: < 3 seconds
- [ ] Correlation fetch: < 1 second
- [ ] Total query time: < 5 seconds

### Browser Console
- [ ] No TypeScript errors
- [ ] No React warnings
- [ ] No failed network requests
- [ ] Appropriate logging only

## Security Review

### API Keys
- [ ] ANTHROPIC_API_KEY not exposed to client
- [ ] Service role key only used server-side
- [ ] No keys in client-side code
- [ ] No keys in git repository

### Input Validation
- [ ] Query length is reasonable (< 500 chars)
- [ ] SQL injection protection (using Supabase client)
- [ ] XSS protection (React escaping)
- [ ] Rate limiting considered

## Documentation

- [ ] README updated with feature description
- [ ] API documentation created
- [ ] Usage guide provided
- [ ] Code comments added where needed

## Production Deployment

### Vercel (or similar)
1. [ ] Environment variables set in dashboard
2. [ ] Build succeeds on platform
3. [ ] No deployment warnings
4. [ ] HTTPS enabled
5. [ ] Domain configured (if applicable)

### Post-Deployment Verification
1. [ ] Open production URL
2. [ ] Test basic query
3. [ ] Check browser console for errors
4. [ ] Verify API responses
5. [ ] Test on mobile device
6. [ ] Check loading times

## Known Limitations

Document these for discussion:
- [ ] Single ticker per query (no multi-ticker comparison yet)
- [ ] Limited to predefined metrics
- [ ] Requires all environment variables
- [ ] Claude API costs per query
- [ ] No query caching implemented

## Interview Demo Flow

### Setup (Before Demo)
1. [ ] Server running
2. [ ] Browser open to localhost:3000
3. [ ] Clear browser cache
4. [ ] Close unnecessary tabs
5. [ ] Prepare example queries

### Demo Script
1. **Introduction**
   - "Built a natural language interface for the dashboard"
   - "Uses Claude AI to parse user queries"
   
2. **Show Default View**
   - "Here's the default correlation chart"
   - Point out the search bar
   
3. **Execute Query**
   - Type: "Show correlation between job postings and price for AAPL"
   - Wait for results
   - Explain what happened
   
4. **Show Example Queries**
   - Click an example button
   - Demonstrate ease of use
   
5. **Handle Errors**
   - Try invalid query
   - Show error handling
   
6. **Explain Architecture**
   - Show code structure
   - Explain API flow
   - Discuss prompt engineering

### Talking Points
- [x] Problem: Manual parameter selection is tedious
- [x] Solution: Natural language interface
- [x] Tech: Next.js API routes + Anthropic Claude
- [x] UX: Progressive enhancement, clear feedback
- [x] Scale: Could support more complex queries

## Rollback Plan

If issues arise:
1. [ ] Revert `.env.local` changes
2. [ ] Remove search interface from component
3. [ ] Keep correlation API working
4. [ ] Deploy previous version
5. [ ] Document issues for future fix

## Success Metrics

After deployment, track:
- [ ] Query success rate
- [ ] Average parsing time
- [ ] Error rate by query type
- [ ] Most common queries
- [ ] User feedback

## Next Steps

Future enhancements to discuss:
- [ ] Query history/favorites
- [ ] Multi-ticker comparison
- [ ] Voice input
- [ ] Auto-suggestions
- [ ] Advanced statistical analysis
- [ ] Export results
- [ ] Share query URLs

---

## Final Sign-Off

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Ready for interview demo
- [ ] Backup plan in place

**Completed by:** _______________  
**Date:** _______________  
**Notes:** _______________
