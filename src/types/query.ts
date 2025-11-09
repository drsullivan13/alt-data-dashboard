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

// Discovery types
export interface DiscoveryResult {
  metric: string
  correlation: number
  dataPoints: number
  strength: 'strong' | 'moderate' | 'weak'
}

export interface DiscoveryTopResult {
  metric: string
  correlation: number
  data: Array<{ date: string; x: number; y: number }>
}

export interface DiscoverRequest {
  ticker: string
  startDate?: string
  endDate?: string
}

export interface DiscoverResponse {
  success: boolean
  ticker: string
  results: DiscoveryResult[]
  topResult: DiscoveryTopResult
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

  // Reddit aliases (including obfuscated display names)
  'reddit mentions': 'reddit_mentions',
  'reddit': 'reddit_mentions',
  'community activity index': 'reddit_mentions',
  'Community Activity Index': 'reddit_mentions',
  'reddit sentiment': 'reddit_sentiment',
  'sentiment alpha': 'reddit_sentiment',
  'Sentiment Alpha': 'reddit_sentiment',

  // Twitter aliases (including obfuscated display names)
  'twitter mentions': 'twitter_mentions',
  'twitter': 'twitter_mentions',
  'social velocity': 'twitter_mentions',
  'Social Velocity': 'twitter_mentions',
  'twitter followers': 'twitter_followers',
  'twitter engagement': 'twitter_mentions',
  'social reach metric': 'twitter_followers',
  'Social Reach Metric': 'twitter_followers',

  // Employee aliases (including obfuscated display names)
  'employees': 'employees_linkedin',
  'employee count': 'employees_linkedin',
  'headcount': 'employees_linkedin',
  'workforce index': 'employees_linkedin',
  'Workforce Index': 'employees_linkedin',

  // AI Score aliases (including obfuscated display names)
  'ai score': 'ai_score_overall',
  'composite signal': 'ai_score_overall',
  'Composite Signal': 'ai_score_overall',
  'employment score': 'ai_score_employment',
  'ai employment': 'ai_score_employment',
  'hiring momentum score': 'ai_score_employment',
  'Hiring Momentum Score': 'ai_score_employment',

  // StockTwits aliases (including obfuscated display names)
  'stocktwits': 'stocktwits_sentiment',
  'stocktwits sentiment': 'stocktwits_sentiment',
  'investor sentiment index': 'stocktwits_sentiment',
  'Investor Sentiment Index': 'stocktwits_sentiment',

  // News aliases
  'news': 'news_mentions',
  'news mentions': 'news_mentions',
  'media coverage': 'news_mentions'
}
