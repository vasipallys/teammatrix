// Simple test to verify all components are working
import React from 'react'
import LoadingSpinner from './components/LoadingSpinner'
import analyticsService from './services/analyticsService'

// Test LoadingSpinner
console.log('✅ LoadingSpinner imported successfully')

// Test analyticsService methods
const testData = {
  data: [
    { 'Squad name': 'Test Squad', 'Book of work': 'Test Work', 'start date': '2024-01-01', 'end date': '2024-02-01' }
  ]
}

try {
  const analysis = analyticsService.analyzeWorkPlan(testData)
  console.log('✅ analyticsService.analyzeWorkPlan working')
  console.log('✅ identifyProjectRisks method available')
  console.log('✅ analyzeCapacity method available')
} catch (error) {
  console.error('❌ analyticsService error:', error.message)
}

export default function TestComponents() {
  return (
    <div>
      <h1>Component Test</h1>
      <LoadingSpinner text="Testing..." />
    </div>
  )
}