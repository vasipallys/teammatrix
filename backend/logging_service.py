#!/usr/bin/env python3
"""
Advanced Logging Service for NextGen Organization Visualizer
Provides comprehensive logging for all application events including:
- Git/Bitbucket/GitLab operations
- Jira integrations  
- LDAP synchronizations
- File upload operations
- WebSocket events
- API requests and responses
- Database operations
- Error tracking and monitoring
"""

import logging
import logging.handlers
import json
import traceback
from datetime import datetime, timezone
from functools import wraps
import os
import sys
import time
from typing import Dict, Any, Optional, Callable
from enum import Enum
import uuid

class LogLevel(Enum):
    """Enhanced log levels for different event types"""
    CRITICAL = "CRITICAL"
    ERROR = "ERROR" 
    WARNING = "WARNING"
    INFO = "INFO"
    DEBUG = "DEBUG"
    TRACE = "TRACE"  # Ultra-detailed tracing

class LogCategory(Enum):
    """Event categories for better log organization"""
    GIT = "GIT"
    JIRA = "JIRA"
    LDAP = "LDAP"
    UPLOAD = "UPLOAD"
    WEBSOCKET = "WEBSOCKET"
    API = "API"
    DATABASE = "DATABASE"
    AUTH = "AUTH"
    SYSTEM = "SYSTEM"
    SECURITY = "SECURITY"
    ANALYTICS = "ANALYTICS"
    PERFORMANCE = "PERFORMANCE"

class EventLogger:
    """Advanced event logger with structured logging and multiple outputs"""
    
    def __init__(self, app_name: str = "teammatrix", log_dir: str = "./logs"):
        self.app_name = app_name
        self.log_dir = log_dir
        self.session_id = str(uuid.uuid4())[:8]
        
        # Create logs directory
        os.makedirs(log_dir, exist_ok=True)
        
        # Initialize loggers
        self.loggers = {}
        self._setup_loggers()
    
    def _setup_loggers(self):
        """Setup multiple specialized loggers"""
        
        # Main application logger
        self.main_logger = self._create_logger(
            'main', 
            f"{self.log_dir}/app.log",
            level=logging.INFO
        )
        
        # Category-specific loggers
        for category in LogCategory:
            logger_name = category.value.lower()
            self.loggers[category] = self._create_logger(
                logger_name,
                f"{self.log_dir}/{logger_name}.log",
                level=logging.DEBUG
            )
        
        # Security events logger (separate for audit)
        self.security_logger = self._create_logger(
            'security',
            f"{self.log_dir}/security.log", 
            level=logging.INFO,
            format_type='security'
        )
        
        # Performance metrics logger
        self.perf_logger = self._create_logger(
            'performance',
            f"{self.log_dir}/performance.log",
            level=logging.INFO,
            format_type='performance'
        )
        
        # Error tracking logger
        self.error_logger = self._create_logger(
            'errors',
            f"{self.log_dir}/errors.log",
            level=logging.ERROR,
            format_type='error'
        )
    
    def _create_logger(self, name: str, filename: str, level: int, format_type: str = 'default'):
        """Create a configured logger with file rotation"""
        
        logger = logging.getLogger(f"{self.app_name}.{name}")
        logger.setLevel(level)
        logger.propagate = False
        
        # Remove existing handlers to avoid duplicates
        logger.handlers.clear()
        
        # File handler with rotation
        file_handler = logging.handlers.RotatingFileHandler(
            filename,
            maxBytes=50*1024*1024,  # 50MB
            backupCount=10,
            encoding='utf-8'
        )
        
        # Console handler for development
        console_handler = logging.StreamHandler(sys.stdout)
        
        # Set formatters based on type
        if format_type == 'security':
            formatter = logging.Formatter(
                '[%(asctime)s] SECURITY [%(levelname)s] %(message)s | Session: ' + self.session_id,
                datefmt='%Y-%m-%d %H:%M:%S UTC'
            )
        elif format_type == 'performance':
            formatter = logging.Formatter(
                '[%(asctime)s] PERF [%(levelname)s] %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S UTC'
            )
        elif format_type == 'error':
            formatter = logging.Formatter(
                '[%(asctime)s] ERROR [%(levelname)s] %(pathname)s:%(lineno)d - %(funcName)s() - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S UTC'
            )
        else:  # default
            formatter = logging.Formatter(
                '[%(asctime)s] %(name)s [%(levelname)s] %(pathname)s:%(lineno)d - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S UTC'
            )

        formatter.converter = time.gmtime
        
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    def _build_context(self, category: LogCategory, **kwargs) -> Dict[str, Any]:
        """Build structured context for log entry"""
        return {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'session_id': self.session_id,
            'category': category.value,
            'app_name': self.app_name,
            **kwargs
        }
    
    def log_event(self, category: LogCategory, level: LogLevel, message: str, **context):
        """Log a structured event"""
        logger = self.loggers.get(category, self.main_logger)
        
        # Build structured log message
        log_context = self._build_context(category, **context)
        structured_message = f"{message} | Context: {json.dumps(log_context, default=str)}"
        
        # Log at appropriate level
        if level == LogLevel.CRITICAL:
            logger.critical(structured_message)
        elif level == LogLevel.ERROR:
            logger.error(structured_message)
            # Also log to error logger
            self.error_logger.error(structured_message)
        elif level == LogLevel.WARNING:
            logger.warning(structured_message)
        elif level == LogLevel.INFO:
            logger.info(structured_message)
        elif level == LogLevel.DEBUG:
            logger.debug(structured_message)
        elif level == LogLevel.TRACE:
            logger.debug(f"TRACE: {structured_message}")
    
    def log_git_operation(self, operation: str, repository: str, user: str = None, 
                         status: str = "SUCCESS", details: Dict = None, error: Exception = None):
        """Log Git-related operations"""
        context = {
            'operation': operation,
            'repository': repository,
            'user': user,
            'status': status,
            'details': details or {}
        }
        
        if error:
            context['error'] = str(error)
            context['traceback'] = traceback.format_exc()
            self.log_event(LogCategory.GIT, LogLevel.ERROR, 
                          f"Git operation failed: {operation}", **context)
        else:
            self.log_event(LogCategory.GIT, LogLevel.INFO, 
                          f"Git operation completed: {operation}", **context)
    
    def log_jira_operation(self, operation: str, project: str = None, issue: str = None,
                          user: str = None, status: str = "SUCCESS", details: Dict = None, error: Exception = None):
        """Log Jira integration operations"""
        context = {
            'operation': operation,
            'project': project,
            'issue': issue,
            'user': user,
            'status': status,
            'details': details or {}
        }
        
        if error:
            context['error'] = str(error)
            context['traceback'] = traceback.format_exc()
            self.log_event(LogCategory.JIRA, LogLevel.ERROR,
                          f"Jira operation failed: {operation}", **context)
        else:
            self.log_event(LogCategory.JIRA, LogLevel.INFO,
                          f"Jira operation completed: {operation}", **context)
    
    def log_ldap_operation(self, operation: str, user: str = None, entries_processed: int = 0,
                          status: str = "SUCCESS", details: Dict = None, error: Exception = None):
        """Log LDAP synchronization operations"""
        context = {
            'operation': operation,
            'user': user,
            'entries_processed': entries_processed,
            'status': status,
            'details': details or {}
        }
        
        if error:
            context['error'] = str(error)
            context['traceback'] = traceback.format_exc()
            self.log_event(LogCategory.LDAP, LogLevel.ERROR,
                          f"LDAP operation failed: {operation}", **context)
        else:
            self.log_event(LogCategory.LDAP, LogLevel.INFO,
                          f"LDAP operation completed: {operation}", **context)
    
    def log_file_upload(self, filename: str, user: str = None, file_size: int = 0,
                       file_type: str = None, status: str = "SUCCESS", processing_time: float = None,
                       records_processed: int = 0, details: Dict = None, error: Exception = None):
        """Log file upload operations"""
        context = {
            'filename': filename,
            'user': user,
            'file_size': file_size,
            'file_type': file_type,
            'status': status,
            'processing_time': processing_time,
            'records_processed': records_processed,
            'details': details or {}
        }
        
        if error:
            context['error'] = str(error)
            context['traceback'] = traceback.format_exc()
            self.log_event(LogCategory.UPLOAD, LogLevel.ERROR,
                          f"File upload failed: {filename}", **context)
        else:
            self.log_event(LogCategory.UPLOAD, LogLevel.INFO,
                          f"File upload completed: {filename}", **context)
    
    def log_websocket_event(self, event_type: str, client_id: str = None, room: str = None,
                           data_size: int = 0, status: str = "SUCCESS", error: Exception = None):
        """Log WebSocket events"""
        context = {
            'event_type': event_type,
            'client_id': client_id,
            'room': room,
            'data_size': data_size,
            'status': status
        }
        
        if error:
            context['error'] = str(error)
            self.log_event(LogCategory.WEBSOCKET, LogLevel.ERROR,
                          f"WebSocket event failed: {event_type}", **context)
        else:
            self.log_event(LogCategory.WEBSOCKET, LogLevel.DEBUG,
                          f"WebSocket event: {event_type}", **context)
    
    def log_api_request(self, method: str, endpoint: str, user: str = None, ip: str = None,
                       status_code: int = 200, response_time: float = None, request_size: int = 0,
                       response_size: int = 0, error: Exception = None):
        """Log API requests and responses"""
        context = {
            'method': method,
            'endpoint': endpoint,
            'user': user,
            'ip': ip,
            'status_code': status_code,
            'response_time': response_time,
            'request_size': request_size,
            'response_size': response_size
        }
        
        if error or status_code >= 400:
            if error:
                context['error'] = str(error)
            self.log_event(LogCategory.API, LogLevel.WARNING if status_code < 500 else LogLevel.ERROR,
                          f"API request: {method} {endpoint} -> {status_code}", **context)
        else:
            self.log_event(LogCategory.API, LogLevel.INFO,
                          f"API request: {method} {endpoint} -> {status_code}", **context)
    
    def log_database_operation(self, operation: str, table: str, affected_rows: int = 0,
                              execution_time: float = None, user: str = None, error: Exception = None):
        """Log database operations"""
        context = {
            'operation': operation,
            'table': table,
            'affected_rows': affected_rows,
            'execution_time': execution_time,
            'user': user
        }
        
        if error:
            context['error'] = str(error)
            context['traceback'] = traceback.format_exc()
            self.log_event(LogCategory.DATABASE, LogLevel.ERROR,
                          f"Database operation failed: {operation} on {table}", **context)
        else:
            self.log_event(LogCategory.DATABASE, LogLevel.DEBUG,
                          f"Database operation: {operation} on {table}", **context)
    
    def log_security_event(self, event_type: str, user: str = None, ip: str = None,
                          success: bool = True, details: Dict = None):
        """Log security-related events"""
        context = {
            'event_type': event_type,
            'user': user,
            'ip': ip,
            'success': success,
            'details': details or {}
        }
        
        level = LogLevel.INFO if success else LogLevel.WARNING
        message = f"Security event: {event_type} - {'SUCCESS' if success else 'FAILED'}"
        
        # LogCategory.SECURITY is configured with the dedicated security logger.
        self.log_event(LogCategory.SECURITY, level, message, **context)
    
    def log_performance_metric(self, metric_name: str, value: float, unit: str = "ms",
                              endpoint: str = None, details: Dict = None):
        """Log performance metrics"""
        context = {
            'metric_name': metric_name,
            'value': value,
            'unit': unit,
            'endpoint': endpoint,
            'details': details or {}
        }
        
        message = f"Performance metric: {metric_name} = {value} {unit}"
        self.log_event(LogCategory.PERFORMANCE, LogLevel.INFO, message, **context)

# Global logger instance
event_logger = EventLogger()

# Decorator for automatic API logging
def log_api_calls(func: Callable) -> Callable:
    """Decorator to automatically log API calls"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        from flask import request as flask_request
        
        start_time = datetime.now()
        method = flask_request.method
        endpoint = flask_request.endpoint or flask_request.path
        ip = flask_request.remote_addr
        request_size = len(flask_request.get_data())
        
        try:
            result = func(*args, **kwargs)
            
            # Calculate response metrics
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000  # ms
            
            if hasattr(result, 'get_data'):
                response_size = len(result.get_data())
                status_code = result.status_code
            else:
                response_size = len(str(result)) if result else 0
                status_code = 200
            
            event_logger.log_api_request(
                method=method,
                endpoint=endpoint,
                ip=ip,
                status_code=status_code,
                response_time=response_time,
                request_size=request_size,
                response_size=response_size
            )
            
            return result
            
        except Exception as e:
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000
            
            event_logger.log_api_request(
                method=method,
                endpoint=endpoint,
                ip=ip,
                status_code=500,
                response_time=response_time,
                request_size=request_size,
                response_size=0,
                error=e
            )
            
            raise e
    
    return wrapper

# Convenience functions for common logging scenarios
def log_git_sync(repo_name: str, commits: int = 0, prs: int = 0, branches: int = 0, error: Exception = None):
    """Log git repository synchronization"""
    details = {'commits': commits, 'pull_requests': prs, 'branches': branches}
    event_logger.log_git_operation(
        operation="repository_sync",
        repository=repo_name,
        status="FAILED" if error else "SUCCESS",
        details=details,
        error=error
    )

def log_jira_sync(project_key: str, epics: int = 0, stories: int = 0, sprints: int = 0, error: Exception = None):
    """Log Jira project synchronization"""
    details = {'epics': epics, 'stories': stories, 'sprints': sprints}
    event_logger.log_jira_operation(
        operation="project_sync",
        project=project_key,
        status="FAILED" if error else "SUCCESS",
        details=details,
        error=error
    )

def log_ldap_sync(entries: int = 0, updated: int = 0, inserted: int = 0, error: Exception = None):
    """Log LDAP directory synchronization"""
    details = {'total_entries': entries, 'updated': updated, 'inserted': inserted}
    event_logger.log_ldap_operation(
        operation="directory_sync",
        entries_processed=entries,
        status="FAILED" if error else "SUCCESS",
        details=details,
        error=error
    )
