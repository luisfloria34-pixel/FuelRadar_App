import httpx
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

class ExpoPushService:
    """Service for sending Expo Push Notifications"""
    
    @classmethod
    async def send_notification(
        cls,
        push_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        sound: str = "default",
        badge: Optional[int] = None,
        priority: str = "high"
    ) -> Dict[str, Any]:
        """Send a single push notification"""
        
        if not push_token or not push_token.startswith("ExponentPushToken"):
            return {"ok": False, "message": "Invalid push token"}
        
        message = {
            "to": push_token,
            "title": title,
            "body": body,
            "sound": sound,
            "priority": priority,
        }
        
        if data:
            message["data"] = data
        if badge is not None:
            message["badge"] = badge
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    EXPO_PUSH_URL,
                    json=message,
                    headers={
                        "Accept": "application/json",
                        "Accept-Encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Expo push error: {response.status_code}")
                    return {"ok": False, "message": f"HTTP {response.status_code}"}
                
                result = response.json()
                
                # Check for errors in response
                if "data" in result and len(result["data"]) > 0:
                    ticket = result["data"][0]
                    if ticket.get("status") == "error":
                        logger.error(f"Expo push error: {ticket.get('message')}")
                        return {
                            "ok": False,
                            "message": ticket.get("message", "Unknown error")
                        }
                
                return {"ok": True, "data": result}
                
        except Exception as e:
            logger.error(f"Expo push exception: {e}")
            return {"ok": False, "message": str(e)}
    
    @classmethod
    async def send_notifications_batch(
        cls,
        messages: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Send multiple notifications in batch (max 100)"""
        
        if not messages:
            return []
        
        # Limit batch size
        messages = messages[:100]
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    EXPO_PUSH_URL,
                    json=messages,
                    headers={
                        "Accept": "application/json",
                        "Accept-Encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Expo batch push error: {response.status_code}")
                    return [{"ok": False} for _ in messages]
                
                result = response.json()
                return result.get("data", [])
                
        except Exception as e:
            logger.error(f"Expo batch push exception: {e}")
            return [{"ok": False, "message": str(e)} for _ in messages]


class PushNotificationBuilder:
    """Helper class to build localized push notifications"""
    
    MESSAGES = {
        "de": {
            "price_drop": "{fuel} gefallen auf {price} € bei {station}",
            "price_below_threshold": "{fuel} unter {threshold} €! Jetzt {price} € bei {station}",
            "cheaper_nearby": "Spare {savings} €/L! {station} ist nur {distance} km entfernt",
            "price_changed": "Preisänderung bei {station}: {fuel} jetzt {price} €",
        },
        "en": {
            "price_drop": "{fuel} dropped to {price} € at {station}",
            "price_below_threshold": "{fuel} below {threshold} €! Now {price} € at {station}",
            "cheaper_nearby": "Save {savings} €/L! {station} is only {distance} km away",
            "price_changed": "Price change at {station}: {fuel} now {price} €",
        }
    }
    
    TITLES = {
        "de": {
            "price_alert": "Preisalarm",
            "fuel_alert": "Kraftstoff-Alarm",
        },
        "en": {
            "price_alert": "Price Alert",
            "fuel_alert": "Fuel Alert",
        }
    }
    
    @classmethod
    def build_price_threshold_notification(
        cls,
        locale: str,
        fuel_type: str,
        price: float,
        threshold: float,
        station_name: str,
        station_id: str
    ) -> Dict[str, Any]:
        """Build notification for price below threshold"""
        
        locale = locale if locale in cls.MESSAGES else "de"
        fuel_labels = {"diesel": "Diesel", "e5": "Super E5", "e10": "Super E10"}
        
        return {
            "title": cls.TITLES[locale]["price_alert"],
            "body": cls.MESSAGES[locale]["price_below_threshold"].format(
                fuel=fuel_labels.get(fuel_type, fuel_type),
                price=f"{price:.3f}",
                threshold=f"{threshold:.2f}",
                station=station_name
            ),
            "data": {
                "type": "price_alert",
                "station_id": station_id,
                "fuel_type": fuel_type,
                "price": price
            }
        }
    
    @classmethod
    def build_cheaper_nearby_notification(
        cls,
        locale: str,
        fuel_type: str,
        savings: float,
        station_name: str,
        station_id: str,
        distance: float
    ) -> Dict[str, Any]:
        """Build notification for cheaper station nearby"""
        
        locale = locale if locale in cls.MESSAGES else "de"
        
        return {
            "title": cls.TITLES[locale]["fuel_alert"],
            "body": cls.MESSAGES[locale]["cheaper_nearby"].format(
                savings=f"{savings:.2f}",
                station=station_name,
                distance=f"{distance:.1f}"
            ),
            "data": {
                "type": "cheaper_nearby",
                "station_id": station_id,
                "fuel_type": fuel_type,
                "savings": savings
            }
        }


expo_push_service = ExpoPushService()
push_builder = PushNotificationBuilder()
