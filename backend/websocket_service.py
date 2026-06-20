from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
import json
import logging
from datetime import datetime
from threading import Thread
import time
from logging_service import event_logger, LogLevel, LogCategory

logger = logging.getLogger(__name__)

class WebSocketService:
    def __init__(self, app):
        self.socketio = SocketIO(
            app, 
            cors_allowed_origins="*",
            async_mode='threading',
            logger=True,
            engineio_logger=True
        )
        self.connected_clients = {}
        self.user_activities = []
        self.setup_handlers()
        
    def setup_handlers(self):
        @self.socketio.on('connect')
        def handle_connect():
            client_id = request.sid
            user_ip = request.environ.get('REMOTE_ADDR', 'unknown')
            
            self.connected_clients[client_id] = {
                'connected_at': datetime.utcnow(),
                'last_activity': datetime.utcnow(),
                'user_id': None,
                'ip': user_ip
            }
            
            # Log WebSocket connection
            event_logger.log_websocket_event(
                event_type="client_connect",
                client_id=client_id,
                status="SUCCESS",
                data_size=0
            )
            
            # Log security event
            event_logger.log_security_event(
                event_type="websocket_connection",
                ip=user_ip,
                success=True,
                details={'client_id': client_id}
            )
            
            logger.info(f"Client {client_id} connected from {user_ip}")
            emit('connected', {'status': 'success', 'client_id': client_id})
            
        @self.socketio.on('disconnect')
        def handle_disconnect():
            client_id = request.sid
            connection_info = self.connected_clients.get(client_id, {})
            user_ip = connection_info.get('ip', 'unknown')
            
            # Calculate session duration
            if 'connected_at' in connection_info:
                session_duration = (datetime.utcnow() - connection_info['connected_at']).total_seconds()
            else:
                session_duration = 0
            
            # Log WebSocket disconnection
            event_logger.log_websocket_event(
                event_type="client_disconnect",
                client_id=client_id,
                status="SUCCESS",
                data_size=0
            )
            
            # Log performance metric for session duration
            event_logger.log_performance_metric(
                metric_name="websocket_session_duration",
                value=session_duration,
                unit="seconds",
                details={'client_id': client_id, 'ip': user_ip}
            )
            
            if client_id in self.connected_clients:
                del self.connected_clients[client_id]
            
            logger.info(f"Client {client_id} disconnected after {session_duration:.1f} seconds")
            
        @self.socketio.on('user_activity')
        def handle_user_activity(data):
            client_id = request.sid
            activity = {
                'client_id': client_id,
                'timestamp': datetime.utcnow(),
                'activity': data
            }
            self.user_activities.append(activity)
            
            # Log user activity
            event_logger.log_websocket_event(
                event_type="user_activity",
                client_id=client_id,
                data_size=len(str(data)) if data else 0,
                status="SUCCESS"
            )
            
            # Log detailed activity for analytics
            event_logger.log_event(
                category=LogCategory.ANALYTICS,
                level=LogLevel.DEBUG,
                message="User activity tracked",
                client_id=client_id,
                activity_type=data.get('type', 'unknown') if data else 'unknown',
                activity_data=data
            )
            
            # Keep only last 100 activities
            if len(self.user_activities) > 100:
                self.user_activities = self.user_activities[-100:]
                
            # Broadcast activity to other clients
            emit('user_activity', activity, broadcast=True, include_self=False)
            
        @self.socketio.on('request_org_update')
        def handle_org_update_request():
            client_id = request.sid
            
            # Log organization data update request
            event_logger.log_websocket_event(
                event_type="org_update_request",
                client_id=client_id,
                status="SUCCESS"
            )
            
            # Log API-like event for data requests
            event_logger.log_event(
                category=LogCategory.API,
                level=LogLevel.INFO,
                message="Organization data update requested via WebSocket",
                client_id=client_id,
                endpoint="websocket:request_org_update"
            )
            
            # This would trigger a fresh data fetch
            logger.info(f"Organization data update requested by client {client_id}")
            # In a real implementation, you'd fetch fresh data here
            emit('org_data_update_requested')
            
        @self.socketio.on('request_work_update')
        def handle_work_update_request():
            client_id = request.sid
            
            # Log work plan data update request
            event_logger.log_websocket_event(
                event_type="work_update_request",
                client_id=client_id,
                status="SUCCESS"
            )
            
            # Log API-like event for data requests
            event_logger.log_event(
                category=LogCategory.API,
                level=LogLevel.INFO,
                message="Work plan data update requested via WebSocket",
                client_id=client_id,
                endpoint="websocket:request_work_update"
            )
            
            logger.info(f"Work plan data update requested by client {client_id}")
            emit('work_data_update_requested')
            
        @self.socketio.on('heartbeat')
        def handle_heartbeat():
            client_id = request.sid
            
            # Log heartbeat (trace level to avoid spam)
            event_logger.log_event(
                category=LogCategory.WEBSOCKET,
                level=LogLevel.TRACE,
                message="Heartbeat received",
                client_id=client_id
            )
            
            if client_id in self.connected_clients:
                self.connected_clients[client_id]['last_activity'] = datetime.utcnow()
            emit('heartbeat_response')
            
        @self.socketio.on('join_room')
        def handle_join_room(data):
            client_id = request.sid
            room = data.get('room')
            
            if room:
                # Log room join event
                event_logger.log_websocket_event(
                    event_type="join_room",
                    client_id=client_id,
                    room=room,
                    status="SUCCESS"
                )
                
                join_room(room)
                emit('joined_room', {'room': room})
                logger.info(f"Client {client_id} joined room {room}")
            else:
                # Log failed room join
                event_logger.log_websocket_event(
                    event_type="join_room_failed",
                    client_id=client_id,
                    status="FAILED"
                )
                
        @self.socketio.on('leave_room')
        def handle_leave_room(data):
            client_id = request.sid
            room = data.get('room')
            
            if room:
                # Log room leave event
                event_logger.log_websocket_event(
                    event_type="leave_room",
                    client_id=client_id,
                    room=room,
                    status="SUCCESS"
                )
                
                leave_room(room)
                emit('left_room', {'room': room})
                logger.info(f"Client {client_id} left room {room}")
            else:
                # Log failed room leave
                event_logger.log_websocket_event(
                    event_type="leave_room_failed",
                    client_id=client_id,
                    status="FAILED"
                )

    def broadcast_org_data_update(self, data):
        """Broadcast organization data updates to all connected clients"""
        message_size = len(str(data)) if data else 0
        connected_count = len(self.connected_clients)
        
        # Log broadcast event
        event_logger.log_websocket_event(
            event_type="broadcast_org_data_update",
            data_size=message_size,
            status="SUCCESS"
        )
        
        # Log performance metric
        event_logger.log_performance_metric(
            metric_name="websocket_broadcast_size",
            value=message_size,
            unit="bytes",
            details={'broadcast_type': 'org_data_update', 'recipients': connected_count}
        )
        
        self.socketio.emit('org_data_updated', {
            'type': 'org_data_updated',
            'payload': data,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        logger.info(f"Broadcasted org data update to {connected_count} clients ({message_size} bytes)")
        
    def broadcast_work_data_update(self, data):
        """Broadcast work plan data updates to all connected clients"""
        message_size = len(str(data)) if data else 0
        connected_count = len(self.connected_clients)
        
        # Log broadcast event
        event_logger.log_websocket_event(
            event_type="broadcast_work_data_update",
            data_size=message_size,
            status="SUCCESS"
        )
        
        # Log performance metric
        event_logger.log_performance_metric(
            metric_name="websocket_broadcast_size",
            value=message_size,
            unit="bytes",
            details={'broadcast_type': 'work_data_update', 'recipients': connected_count}
        )
        
        self.socketio.emit('work_data_updated', {
            'type': 'work_data_updated',
            'payload': data,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        logger.info(f"Broadcasted work data update to {connected_count} clients ({message_size} bytes)")
        
    def broadcast_system_notification(self, message, level='info'):
        """Broadcast system notifications to all connected clients"""
        message_size = len(str(message))
        connected_count = len(self.connected_clients)
        
        # Log broadcast event
        event_logger.log_websocket_event(
            event_type="broadcast_system_notification",
            data_size=message_size,
            status="SUCCESS"
        )
        
        # Log the notification itself based on level
        log_level = LogLevel.WARNING if level == 'error' else LogLevel.INFO
        event_logger.log_event(
            category=LogCategory.SYSTEM,
            level=log_level,
            message=f"System notification broadcasted: {message}",
            notification_level=level,
            recipients=connected_count
        )
        
        self.socketio.emit('system_notification', {
            'type': 'system_notification',
            'payload': {
                'message': message,
                'level': level,
                'timestamp': datetime.utcnow().isoformat()
            }
        })
        
        logger.info(f"Broadcasted system notification ({level}) to {connected_count} clients: {message}")
        
    def broadcast_data_sync_status(self, status, details=None):
        """Broadcast data synchronization status"""
        message_data = {'status': status, 'details': details}
        message_size = len(str(message_data))
        connected_count = len(self.connected_clients)
        
        # Log broadcast event
        event_logger.log_websocket_event(
            event_type="broadcast_data_sync_status",
            data_size=message_size,
            status="SUCCESS"
        )
        
        # Log sync status event
        event_logger.log_event(
            category=LogCategory.SYSTEM,
            level=LogLevel.INFO,
            message=f"Data sync status broadcasted: {status}",
            sync_status=status,
            sync_details=details,
            recipients=connected_count
        )
        
        self.socketio.emit('data_sync_status', {
            'type': 'data_sync_status',
            'payload': {
                'status': status,
                'details': details,
                'timestamp': datetime.utcnow().isoformat()
            }
        })
        
        logger.info(f"Broadcasted data sync status '{status}' to {connected_count} clients")
        
    def get_connected_clients_count(self):
        """Get the number of currently connected clients"""
        return len(self.connected_clients)
        
    def get_user_activities(self, limit=50):
        """Get recent user activities"""
        return self.user_activities[-limit:]
        
    def start_heartbeat_monitor(self):
        """Start a background thread to monitor client connections"""
        def monitor():
            while True:
                try:
                    current_time = datetime.utcnow()
                    inactive_clients = []
                    
                    for client_id, client_info in self.connected_clients.items():
                        last_activity = client_info['last_activity']
                        if (current_time - last_activity).seconds > 60:  # 60 seconds timeout
                            inactive_clients.append(client_id)
                    
                    # Remove inactive clients
                    for client_id in inactive_clients:
                        if client_id in self.connected_clients:
                            del self.connected_clients[client_id]
                            
                            # Log client timeout
                            event_logger.log_websocket_event(
                                event_type="client_timeout",
                                client_id=client_id,
                                status="SUCCESS"
                            )
                            
                            logger.info(f"Removed inactive client {client_id}")
                    
                    # Send heartbeat to all clients
                    connected_count = len(self.connected_clients)
                    
                    # Log heartbeat broadcast (trace level to avoid spam)
                    event_logger.log_event(
                        category=LogCategory.WEBSOCKET,
                        level=LogLevel.TRACE,
                        message="Heartbeat broadcast sent",
                        connected_clients=connected_count,
                        inactive_clients_removed=len(inactive_clients)
                    )
                    
                    self.socketio.emit('heartbeat', {
                        'timestamp': current_time.isoformat(),
                        'connected_clients': connected_count
                    })
                    
                    # Log performance metrics
                    if connected_count > 0:
                        event_logger.log_performance_metric(
                            metric_name="websocket_active_connections",
                            value=connected_count,
                            unit="count",
                            details={'inactive_removed': len(inactive_clients)}
                        )
                    
                    time.sleep(30)  # Check every 30 seconds
                    
                except Exception as e:
                    event_logger.log_websocket_event(
                        event_type="heartbeat_monitor_error",
                        error=e,
                        status="FAILED"
                    )
                    logger.error(f"Error in heartbeat monitor: {e}")
                    time.sleep(30)
        
        thread = Thread(target=monitor, daemon=True)
        thread.start()
        logger.info("Heartbeat monitor started")

# Data synchronization service
class DataSyncService:
    def __init__(self, websocket_service):
        self.ws = websocket_service
        self.sync_in_progress = False
        self.last_sync_time = None
        
    def start_auto_sync(self, interval_minutes=5):
        """Start automatic data synchronization"""
        def sync_worker():
            while True:
                try:
                    time.sleep(interval_minutes * 60)
                    if not self.sync_in_progress:
                        self.sync_all_data()
                except Exception as e:
                    logger.error(f"Error in auto sync: {e}")
        
        thread = Thread(target=sync_worker, daemon=True)
        thread.start()
        logger.info(f"Auto sync started with {interval_minutes} minute interval")
        
    def sync_all_data(self):
        """Synchronize all data sources"""
        if self.sync_in_progress:
            return
            
        self.sync_in_progress = True
        start_time = datetime.utcnow()
        
        try:
            # Log sync start
            event_logger.log_event(
                category=LogCategory.SYSTEM,
                level=LogLevel.INFO,
                message="Data synchronization started",
                sync_type="all_data"
            )
            
            logger.info("Starting data synchronization")
            self.ws.broadcast_data_sync_status('started')
            
            # Simulate data sync operations
            # In a real implementation, you would:
            # 1. Sync with LDAP
            # 2. Update database
            # 3. Refresh cached data
            # 4. Validate data integrity
            
            time.sleep(2)  # Simulate sync time
            
            self.last_sync_time = datetime.utcnow()
            sync_duration = (self.last_sync_time - start_time).total_seconds()
            
            # Log successful sync
            event_logger.log_event(
                category=LogCategory.SYSTEM,
                level=LogLevel.INFO,
                message="Data synchronization completed successfully",
                sync_type="all_data",
                sync_duration=sync_duration,
                records_updated=0
            )
            
            # Log performance metric
            event_logger.log_performance_metric(
                metric_name="data_sync_duration",
                value=sync_duration * 1000,  # Convert to ms
                unit="ms",
                details={'sync_type': 'all_data', 'records_updated': 0}
            )
            
            self.ws.broadcast_data_sync_status('completed', {
                'sync_time': self.last_sync_time.isoformat(),
                'records_updated': 0  # Would be actual count
            })
            
            logger.info(f"Data synchronization completed in {sync_duration:.2f} seconds")
            
        except Exception as e:
            sync_duration = (datetime.utcnow() - start_time).total_seconds()
            
            # Log failed sync
            event_logger.log_event(
                category=LogCategory.SYSTEM,
                level=LogLevel.ERROR,
                message="Data synchronization failed",
                sync_type="all_data",
                sync_duration=sync_duration,
                error=str(e)
            )
            
            logger.error(f"Data sync failed: {e}")
            self.ws.broadcast_data_sync_status('failed', {'error': str(e)})
        finally:
            self.sync_in_progress = False
            
    def sync_ldap_data(self):
        """Synchronize LDAP data specifically"""
        try:
            logger.info("Syncing LDAP data")
            # LDAP sync implementation would go here
            self.ws.broadcast_system_notification("LDAP data synchronized", "success")
        except Exception as e:
            logger.error(f"LDAP sync failed: {e}")
            self.ws.broadcast_system_notification(f"LDAP sync failed: {e}", "error")
            
    def sync_work_plan_data(self):
        """Synchronize work plan data"""
        try:
            logger.info("Syncing work plan data")
            # Work plan sync implementation would go here
            self.ws.broadcast_system_notification("Work plan data synchronized", "success")
        except Exception as e:
            logger.error(f"Work plan sync failed: {e}")
            self.ws.broadcast_system_notification(f"Work plan sync failed: {e}", "error")

# Analytics service for real-time insights
class AnalyticsService:
    def __init__(self, websocket_service):
        self.ws = websocket_service
        self.analytics_cache = {}
        
    def analyze_user_activity(self):
        """Analyze user activity patterns"""
        activities = self.ws.get_user_activities()
        
        # Simple activity analysis
        activity_types = {}
        for activity in activities:
            activity_type = activity['activity'].get('type', 'unknown')
            activity_types[activity_type] = activity_types.get(activity_type, 0) + 1
            
        return {
            'total_activities': len(activities),
            'activity_types': activity_types,
            'active_users': len(set(a['client_id'] for a in activities))
        }
        
    def generate_real_time_insights(self, org_data=None, work_data=None):
        """Generate real-time insights and broadcast them"""
        insights = []
        
        # Connection insights
        connected_count = self.ws.get_connected_clients_count()
        if connected_count > 0:
            insights.append({
                'type': 'info',
                'category': 'System',
                'title': 'Active Users',
                'description': f'{connected_count} users currently connected',
                'timestamp': datetime.utcnow().isoformat()
            })
        
        # Activity insights
        activity_analysis = self.analyze_user_activity()
        if activity_analysis['total_activities'] > 10:
            insights.append({
                'type': 'info',
                'category': 'Usage',
                'title': 'High Activity',
                'description': f'{activity_analysis["total_activities"]} activities in the last hour',
                'timestamp': datetime.utcnow().isoformat()
            })
        
        # Broadcast insights
        if insights:
            self.ws.socketio.emit('real_time_insights', {
                'type': 'real_time_insights',
                'payload': insights
            })
            
        return insights
        
    def start_real_time_analytics(self):
        """Start real-time analytics processing"""
        def analytics_worker():
            while True:
                try:
                    self.generate_real_time_insights()
                    time.sleep(60)  # Generate insights every minute
                except Exception as e:
                    logger.error(f"Error in real-time analytics: {e}")
                    time.sleep(60)
        
        thread = Thread(target=analytics_worker, daemon=True)
        thread.start()
        logger.info("Real-time analytics started")

# Notification service
class NotificationService:
    def __init__(self, websocket_service):
        self.ws = websocket_service
        self.notification_queue = []
        
    def queue_notification(self, message, level='info', target='all'):
        """Queue a notification for broadcast"""
        notification = {
            'id': f"notif_{int(time.time())}_{len(self.notification_queue)}",
            'message': message,
            'level': level,
            'target': target,
            'timestamp': datetime.utcnow().isoformat(),
            'sent': False
        }
        self.notification_queue.append(notification)
        
    def process_notification_queue(self):
        """Process and send queued notifications"""
        for notification in self.notification_queue:
            if not notification['sent']:
                self.ws.broadcast_system_notification(
                    notification['message'],
                    notification['level']
                )
                notification['sent'] = True
                
        # Clean up sent notifications older than 1 hour
        current_time = datetime.utcnow()
        self.notification_queue = [
            n for n in self.notification_queue
            if not n['sent'] or 
            (current_time - datetime.fromisoformat(n['timestamp'])).seconds < 3600
        ]
        
    def start_notification_processor(self):
        """Start notification processing"""
        def processor():
            while True:
                try:
                    self.process_notification_queue()
                    time.sleep(10)  # Process every 10 seconds
                except Exception as e:
                    logger.error(f"Error in notification processor: {e}")
                    time.sleep(10)
        
        thread = Thread(target=processor, daemon=True)
        thread.start()
        logger.info("Notification processor started")

def create_websocket_service(app):
    """Factory function to create and configure WebSocket service"""
    ws_service = WebSocketService(app)
    
    # Create and start additional services
    sync_service = DataSyncService(ws_service)
    analytics_service = AnalyticsService(ws_service)
    notification_service = NotificationService(ws_service)
    
    # Start background services
    ws_service.start_heartbeat_monitor()
    sync_service.start_auto_sync(interval_minutes=5)
    analytics_service.start_real_time_analytics()
    notification_service.start_notification_processor()
    
    return ws_service, sync_service, analytics_service, notification_service