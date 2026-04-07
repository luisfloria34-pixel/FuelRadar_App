"""
Alert Worker - Background job for checking price alerts
Runs every X minutes (configurable via ALERT_CHECK_MINUTES)
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlmodel import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_factory
from app.models.alert import Alert, AlertState, AlertType, FuelType
from app.models.device import Device
from app.services.tankerkoenig import tankerkoenig_service
from app.services.push_notifications import expo_push_service, push_builder

logger = logging.getLogger(__name__)


class AlertWorker:
    """Background worker for processing price alerts"""
    
    def __init__(self):
        self.is_running = False
        self.last_run: Optional[datetime] = None
        self.alerts_processed = 0
        self.notifications_sent = 0
    
    async def check_alerts(self):
        """Main entry point - check all active alerts"""
        
        if not settings.tankerkoenig_api_key:
            logger.warning("Alert worker: No API key configured, skipping")
            return
        
        if self.is_running:
            logger.warning("Alert worker: Already running, skipping")
            return
        
        self.is_running = True
        self.last_run = datetime.utcnow()
        
        try:
            logger.info("Alert worker: Starting alert check")
            
            if not async_session_factory:
                logger.warning("Alert worker: Database not configured")
                return
            
            async with async_session_factory() as session:
                # Get all active alerts grouped by type
                alerts = await self._get_active_alerts(session)
                
                if not alerts:
                    logger.info("Alert worker: No active alerts")
                    return
                
                logger.info(f"Alert worker: Processing {len(alerts)} alerts")
                
                # Group alerts by type for efficient processing
                threshold_alerts = [a for a in alerts if a.alert_type == AlertType.FUEL_THRESHOLD.value]
                station_alerts = [a for a in alerts if a.alert_type == AlertType.STATION_CHANGE.value]
                nearby_alerts = [a for a in alerts if a.alert_type == AlertType.NEARBY_CHEAPER.value]
                
                # Process each type
                await self._process_threshold_alerts(session, threshold_alerts)
                await self._process_station_alerts(session, station_alerts)
                await self._process_nearby_alerts(session, nearby_alerts)
                
                self.alerts_processed = len(alerts)
                
        except Exception as e:
            logger.error(f"Alert worker error: {e}")
        finally:
            self.is_running = False
            logger.info(f"Alert worker: Completed. Processed {self.alerts_processed} alerts, sent {self.notifications_sent} notifications")
    
    async def _get_active_alerts(self, session: AsyncSession) -> List[Alert]:
        """Get all active alerts with their device info"""
        
        statement = select(Alert).where(Alert.is_active == True)
        result = await session.execute(statement)
        return result.scalars().all()
    
    async def _get_device_info(self, session: AsyncSession, device_uuid: str) -> Optional[Device]:
        """Get device info for sending notifications"""
        
        statement = select(Device).where(Device.device_uuid == device_uuid)
        result = await session.execute(statement)
        return result.scalar_one_or_none()
    
    async def _get_alert_state(self, session: AsyncSession, alert_id: int) -> Optional[AlertState]:
        """Get alert state for tracking changes"""
        
        statement = select(AlertState).where(AlertState.alert_id == alert_id)
        result = await session.execute(statement)
        return result.scalar_one_or_none()
    
    async def _update_alert_state(
        self,
        session: AsyncSession,
        alert_id: int,
        last_price: Optional[float] = None,
        last_station_id: Optional[str] = None
    ):
        """Update alert state after check"""
        
        state = await self._get_alert_state(session, alert_id)
        if state:
            state.last_price = last_price
            state.last_station_id = last_station_id
            state.last_check_at = datetime.utcnow()
            session.add(state)
            await session.commit()
    
    async def _trigger_alert(self, session: AsyncSession, alert: Alert):
        """Mark alert as triggered"""
        
        alert.last_triggered_at = datetime.utcnow()
        alert.trigger_count += 1
        session.add(alert)
        await session.commit()
    
    async def _process_threshold_alerts(self, session: AsyncSession, alerts: List[Alert]):
        """Process fuel_threshold alerts - price below X"""
        
        if not alerts:
            return
        
        logger.info(f"Processing {len(alerts)} threshold alerts")
        
        # Group by location to minimize API calls
        # For now, use a default location (Berlin)
        # In production, group by device location
        
        for alert in alerts:
            try:
                # Get device info
                device = await self._get_device_info(session, alert.device_uuid)
                if not device or not device.expo_push_token:
                    continue
                
                # Get alert state
                state = await self._get_alert_state(session, alert.id)
                
                # Get nearby stations (use alert location if available, else default)
                lat = alert.lat or 52.520008
                lng = alert.lng or 13.404954
                
                result = await tankerkoenig_service.get_nearby_stations(
                    lat=lat,
                    lng=lng,
                    radius=alert.radius_km,
                    fuel_type=alert.fuel_type,
                    sort="price"
                )
                
                if not result.get("ok") or not result.get("stations"):
                    continue
                
                # Find cheapest open station
                for station in result["stations"]:
                    if not station.get("is_open"):
                        continue
                    
                    price = station.get(alert.fuel_type)
                    if price and price < alert.threshold_price:
                        # Check if we already notified about this
                        if state and state.last_price and state.last_price <= price:
                            continue  # Already notified at this or lower price
                        
                        # Send notification
                        notification = push_builder.build_price_threshold_notification(
                            locale=device.locale,
                            fuel_type=alert.fuel_type,
                            price=price,
                            threshold=alert.threshold_price,
                            station_name=station.get("brand", station.get("name")),
                            station_id=station.get("id")
                        )
                        
                        await expo_push_service.send_notification(
                            push_token=device.expo_push_token,
                            title=notification["title"],
                            body=notification["body"],
                            data=notification["data"]
                        )
                        
                        self.notifications_sent += 1
                        
                        # Update state and trigger
                        await self._update_alert_state(session, alert.id, last_price=price)
                        await self._trigger_alert(session, alert)
                        
                        break  # Only notify once per check
                        
            except Exception as e:
                logger.error(f"Error processing threshold alert {alert.id}: {e}")
    
    async def _process_station_alerts(self, session: AsyncSession, alerts: List[Alert]):
        """Process station_change alerts - price changes at specific station"""
        
        if not alerts:
            return
        
        logger.info(f"Processing {len(alerts)} station alerts")
        
        # Group by station to batch API calls
        station_alerts: Dict[str, List[Alert]] = {}
        for alert in alerts:
            if alert.station_id:
                if alert.station_id not in station_alerts:
                    station_alerts[alert.station_id] = []
                station_alerts[alert.station_id].append(alert)
        
        if not station_alerts:
            return
        
        # Batch get prices (max 10 at a time)
        station_ids = list(station_alerts.keys())
        for i in range(0, len(station_ids), 10):
            batch_ids = station_ids[i:i+10]
            
            result = await tankerkoenig_service.get_prices(batch_ids)
            if not result.get("ok"):
                continue
            
            prices = result.get("prices", {})
            
            for station_id, price_data in prices.items():
                if station_id not in station_alerts:
                    continue
                
                for alert in station_alerts[station_id]:
                    try:
                        device = await self._get_device_info(session, alert.device_uuid)
                        if not device or not device.expo_push_token:
                            continue
                        
                        state = await self._get_alert_state(session, alert.id)
                        current_price = price_data.get(alert.fuel_type)
                        
                        if not current_price:
                            continue
                        
                        # Check if price changed
                        if state and state.last_price and state.last_price != current_price:
                            # Price changed - send notification
                            notification = {
                                "title": "Preisänderung" if device.locale == "de" else "Price Change",
                                "body": f"{alert.fuel_type.upper()} bei {alert.station_name}: {current_price:.3f} €"
                                         if device.locale == "de" else
                                         f"{alert.fuel_type.upper()} at {alert.station_name}: {current_price:.3f} €",
                                "data": {
                                    "type": "station_change",
                                    "station_id": station_id,
                                    "fuel_type": alert.fuel_type,
                                    "old_price": state.last_price,
                                    "new_price": current_price
                                }
                            }
                            
                            await expo_push_service.send_notification(
                                push_token=device.expo_push_token,
                                title=notification["title"],
                                body=notification["body"],
                                data=notification["data"]
                            )
                            
                            self.notifications_sent += 1
                            await self._trigger_alert(session, alert)
                        
                        # Update state
                        await self._update_alert_state(session, alert.id, last_price=current_price)
                        
                    except Exception as e:
                        logger.error(f"Error processing station alert {alert.id}: {e}")
    
    async def _process_nearby_alerts(self, session: AsyncSession, alerts: List[Alert]):
        """Process nearby_cheaper alerts - cheaper station in radius"""
        
        if not alerts:
            return
        
        logger.info(f"Processing {len(alerts)} nearby alerts")
        
        for alert in alerts:
            try:
                if not alert.lat or not alert.lng:
                    continue
                
                device = await self._get_device_info(session, alert.device_uuid)
                if not device or not device.expo_push_token:
                    continue
                
                # Check premium status for this feature
                if alert.is_premium_feature and not device.is_premium:
                    continue
                
                state = await self._get_alert_state(session, alert.id)
                
                # Get nearby stations sorted by price
                result = await tankerkoenig_service.get_nearby_stations(
                    lat=alert.lat,
                    lng=alert.lng,
                    radius=alert.radius_km,
                    fuel_type=alert.fuel_type,
                    sort="price"
                )
                
                if not result.get("ok") or not result.get("stations"):
                    continue
                
                # Find cheapest open station
                cheapest = None
                for station in result["stations"]:
                    if station.get("is_open") and station.get(alert.fuel_type):
                        cheapest = station
                        break
                
                if not cheapest:
                    continue
                
                cheapest_price = cheapest.get(alert.fuel_type)
                cheapest_id = cheapest.get("id")
                
                # Check if this is a new cheaper station
                if state and state.last_station_id != cheapest_id:
                    if state.last_price and cheapest_price < state.last_price:
                        savings = state.last_price - cheapest_price
                        
                        notification = push_builder.build_cheaper_nearby_notification(
                            locale=device.locale,
                            fuel_type=alert.fuel_type,
                            savings=savings,
                            station_name=cheapest.get("brand", cheapest.get("name")),
                            station_id=cheapest_id,
                            distance=cheapest.get("dist", 0)
                        )
                        
                        await expo_push_service.send_notification(
                            push_token=device.expo_push_token,
                            title=notification["title"],
                            body=notification["body"],
                            data=notification["data"]
                        )
                        
                        self.notifications_sent += 1
                        await self._trigger_alert(session, alert)
                
                # Update state
                await self._update_alert_state(
                    session,
                    alert.id,
                    last_price=cheapest_price,
                    last_station_id=cheapest_id
                )
                
            except Exception as e:
                logger.error(f"Error processing nearby alert {alert.id}: {e}")


# Global worker instance
alert_worker = AlertWorker()


async def run_alert_check():
    """Async wrapper for APScheduler"""
    await alert_worker.check_alerts()
