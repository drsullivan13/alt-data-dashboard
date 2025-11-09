// metricDisplay.ts
// UI-level display name mapping to obfuscate internal metric names

import type { Metric } from '@/types/query'

/**
 * Maps internal metric names (database/API) to user-facing display names
 * This allows us to hide the true data sources while keeping backend unchanged
 */
export const METRIC_DISPLAY_NAMES: Record<Metric, string> = {
  // Unchanged metrics
  price: 'Price',
  job_posts: 'Job Posts',
  news_mentions: 'News Mentions',

  // Obfuscated metrics (hide data sources)
  reddit_mentions: 'Community Activity Index',
  twitter_mentions: 'Social Velocity',
  reddit_sentiment: 'Sentiment Alpha',
  twitter_followers: 'Social Reach Metric',
  employees_linkedin: 'Workforce Index',
  ai_score_employment: 'Hiring Momentum Score',
  ai_score_overall: 'Composite Signal',
  stocktwits_sentiment: 'Investor Sentiment Index',
}

/**
 * Converts internal metric name to user-facing display name
 * @param internalMetric - The internal metric name (e.g., 'twitter_mentions')
 * @returns User-facing display name (e.g., 'Social Velocity')
 */
export function getDisplayName(internalMetric: string): string {
  // Check if it's a valid metric with a display name
  if (internalMetric in METRIC_DISPLAY_NAMES) {
    return METRIC_DISPLAY_NAMES[internalMetric as Metric]
  }

  // Fallback: convert snake_case to Title Case
  return internalMetric
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Converts user-facing display name back to internal metric name
 * Useful for reverse lookups if needed
 * @param displayName - The display name (e.g., 'Social Velocity')
 * @returns Internal metric name (e.g., 'twitter_mentions') or undefined if not found
 */
export function getInternalMetric(displayName: string): string | undefined {
  const entry = Object.entries(METRIC_DISPLAY_NAMES).find(
    ([_, display]) => display === displayName
  )
  return entry?.[0]
}

/**
 * Legacy function name for backwards compatibility
 * Use getDisplayName() instead
 */
export function formatMetricName(metric: string): string {
  return getDisplayName(metric)
}
