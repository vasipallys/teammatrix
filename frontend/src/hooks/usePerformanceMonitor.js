import { useState, useEffect, useRef } from 'react'

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    loadTime: 0,
    renderTime: 0,
    networkLatency: 0
  })
  
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const animationFrame = useRef(null)

  // FPS Monitoring
  useEffect(() => {
    const measureFPS = () => {
      frameCount.current++
      const currentTime = performance.now()
      
      if (currentTime - lastTime.current >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount.current * 1000) / (currentTime - lastTime.current))
        }))
        
        frameCount.current = 0
        lastTime.current = currentTime
      }
      
      animationFrame.current = requestAnimationFrame(measureFPS)
    }
    
    animationFrame.current = requestAnimationFrame(measureFPS)
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  // Memory Usage Monitoring
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = performance.memory
        setMetrics(prev => ({
          ...prev,
          memory: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        }))
      }
    }

    const interval = setInterval(measureMemory, 2000)
    measureMemory() // Initial measurement
    
    return () => clearInterval(interval)
  }, [])

  // Page Load Time
  useEffect(() => {
    const measureLoadTime = () => {
      if ('navigation' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0]
        if (navigation) {
          setMetrics(prev => ({
            ...prev,
            loadTime: Math.round(navigation.loadEventEnd - navigation.navigationStart)
          }))
        }
      }
    }

    // Measure after page is fully loaded
    if (document.readyState === 'complete') {
      measureLoadTime()
    } else {
      window.addEventListener('load', measureLoadTime)
      return () => window.removeEventListener('load', measureLoadTime)
    }
  }, [])

  // Network Latency Monitoring
  useEffect(() => {
    const measureLatency = async () => {
      try {
        const start = performance.now()
        await fetch('/api/test', { method: 'HEAD' })
        const end = performance.now()
        
        setMetrics(prev => ({
          ...prev,
          networkLatency: Math.round(end - start)
        }))
      } catch (error) {
        console.warn('Network latency measurement failed:', error)
      }
    }

    // Measure latency every 30 seconds
    const interval = setInterval(measureLatency, 30000)
    measureLatency() // Initial measurement
    
    return () => clearInterval(interval)
  }, [])

  // Render Time Monitoring
  const measureRenderTime = (componentName) => {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      const renderTime = end - start
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime)
      }))
      
      // Log slow renders
      if (renderTime > 16) { // 60fps threshold
        console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`)
      }
    }
  }

  return {
    metrics,
    measureRenderTime
  }
}

export const useResourceMonitor = () => {
  const [resources, setResources] = useState([])

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const resourceData = entries.map(entry => ({
        name: entry.name,
        type: entry.initiatorType,
        size: entry.transferSize || 0,
        duration: Math.round(entry.duration),
        startTime: Math.round(entry.startTime)
      }))
      
      setResources(prev => [...prev, ...resourceData].slice(-50)) // Keep last 50 resources
    })

    observer.observe({ entryTypes: ['resource'] })
    
    return () => observer.disconnect()
  }, [])

  return resources
}

export const useErrorMonitor = () => {
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const handleError = (event) => {
      const error = {
        message: event.error?.message || event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      }
      
      setErrors(prev => [error, ...prev].slice(0, 10)) // Keep last 10 errors
    }

    const handleUnhandledRejection = (event) => {
      const error = {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      }
      
      setErrors(prev => [error, ...prev].slice(0, 10))
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return errors
}

export const useWebVitals = () => {
  const [vitals, setVitals] = useState({
    CLS: null,
    FID: null,
    FCP: null,
    LCP: null,
    TTFB: null
  })

  useEffect(() => {
    // Cumulative Layout Shift
    const observeCLS = () => {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            setVitals(prev => ({ ...prev, CLS: clsValue }))
          }
        }
      })
      observer.observe({ type: 'layout-shift', buffered: true })
      return observer
    }

    // First Input Delay
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          setVitals(prev => ({ ...prev, FID: entry.processingStart - entry.startTime }))
        }
      })
      observer.observe({ type: 'first-input', buffered: true })
      return observer
    }

    // Largest Contentful Paint
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        setVitals(prev => ({ ...prev, LCP: lastEntry.startTime }))
      })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      return observer
    }

    // First Contentful Paint
    const observeFCP = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            setVitals(prev => ({ ...prev, FCP: entry.startTime }))
          }
        }
      })
      observer.observe({ type: 'paint', buffered: true })
      return observer
    }

    // Time to First Byte
    const measureTTFB = () => {
      const navigation = performance.getEntriesByType('navigation')[0]
      if (navigation) {
        setVitals(prev => ({ 
          ...prev, 
          TTFB: navigation.responseStart - navigation.requestStart 
        }))
      }
    }

    const observers = []
    
    try {
      observers.push(observeCLS())
      observers.push(observeFID())
      observers.push(observeLCP())
      observers.push(observeFCP())
      measureTTFB()
    } catch (error) {
      console.warn('Web Vitals monitoring not supported:', error)
    }

    return () => {
      observers.forEach(observer => observer?.disconnect())
    }
  }, [])

  return vitals
}

// Advanced performance monitoring hook
export const useAdvancedPerformanceMonitor = () => {
  const [advancedMetrics, setAdvancedMetrics] = useState({
    bundleSize: 0,
    cacheHitRate: 0,
    apiResponseTimes: [],
    componentRenderCounts: new Map(),
    memoryLeaks: [],
    longTasks: []
  })

  useEffect(() => {
    // Monitor long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      const longTasks = list.getEntries().map(entry => ({
        duration: entry.duration,
        startTime: entry.startTime,
        name: entry.name
      }))
      
      setAdvancedMetrics(prev => ({
        ...prev,
        longTasks: [...prev.longTasks, ...longTasks].slice(-20)
      }))
    })

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    } catch (e) {
      console.warn('Long task monitoring not supported')
    }

    // Monitor API response times
    const resourceObserver = new PerformanceObserver((list) => {
      const apiCalls = list.getEntries()
        .filter(entry => entry.name.includes('/api/'))
        .map(entry => ({
          url: entry.name,
          duration: entry.duration,
          size: entry.transferSize
        }))

      if (apiCalls.length > 0) {
        setAdvancedMetrics(prev => ({
          ...prev,
          apiResponseTimes: [...prev.apiResponseTimes, ...apiCalls].slice(-50)
        }))
      }
    })

    try {
      resourceObserver.observe({ entryTypes: ['resource'] })
    } catch (e) {
      console.warn('Resource monitoring not supported')
    }

    // Monitor memory usage for leaks
    const memoryMonitor = setInterval(() => {
      if ('memory' in performance) {
        const memory = performance.memory
        const currentUsage = memory.usedJSHeapSize / 1024 / 1024
        
        setAdvancedMetrics(prev => {
          const recentUsage = prev.memoryLeaks.slice(-10)
          recentUsage.push({ timestamp: Date.now(), usage: currentUsage })
          
          // Detect potential memory leak (consistent growth)
          if (recentUsage.length >= 5) {
            const trend = recentUsage.slice(-5)
            const isIncreasing = trend.every((point, index) => 
              index === 0 || point.usage > trend[index - 1].usage
            )
            
            if (isIncreasing && trend[4].usage - trend[0].usage > 10) {
              console.warn('Potential memory leak detected')
            }
          }
          
          return {
            ...prev,
            memoryLeaks: recentUsage
          }
        })
      }
    }, 5000)

    return () => {
      longTaskObserver.disconnect()
      resourceObserver.disconnect()
      clearInterval(memoryMonitor)
    }
  }, [])

  // Component render tracking
  const trackComponentRender = (componentName) => {
    setAdvancedMetrics(prev => {
      const newCounts = new Map(prev.componentRenderCounts)
      newCounts.set(componentName, (newCounts.get(componentName) || 0) + 1)
      return {
        ...prev,
        componentRenderCounts: newCounts
      }
    })
  }

  // Calculate performance score
  const getPerformanceScore = () => {
    let score = 100
    
    // Deduct for long tasks
    const recentLongTasks = advancedMetrics.longTasks.filter(
      task => Date.now() - task.startTime < 60000 // Last minute
    )
    score -= recentLongTasks.length * 5
    
    // Deduct for slow API calls
    const slowApiCalls = advancedMetrics.apiResponseTimes.filter(
      call => call.duration > 1000
    )
    score -= slowApiCalls.length * 3
    
    // Deduct for memory growth
    if (advancedMetrics.memoryLeaks.length > 5) {
      const memoryGrowth = advancedMetrics.memoryLeaks[advancedMetrics.memoryLeaks.length - 1].usage - 
                          advancedMetrics.memoryLeaks[0].usage
      if (memoryGrowth > 20) score -= 15
    }
    
    return Math.max(0, Math.min(100, score))
  }

  return {
    ...advancedMetrics,
    trackComponentRender,
    performanceScore: getPerformanceScore()
  }
}