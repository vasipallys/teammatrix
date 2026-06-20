/**
 * Unified Data Model for Data Management and Analytics Center
 * Based on the comprehensive ERD and data architecture specification
 */

// Core Entity Schemas
export const schemas = {
  // LDAP/Employee Data
  employee: {
    employee_id: String,
    mail_nickname: String,
    display_name: String,
    manager_id: String,
    title: String,
    mail: String,
    department: String,
    location: String,
    hire_date: Date,
    last_sync: Date
  },

  // HR Allocation Data
  allocation: {
    staff_1bank_id: String,
    staff_name: String,
    team_name: String,
    team_lead_1bank_id: String,
    fte_allocation: Number,
    start_date: Date,
    end_date: Date,
    tech_skills: Array,
    domain_knowledge: Array
  },

  // Work Plan Data (Enhanced)
  workPlan: {
    plan_id: String,
    squad_name: String,
    book_of_work: String,
    start_date: Date,
    end_date: Date,
    description: String,
    priority: String,
    status: String,
    epic_keys: Array, // Links to Jira epics
    estimated_effort: Number,
    actual_effort: Number,
    completion_percentage: Number
  },

  // Git Repository Data
  repository: {
    repo_id: String,
    repo_name: String,
    primary_language: String,
    languages: Object, // {language: percentage}
    size_kb: Number,
    last_activity: Date,
    contributors: Array,
    is_active: Boolean,
    tech_stack: Array
  },

  // Git Commit Data
  commit: {
    commit_hash: String,
    repo_id: String,
    author_email: String,
    author_name: String,
    commit_date: Date,
    lines_added: Number,
    lines_deleted: Number,
    files_changed: Array,
    message: String,
    branch: String,
    is_merge: Boolean
  },

  // Pull Request Data
  pullRequest: {
    pr_id: String,
    repo_id: String,
    author_id: String,
    title: String,
    description: String,
    created_date: Date,
    merged_date: Date,
    closed_date: Date,
    state: String, // open, merged, closed
    reviewers: Array,
    commits_count: Number,
    files_changed: Number,
    additions: Number,
    deletions: Number
  },

  // Jira Epic Data
  epic: {
    epic_id: String,
    epic_key: String,
    epic_name: String,
    epic_status: String,
    squad_name: String,
    start_date: Date,
    due_date: Date,
    story_points: Number,
    completion_percentage: Number,
    assignee: String,
    reporter: String
  },

  // Jira Story Data
  story: {
    story_id: String,
    story_key: String,
    epic_id: String,
    assignee_id: String,
    story_points: Number,
    status: String,
    priority: String,
    created_date: Date,
    resolved_date: Date,
    sprint_id: String,
    labels: Array,
    components: Array
  },

  // Sprint Data
  sprint: {
    sprint_id: String,
    sprint_name: String,
    start_date: Date,
    end_date: Date,
    state: String,
    goal: String,
    team_id: String,
    velocity: Number,
    commitment: Number,
    completed_points: Number
  }
}

// Data Relationship Definitions
export const relationships = {
  // Employee relationships
  employee_to_allocation: {
    key: 'mail_nickname',
    foreign_key: 'staff_1bank_id',
    type: 'one_to_many'
  },
  employee_to_commits: {
    key: 'mail',
    foreign_key: 'author_email',
    type: 'one_to_many'
  },
  employee_to_stories: {
    key: 'mail',
    foreign_key: 'assignee_id',
    type: 'one_to_many'
  },

  // Squad/Team relationships
  allocation_to_workplan: {
    key: 'team_name',
    foreign_key: 'squad_name',
    type: 'one_to_many'
  },
  workplan_to_epic: {
    key: 'epic_keys',
    foreign_key: 'epic_key',
    type: 'many_to_many'
  },

  // Repository relationships
  repository_to_commits: {
    key: 'repo_id',
    foreign_key: 'repo_id',
    type: 'one_to_many'
  },
  repository_to_prs: {
    key: 'repo_id',
    foreign_key: 'repo_id',
    type: 'one_to_many'
  },

  // Epic to Story relationship
  epic_to_stories: {
    key: 'epic_id',
    foreign_key: 'epic_id',
    type: 'one_to_many'
  }
}

// Unified Data Model Class
export class UnifiedDataModel {
  constructor() {
    this.data = {
      employees: new Map(),
      allocations: new Map(),
      workPlans: new Map(),
      repositories: new Map(),
      commits: new Map(),
      pullRequests: new Map(),
      epics: new Map(),
      stories: new Map(),
      sprints: new Map()
    }
    
    this.metadata = {
      lastSync: {},
      dataQuality: {},
      relationships: {}
    }
  }

  // Data ingestion methods
  ingestEmployees(employees) {
    employees.forEach(emp => {
      this.data.employees.set(emp.employee_id, this.validateSchema(emp, 'employee'))
    })
    this.metadata.lastSync.employees = new Date()
  }

  ingestAllocations(allocations) {
    allocations.forEach(alloc => {
      this.data.allocations.set(alloc.staff_1bank_id, this.validateSchema(alloc, 'allocation'))
    })
    this.metadata.lastSync.allocations = new Date()
  }

  ingestWorkPlans(workPlans) {
    workPlans.forEach(plan => {
      this.data.workPlans.set(plan.plan_id, this.validateSchema(plan, 'workPlan'))
    })
    this.metadata.lastSync.workPlans = new Date()
  }

  ingestRepositories(repos) {
    repos.forEach(repo => {
      this.data.repositories.set(repo.repo_id, this.validateSchema(repo, 'repository'))
    })
    this.metadata.lastSync.repositories = new Date()
  }

  ingestCommits(commits) {
    commits.forEach(commit => {
      this.data.commits.set(commit.commit_hash, this.validateSchema(commit, 'commit'))
    })
    this.metadata.lastSync.commits = new Date()
  }

  ingestPullRequests(prs) {
    prs.forEach(pr => {
      this.data.pullRequests.set(pr.pr_id, this.validateSchema(pr, 'pullRequest'))
    })
    this.metadata.lastSync.pullRequests = new Date()
  }

  ingestEpics(epics) {
    epics.forEach(epic => {
      this.data.epics.set(epic.epic_id, this.validateSchema(epic, 'epic'))
    })
    this.metadata.lastSync.epics = new Date()
  }

  ingestStories(stories) {
    stories.forEach(story => {
      this.data.stories.set(story.story_id, this.validateSchema(story, 'story'))
    })
    this.metadata.lastSync.stories = new Date()
  }

  ingestSprints(sprints) {
    sprints.forEach(sprint => {
      this.data.sprints.set(sprint.sprint_id, this.validateSchema(sprint, 'sprint'))
    })
    this.metadata.lastSync.sprints = new Date()
  }

  // Schema validation
  validateSchema(data, schemaName) {
    const schema = schemas[schemaName]
    const validated = {}
    
    for (const [key, type] of Object.entries(schema)) {
      if (data[key] !== undefined) {
        validated[key] = data[key]
      }
    }
    
    return validated
  }

  // Data relationship methods
  getEmployeeProfile(employeeId) {
    const employee = this.data.employees.get(employeeId)
    if (!employee) return null

    const allocations = Array.from(this.data.allocations.values())
      .filter(alloc => alloc.staff_1bank_id === employee.mail_nickname)
    
    const commits = Array.from(this.data.commits.values())
      .filter(commit => commit.author_email === employee.mail)
    
    const stories = Array.from(this.data.stories.values())
      .filter(story => story.assignee_id === employee.mail)

    return {
      employee,
      allocations,
      commits,
      stories,
      metrics: this.calculateDeveloperMetrics(employee, commits, stories)
    }
  }

  getSquadAnalysis(squadName) {
    const workPlans = Array.from(this.data.workPlans.values())
      .filter(plan => plan.squad_name === squadName)
    
    const allocations = Array.from(this.data.allocations.values())
      .filter(alloc => alloc.team_name === squadName)
    
    const epics = Array.from(this.data.epics.values())
      .filter(epic => epic.squad_name === squadName)

    return {
      squadron: squadName,
      workPlans,
      allocations,
      epics,
      metrics: this.calculateSquadMetrics(workPlans, allocations, epics)
    }
  }

  // Analytics calculation methods
  calculateDeveloperMetrics(employee, commits, stories) {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const recentCommits = commits.filter(c => new Date(c.commit_date) >= thirtyDaysAgo)
    const recentStories = stories.filter(s => s.resolved_date && new Date(s.resolved_date) >= thirtyDaysAgo)
    
    const languages = new Set()
    const repositories = new Set()
    
    recentCommits.forEach(commit => {
      repositories.add(commit.repo_id)
      const repo = this.data.repositories.get(commit.repo_id)
      if (repo) languages.add(repo.primary_language)
    })

    return {
      commitCount: recentCommits.length,
      linesAdded: recentCommits.reduce((sum, c) => sum + (c.lines_added || 0), 0),
      linesDeleted: recentCommits.reduce((sum, c) => sum + (c.lines_deleted || 0), 0),
      repositoryCount: repositories.size,
      languageCount: languages.size,
      storiesCompleted: recentStories.length,
      storyPoints: recentStories.reduce((sum, s) => sum + (s.story_points || 0), 0),
      isFullStack: languages.size > 2,
      techStackSpread: Array.from(languages),
      activeRepositories: Array.from(repositories)
    }
  }

  calculateSquadMetrics(workPlans, allocations, epics) {
    const totalFTE = allocations.reduce((sum, alloc) => sum + (alloc.fte_allocation || 1), 0)
    const activeWorkPlans = workPlans.filter(plan => 
      new Date(plan.end_date) >= new Date() && 
      new Date(plan.start_date) <= new Date()
    )
    
    const completedEpics = epics.filter(epic => epic.epic_status === 'Done').length
    const totalEpics = epics.length
    
    const planVsActual = workPlans.map(plan => ({
      planId: plan.plan_id,
      bookOfWork: plan.book_of_work,
      plannedStart: plan.start_date,
      plannedEnd: plan.end_date,
      actualProgress: plan.completion_percentage || 0,
      isOnTrack: this.isWorkPlanOnTrack(plan, epics),
      riskLevel: this.calculateRiskLevel(plan, epics)
    }))

    return {
      totalFTE,
      activeWorkPlans: activeWorkPlans.length,
      totalWorkPlans: workPlans.length,
      epicCompletionRate: totalEpics > 0 ? (completedEpics / totalEpics) * 100 : 0,
      planVsActual,
      utilizationRate: (activeWorkPlans.length / totalFTE) * 100,
      riskIndicators: planVsActual.filter(p => p.riskLevel === 'high').length
    }
  }

  isWorkPlanOnTrack(plan, epics) {
    const linkedEpics = epics.filter(epic => 
      plan.epic_keys && plan.epic_keys.includes(epic.epic_key)
    )
    
    if (linkedEpics.length === 0) return null // No data to determine
    
    const completedEpics = linkedEpics.filter(epic => epic.epic_status === 'Done').length
    const progressRate = completedEpics / linkedEpics.length
    const timeElapsed = (new Date() - new Date(plan.start_date)) / 
                       (new Date(plan.end_date) - new Date(plan.start_date))
    
    return progressRate >= timeElapsed * 0.8 // Allow 20% buffer
  }

  calculateRiskLevel(plan, epics) {
    const isOnTrack = this.isWorkPlanOnTrack(plan, epics)
    const daysToEnd = (new Date(plan.end_date) - new Date()) / (1000 * 60 * 60 * 24)
    
    if (isOnTrack === null) return 'unknown'
    if (!isOnTrack && daysToEnd < 30) return 'high'
    if (!isOnTrack && daysToEnd < 60) return 'medium'
    return 'low'
  }

  // Data quality assessment
  assessDataQuality() {
    const assessment = {
      employees: this.assessEntityQuality('employees'),
      allocations: this.assessEntityQuality('allocations'),
      workPlans: this.assessEntityQuality('workPlans'),
      repositories: this.assessEntityQuality('repositories'),
      commits: this.assessEntityQuality('commits'),
      pullRequests: this.assessEntityQuality('pullRequests'),
      epics: this.assessEntityQuality('epics'),
      stories: this.assessEntityQuality('stories'),
      relationships: this.assessRelationshipQuality()
    }
    
    this.metadata.dataQuality = assessment
    return assessment
  }

  assessEntityQuality(entityType) {
    const entities = Array.from(this.data[entityType].values())
    const totalCount = entities.length
    
    if (totalCount === 0) {
      return { score: 0, issues: ['No data available'], count: 0 }
    }

    const schema = schemas[entityType === 'pullRequests' ? 'pullRequest' : entityType.slice(0, -1)]
    const requiredFields = Object.keys(schema)
    
    let qualityScore = 0
    const issues = []
    
    entities.forEach(entity => {
      const completeness = requiredFields.filter(field => 
        entity[field] !== undefined && entity[field] !== null && entity[field] !== ''
      ).length / requiredFields.length
      
      qualityScore += completeness
    })
    
    const avgScore = (qualityScore / totalCount) * 100
    
    if (avgScore < 70) issues.push('Low data completeness')
    if (totalCount < 10) issues.push('Insufficient data volume')
    
    return {
      score: Math.round(avgScore),
      issues,
      count: totalCount,
      lastSync: this.metadata.lastSync[entityType]
    }
  }

  assessRelationshipQuality() {
    const issues = []
    let validRelationships = 0
    let totalRelationships = 0
    
    // Check employee-allocation relationships
    this.data.employees.forEach(employee => {
      const hasAllocation = Array.from(this.data.allocations.values())
        .some(alloc => alloc.staff_1bank_id === employee.mail_nickname)
      
      totalRelationships++
      if (hasAllocation) validRelationships++
    })
    
    // Check work plan-epic relationships
    this.data.workPlans.forEach(plan => {
      if (plan.epic_keys && plan.epic_keys.length > 0) {
        const hasLinkedEpics = plan.epic_keys.some(key =>
          Array.from(this.data.epics.values()).some(epic => epic.epic_key === key)
        )
        totalRelationships++
        if (hasLinkedEpics) validRelationships++
      }
    })
    
    const relationshipScore = totalRelationships > 0 
      ? (validRelationships / totalRelationships) * 100 
      : 0
    
    if (relationshipScore < 80) {
      issues.push('Weak data relationships detected')
    }
    
    return {
      score: Math.round(relationshipScore),
      issues,
      validCount: validRelationships,
      totalCount: totalRelationships
    }
  }

  // Export methods for components
  exportForVisualization() {
    return {
      summary: {
        employees: this.data.employees.size,
        workPlans: this.data.workPlans.size,
        repositories: this.data.repositories.size,
        commits: this.data.commits.size,
        lastSync: this.metadata.lastSync
      },
      quality: this.metadata.dataQuality,
      relationships: this.metadata.relationships
    }
  }
}

// Create singleton instance
export const unifiedDataModel = new UnifiedDataModel()