#!/usr/bin/env python3
"""
Startup script for NextGen Organization Visualizer Backend
"""

import os
import sys
import logging.config
from config import config_map

def get_config_class():
    """Get the configuration class based on environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config_map.get(env, config_map['default'])

def setup_logging(config_class):
    """Setup logging configuration"""
    logging_config = config_class.get_logging_config()
    logging.config.dictConfig(logging_config)
    return logging.getLogger(__name__)

def check_environment(config_class):
    """Check if all required environment variables are set"""
    try:
        config_class.validate_required_config()
        return True
    except ValueError as e:
        print(f"Configuration error: {e}")
        return False

def initialize_database(app, db, logger):
    """Initialize database tables"""
    try:
        with app.app_context():
            db.create_all()
            logger.info("Database tables initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return False

def run_server(app, config_class, logger):
    """Run the Flask server"""
    try:
        port = int(os.getenv('PORT', 5000))
        debug = config_class.DEBUG
        
        logger.info(f"Starting server on port {port} (debug={debug})")
        logger.info(f"Using configuration: {config_class.__name__}")
        
        app.run(
            host='0.0.0.0',
            port=port,
            debug=debug,
            threaded=True,
            # Import-time WebSocket workers must only be started once.
            use_reloader=False
        )
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        return False

def main():
    """Main startup function"""
    print("🚀 NextGen Organization Visualizer Backend")
    print("=" * 50)
    
    # Get configuration
    config_class = get_config_class()
    
    # Setup logging
    logger = setup_logging(config_class)
    
    # Check environment
    if not check_environment(config_class):
        sys.exit(1)
    
    # Import app after configuration is set
    from app import app, db
    
    # Configure Flask app with the selected configuration
    app.config.from_object(config_class)
    
    # Initialize database
    if not initialize_database(app, db, logger):
        sys.exit(1)
    
    # Run server
    logger.info("All systems ready. Starting server...")
    run_server(app, config_class, logger)

if __name__ == '__main__':
    main()
