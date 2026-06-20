#!/usr/bin/env python3
"""
Comprehensive Logging Dashboard for NextGen Organization Visualizer
Provides real-time monitoring and analysis of all application events
"""

import os
import json
import re
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Dict, List, Any, Optional
from flask import Blueprint, jsonify, request, render_template_string
from logging_service import LogCategory, event_logger

# Blueprint for logging endpoints
logging_bp = Blueprint('logging', __name__, url_prefix='/api/logs')

class LogAnalyzer:
    """Analyzes and aggregates log data from various sources"""
    
    def __init__(self, log_dir: str = "./logs"):
        self.log_dir = log_dir
        self.categories = [cat.value.lower() for cat in LogCategory]
    
    def get_recent_events(self, category: Optional[str] = None, hours: int = 24, limit: int = 100) -> List[Dict]:
        """Get recent events from logs"""
        events = []
        
        if category:
            log_files = [f"{category}.log"]
        else:
            log_files = [f"{cat}.log" for cat in self.categories] + ["app.log", "errors.log", "security.log", "performance.log"]
        
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        for log_file in log_files:
            file_path = os.path.join(self.log_dir, log_file)
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    # Parse recent lines (reverse order for most recent first)
                    for line in reversed(lines[-1000:]):  # Look at last 1000 lines
                        event = self._parse_log_line(line, log_file)
                        if event and event.get('timestamp'):
                            event_time = datetime.fromisoformat(event['timestamp'])
                            if event_time >= cutoff_time:
                                events.append(event)
                            else:
                                break  # Assuming logs are chronological
                        
                        if len(events) >= limit:
                            break
                            
                except Exception as e:
                    continue
        
        # Sort by timestamp (most recent first)
        events.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return events[:limit]
    
    def _parse_log_line(self, line: str, source_file: str) -> Optional[Dict]:
        """Parse a single log line into structured data"""
        try:
            # Extract timestamp
            timestamp_match = re.search(r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', line)
            if not timestamp_match:
                return None
            
            timestamp = timestamp_match.group(1)
            
            # Extract level
            level_match = re.search(r'\[(ERROR|WARNING|INFO|DEBUG|CRITICAL)\]', line)
            level = level_match.group(1) if level_match else 'INFO'
            
            # Extract context JSON if present
            context = {}
            context_match = re.search(r'Context: ({.*})', line)
            if context_match:
                try:
                    context = json.loads(context_match.group(1))
                except:
                    pass
            
            # Extract main message (everything between level and Context)
            message_pattern = r'\] (.+?)(?:\s+\|\s+Context:|\s*$)'
            message_match = re.search(message_pattern, line)
            message = message_match.group(1).strip() if message_match else line.strip()
            
            return {
                'timestamp': timestamp,
                'level': level,
                'message': message,
                'source_file': source_file,
                'context': context,
                'category': context.get('category', 'SYSTEM'),
                'raw_line': line.strip()
            }
            
        except Exception as e:
            return {
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'level': 'ERROR',
                'message': f'Failed to parse log line: {str(e)}',
                'source_file': source_file,
                'context': {},
                'category': 'SYSTEM',
                'raw_line': line.strip()
            }
    
    def get_statistics(self, hours: int = 24) -> Dict[str, Any]:
        """Get comprehensive statistics about log events"""
        events = self.get_recent_events(hours=hours, limit=10000)
        
        stats = {
            'total_events': len(events),
            'time_range': {
                'hours': hours,
                'start_time': (datetime.now() - timedelta(hours=hours)).isoformat(),
                'end_time': datetime.now().isoformat()
            },
            'by_category': Counter(),
            'by_level': Counter(),
            'by_hour': defaultdict(int),
            'error_rate': 0,
            'top_errors': [],
            'performance_metrics': {
                'avg_response_time': 0,
                'slowest_endpoints': [],
                'total_api_calls': 0
            },
            'security_events': {
                'total': 0,
                'failed_attempts': 0,
                'by_type': Counter()
            },
            'integration_status': {
                'git': {'total': 0, 'errors': 0, 'last_success': None},
                'ldap': {'total': 0, 'errors': 0, 'last_success': None},
                'jira': {'total': 0, 'errors': 0, 'last_success': None}
            }
        }
        
        error_messages = []
        response_times = []
        
        for event in events:
            # Category stats
            stats['by_category'][event.get('category', 'UNKNOWN')] += 1
            
            # Level stats
            level = event.get('level', 'INFO')
            stats['by_level'][level] += 1
            
            # Hourly distribution
            if event.get('timestamp'):
                try:
                    event_time = datetime.fromisoformat(event['timestamp'])
                    hour_key = event_time.strftime('%Y-%m-%d %H:00')
                    stats['by_hour'][hour_key] += 1
                except:
                    pass
            
            # Error tracking
            if level in ['ERROR', 'CRITICAL']:
                error_messages.append(event.get('message', ''))
            
            # Performance metrics
            context = event.get('context', {})
            if 'response_time' in context:
                try:
                    response_times.append(float(context['response_time']))
                except:
                    pass
            
            # Security events
            if event.get('category') == 'SECURITY':
                stats['security_events']['total'] += 1
                if not context.get('success', True):
                    stats['security_events']['failed_attempts'] += 1
                
                event_type = context.get('event_type', 'unknown')
                stats['security_events']['by_type'][event_type] += 1
            
            # Integration status
            category = event.get('category', '').lower()
            if category in ['git', 'ldap', 'jira']:
                stats['integration_status'][category]['total'] += 1
                
                if level in ['ERROR', 'CRITICAL']:
                    stats['integration_status'][category]['errors'] += 1
                elif level in ['INFO'] and 'SUCCESS' in event.get('message', '').upper():
                    stats['integration_status'][category]['last_success'] = event.get('timestamp')
        
        # Calculate derived metrics
        total_events = len(events)
        error_count = stats['by_level']['ERROR'] + stats['by_level']['CRITICAL']
        stats['error_rate'] = (error_count / total_events * 100) if total_events > 0 else 0
        
        # Top error messages
        error_counter = Counter(error_messages)
        stats['top_errors'] = [
            {'message': msg, 'count': count} 
            for msg, count in error_counter.most_common(10)
        ]
        
        # Performance metrics
        if response_times:
            stats['performance_metrics']['avg_response_time'] = sum(response_times) / len(response_times)
            stats['performance_metrics']['total_api_calls'] = len(response_times)
        
        # Convert defaultdict to regular dict for JSON serialization
        stats['by_hour'] = dict(stats['by_hour'])
        
        return stats
    
    def search_logs(self, query: str, category: Optional[str] = None, 
                   level: Optional[str] = None, hours: int = 24) -> List[Dict]:
        """Search logs with filters"""
        events = self.get_recent_events(category=category, hours=hours, limit=1000)
        
        filtered_events = []
        query_lower = query.lower() if query else ""
        
        for event in events:
            # Apply filters
            if level and event.get('level') != level.upper():
                continue
            
            # Search in message and context
            if query:
                searchable_text = (
                    event.get('message', '') + ' ' +
                    json.dumps(event.get('context', {}), default=str)
                ).lower()
                
                if query_lower not in searchable_text:
                    continue
            
            filtered_events.append(event)
        
        return filtered_events

# Global log analyzer instance
log_analyzer = LogAnalyzer()

# API Endpoints
@logging_bp.route('/dashboard')
def logging_dashboard():
    """Serve the logging dashboard HTML"""
    dashboard_html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TeamMatrix Logging Dashboard</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
                line-height: 1.6;
            }
            .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                color: white;
            }
            .header h1 { 
                font-size: 2.5rem; 
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .stats-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                gap: 20px; 
                margin-bottom: 30px; 
            }
            .stat-card { 
                background: rgba(255,255,255,0.95); 
                padding: 20px; 
                border-radius: 10px; 
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.18);
            }
            .stat-card h3 { 
                color: #4a5568; 
                margin-bottom: 10px; 
                font-size: 1.1rem;
            }
            .stat-value { 
                font-size: 2rem; 
                font-weight: bold; 
                color: #2d3748; 
            }
            .logs-section { 
                background: rgba(255,255,255,0.95); 
                padding: 25px; 
                border-radius: 10px; 
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.18);
                margin-bottom: 20px;
            }
            .logs-header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 20px; 
            }
            .logs-header h2 { 
                color: #2d3748; 
                font-size: 1.5rem;
            }
            .refresh-btn { 
                background: linear-gradient(45deg, #667eea, #764ba2); 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 5px; 
                cursor: pointer; 
                font-weight: 500;
                transition: transform 0.2s;
            }
            .refresh-btn:hover { 
                transform: translateY(-2px); 
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .log-entry { 
                border-bottom: 1px solid #e2e8f0; 
                padding: 12px 0; 
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 0.9rem;
            }
            .log-entry:last-child { border-bottom: none; }
            .log-timestamp { 
                color: #718096; 
                font-weight: 500; 
                margin-right: 10px;
            }
            .log-level { 
                padding: 2px 8px; 
                border-radius: 3px; 
                font-size: 0.8rem; 
                font-weight: bold; 
                margin-right: 10px;
            }
            .log-level.ERROR { background: #fed7d7; color: #c53030; }
            .log-level.WARNING { background: #feebc8; color: #dd6b20; }
            .log-level.INFO { background: #bee3f8; color: #2b6cb0; }
            .log-level.DEBUG { background: #e6fffa; color: #319795; }
            .log-message { color: #2d3748; }
            .chart-container { 
                height: 300px; 
                margin: 20px 0; 
                background: #f7fafc; 
                border-radius: 8px; 
                padding: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #718096;
            }
            .loading { 
                text-align: center; 
                color: #718096; 
                padding: 40px;
            }
            .error-list { 
                max-height: 300px; 
                overflow-y: auto; 
            }
            .error-item { 
                background: #fed7d7; 
                padding: 10px; 
                margin: 5px 0; 
                border-radius: 5px; 
                border-left: 4px solid #c53030;
            }
            .integration-status { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 15px; 
            }
            .integration-card { 
                padding: 15px; 
                border-radius: 8px; 
                text-align: center;
            }
            .integration-card.healthy { background: #c6f6d5; color: #22543d; }
            .integration-card.warning { background: #feebc8; color: #7c2d12; }
            .integration-card.error { background: #fed7d7; color: #742a2a; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 TeamMatrix Logging Dashboard</h1>
                <p>Real-time monitoring of all application events</p>
            </div>
            
            <div class="stats-grid" id="statsGrid">
                <div class="loading">Loading statistics...</div>
            </div>
            
            <div class="logs-section">
                <div class="logs-header">
                    <h2>📊 Integration Status</h2>
                </div>
                <div class="integration-status" id="integrationStatus">
                    <div class="loading">Loading integration status...</div>
                </div>
            </div>
            
            <div class="logs-section">
                <div class="logs-header">
                    <h2>🚨 Recent Errors</h2>
                </div>
                <div class="error-list" id="errorList">
                    <div class="loading">Loading errors...</div>
                </div>
            </div>
            
            <div class="logs-section">
                <div class="logs-header">
                    <h2>📝 Recent Events</h2>
                    <button class="refresh-btn" onclick="loadDashboard()">🔄 Refresh</button>
                </div>
                <div id="logEntries">
                    <div class="loading">Loading recent events...</div>
                </div>
            </div>
        </div>
        
        <script>
            async function loadDashboard() {
                try {
                    // Load statistics
                    const statsResponse = await fetch('/api/logs/stats');
                    const stats = await statsResponse.json();
                    updateStats(stats);
                    
                    // Load recent events
                    const eventsResponse = await fetch('/api/logs/events?limit=50');
                    const events = await eventsResponse.json();
                    updateEvents(events);
                    
                } catch (error) {
                    console.error('Error loading dashboard:', error);
                }
            }
            
            function updateStats(stats) {
                const statsGrid = document.getElementById('statsGrid');
                statsGrid.innerHTML = `
                    <div class="stat-card">
                        <h3>Total Events (24h)</h3>
                        <div class="stat-value">${stats.total_events.toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Error Rate</h3>
                        <div class="stat-value">${stats.error_rate.toFixed(1)}%</div>
                    </div>
                    <div class="stat-card">
                        <h3>API Calls</h3>
                        <div class="stat-value">${stats.performance_metrics.total_api_calls.toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Avg Response Time</h3>
                        <div class="stat-value">${stats.performance_metrics.avg_response_time.toFixed(0)}ms</div>
                    </div>
                    <div class="stat-card">
                        <h3>Security Events</h3>
                        <div class="stat-value">${stats.security_events.total}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Failed Attempts</h3>
                        <div class="stat-value">${stats.security_events.failed_attempts}</div>
                    </div>
                `;
                
                // Update integration status
                const integrationStatus = document.getElementById('integrationStatus');
                let integrationHTML = '';
                
                Object.entries(stats.integration_status).forEach(([name, status]) => {
                    let statusClass = 'healthy';
                    let statusText = 'Healthy';
                    
                    if (status.errors > status.total * 0.1) {
                        statusClass = 'error';
                        statusText = 'Error';
                    } else if (status.errors > 0) {
                        statusClass = 'warning';
                        statusText = 'Warning';
                    }
                    
                    integrationHTML += `
                        <div class="integration-card ${statusClass}">
                            <h4>${name.toUpperCase()}</h4>
                            <div>Status: ${statusText}</div>
                            <div>Total: ${status.total}</div>
                            <div>Errors: ${status.errors}</div>
                        </div>
                    `;
                });
                
                integrationStatus.innerHTML = integrationHTML;
                
                // Update error list
                const errorList = document.getElementById('errorList');
                let errorHTML = '';
                
                stats.top_errors.forEach(error => {
                    errorHTML += `
                        <div class="error-item">
                            <strong>${error.count}x</strong> ${error.message}
                        </div>
                    `;
                });
                
                errorList.innerHTML = errorHTML || '<div style="text-align: center; color: #718096;">No recent errors</div>';
            }
            
            function updateEvents(events) {
                const logEntries = document.getElementById('logEntries');
                let html = '';
                
                events.forEach(event => {
                    html += `
                        <div class="log-entry">
                            <span class="log-timestamp">${event.timestamp}</span>
                            <span class="log-level ${event.level}">${event.level}</span>
                            <span class="log-message">${event.message}</span>
                        </div>
                    `;
                });
                
                logEntries.innerHTML = html || '<div class="loading">No recent events</div>';
            }
            
            // Load dashboard on page load
            document.addEventListener('DOMContentLoaded', loadDashboard);
            
            // Auto-refresh every 30 seconds
            setInterval(loadDashboard, 30000);
        </script>
    </body>
    </html>
    """
    return dashboard_html

@logging_bp.route('/stats')
def get_log_statistics():
    """Get comprehensive log statistics"""
    hours = int(request.args.get('hours', 24))
    stats = log_analyzer.get_statistics(hours)
    return jsonify(stats)

@logging_bp.route('/events')
def get_recent_events():
    """Get recent log events"""
    category = request.args.get('category')
    hours = int(request.args.get('hours', 24))
    limit = int(request.args.get('limit', 100))
    
    events = log_analyzer.get_recent_events(category, hours, limit)
    return jsonify(events)

@logging_bp.route('/search')
def search_logs():
    """Search logs with filters"""
    query = request.args.get('q', '')
    category = request.args.get('category')
    level = request.args.get('level')
    hours = int(request.args.get('hours', 24))
    
    results = log_analyzer.search_logs(query, category, level, hours)
    return jsonify(results)

@logging_bp.route('/categories')
def get_log_categories():
    """Get available log categories"""
    return jsonify([cat.value for cat in LogCategory])

@logging_bp.route('/health')
def logging_health():
    """Get logging system health status"""
    health = {
        'status': 'healthy',
        'log_files': {},
        'disk_usage': {},
        'last_events': {}
    }
    
    # Check log files
    for category in log_analyzer.categories:
        log_file = f"{category}.log"
        file_path = os.path.join(log_analyzer.log_dir, log_file)
        
        if os.path.exists(file_path):
            stat = os.stat(file_path)
            health['log_files'][log_file] = {
                'exists': True,
                'size_bytes': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
            }
        else:
            health['log_files'][log_file] = {'exists': False}
    
    return jsonify(health)

# Function to register the blueprint with the main app
def register_logging_routes(app):
    """Register logging routes with the Flask app"""
    app.register_blueprint(logging_bp)
    
    # Also add a simple route for quick access
    @app.route('/logs')
    def logs_redirect():
        from flask import redirect
        return redirect('/api/logs/dashboard')