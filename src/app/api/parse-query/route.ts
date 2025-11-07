// app/api/parse-query/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { VALID_TICKERS, VALID_METRICS, type ParsedQuery } from '@/types/query'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `You are a financial data query parser. Your job is to extract structured parameters from natural language queries about stock correlations.

AVAILABLE TICKERS: ${VALID_TICKERS.join(', ')}
AVAILABLE METRICS: ${VALID_METRICS.join(', ')}

METRIC DESCRIPTIONS:
- price: Stock price
- job_posts: Number of job postings
- reddit_mentions: Reddit post mentions
- twitter_mentions: Twitter/X mentions
- reddit_sentiment: Reddit sentiment score
- twitter_followers: Twitter follower count
- employees_linkedin: Employee count from LinkedIn
- ai_score_employment: AI employment signal score
- ai_score_overall: Overall AI score
- stocktwits_sentiment: StockTwits sentiment
- news_mentions: News article mentions

Your task is to parse queries and return ONLY valid JSON. For single-stock queries, use this format:
{
  "ticker": "AAPL",
  "metricX": "job_posts",
  "metricY": "price",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "confidence": "high"
}

For multi-stock comparison queries, use this format:
{
  "tickers": ["TSLA", "NVDA"],
  "metricX": "reddit_sentiment",
  "metricY": "price",
  "startDate": "2024-01-01",
  "confidence": "high"
}

RULES:
1. If query mentions multiple stocks (e.g., "compare TSLA vs NVDA"), use "tickers" array (not "ticker")
2. If query mentions only one stock, use "ticker" string (not "tickers")
3. tickers array MUST contain 1-3 tickers ONLY (no more than 3 for chart readability)
4. All tickers MUST be from the available tickers list (uppercase)
5. metricX and metricY MUST be from the available metrics list (lowercase with underscores)
6. Dates should be in YYYY-MM-DD format (optional, only if mentioned)
7. confidence should be "high", "medium", or "low" based on query clarity
8. For queries about "X vs Y", X should be metricX and Y should be metricY
9. Common mappings:
   - "job postings", "jobs", "hiring" → job_posts
   - "stock price", "price", "share price" → price
   - "reddit", "reddit mentions" → reddit_mentions
   - "twitter", "twitter mentions" → twitter_mentions
   - "employees", "employee count", "headcount" → employees_linkedin
   - "sentiment" (from reddit) → reddit_sentiment
   - "sentiment" (from stocktwits) → stocktwits_sentiment
10. If a date range like "since 2024" is mentioned, set startDate to "2024-01-01"
11. If query is ambiguous, set confidence to "medium" or "low"
12. Keywords like "compare", "vs", "versus", "between" indicate multi-stock queries

EXAMPLES:
- "Show AAPL job postings vs price" → use "ticker": "AAPL"
- "Compare TSLA vs NVDA Reddit sentiment" → use "tickers": ["TSLA", "NVDA"]
- "How do AAPL, MSFT, and GOOGL compare on hiring?" → use "tickers": ["AAPL", "MSFT", "GOOGL"]

Return ONLY the JSON object, no other text or explanation.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

    // Call Anthropic API - Using Haiku 4.5 (latest) for speed and cost efficiency
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Parse this query: "${query}"`
        }
      ]
    })

    // Extract the text response
    const textContent = message.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse the JSON response
    let parsed: ParsedQuery & { confidence?: string }
    try {
      // Remove any markdown code blocks if present
      let jsonText = textContent.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
      }
      parsed = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', textContent.text)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to parse query. Please try rephrasing.',
          suggestions: [
            'Try: "Show correlation between job postings and price for AAPL"',
            'Try: "Compare Reddit sentiment vs stock price for TSLA"'
          ]
        },
        { status: 400 }
      )
    }

    // Validate the parsed response
    const validation = validateParsedQuery(parsed)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          suggestions: validation.suggestions
        },
        { status: 400 }
      )
    }

    // Return successful parse (support both single and multi-ticker formats)
    return NextResponse.json({
      success: true,
      parsed: {
        ticker: parsed.ticker,
        tickers: parsed.tickers,
        metricX: parsed.metricX,
        metricY: parsed.metricY,
        startDate: parsed.startDate,
        endDate: parsed.endDate
      },
      confidence: parsed.confidence || 'medium'
    })

  } catch (error) {
    console.error('Parse query error:', error)
    
    // Check if it's an Anthropic API error
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { 
          success: false, 
          error: `AI service error: ${error.message}` 
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function validateParsedQuery(parsed: any): { 
  valid: boolean
  error?: string
  suggestions?: string[]
} {
  // Check if we have either ticker or tickers (but not both)
  const hasSingleTicker = parsed.ticker && !parsed.tickers
  const hasMultipleTickers = parsed.tickers && Array.isArray(parsed.tickers)
  
  if (!hasSingleTicker && !hasMultipleTickers) {
    return {
      valid: false,
      error: 'Must specify either a single ticker or an array of tickers',
      suggestions: [
        'Try: "Show AAPL job postings vs price"',
        'Try: "Compare TSLA vs NVDA Reddit sentiment"'
      ]
    }
  }
  
  // Validate single ticker
  if (hasSingleTicker) {
    if (!VALID_TICKERS.includes(parsed.ticker.toUpperCase())) {
      return {
        valid: false,
        error: `Invalid ticker: ${parsed.ticker}. Available: ${VALID_TICKERS.join(', ')}`,
        suggestions: [
          'Make sure to specify a valid ticker symbol (AAPL, TSLA, etc.)',
          'Try: "Show AAPL job postings vs price"'
        ]
      }
    }
  }
  
  // Validate multiple tickers
  if (hasMultipleTickers) {
    // CRITICAL: Enforce max 3 tickers for chart readability
    if (parsed.tickers.length > 3) {
      const suggestedTickers = parsed.tickers.slice(0, 3)
      return {
        valid: false,
        error: `For chart readability, please limit comparisons to 3 stocks. Try comparing: ${suggestedTickers.join(', ')}`,
        suggestions: [
          `Try: "Compare ${suggestedTickers.slice(0, 2).join(' vs ')} ${parsed.metricX || 'metrics'}"`,
          'Tip: Compare up to 3 stocks at once for best readability'
        ]
      }
    }
    
    if (parsed.tickers.length === 0) {
      return {
        valid: false,
        error: 'tickers array cannot be empty',
        suggestions: ['Try: "Compare TSLA vs NVDA Reddit sentiment"']
      }
    }
    
    // Validate each ticker in the array
    for (const ticker of parsed.tickers) {
      if (!VALID_TICKERS.includes(ticker.toUpperCase())) {
        return {
          valid: false,
          error: `Invalid ticker in comparison: ${ticker}. Available: ${VALID_TICKERS.join(', ')}`,
          suggestions: [
            'Make sure all tickers are valid (AAPL, TSLA, NVDA, etc.)',
            'Try: "Compare AAPL vs MSFT job postings"'
          ]
        }
      }
    }
    
    // Normalize tickers to uppercase
    parsed.tickers = parsed.tickers.map((t: string) => t.toUpperCase())
  }

  // Check metricX
  if (!parsed.metricX || !VALID_METRICS.includes(parsed.metricX)) {
    return {
      valid: false,
      error: `Invalid metricX: ${parsed.metricX}. Available metrics: ${VALID_METRICS.join(', ')}`,
      suggestions: [
        'Common metrics: price, job_posts, reddit_mentions, twitter_mentions',
        'Try: "Compare job postings and price for AAPL"'
      ]
    }
  }

  // Check metricY
  if (!parsed.metricY || !VALID_METRICS.includes(parsed.metricY)) {
    return {
      valid: false,
      error: `Invalid metricY: ${parsed.metricY}. Available metrics: ${VALID_METRICS.join(', ')}`,
      suggestions: [
        'Common metrics: price, job_posts, reddit_mentions, twitter_mentions',
        'Try: "Compare job postings and price for AAPL"'
      ]
    }
  }

  // Check dates if provided
  if (parsed.startDate && !isValidDate(parsed.startDate)) {
    return {
      valid: false,
      error: 'Invalid startDate format. Use YYYY-MM-DD',
      suggestions: ['Try: "since 2024" or "from January 2024"']
    }
  }

  if (parsed.endDate && !isValidDate(parsed.endDate)) {
    return {
      valid: false,
      error: 'Invalid endDate format. Use YYYY-MM-DD',
      suggestions: ['Try: "until December 2024"']
    }
  }

  return { valid: true }
}

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}
