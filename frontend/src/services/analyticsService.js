class AnalyticsService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  // Organization Analytics
  analyzeOrganizationStructure(orgData) {
    const cacheKey = 'org_analysis_' + this.hashData(orgData)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const analysis = {
      overview: this.getOrganizationOverview(orgData),
      hierarchy: this.analyzeHierarchy(orgData),
      distribution: this.analyzeDistribution(orgData),
      insights: this.generateOrganizationInsights(orgData),
      recommendations: this.generateOrganizationRecommendations(orgData),
      riskFactors: this.identifyRiskFactors(orgData),
      trends: this.analyzeTrends(orgData)
    }

    this.setCache(cacheKey, analysis)
    return analysis
  }

  getOrganizationOverview(orgData) {
    const employees = orgData.data || []
    const totalEmployees = employees.length
    
    // Count by job function
    const jobFunctions = {}
    const ranks = {}
    const locations = {}
    const squads = {}
    
    employees.forEach(emp => {
      const jobFunction = emp['Job Function'] || 'Unknown'
      const rank = emp['Rank'] || 'Unknown'
      const location = emp['Work Location'] || 'Unknown'
      const squad = emp['Squad 1 (where applicable)'] || 'Unknown'
      
      jobFunctions[jobFunction] = (jobFunctions[jobFunction] || 0) + 1
      ranks[rank] = (ranks[rank] || 0) + 1
      locations[location] = (locations[location] || 0) + 1
      squads[squad] = (squads[squad] || 0) + 1
    })

    return {
      totalEmployees,
      uniqueJobFunctions: Object.keys(jobFunctions).length,
      uniqueRanks: Object.keys(ranks).length,
      uniqueLocations: Object.keys(locations).length,
      uniqueSquads: Object.keys(squads).length,
      distributions: {
        jobFunctions,
        ranks,
        locations,
        squads
      }
    }
  }

  analyzeHierarchy(orgData) {
    const employees = orgData.data || []
    const hierarchy = orgData.hierarchy || []
    
    // Calculate hierarchy depth
    const calculateDepth = (node, depth = 0) => {
      if (!node.children || node.children.length === 0) {
        return depth
      }
      return Math.max(...node.children.map(child => calculateDepth(child, depth + 1)))
    }

    const maxDepth = Math.max(...hierarchy.map(root => calculateDepth(root)))
    
    // Calculate span of control
    const managersWithDirectReports = new Map()
    employees.forEach(emp => {
      const manager = emp['Reporting Manager Name']
      if (manager) {
        if (!managersWithDirectReports.has(manager)) {
          managersWithDirectReports.set(manager, 0)
        }
        managersWithDirectReports.set(manager, managersWithDirectReports.get(manager) + 1)
      }
    })

    const spanOfControl = Array.from(managersWithDirectReports.values())
    const avgSpanOfControl = spanOfControl.length > 0 
      ? spanOfControl.reduce((a, b) => a + b, 0) / spanOfControl.length 
      : 0

    return {
      maxDepth,
      avgSpanOfControl: Math.round(avgSpanOfControl * 100) / 100,
      totalManagers: managersWithDirectReports.size,
      spanDistribution: this.getDistribution(spanOfControl)
    }
  }

  analyzeDistribution(orgData) {
    const employees = orgData.data || []
    
    // Analyze skill distribution
    const skillsMap = new Map()
    const domainMap = new Map()
    
    employees.forEach(emp => {
      const skills = emp['Tech Skills (SQL, Java, React etc)'] || ''
      const domain = emp['Domain Knowledge (Equity, FX, Reg, Advisory etc)'] || ''
      
      // Parse skills
      if (skills) {
        const skillList = skills.split(',').map(s => s.trim().toLowerCase())
        skillList.forEach(skill => {
          if (skill) {
            skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1)
          }
        })
      }
      
      // Parse domain knowledge
      if (domain) {
        const domainList = domain.split(',').map(d => d.trim().toLowerCase())
        domainList.forEach(d => {
          if (d) {
            domainMap.set(d, (domainMap.get(d) || 0) + 1)
          }
        })
      }
    })

    return {
      topSkills: this.getTopItems(skillsMap, 10),
      topDomains: this.getTopItems(domainMap, 10),
      skillCoverage: skillsMap.size,
      domainCoverage: domainMap.size
    }
  }

  generateOrganizationInsights(orgData) {
    const overview = this.getOrganizationOverview(orgData)
    const hierarchy = this.analyzeHierarchy(orgData)
    const insights = []

    // Span of control insights
    if (hierarchy.avgSpanOfControl > 8) {
      insights.push({
        type: 'warning',
        category: 'Management',
        title: 'High Span of Control',
        description: `Average span of control is ${hierarchy.avgSpanOfControl}, which may indicate management overload.`,
        recommendation: 'Consider adding middle management layers or redistributing responsibilities.'
      })
    } else if (hierarchy.avgSpanOfControl < 3) {
      insights.push({
        type: 'info',
        category: 'Management',
        title: 'Low Span of Control',
        description: `Average span of control is ${hierarchy.avgSpanOfControl}, which may indicate over-management.`,
        recommendation: 'Consider flattening the organization structure to improve efficiency.'
      })
    }

    // Team size insights
    const avgTeamSize = overview.totalEmployees / overview.uniqueSquads
    if (avgTeamSize > 12) {
      insights.push({
        type: 'warning',
        category: 'Team Structure',
        title: 'Large Team Sizes',
        description: `Average team size is ${Math.round(avgTeamSize)}, which may impact communication and agility.`,
        recommendation: 'Consider breaking large teams into smaller, more focused units.'
      })
    }

    // Location distribution insights
    const locationEntropy = this.calculateEntropy(Object.values(overview.distributions.locations))
    if (locationEntropy < 0.5) {
      insights.push({
        type: 'info',
        category: 'Distribution',
        title: 'Centralized Workforce',
        description: 'Most employees are concentrated in few locations.',
        recommendation: 'Consider remote work policies or distributed team strategies.'
      })
    }

    return insights
  }

  generateOrganizationRecommendations(orgData) {
    const recommendations = []
    const overview = this.getOrganizationOverview(orgData)
    const hierarchy = this.analyzeHierarchy(orgData)

    // Skill gap analysis
    const distribution = this.analyzeDistribution(orgData)
    const criticalSkills = ['javascript', 'python', 'sql', 'react', 'java']
    const missingSkills = criticalSkills.filter(skill => 
      !distribution.topSkills.some(s => s.name.includes(skill))
    )

    if (missingSkills.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Skills',
        title: 'Critical Skill Gaps Identified',
        description: `Missing or low coverage in: ${missingSkills.join(', ')}`,
        actions: [
          'Hire specialists in these areas',
          'Provide training programs',
          'Consider contractor support'
        ]
      })
    }

    // Succession planning
    if (hierarchy.maxDepth > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'Structure',
        title: 'Deep Hierarchy Detected',
        description: 'Organization has many management layers which may slow decision making.',
        actions: [
          'Review management layers',
          'Empower middle management',
          'Consider flatter structure'
        ]
      })
    }

    return recommendations
  }

  identifyRiskFactors(orgData) {
    const risks = []
    const employees = orgData.data || []
    
    // Single points of failure
    const skillCounts = new Map()
    employees.forEach(emp => {
      const skills = emp['Tech Skills (SQL, Java, React etc)'] || ''
      if (skills) {
        const skillList = skills.split(',').map(s => s.trim().toLowerCase())
        skillList.forEach(skill => {
          if (skill) {
            skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1)
          }
        })
      }
    })

    // Find skills with only one person
    const singlePersonSkills = Array.from(skillCounts.entries())
      .filter(([skill, count]) => count === 1)
      .map(([skill]) => skill)

    if (singlePersonSkills.length > 0) {
      risks.push({
        level: 'high',
        category: 'Knowledge Risk',
        title: 'Single Points of Failure',
        description: `${singlePersonSkills.length} critical skills have only one expert`,
        impact: 'High risk if key personnel leave',
        mitigation: 'Cross-train team members, document processes'
      })
    }

    // Management bottlenecks
    const hierarchy = this.analyzeHierarchy(orgData)
    if (hierarchy.avgSpanOfControl > 10) {
      risks.push({
        level: 'medium',
        category: 'Management Risk',
        title: 'Management Overload',
        description: 'Some managers have too many direct reports',
        impact: 'Reduced management effectiveness, employee satisfaction',
        mitigation: 'Add management layers, delegate authority'
      })
    }

    return risks
  }

  // Work Plan Analytics
  analyzeWorkPlan(workData) {
    const cacheKey = 'work_analysis_' + this.hashData(workData)
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const analysis = {
      overview: this.getWorkPlanOverview(workData),
      timeline: this.analyzeTimeline(workData),
      capacity: this.analyzeCapacity(workData),
      risks: this.identifyProjectRisks(workData),
      predictions: this.generatePredictions(workData),
      recommendations: this.generateWorkRecommendations(workData)
    }

    this.setCache(cacheKey, analysis)
    return analysis
  }

  getWorkPlanOverview(workData) {
    const items = workData.data || []
    const now = new Date()
    
    let totalDuration = 0
    let activeProjects = 0
    let completedProjects = 0
    let upcomingProjects = 0
    
    const squadWorkload = {}
    
    items.forEach(item => {
      const startDate = new Date(item['start date'])
      const endDate = new Date(item['end date'])
      const duration = (endDate - startDate) / (1000 * 60 * 60 * 24) // days
      
      totalDuration += duration
      
      const squad = item['Squad name'] || 'Unknown'
      squadWorkload[squad] = (squadWorkload[squad] || 0) + duration
      
      if (startDate <= now && endDate >= now) {
        activeProjects++
      } else if (endDate < now) {
        completedProjects++
      } else if (startDate > now) {
        upcomingProjects++
      }
    })

    return {
      totalItems: items.length,
      activeProjects,
      completedProjects,
      upcomingProjects,
      avgDuration: Math.round(totalDuration / items.length),
      squadWorkload
    }
  }

  analyzeTimeline(workData) {
    const items = workData.data || []
    const now = new Date()
    
    // Find project timeline boundaries
    let earliestStart = new Date()
    let latestEnd = new Date()
    
    items.forEach(item => {
      const startDate = new Date(item['start date'])
      const endDate = new Date(item['end date'])
      
      if (startDate < earliestStart) earliestStart = startDate
      if (endDate > latestEnd) latestEnd = endDate
    })

    // Analyze timeline distribution
    const timelineMonths = {}
    items.forEach(item => {
      const startDate = new Date(item['start date'])
      const endDate = new Date(item['end date'])
      
      // Count projects by month
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
      timelineMonths[monthKey] = (timelineMonths[monthKey] || 0) + 1
    })

    return {
      projectSpan: Math.ceil((latestEnd - earliestStart) / (1000 * 60 * 60 * 24)),
      earliestStart,
      latestEnd,
      monthlyDistribution: timelineMonths,
      currentProgress: this.calculateCurrentProgress(items, now)
    }
  }

  analyzeCapacity(workData) {
    const items = workData.data || []
    const squadCapacity = {}
    const now = new Date()
    
    // Calculate capacity utilization by squad
    items.forEach(item => {
      const squad = item['Squad name'] || 'Unknown'
      const startDate = new Date(item['start date'])
      const endDate = new Date(item['end date'])
      const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) // days
      
      if (!squadCapacity[squad]) {
        squadCapacity[squad] = {
          totalDays: 0,
          activeProjects: 0,
          completedProjects: 0,
          upcomingProjects: 0,
          utilization: 0
        }
      }
      
      squadCapacity[squad].totalDays += duration
      
      if (startDate <= now && endDate >= now) {
        squadCapacity[squad].activeProjects++
      } else if (endDate < now) {
        squadCapacity[squad].completedProjects++
      } else if (startDate > now) {
        squadCapacity[squad].upcomingProjects++
      }
    })
    
    // Calculate utilization (assuming 5 working days per week, 4 weeks per month)
    const workingDaysPerMonth = 20
    Object.keys(squadCapacity).forEach(squad => {
      const capacity = squadCapacity[squad]
      const monthsSpan = Math.max(1, capacity.totalDays / 30) // rough estimate
      const availableDays = monthsSpan * workingDaysPerMonth
      capacity.utilization = Math.min((capacity.totalDays / availableDays) * 100, 100)
    })
    
    return {
      squadCapacity,
      overUtilizedSquads: Object.entries(squadCapacity)
        .filter(([squad, data]) => data.utilization > 80)
        .map(([squad, data]) => ({ squad, utilization: Math.round(data.utilization) })),
      underUtilizedSquads: Object.entries(squadCapacity)
        .filter(([squad, data]) => data.utilization < 50)
        .map(([squad, data]) => ({ squad, utilization: Math.round(data.utilization) })),
      avgUtilization: Object.values(squadCapacity)
        .reduce((sum, data) => sum + data.utilization, 0) / Object.keys(squadCapacity).length
    }
  }

  calculateCurrentProgress(items, now) {
    let totalProgress = 0
    let activeItems = 0

    items.forEach(item => {
      const startDate = new Date(item['start date'])
      const endDate = new Date(item['end date'])
      
      if (startDate <= now && endDate >= now) {
        activeItems++
        const totalDuration = endDate - startDate
        const elapsed = now - startDate
        const progress = Math.min(elapsed / totalDuration, 1)
        totalProgress += progress
      }
    })

    return activeItems > 0 ? (totalProgress / activeItems) * 100 : 0
  }

  identifyProjectRisks(workData) {
    const items = workData.data || []
    const risks = []
    const now = new Date()
    
    // Analyze timeline risks
    const overlapRisks = this.findTimelineOverlaps(items)
    if (overlapRisks.length > 0) {
      risks.push({
        type: 'timeline',
        level: 'high',
        title: 'Resource Conflicts Detected',
        description: `${overlapRisks.length} potential resource conflicts found`,
        details: overlapRisks,
        impact: 'Project delays and resource overallocation',
        mitigation: 'Reschedule conflicting projects or add resources'
      })
    }
    
    // Analyze duration risks
    const longProjects = items.filter(item => {
      const startDate = new Date(item['start date'])
      const endDate = new Date(item['end date'])
      const duration = (endDate - startDate) / (1000 * 60 * 60 * 24)
      return duration > 180 // More than 6 months
    })
    
    if (longProjects.length > 0) {
      risks.push({
        type: 'duration',
        level: 'medium',
        title: 'Long Duration Projects',
        description: `${longProjects.length} projects exceed 6 months duration`,
        details: longProjects.map(p => p['Book of work']),
        impact: 'Increased risk of scope creep and delays',
        mitigation: 'Break into smaller milestones, increase monitoring'
      })
    }
    
    // Analyze squad workload risks
    const squadWorkload = {}
    items.forEach(item => {
      const squad = item['Squad name'] || 'Unknown'
      squadWorkload[squad] = (squadWorkload[squad] || 0) + 1
    })
    
    const overloadedSquads = Object.entries(squadWorkload)
      .filter(([squad, count]) => count > 5)
      .map(([squad, count]) => ({ squad, projects: count }))
    
    if (overloadedSquads.length > 0) {
      risks.push({
        type: 'workload',
        level: 'medium',
        title: 'Squad Overload Risk',
        description: `${overloadedSquads.length} squads have more than 5 concurrent projects`,
        details: overloadedSquads,
        impact: 'Reduced quality and increased burnout risk',
        mitigation: 'Redistribute workload or extend timelines'
      })
    }
    
    return risks
  }

  findTimelineOverlaps(items) {
    const overlaps = []
    const squadProjects = {}
    
    // Group projects by squad
    items.forEach(item => {
      const squad = item['Squad name'] || 'Unknown'
      if (!squadProjects[squad]) squadProjects[squad] = []
      squadProjects[squad].push({
        name: item['Book of work'],
        start: new Date(item['start date']),
        end: new Date(item['end date'])
      })
    })
    
    // Check for overlaps within each squad
    Object.entries(squadProjects).forEach(([squad, projects]) => {
      for (let i = 0; i < projects.length; i++) {
        for (let j = i + 1; j < projects.length; j++) {
          const project1 = projects[i]
          const project2 = projects[j]
          
          if (this.datesOverlap(project1.start, project1.end, project2.start, project2.end)) {
            overlaps.push({
              squad,
              project1: project1.name,
              project2: project2.name,
              overlapDays: this.calculateOverlapDays(project1.start, project1.end, project2.start, project2.end)
            })
          }
        }
      }
    })
    
    return overlaps
  }

  calculateOverlapDays(start1, end1, start2, end2) {
    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()))
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()))
    return Math.max(0, Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)))
  }

  // Utility methods
  getDistribution(values) {
    const distribution = {}
    values.forEach(value => {
      distribution[value] = (distribution[value] || 0) + 1
    })
    return distribution
  }

  getTopItems(map, limit = 10) {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }))
  }

  calculateEntropy(values) {
    const total = values.reduce((sum, val) => sum + val, 0)
    if (total === 0) return 0
    
    const probabilities = values.map(val => val / total)
    return -probabilities.reduce((entropy, p) => {
      return p > 0 ? entropy + p * Math.log2(p) : entropy
    }, 0)
  }

  analyzeTrends(orgData) {
    const employees = orgData.data || []
    const currentDate = new Date()
    
    // Analyze skill trends
    const skillTrends = this.analyzeSkillTrends(employees)
    
    // Analyze role evolution
    const roleEvolution = this.analyzeRoleEvolution(employees)
    
    // Predict future needs
    const futureNeeds = this.predictFutureNeeds(employees)
    
    // Calculate growth metrics
    const growthMetrics = this.calculateGrowthMetrics(employees)
    
    return {
      growthRate: growthMetrics.growthRate,
      turnoverRate: growthMetrics.turnoverRate,
      skillTrends: skillTrends.trending,
      emergingRoles: roleEvolution.emerging,
      decliningSkills: skillTrends.declining,
      futureNeeds: futureNeeds,
      diversityIndex: this.calculateDiversityIndex(employees),
      collaborationScore: this.calculateCollaborationScore(employees)
    }
  }

  analyzeSkillTrends(employees) {
    const skillCounts = new Map()
    const skillsByRole = new Map()
    
    employees.forEach(emp => {
      const skills = emp['Tech Skills (SQL, Java, React etc)'] || ''
      const role = emp['Job Function'] || 'Unknown'
      
      if (skills) {
        const skillList = skills.split(',').map(s => s.trim().toLowerCase())
        skillList.forEach(skill => {
          if (skill) {
            skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1)
            
            if (!skillsByRole.has(role)) {
              skillsByRole.set(role, new Map())
            }
            const roleSkills = skillsByRole.get(role)
            roleSkills.set(skill, (roleSkills.get(skill) || 0) + 1)
          }
        })
      }
    })
    
    // Identify trending skills (high adoption rate)
    const trendingSkills = ['javascript', 'python', 'react', 'aws', 'kubernetes', 'docker']
    const decliningSkills = ['jquery', 'flash', 'silverlight', 'vb.net']
    
    const trending = trendingSkills.filter(skill => 
      Array.from(skillCounts.keys()).some(s => s.includes(skill))
    )
    
    const declining = decliningSkills.filter(skill => 
      Array.from(skillCounts.keys()).some(s => s.includes(skill))
    )
    
    return { trending, declining, skillsByRole }
  }

  analyzeRoleEvolution(employees) {
    const roleCounts = new Map()
    const modernRoles = ['data scientist', 'devops engineer', 'product owner', 'scrum master', 'ui/ux designer']
    
    employees.forEach(emp => {
      const role = (emp['Job Function'] || '').toLowerCase()
      roleCounts.set(role, (roleCounts.get(role) || 0) + 1)
    })
    
    const emerging = modernRoles.filter(role => 
      Array.from(roleCounts.keys()).some(r => r.includes(role))
    )
    
    return { emerging, roleCounts }
  }

  predictFutureNeeds(employees) {
    const currentSkills = new Map()
    const totalEmployees = employees.length
    
    employees.forEach(emp => {
      const skills = emp['Tech Skills (SQL, Java, React etc)'] || ''
      if (skills) {
        const skillList = skills.split(',').map(s => s.trim().toLowerCase())
        skillList.forEach(skill => {
          if (skill) {
            currentSkills.set(skill, (currentSkills.get(skill) || 0) + 1)
          }
        })
      }
    })
    
    // Predict skills that will be needed based on industry trends
    const futureSkills = [
      { skill: 'artificial intelligence', priority: 'high', coverage: (currentSkills.get('ai') || 0) / totalEmployees },
      { skill: 'machine learning', priority: 'high', coverage: (currentSkills.get('ml') || 0) / totalEmployees },
      { skill: 'cloud computing', priority: 'high', coverage: (currentSkills.get('aws') || 0) / totalEmployees },
      { skill: 'cybersecurity', priority: 'medium', coverage: (currentSkills.get('security') || 0) / totalEmployees },
      { skill: 'blockchain', priority: 'low', coverage: (currentSkills.get('blockchain') || 0) / totalEmployees }
    ]
    
    return futureSkills.filter(fs => fs.coverage < 0.3) // Skills with less than 30% coverage
  }

  calculateGrowthMetrics(employees) {
    // Simulate growth calculation based on team sizes and roles
    const managerCount = employees.filter(emp => 
      (emp['Job Function'] || '').toLowerCase().includes('manager') ||
      (emp['Job Function'] || '').toLowerCase().includes('lead')
    ).length
    
    const totalEmployees = employees.length
    const managerRatio = managerCount / totalEmployees
    
    // Estimate growth rate based on manager ratio and team structure
    const growthRate = Math.min(0.15, Math.max(0.02, managerRatio * 0.5))
    
    // Estimate turnover based on team sizes (larger teams tend to have higher turnover)
    const avgTeamSize = totalEmployees / Math.max(1, managerCount)
    const turnoverRate = Math.min(0.25, Math.max(0.05, avgTeamSize * 0.02))
    
    return { growthRate, turnoverRate }
  }

  calculateDiversityIndex(employees) {
    const locations = new Map()
    const roles = new Map()
    
    employees.forEach(emp => {
      const location = emp['Work Location'] || 'Unknown'
      const role = emp['Job Function'] || 'Unknown'
      
      locations.set(location, (locations.get(location) || 0) + 1)
      roles.set(role, (roles.get(role) || 0) + 1)
    })
    
    // Calculate Shannon diversity index
    const locationDiversity = this.calculateEntropy(Array.from(locations.values()))
    const roleDiversity = this.calculateEntropy(Array.from(roles.values()))
    
    return {
      location: Math.round(locationDiversity * 100) / 100,
      role: Math.round(roleDiversity * 100) / 100,
      overall: Math.round((locationDiversity + roleDiversity) / 2 * 100) / 100
    }
  }

  calculateCollaborationScore(employees) {
    // Analyze potential collaboration based on shared skills and locations
    let collaborationPairs = 0
    let totalPairs = 0
    
    for (let i = 0; i < employees.length; i++) {
      for (let j = i + 1; j < employees.length; j++) {
        totalPairs++
        
        const emp1 = employees[i]
        const emp2 = employees[j]
        
        // Check for shared location
        const sameLocation = emp1['Work Location'] === emp2['Work Location']
        
        // Check for complementary skills
        const skills1 = (emp1['Tech Skills (SQL, Java, React etc)'] || '').toLowerCase().split(',')
        const skills2 = (emp2['Tech Skills (SQL, Java, React etc)'] || '').toLowerCase().split(',')
        const sharedSkills = skills1.filter(skill => skills2.includes(skill)).length
        
        if (sameLocation && sharedSkills > 0) {
          collaborationPairs++
        }
      }
    }
    
    return totalPairs > 0 ? Math.round((collaborationPairs / totalPairs) * 100) / 100 : 0
  }

  generatePredictions(workData) {
    const overview = this.getWorkPlanOverview(workData)
    const timeline = this.analyzeTimeline(workData)
    
    return {
      completionDate: this.predictCompletionDate(workData),
      resourceNeeds: this.predictResourceNeeds(workData),
      bottlenecks: this.predictBottlenecks(workData),
      riskScore: this.calculateRiskScore(workData)
    }
  }

  predictCompletionDate(workData) {
    // Simple prediction based on current progress
    const items = workData.data || []
    const now = new Date()
    
    let latestEnd = now
    items.forEach(item => {
      const endDate = new Date(item['end date'])
      if (endDate > latestEnd) latestEnd = endDate
    })
    
    return latestEnd
  }

  predictResourceNeeds(workData) {
    const overview = this.getWorkPlanOverview(workData)
    const predictions = []
    
    Object.entries(overview.squadWorkload).forEach(([squad, workload]) => {
      if (workload > 100) { // More than 100 days of work
        predictions.push({
          squad,
          recommendation: 'Consider additional resources',
          workload: Math.round(workload)
        })
      }
    })
    
    return predictions
  }

  predictBottlenecks(workData) {
    // Analyze overlapping projects and resource conflicts
    const items = workData.data || []
    const squadTimelines = {}
    
    items.forEach(item => {
      const squad = item['Squad name']
      if (!squadTimelines[squad]) squadTimelines[squad] = []
      
      squadTimelines[squad].push({
        start: new Date(item['start date']),
        end: new Date(item['end date']),
        work: item['Book of work']
      })
    })
    
    const bottlenecks = []
    Object.entries(squadTimelines).forEach(([squad, timeline]) => {
      // Check for overlapping projects
      for (let i = 0; i < timeline.length; i++) {
        for (let j = i + 1; j < timeline.length; j++) {
          const project1 = timeline[i]
          const project2 = timeline[j]
          
          if (this.datesOverlap(project1.start, project1.end, project2.start, project2.end)) {
            bottlenecks.push({
              squad,
              type: 'Resource Conflict',
              projects: [project1.work, project2.work],
              severity: 'medium'
            })
          }
        }
      }
    })
    
    return bottlenecks
  }

  datesOverlap(start1, end1, start2, end2) {
    return start1 <= end2 && start2 <= end1
  }

  calculateRiskScore(workData) {
    const overview = this.getWorkPlanOverview(workData)
    const timeline = this.analyzeTimeline(workData)
    
    let riskScore = 0
    
    // High number of concurrent projects increases risk
    if (overview.activeProjects > 10) riskScore += 20
    
    // Long project duration increases risk
    if (overview.avgDuration > 90) riskScore += 15
    
    // Uneven workload distribution increases risk
    const workloadValues = Object.values(overview.squadWorkload)
    const maxWorkload = Math.max(...workloadValues)
    const minWorkload = Math.min(...workloadValues)
    if (maxWorkload / minWorkload > 3) riskScore += 25
    
    return Math.min(riskScore, 100) // Cap at 100
  }

  generateWorkRecommendations(workData) {
    const overview = this.getWorkPlanOverview(workData)
    const predictions = this.generatePredictions(workData)
    const recommendations = []
    
    // Resource balancing
    const workloadValues = Object.values(overview.squadWorkload)
    const avgWorkload = workloadValues.reduce((a, b) => a + b, 0) / workloadValues.length
    const imbalancedSquads = Object.entries(overview.squadWorkload)
      .filter(([squad, workload]) => workload > avgWorkload * 1.5)
    
    if (imbalancedSquads.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Resource Management',
        title: 'Workload Imbalance Detected',
        description: `${imbalancedSquads.length} squads have significantly higher workload`,
        actions: [
          'Redistribute work items',
          'Add temporary resources',
          'Extend timelines for overloaded squads'
        ]
      })
    }
    
    // Timeline optimization
    if (predictions.riskScore > 60) {
      recommendations.push({
        priority: 'medium',
        category: 'Timeline',
        title: 'High Project Risk Score',
        description: `Current risk score is ${predictions.riskScore}/100`,
        actions: [
          'Review project dependencies',
          'Add buffer time to critical path',
          'Increase monitoring frequency'
        ]
      })
    }
    
    return recommendations
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  hashData(data) {
    return btoa(JSON.stringify(data)).slice(0, 16)
  }
}

export default new AnalyticsService()