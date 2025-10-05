"""
Health & Monitoring Service
Monitors bot system health and provides alerts and metrics
"""

import json
import asyncio
import requests
import random
import httpx
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict, deque
from enum import Enum

class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    CRITICAL = "critical"

class HealthMetric:
    def __init__(self, name: str, max_history: int = 100):
        """Initialize health metric"""
        self.name = name
        self.values: deque = deque(maxlen=max_history)
        self.timestamps: deque = deque(maxlen=max_history)
        self.alerts: List[Dict] = []
        
    def add_value(self, value: float, timestamp: datetime = None) -> None:
        """Add a metric value"""
        if timestamp is None:
            timestamp = datetime.now()
        
        self.values.append(value)
        self.timestamps.append(timestamp)
    
    def get_average(self, minutes: int = 60) -> float:
        """Get average value over last N minutes"""
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        
        recent_values = [
            value for value, timestamp in zip(self.values, self.timestamps)
            if timestamp > cutoff_time
        ]
        
        return sum(recent_values) / len(recent_values) if recent_values else 0.0
    
    def get_latest(self) -> Optional[float]:
        """Get latest metric value"""
        return self.values[-1] if self.values else None

class BotHealthMonitor:
    def __init__(self, bot_id: str):
        """Initialize bot health monitor"""
        self.bot_id = bot_id
        self.metrics: Dict[str, HealthMetric] = {
            'posts_per_hour': HealthMetric('posts_per_hour'),
            'api_response_time': HealthMetric('api_response_time'),
            'error_rate': HealthMetric('error_rate'),
            'engagement_rate': HealthMetric('engagement_rate'),
            'memory_usage': HealthMetric('memory_usage')
        }
        self.last_activity: Optional[datetime] = None
        self.consecutive_errors = 0
        self.status = HealthStatus.HEALTHY
        self.alerts: List[Dict] = []
        
    def record_post_created(self) -> None:
        """Record successful post creation"""
        self.last_activity = datetime.now()
        self.consecutive_errors = 0
        
        # Update posts per hour metric
        current_hour_posts = self._count_posts_in_last_hour()
        self.metrics['posts_per_hour'].add_value(current_hour_posts)
        
    def record_api_call(self, response_time: float, success: bool) -> None:
        """Record API call metrics"""
        self.metrics['api_response_time'].add_value(response_time)
        
        if not success:
            self.consecutive_errors += 1
        else:
            self.consecutive_errors = 0
        
        # Update error rate
        error_rate = self._calculate_error_rate()
        self.metrics['error_rate'].add_value(error_rate)
        
    def record_engagement(self, likes: int, comments: int, shares: int) -> None:
        """Record engagement metrics"""
        total_engagement = likes + comments + shares
        self.metrics['engagement_rate'].add_value(total_engagement)
        
    def _count_posts_in_last_hour(self) -> int:
        """Count posts created in the last hour"""
        # This would query actual post history in production
        return random.randint(0, 3)
    
    def _calculate_error_rate(self) -> float:
        """Calculate current error rate"""
        if self.consecutive_errors == 0:
            return 0.0
        
        # Simple error rate based on consecutive errors
        return min(1.0, self.consecutive_errors / 10.0)
    
    def check_health(self) -> HealthStatus:
        """Check overall bot health"""
        
        issues = []
        
        # Check if bot is active
        if self.last_activity:
            time_since_activity = datetime.now() - self.last_activity
            if time_since_activity > timedelta(hours=2):
                issues.append("No activity for over 2 hours")
        
        # Check error rate
        error_rate = self.metrics['error_rate'].get_latest() or 0
        if error_rate > 0.5:
            issues.append(f"High error rate: {error_rate:.2%}")
        
        # Check API response time
        avg_response_time = self.metrics['api_response_time'].get_average(30)
        if avg_response_time > 5000:  # 5 seconds
            issues.append(f"Slow API responses: {avg_response_time:.0f}ms")
        
        # Check consecutive errors
        if self.consecutive_errors > 5:
            issues.append(f"Consecutive errors: {self.consecutive_errors}")
        
        # Determine health status
        if len(issues) == 0:
            self.status = HealthStatus.HEALTHY
        elif len(issues) <= 2 and self.consecutive_errors < 10:
            self.status = HealthStatus.DEGRADED
        elif len(issues) <= 3 and self.consecutive_errors < 20:
            self.status = HealthStatus.UNHEALTHY
        else:
            self.status = HealthStatus.CRITICAL
        
        return self.status
    
    def get_health_summary(self) -> Dict:
        """Get health summary for this bot"""
        
        return {
            'bot_id': self.bot_id,
            'status': self.status.value,
            'last_activity': self.last_activity,
            'consecutive_errors': self.consecutive_errors,
            'metrics': {
                name: {
                    'latest': metric.get_latest(),
                    'average_1h': metric.get_average(60),
                    'average_24h': metric.get_average(1440)
                }
                for name, metric in self.metrics.items()
            },
            'alerts': self.alerts[-5:]  # Last 5 alerts
        }

class SystemHealthMonitor:
    def __init__(self):
        """Initialize system health monitor"""
        self.bot_monitors: Dict[str, BotHealthMonitor] = {}
        self.system_metrics: Dict[str, HealthMetric] = {
            'total_bots_active': HealthMetric('total_bots_active'),
            'total_posts_per_hour': HealthMetric('total_posts_per_hour'),
            'system_error_rate': HealthMetric('system_error_rate'),
            'api_availability': HealthMetric('api_availability')
        }
        self.alerts: List[Dict] = []
        self.telegram_bot_token: Optional[str] = None
        self.telegram_chat_id: Optional[str] = None
        
    def register_bot(self, bot_id: str) -> None:
        """Register a bot for monitoring"""
        if bot_id not in self.bot_monitors:
            self.bot_monitors[bot_id] = BotHealthMonitor(bot_id)
            print(f"📊 Registered bot {bot_id} for health monitoring")
    
    def record_bot_activity(self, bot_id: str, activity_type: str, **kwargs) -> None:
        """Record bot activity"""
        
        if bot_id not in self.bot_monitors:
            self.register_bot(bot_id)
        
        monitor = self.bot_monitors[bot_id]
        
        if activity_type == 'post_created':
            monitor.record_post_created()
        elif activity_type == 'api_call':
            monitor.record_api_call(kwargs.get('response_time', 0), kwargs.get('success', True))
        elif activity_type == 'engagement':
            monitor.record_engagement(
                kwargs.get('likes', 0),
                kwargs.get('comments', 0),
                kwargs.get('shares', 0)
            )
    
    def check_system_health(self) -> Dict:
        """Check overall system health"""
        
        bot_statuses = {}
        status_counts = defaultdict(int)
        
        # Check each bot
        for bot_id, monitor in self.bot_monitors.items():
            status = monitor.check_health()
            bot_statuses[bot_id] = status.value
            status_counts[status.value] += 1
        
        # Determine overall system status
        total_bots = len(self.bot_monitors)
        if total_bots == 0:
            system_status = HealthStatus.HEALTHY
        elif status_counts['critical'] > 0:
            system_status = HealthStatus.CRITICAL
        elif status_counts['unhealthy'] > total_bots * 0.3:
            system_status = HealthStatus.UNHEALTHY
        elif status_counts['degraded'] > total_bots * 0.5:
            system_status = HealthStatus.DEGRADED
        else:
            system_status = HealthStatus.HEALTHY
        
        # Update system metrics
        self.system_metrics['total_bots_active'].add_value(status_counts['healthy'] + status_counts['degraded'])
        
        return {
            'system_status': system_status.value,
            'total_bots': total_bots,
            'bot_status_distribution': dict(status_counts),
            'unhealthy_bots': [
                bot_id for bot_id, status in bot_statuses.items()
                if status in ['unhealthy', 'critical']
            ],
            'system_metrics': {
                name: {
                    'latest': metric.get_latest(),
                    'average_1h': metric.get_average(60)
                }
                for name, metric in self.system_metrics.items()
            }
        }
    
    def create_alert(self, level: AlertLevel, message: str, bot_id: str = None) -> None:
        """Create system alert"""
        
        alert = {
            'id': f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'level': level.value,
            'message': message,
            'bot_id': bot_id,
            'timestamp': datetime.now(),
            'resolved': False
        }
        
        self.alerts.append(alert)
        
        # Send to Telegram if configured
        if self.telegram_bot_token and self.telegram_chat_id:
            asyncio.create_task(self._send_telegram_alert(alert))
        
        print(f"🚨 {level.value.upper()}: {message}")
    
    async def _send_telegram_alert(self, alert: Dict) -> None:
        """Send alert to Telegram"""
        
        try:
            message = f"🤖 HooksDream Bot Alert\n\n"
            message += f"Level: {alert['level'].upper()}\n"
            message += f"Message: {alert['message']}\n"
            message += f"Time: {alert['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}\n"
            
            if alert['bot_id']:
                message += f"Bot: {alert['bot_id']}\n"
            
            url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
            payload = {
                'chat_id': self.telegram_chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10)
                
                if response.status_code == 200:
                    print(f"📱 Alert sent to Telegram successfully")
                else:
                    print(f"⚠️ Failed to send Telegram alert: {response.status_code}")
                    
        except Exception as e:
            print(f"⚠️ Error sending Telegram alert: {e}")
    
    def get_dashboard_data(self) -> Dict:
        """Get comprehensive dashboard data"""
        
        system_health = self.check_system_health()
        
        # Get individual bot summaries
        bot_summaries = {}
        for bot_id, monitor in self.bot_monitors.items():
            bot_summaries[bot_id] = monitor.get_health_summary()
        
        # Calculate additional metrics
        total_posts_today = sum(
            monitor.metrics['posts_per_hour'].get_average(24) * 24
            for monitor in self.bot_monitors.values()
        )
        
        avg_engagement = sum(
            monitor.metrics['engagement_rate'].get_average(24)
            for monitor in self.bot_monitors.values()
        ) / max(len(self.bot_monitors), 1)
        
        return {
            'system_health': system_health,
            'bot_summaries': bot_summaries,
            'daily_stats': {
                'total_posts': int(total_posts_today),
                'average_engagement': avg_engagement,
                'active_bots': len([m for m in self.bot_monitors.values() if m.status != HealthStatus.CRITICAL]),
                'total_alerts': len([a for a in self.alerts if not a['resolved']])
            },
            'recent_alerts': self.alerts[-10:],  # Last 10 alerts
            'uptime_stats': self._calculate_uptime_stats()
        }
    
    def _calculate_uptime_stats(self) -> Dict:
        """Calculate system uptime statistics"""
        
        # Simple uptime calculation
        healthy_bots = sum(1 for m in self.bot_monitors.values() if m.status == HealthStatus.HEALTHY)
        total_bots = len(self.bot_monitors)
        
        uptime_percentage = (healthy_bots / max(total_bots, 1)) * 100
        
        return {
            'current_uptime_percentage': uptime_percentage,
            'healthy_bots': healthy_bots,
            'total_bots': total_bots,
            'last_incident': None  # Would track in production
        }
    
    def set_telegram_config(self, bot_token: str, chat_id: str) -> None:
        """Configure Telegram alerts"""
        self.telegram_bot_token = bot_token
        self.telegram_chat_id = chat_id
        print(f"📱 Telegram alerts configured")

class HealthMonitoringService:
    def __init__(self):
        """Initialize health monitoring service"""
        self.monitor = SystemHealthMonitor()
        self.monitoring_enabled = True
        
    def enable_monitoring(self) -> None:
        """Enable health monitoring"""
        self.monitoring_enabled = True
        print("📊 Health monitoring enabled")
    
    def disable_monitoring(self) -> None:
        """Disable health monitoring"""
        self.monitoring_enabled = False
        print("📊 Health monitoring disabled")
    
    def record_bot_post(self, bot_id: str) -> None:
        """Record bot post creation"""
        if self.monitoring_enabled:
            self.monitor.record_bot_activity(bot_id, 'post_created')
    
    def record_api_call(self, bot_id: str, response_time: float, success: bool) -> None:
        """Record API call metrics"""
        if self.monitoring_enabled:
            self.monitor.record_bot_activity(bot_id, 'api_call', response_time=response_time, success=success)
    
    def record_bot_engagement(self, bot_id: str, likes: int = 0, comments: int = 0, shares: int = 0) -> None:
        """Record bot engagement metrics"""
        if self.monitoring_enabled:
            self.monitor.record_bot_activity(bot_id, 'engagement', likes=likes, comments=comments, shares=shares)
    
    def check_bot_health(self, bot_id: str) -> Optional[Dict]:
        """Check specific bot health"""
        if bot_id in self.monitor.bot_monitors:
            return self.monitor.bot_monitors[bot_id].get_health_summary()
        return None
    
    def get_system_dashboard(self) -> Dict:
        """Get system health dashboard"""
        return self.monitor.get_dashboard_data()
    
    def create_alert(self, level: str, message: str, bot_id: str = None) -> None:
        """Create system alert"""
        try:
            alert_level = AlertLevel(level)
            self.monitor.create_alert(alert_level, message, bot_id)
        except ValueError:
            print(f"⚠️ Invalid alert level: {level}")
    
    def configure_telegram_alerts(self, bot_token: str, chat_id: str) -> None:
        """Configure Telegram alerts"""
        self.monitor.set_telegram_config(bot_token, chat_id)

# Global instance
health_monitoring_service = HealthMonitoringService()

# Import random for fallback metrics
import random
