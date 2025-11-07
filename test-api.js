#!/usr/bin/env node
/**
 * Test script for Natural Language Query API
 * Usage: node test-api.js
 */

const BASE_URL = 'http://localhost:3000'

const testQueries = [
  'Show correlation between job postings and price for AAPL',
  'Compare Reddit sentiment vs stock price for TSLA',
  'Does Twitter engagement predict NVDA stock movement?',
  'Show me employment signals vs price for META since 2024'
]

async function testParseQuery(query) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Testing query: "${query}"`)
  console.log('='.repeat(60))

  try {
    // Step 1: Parse the query
    console.log('\n1️⃣  Parsing query with Anthropic...')
    const parseResponse = await fetch(`${BASE_URL}/api/parse-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })

    if (!parseResponse.ok) {
      const error = await parseResponse.json()
      console.error('❌ Parse failed:', error)
      return false
    }

    const parseResult = await parseResponse.json()
    console.log('✅ Parsed successfully:')
    console.log(JSON.stringify(parseResult, null, 2))

    if (!parseResult.success || !parseResult.parsed) {
      console.error('❌ Parse result invalid')
      return false
    }

    // Step 2: Fetch correlation data
    console.log('\n2️⃣  Fetching correlation data...')
    const correlationResponse = await fetch(`${BASE_URL}/api/correlation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parseResult.parsed)
    })

    if (!correlationResponse.ok) {
      const error = await correlationResponse.json()
      console.error('❌ Correlation fetch failed:', error)
      return false
    }

    const correlationResult = await correlationResponse.json()
    console.log('✅ Correlation data retrieved:')
    console.log(`   Ticker: ${correlationResult.ticker}`)
    console.log(`   Metrics: ${correlationResult.metricX} vs ${correlationResult.metricY}`)
    console.log(`   Correlation: ${correlationResult.correlation}`)
    console.log(`   Data Points: ${correlationResult.dataPoints}`)

    return true
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

async function runTests() {
  console.log('\n🚀 Starting Natural Language Query API Tests')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`\nMake sure the dev server is running: npm run dev\n`)

  let passed = 0
  let failed = 0

  for (const query of testQueries) {
    const success = await testParseQuery(query)
    if (success) {
      passed++
    } else {
      failed++
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Results')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${passed}/${testQueries.length}`)
  console.log(`❌ Failed: ${failed}/${testQueries.length}`)
  console.log('')

  process.exit(failed > 0 ? 1 : 0)
}

// Check if server is running
fetch(`${BASE_URL}/api/correlation`, { method: 'POST', body: '{}' })
  .then(() => runTests())
  .catch(() => {
    console.error('\n❌ Error: Cannot connect to development server')
    console.error('Please start the server first: npm run dev')
    process.exit(1)
  })
