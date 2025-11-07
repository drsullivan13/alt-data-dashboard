// types/query.ts
export interface ParsedQuery {
  ticker?: string // Legacy: single ticker (for backwards compatibility)
  tickers?: string[] // New: multiple tickers for comparison
  metricX: string
  metricY: string
  startDate?: string
  endDate?: string
}

export interface ParseQueryRequest {
  query: string
}

export interface ParseQueryResponse {
  success: boolean
  parsed?: ParsedQuery
  error?: string
  confidence?: 'high' | 'medium' | 'low'
  suggestions?: string[]
}

// Multi-stock comparison types
export interface CompareRequest {
  tickers: string[]
  metricX: string
  metricY: string
  startDate?: string
  endDate?: string
}

export interface CompareResult {
  ticker: string
  correlation: number
  dataPoints: number
  data: Array<{ date: string; x: number; y: number }>
}

export interface CompareResponse {
  success: boolean
  metricX: string
  metricY: string
  results: CompareResult[]
  error?: string
}

export const VALID_TICKERS = [
  'AAPL', 'AMZN', 'DELL', 'GOOGL', 'JNJ', 'META', 
  'MSFT', 'NKE', 'NVDA', 'TSLA', 'UBER', 'V'
] as const

export const VALID_METRICS = [
  'price',
  'job_posts',
  'reddit_mentions',
  'twitter_mentions',
  'reddit_sentiment',
  'twitter_followers',
  'employees_linkedin',
  'ai_score_employment',
  'ai_score_overall',
  'stocktwits_sentiment',
  'news_mentions'
] as const

export type Ticker = typeof VALID_TICKERS[number]
export type Metric = typeof VALID_METRICS[number]

export const METRIC_ALIASES: Record<string, Metric> = {
  // Price aliases
  'stock price': 'price',
  'share price': 'price',
  'stock': 'price',
  'price': 'price',
  
  // Job aliases
  'job posts': 'job_posts',
  'job postings': 'job_posts',
  'jobs': 'job_posts',
  'hiring': 'job_posts',
  'employment': 'job_posts',
  
  // Reddit aliases
  'reddit mentions': 'reddit_mentions',
  'reddit': 'reddit_mentions',
  'reddit sentiment': 'reddit_sentiment',
  
  // Twitter aliases
  'twitter mentions': 'twitter_mentions',
  'twitter': 'twitter_mentions',
  'twitter followers': 'twitter_followers',
  'twitter engagement': 'twitter_mentions',
  
  // Employee aliases
  'employees': 'employees_linkedin',
  'employee count': 'employees_linkedin',
  'headcount': 'employees_linkedin',
  
  // AI Score aliases
  'ai score': 'ai_score_overall',
  'employment score': 'ai_score_employment',
  'ai employment': 'ai_score_employment',
  
  // StockTwits aliases
  'stocktwits': 'stocktwits_sentiment',
  'stocktwits sentiment': 'stocktwits_sentiment',
  
  // News aliases
  'news': 'news_mentions',
  'news mentions': 'news_mentions',
  'media coverage': 'news_mentions'
}
