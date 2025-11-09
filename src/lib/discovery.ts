export function getCorrelationStrength(r: number): 'strong' | 'moderate' | 'weak' {
  const abs = Math.abs(r)
  if (abs >= 0.7) return 'strong'
  if (abs >= 0.4) return 'moderate'
  return 'weak'
}

export function getStrengthEmoji(strength: 'strong' | 'moderate' | 'weak'): string {
  if (strength === 'strong') return '🟢'
  if (strength === 'moderate') return '🟡'
  return '⚪'
}

export function getStrengthLabel(r: number): string {
  const abs = Math.abs(r)
  const direction = r >= 0 ? 'positive' : 'negative'
  
  if (abs >= 0.7) return `Strong ${direction}`
  if (abs >= 0.4) return `Moderate ${direction}`
  return 'Weak'
}

export function formatMetricName(metric: string): string {
  return metric
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
