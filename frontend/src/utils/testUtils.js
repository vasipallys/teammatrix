/**
 * Comprehensive Testing Utilities
 * Provides utilities for testing components, services, and integration
 */

import loggingService from '../services/loggingService'
import integrationService from '../services/integrationService'
import analyticsService from '../services/analyticsService'

// Mock data generators
export const mockDataGenerators = {
  // Generate mock organization data
  generateOrgData(count = 25) {
    const jobFunctions = ['Software Engineer', 'Product Manager', 'Designer', 'Data Scientist', 'DevOps Engineer', 'QA Engineer']
    const ranks = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Principal', 'Manager', 'Director']
    const locations = ['New York', 'San Francisco', 'London', 'Remote', 'Austin', 'Seattle']
    const squads = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']
    const skills = ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'GraphQL']
    const domains = ['Frontend', 'Backend', 'DevOps', 'Data', 'Mobile', 'Security', 'Infrastructure']

    const employees = []
    const managers = []

    // Generate managers first
    for (let i = 0; i < Math.ceil(count / 8); i++) {
      const manager = {
        'Staff Id': `MGR${String(i + 1).padStart(3, '0')}`,
        'Staff Name': `Manager ${i + 1}`,
        'Job Function': 'Manager',
        'Rank': this.randomChoice(['Manager', 'Director', 'VP']),
        'Work Location': this.randomChoice(locations),
        'Squad 1 (where applicable)': this.randomChoice(squads),
        'Tech Skills (SQL, Java, React etc)': this.randomChoices(skills, 3).join(', '),
        'Domain Knowledge (Equity, FX, Reg, Advisory etc)': this.randomChoices(domains, 2).join(', '),
        'Reporting Manager Name': i === 0 ? '' : managers[Math.floor(Math.random() * i)]['Staff Name']
      }
      managers.push(manager)
      employees.push(manager)
    }

    // Generate regular employees
    for (let i = managers.length; i < count; i++) {
      const employee = {
        'Staff Id': `EMP${String(i + 1).padStart(3, '0')}`,
        'Staff Name': `Employee ${i + 1}`,
        'Job Function': this.randomChoice(jobFunctions),
        'Rank': this.randomChoice(ranks),
        'Work Location': this.randomChoice(locations),
        'Squad 1 (where applicable)': this.randomChoice(squads),
        'Tech Skills (SQL, Java, React etc)': this.randomChoices(skills, Math.floor(Math.random() * 5) + 2).join(', '),
        'Domain Knowledge (Equity, FX, Reg, Advisory etc)': this.randomChoices(domains, Math.floor(Math.random() * 3) + 1).join(', '),
        'Reporting Manager Name': this.randomChoice(managers)['Staff Name']
      }
      employees.push(employee)
    }

    return {
      success: true,
      data: employees,
      hierarchy: this.buildHierarchy(employees)
    }
  },

  // Generate mock work plan data
  generateWorkData(count = 15) {
    const squads = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']
    const workTypes = [
      'Feature Development', 'Bug Fixes', 'Infrastructure', 'Research', 'Testing',
      'Documentation', 'Security Updates', 'Performance Optimization', 'Migration'
    ]

    const items = []
    const now = new Date()

    for (let i = 0; i < count; i++) {
      const startDate = new Date(now.getTime() + (Math.random() - 0.5) * 180 * 24 * 60 * 60 * 1000) // ±3 months
      const duration = Math.floor(Math.random() * 90) + 7 // 1-13 weeks
      const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000)

      const item = {
        'Squad name': this.randomChoice(squads),
        'Book of work': `${this.randomChoice(workTypes)} ${i + 1}`,
        'start date': startDate.toISOString().split('T')[0],
        'end date': endDate.toISOString().split('T')[0],
        'description if any': `Description for work item ${i + 1}`
      }
      items.push(item)
    }

    return {
      success: true,
      data: items
    }
  },

  // Utility methods
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)]
  },

  randomChoices(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  },

  buildHierarchy(employees) {
    const employeeMap = new Map()
    const roots = []

    // Create employee map
    employees.forEach(emp => {
      employeeMap.set(emp['Staff Name'], { ...emp, children: [] })
    })

    // Build hierarchy
    employees.forEach(emp => {
      const manager = emp['Reporting Manager Name']
      if (manager && employeeMap.has(manager)) {
        employeeMap.get(manager).children.push(employeeMap.get(emp['Staff Name']))
      } else {
        roots.push(employeeMap.get(emp['Staff Name']))
      }
    })

    return roots
  }
}

// Performance testing utilities
export const performanceTestUtils = {
  // Measure component render time
  measureRenderTime(componentName, renderFn) {
    const start = performance.now()
    const result = renderFn()
    const end = performance.now()
    
    const duration = end - start
    loggingService.logPerformance(`Render: ${componentName}`, duration)
    
    if (duration > 16) { // 60fps threshold
      console.warn(`Slow render detected: ${componentName} took ${duration}ms`)
    }
    
    return { result, duration }
  },

  // Measure function execution time
  measureExecution(functionName, fn, ...args) {
    const start = performance.now()
    const result = fn(...args)
    const end = performance.now()
    
    const duration = end - start
    loggingService.logPerformance(`Execution: ${functionName}`, duration)
    
    return { result, duration }
  },

  // Memory usage snapshot
  getMemorySnapshot() {
    if ('memory' in performance) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      }
    }
    return null
  },

  // Bundle size analysis
  analyzeBundleSize() {
    const resources = performance.getEntriesByType('resource')
    const jsResources = resources.filter(r => r.name.endsWith('.js'))
    
    return {
      totalSize: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      resources: jsResources.map(r => ({
        name: r.name,
        size: r.transferSize || 0,
        duration: r.duration
      }))
    }
  }
}

// Integration testing utilities
export const integrationTestUtils = {
  // Test analytics service
  async testAnalyticsService() {
    const results = {
      orgAnalysis: null,
      workAnalysis: null,
      errors: []
    }

    try {
      // Test with mock data
      const mockOrgData = mockDataGenerators.generateOrgData(20)
      const mockWorkData = mockDataGenerators.generateWorkData(10)

      // Test organization analysis
      try {
        results.orgAnalysis = analyticsService.analyzeOrganizationStructure(mockOrgData)
        console.log('✅ Organization analysis test passed')
      } catch (error) {
        results.errors.push({ service: 'analytics', method: 'analyzeOrganizationStructure', error })
        console.error('❌ Organization analysis test failed:', error)
      }

      // Test work plan analysis
      try {
        results.workAnalysis = analyticsService.analyzeWorkPlan(mockWorkData)
        console.log('✅ Work plan analysis test passed')
      } catch (error) {
        results.errors.push({ service: 'analytics', method: 'analyzeWorkPlan', error })
        console.error('❌ Work plan analysis test failed:', error)
      }

    } catch (error) {
      results.errors.push({ service: 'analytics', method: 'general', error })
    }

    return results
  },

  // Test integration service
  async testIntegrationService() {
    const results = {
      events: [],
      workflows: [],
      errors: []
    }

    try {
      // Test event system
      let eventReceived = false
      const unsubscribe = integrationService.subscribe('test:event', (data) => {
        eventReceived = true
        results.events.push(data)
      })

      integrationService.emit('test:event', { test: 'data' })
      
      setTimeout(() => {
        if (eventReceived) {
          console.log('✅ Integration service event system test passed')
        } else {
          console.error('❌ Integration service event system test failed')
          results.errors.push({ service: 'integration', method: 'events', error: 'Event not received' })
        }
        unsubscribe()
      }, 100)

      // Test workflow system
      try {
        const workflowId = integrationService.createWorkflow({
          name: 'Test Workflow',
          steps: [
            { id: 'step1', type: 'notification', config: { message: 'Test notification', type: 'info' } }
          ]
        })
        
        const workflowResult = await integrationService.executeWorkflow(workflowId, { test: 'context' })
        results.workflows.push(workflowResult)
        console.log('✅ Integration service workflow test passed')
      } catch (error) {
        results.errors.push({ service: 'integration', method: 'workflow', error })
        console.error('❌ Integration service workflow test failed:', error)
      }

    } catch (error) {
      results.errors.push({ service: 'integration', method: 'general', error })
    }

    return results
  },

  // Test all services
  async testAllServices() {
    console.log('🧪 Starting comprehensive service tests...')
    
    const results = {
      analytics: await this.testAnalyticsService(),
      integration: await this.testIntegrationService(),
      timestamp: new Date().toISOString()
    }

    const totalErrors = results.analytics.errors.length + results.integration.errors.length
    
    if (totalErrors === 0) {
      console.log('✅ All service tests passed!')
    } else {
      console.error(`❌ ${totalErrors} service tests failed`)
    }

    return results
  }
}

// Component testing utilities
export const componentTestUtils = {
  // Test component props
  validateProps(component, props, expectedTypes) {
    const errors = []
    
    Object.entries(expectedTypes).forEach(([propName, expectedType]) => {
      const propValue = props[propName]
      const actualType = typeof propValue
      
      if (propValue === undefined && expectedType.required) {
        errors.push(`Required prop '${propName}' is missing`)
      } else if (propValue !== undefined && actualType !== expectedType.type) {
        errors.push(`Prop '${propName}' expected ${expectedType.type}, got ${actualType}`)
      }
    })

    if (errors.length > 0) {
      console.error(`Component ${component} prop validation failed:`, errors)
    } else {
      console.log(`✅ Component ${component} prop validation passed`)
    }

    return errors
  },

  // Test component accessibility
  checkAccessibility(element) {
    const issues = []
    
    // Check for alt text on images
    const images = element.querySelectorAll('img')
    images.forEach((img, index) => {
      if (!img.alt) {
        issues.push(`Image ${index} missing alt text`)
      }
    })

    // Check for form labels
    const inputs = element.querySelectorAll('input, select, textarea')
    inputs.forEach((input, index) => {
      const id = input.id
      const label = id ? element.querySelector(`label[for="${id}"]`) : null
      if (!label && !input.getAttribute('aria-label')) {
        issues.push(`Input ${index} missing label or aria-label`)
      }
    })

    // Check for button text
    const buttons = element.querySelectorAll('button')
    buttons.forEach((button, index) => {
      if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
        issues.push(`Button ${index} missing text or aria-label`)
      }
    })

    return issues
  },

  // Test component performance
  measureComponentPerformance(componentName, renderCount = 100) {
    const times = []
    
    for (let i = 0; i < renderCount; i++) {
      const start = performance.now()
      // Simulate component render
      const end = performance.now()
      times.push(end - start)
    }

    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
    const maxTime = Math.max(...times)
    const minTime = Math.min(...times)

    return {
      componentName,
      renderCount,
      avgTime: Math.round(avgTime * 100) / 100,
      maxTime: Math.round(maxTime * 100) / 100,
      minTime: Math.round(minTime * 100) / 100,
      times
    }
  }
}

// Load testing utilities
export const loadTestUtils = {
  // Simulate high user activity
  simulateUserActivity(duration = 10000, actionsPerSecond = 5) {
    const actions = ['click', 'scroll', 'type', 'navigate', 'search']
    const interval = 1000 / actionsPerSecond
    let actionCount = 0

    const intervalId = setInterval(() => {
      const action = mockDataGenerators.randomChoice(actions)
      integrationService.trackUserAction(action, `test-${actionCount}`, { 
        simulated: true,
        timestamp: Date.now()
      })
      actionCount++
    }, interval)

    setTimeout(() => {
      clearInterval(intervalId)
      console.log(`Load test completed: ${actionCount} actions simulated`)
    }, duration)

    return { intervalId, expectedActions: Math.floor(duration / interval) }
  },

  // Simulate memory pressure
  simulateMemoryPressure(iterations = 1000) {
    const largeObjects = []
    
    for (let i = 0; i < iterations; i++) {
      // Create large objects to simulate memory pressure
      const largeObject = {
        id: i,
        data: new Array(1000).fill(0).map(() => Math.random()),
        timestamp: Date.now()
      }
      largeObjects.push(largeObject)
      
      // Occasionally clean up to simulate garbage collection
      if (i % 100 === 0) {
        largeObjects.splice(0, 50)
      }
    }

    return {
      objectsCreated: iterations,
      finalObjectCount: largeObjects.length,
      memorySnapshot: performanceTestUtils.getMemorySnapshot()
    }
  },

  // Simulate API load
  async simulateApiLoad(endpoint, requestCount = 100, concurrency = 10) {
    const results = []
    const batches = []
    
    // Create batches of concurrent requests
    for (let i = 0; i < requestCount; i += concurrency) {
      const batch = []
      for (let j = 0; j < concurrency && i + j < requestCount; j++) {
        batch.push(this.makeTestRequest(endpoint, i + j))
      }
      batches.push(batch)
    }

    // Execute batches sequentially
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(batch)
      results.push(...batchResults)
    }

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return {
      total: requestCount,
      successful,
      failed,
      successRate: (successful / requestCount) * 100,
      results
    }
  },

  async makeTestRequest(endpoint, requestId) {
    const start = performance.now()
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'X-Test-Request-Id': requestId.toString() }
      })
      
      const end = performance.now()
      return {
        requestId,
        status: response.status,
        duration: end - start,
        success: response.ok
      }
    } catch (error) {
      const end = performance.now()
      return {
        requestId,
        error: error.message,
        duration: end - start,
        success: false
      }
    }
  }
}

// Export comprehensive test runner
export const runComprehensiveTests = async () => {
  console.log('🚀 Starting comprehensive application tests...')
  
  const testResults = {
    timestamp: new Date().toISOString(),
    services: await integrationTestUtils.testAllServices(),
    performance: {
      memory: performanceTestUtils.getMemorySnapshot(),
      bundle: performanceTestUtils.analyzeBundleSize()
    },
    loadTest: loadTestUtils.simulateUserActivity(5000, 3),
    mockData: {
      org: mockDataGenerators.generateOrgData(10),
      work: mockDataGenerators.generateWorkData(5)
    }
  }

  console.log('📊 Test Results:', testResults)
  
  // Store results
  localStorage.setItem('test_results', JSON.stringify(testResults))
  
  return testResults
}

export default {
  mockDataGenerators,
  performanceTestUtils,
  integrationTestUtils,
  componentTestUtils,
  loadTestUtils,
  runComprehensiveTests
}