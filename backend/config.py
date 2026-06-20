import os
import logging

class Config:
    # Basic Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY')
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    TESTING = os.environ.get('FLASK_TESTING', 'false').lower() == 'true'
    
    # Database Configuration
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///org_visualizer.db'
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    
    # LDAP Configuration
    LDAP_SERVER = os.environ.get('LDAP_SERVER')
    LDAP_USER = os.environ.get('LDAP_USER') 
    LDAP_PASSWORD = os.environ.get('LDAP_PASSWORD')
    LDAP_BASE_DN = os.environ.get('LDAP_BASE_DN')
    LDAP_TIMEOUT = int(os.environ.get('LDAP_TIMEOUT', '30'))
    LDAP_USE_TLS = os.environ.get('LDAP_USE_TLS', 'false').lower() == 'true'
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', str(16 * 1024 * 1024)))
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', './uploads')
    ALLOWED_EXTENSIONS = set(['csv', 'xlsx', 'xls'])
    
    # WebSocket Configuration
    WEBSOCKET_HEARTBEAT_INTERVAL = int(os.environ.get('WEBSOCKET_HEARTBEAT_INTERVAL', '30'))
    WEBSOCKET_MAX_CLIENTS = int(os.environ.get('WEBSOCKET_MAX_CLIENTS', '100'))
    
    # API Rate Limiting
    RATE_LIMIT_ENABLED = os.environ.get('RATE_LIMIT_ENABLED', 'true').lower() == 'true'
    RATE_LIMIT_DEFAULT = os.environ.get('RATE_LIMIT_DEFAULT', '1000 per hour')
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization', 'X-Requested-With']
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
    LOG_FILE = os.environ.get('LOG_FILE', 'app.log')
    LOG_MAX_BYTES = int(os.environ.get('LOG_MAX_BYTES', '10485760'))  # 10MB
    LOG_BACKUP_COUNT = int(os.environ.get('LOG_BACKUP_COUNT', '5'))
    
    # Cache Configuration
    CACHE_TYPE = os.environ.get('CACHE_TYPE', 'simple')
    CACHE_DEFAULT_TIMEOUT = int(os.environ.get('CACHE_DEFAULT_TIMEOUT', '300'))
    
    # Git Integration Configuration
    GIT_API_TIMEOUT = int(os.environ.get('GIT_API_TIMEOUT', '30'))
    GIT_CLONE_TIMEOUT = int(os.environ.get('GIT_CLONE_TIMEOUT', '300'))
    GIT_TEMP_DIR = os.environ.get('GIT_TEMP_DIR', './temp/git')
    
    # Jira Integration Configuration
    JIRA_API_TIMEOUT = int(os.environ.get('JIRA_API_TIMEOUT', '30'))
    JIRA_MAX_RESULTS = int(os.environ.get('JIRA_MAX_RESULTS', '1000'))
    
    # Performance Configuration
    ENABLE_PROFILING = os.environ.get('ENABLE_PROFILING', 'false').lower() == 'true'
    SLOW_QUERY_THRESHOLD = float(os.environ.get('SLOW_QUERY_THRESHOLD', '0.5'))
    
    # Security Configuration
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'true').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    WTF_CSRF_ENABLED = os.environ.get('WTF_CSRF_ENABLED', 'true').lower() == 'true'
    
    # Analytics Configuration
    ENABLE_ANALYTICS_TRACKING = os.environ.get('ENABLE_ANALYTICS_TRACKING', 'false').lower() == 'true'
    ANALYTICS_RETENTION_DAYS = int(os.environ.get('ANALYTICS_RETENTION_DAYS', '90'))

    @classmethod
    def validate_required_config(cls):
        """Validate that all required configuration is present"""
        required_configs = ['SECRET_KEY']
        missing_configs = []
        
        for config in required_configs:
            if not getattr(cls, config):
                missing_configs.append(config)
        
        if missing_configs:
            raise ValueError(f"Missing required configuration: {', '.join(missing_configs)}")
    
    @classmethod
    def get_logging_config(cls):
        """Get logging configuration dictionary"""
        return {
            'version': 1,
            'disable_existing_loggers': False,
            'formatters': {
                'default': {
                    'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
                },
                'detailed': {
                    'format': '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
                }
            },
            'handlers': {
                'console': {
                    'class': 'logging.StreamHandler',
                    'level': cls.LOG_LEVEL,
                    'formatter': 'default',
                    'stream': 'ext://sys.stdout'
                },
                'file': {
                    'class': 'logging.handlers.RotatingFileHandler',
                    'level': cls.LOG_LEVEL,
                    'formatter': 'detailed',
                    'filename': cls.LOG_FILE,
                    'maxBytes': cls.LOG_MAX_BYTES,
                    'backupCount': cls.LOG_BACKUP_COUNT,
                }
            },
            'root': {
                'level': cls.LOG_LEVEL,
                'handlers': ['console', 'file']
            }
        }

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    LDAP_SERVER = os.environ.get('LDAP_SERVER') or 'ldap://localhost:389'
    LDAP_USER = os.environ.get('LDAP_USER') or 'cn=admin,dc=example,dc=com'
    LDAP_PASSWORD = os.environ.get('LDAP_PASSWORD') or 'admin'
    LDAP_BASE_DN = os.environ.get('LDAP_BASE_DN') or 'dc=example,dc=com'
    LOG_LEVEL = 'DEBUG'
    SESSION_COOKIE_SECURE = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
    
    @classmethod
    def validate_required_config(cls):
        """Validate production-specific requirements"""
        super().validate_required_config()
        
        # Additional production requirements
        required_prod_configs = [
            'LDAP_SERVER', 'LDAP_USER', 'LDAP_PASSWORD', 'LDAP_BASE_DN'
        ]
        
        missing_configs = []
        for config in required_prod_configs:
            if not getattr(cls, config):
                missing_configs.append(config)
        
        if missing_configs:
            print(f"WARNING: Missing production configuration (using defaults): {', '.join(missing_configs)}")

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SECRET_KEY = 'testing-secret-key'
    DATABASE_URL = 'sqlite:///:memory:'
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    LDAP_SERVER = 'ldap://test.example.com'
    LOG_LEVEL = 'DEBUG'
    WTF_CSRF_ENABLED = False

# Configuration mapping
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}