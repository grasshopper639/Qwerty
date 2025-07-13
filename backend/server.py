from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import json
import math
import statistics
from datetime import datetime, timedelta
from geopy.distance import geodesic
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Restaurant Management System API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# WebSocket connection manager with GPS tracking
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.delivery_agents: Dict[str, WebSocket] = {}
        self.owners: List[WebSocket] = []
        self.agent_locations: Dict[str, Dict] = {}  # Store real-time locations

    async def connect(self, websocket: WebSocket, user_type: str = "unknown", user_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_type == "delivery_agent" and user_id:
            self.delivery_agents[user_id] = websocket
        elif user_type == "owner":
            self.owners.append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.delivery_agents:
            del self.delivery_agents[user_id]
            if user_id in self.agent_locations:
                del self.agent_locations[user_id]
        if websocket in self.owners:
            self.owners.remove(websocket)

    async def update_agent_location(self, agent_id: str, location: Dict):
        """Update real-time location of delivery agent"""
        self.agent_locations[agent_id] = {
            **location,
            "timestamp": datetime.utcnow().isoformat()
        }
        # Broadcast location update to owners
        await self.broadcast_to_owners(json.dumps({
            "type": "location_update",
            "agent_id": agent_id,
            "location": location
        }))

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_delivery_agents(self, message: str):
        for connection in self.delivery_agents.values():
            try:
                await connection.send_text(message)
            except:
                pass

    async def broadcast_to_owners(self, message: str):
        for connection in self.owners:
            try:
                await connection.send_text(message)
            except:
                pass

    async def send_to_specific_agent(self, agent_id: str, message: str):
        if agent_id in self.delivery_agents:
            try:
                await self.delivery_agents[agent_id].send_text(message)
            except:
                pass

manager = ConnectionManager()

# Enhanced Models with Authentication
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    role: str  # "restaurant_owner" or "delivery_agent"
    name: str
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    name: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

class LoginResponse(BaseModel):
    user: UserResponse
    token: str
    message: str

# Password hashing utilities
import hashlib
import secrets

def hash_password(password: str) -> str:
    """Hash a password with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{password_hash.hex()}"

def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash"""
    try:
        salt, hash_hex = password_hash.split(':')
        password_check = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return password_check.hex() == hash_hex
    except:
        return False

def generate_token() -> str:
    """Generate a simple session token"""
    return secrets.token_urlsafe(32)

# In-memory session storage (in production, use Redis or database)
active_sessions = {}

def create_session(user_id: str) -> str:
    """Create a new session"""
    token = generate_token()
    active_sessions[token] = {
        "user_id": user_id,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    }
    return token

def get_session(token: str) -> Optional[str]:
    """Get user_id from session token"""
    session = active_sessions.get(token)
    if session and session["expires_at"] > datetime.utcnow():
        return session["user_id"]
    elif session:
        # Remove expired session
        del active_sessions[token]
    return None

def delete_session(token: str):
    """Delete a session"""
    if token in active_sessions:
        del active_sessions[token]

# Authentication dependency
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    user_id = get_session(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return UserResponse(**user)
class Location(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)

class DeliveryEstimate(BaseModel):
    estimated_time_minutes: int
    distance_km: float
    confidence_score: float
    factors: List[str] = []

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_phone: str
    customer_address: str
    customer_location: Optional[Location] = None
    order_id: str
    order_value: Optional[float] = 0.0
    status: str = "pending"  # pending, out_for_delivery, delivered, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_to: Optional[str] = None
    delivered_at: Optional[datetime] = None
    estimated_delivery_time: Optional[int] = None  # minutes
    actual_delivery_time: Optional[int] = None  # minutes
    delivery_notes: Optional[str] = None
    customer_rating: Optional[int] = None
    delivery_photo: Optional[str] = None  # base64 encoded image
    priority: str = "normal"  # low, normal, high, urgent

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_address: str
    customer_location: Optional[Location] = None
    order_id: str
    order_value: Optional[float] = 0.0
    priority: Optional[str] = "normal"

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    delivery_notes: Optional[str] = None
    customer_rating: Optional[int] = None
    delivery_photo: Optional[str] = None

class OrderFilter(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    customer_name: Optional[str] = None
    priority: Optional[str] = None

class DeliveryAgent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[str] = None
    is_online: bool = False
    current_location: Optional[Location] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_deliveries: int = 0
    avg_delivery_time: Optional[float] = None
    rating: Optional[float] = None
    vehicle_type: Optional[str] = "bike"  # bike, car, motorcycle, walking

class DeliveryAgentCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    vehicle_type: Optional[str] = "bike"

class DeliveryAgentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_online: Optional[bool] = None
    current_location: Optional[Location] = None
    vehicle_type: Optional[str] = None

class APIKey(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str = Field(default_factory=lambda: f"rms_{uuid.uuid4().hex}")
    name: str
    permissions: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = None
    is_active: bool = True

class APIKeyCreate(BaseModel):
    name: str
    permissions: List[str] = []

class AnalyticsData(BaseModel):
    total_orders: int
    completed_orders: int
    pending_orders: int
    cancelled_orders: int
    avg_delivery_time: float
    total_revenue: float
    top_delivery_zones: List[Dict]
    agent_performance: List[Dict]
    hourly_distribution: Dict[str, int]
    daily_stats: List[Dict]

# AI-Powered Delivery Time Estimation
class DeliveryTimeEstimator:
    def __init__(self):
        self.base_preparation_time = 15  # minutes
        self.speed_by_vehicle = {
            "walking": 5,    # km/h
            "bike": 15,      # km/h
            "motorcycle": 25, # km/h
            "car": 20        # km/h (accounting for traffic)
        }
    
    def calculate_distance(self, location1: Location, location2: Location) -> float:
        """Calculate distance between two locations in km"""
        if not location1 or not location2:
            return 5.0  # Default distance
        
        coord1 = (location1.latitude, location1.longitude)
        coord2 = (location2.latitude, location2.longitude)
        return geodesic(coord1, coord2).kilometers
    
    async def estimate_delivery_time(self, order: Order, agent: DeliveryAgent) -> DeliveryEstimate:
        """AI-powered delivery time estimation"""
        factors = []
        
        # Base preparation time
        total_time = self.base_preparation_time
        factors.append(f"Preparation time: {self.base_preparation_time} min")
        
        # Calculate distance and travel time
        restaurant_location = Location(latitude=40.7128, longitude=-74.0060)  # Default NYC location
        
        if order.customer_location and agent.current_location:
            # Distance from agent to restaurant
            agent_to_restaurant = self.calculate_distance(agent.current_location, restaurant_location)
            # Distance from restaurant to customer
            restaurant_to_customer = self.calculate_distance(restaurant_location, order.customer_location)
            total_distance = agent_to_restaurant + restaurant_to_customer
        else:
            total_distance = 5.0  # Default distance
            factors.append("Using default distance (no GPS data)")
        
        # Travel time based on vehicle type
        vehicle_speed = self.speed_by_vehicle.get(agent.vehicle_type, 15)
        travel_time = (total_distance / vehicle_speed) * 60  # Convert to minutes
        total_time += travel_time
        factors.append(f"Travel time: {travel_time:.1f} min ({total_distance:.1f} km at {vehicle_speed} km/h)")
        
        # Time-based adjustments
        current_hour = datetime.utcnow().hour
        if 11 <= current_hour <= 14 or 17 <= current_hour <= 21:  # Peak hours
            total_time *= 1.3
            factors.append("Peak hours adjustment: +30%")
        elif 22 <= current_hour <= 6:  # Late night
            total_time *= 0.8
            factors.append("Late night adjustment: -20%")
        
        # Priority adjustment
        if order.priority == "urgent":
            total_time *= 0.7
            factors.append("Urgent priority: -30%")
        elif order.priority == "high":
            total_time *= 0.9
            factors.append("High priority: -10%")
        
        # Weather adjustment (simplified)
        # In real implementation, you'd integrate with weather API
        total_time *= 1.1
        factors.append("Weather conditions: +10%")
        
        # Historical performance
        if agent.avg_delivery_time:
            if agent.avg_delivery_time < 30:  # Fast agent
                total_time *= 0.9
                factors.append("Fast agent bonus: -10%")
            elif agent.avg_delivery_time > 45:  # Slow agent
                total_time *= 1.1
                factors.append("Agent performance: +10%")
        
        confidence_score = 0.8
        if order.customer_location and agent.current_location:
            confidence_score = 0.95
        
        return DeliveryEstimate(
            estimated_time_minutes=int(total_time),
            distance_km=total_distance,
            confidence_score=confidence_score,
            factors=factors
        )

estimator = DeliveryTimeEstimator()

# API Key Authentication
async def get_api_key(x_api_key: str = Header(None)):
    if not x_api_key:
        return None
    
    api_key = await db.api_keys.find_one({"key": x_api_key, "is_active": True})
    if api_key:
        # Update last used timestamp
        await db.api_keys.update_one(
            {"key": x_api_key},
            {"$set": {"last_used": datetime.utcnow()}}
        )
        return APIKey(**api_key)
    return None

# WebSocket endpoints with GPS tracking
@app.websocket("/ws/delivery/{agent_id}")
async def websocket_delivery_agent(websocket: WebSocket, agent_id: str):
    await manager.connect(websocket, "delivery_agent", agent_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "location_update":
                # Update agent's real-time location
                location_data = message_data.get("location")
                if location_data:
                    await manager.update_agent_location(agent_id, location_data)
                    
                    # Update agent's location in database
                    await db.delivery_agents.update_one(
                        {"id": agent_id},
                        {"$set": {"current_location": location_data}}
                    )
                    
            elif message_data.get("type") == "status_update":
                # Update order status and broadcast to owners
                order_id = message_data.get("order_id")
                new_status = message_data.get("status")
                
                # Update order in database
                update_data = {"status": new_status, "assigned_to": agent_id}
                if new_status == "delivered":
                    update_data["delivered_at"] = datetime.utcnow()
                    
                    # Calculate actual delivery time
                    order = await db.orders.find_one({"id": order_id})
                    if order:
                        created_at = order.get("created_at")
                        if created_at:
                            actual_time = (datetime.utcnow() - created_at).total_seconds() / 60
                            update_data["actual_delivery_time"] = int(actual_time)
                
                await db.orders.update_one({"id": order_id}, {"$set": update_data})
                
                # Broadcast status update to owners
                await manager.broadcast_to_owners(json.dumps({
                    "type": "status_update",
                    "order_id": order_id,
                    "status": new_status,
                    "agent_id": agent_id
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, agent_id)

@app.websocket("/ws/owner/{owner_id}")
async def websocket_owner(websocket: WebSocket, owner_id: str):
    await manager.connect(websocket, "owner")
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            if message_data.get("type") == "send_for_delivery":
                # Broadcast new order to delivery agents
                await manager.broadcast_to_delivery_agents(json.dumps({
                    "type": "new_order",
                    "order": message_data.get("order")
                }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Enhanced API Routes
@api_router.get("/")
async def root():
    return {"message": "Restaurant Management System API v2.0", "features": [
        "Real-time GPS tracking",
        "AI-powered delivery estimates",
        "Advanced analytics",
        "Integration hub",
        "API access control"
    ]}

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_dict = order.dict()
    order_obj = Order(**order_dict)
    
    # Find best available agent for delivery time estimation
    available_agents = await db.delivery_agents.find({"is_online": True}).to_list(100)
    if available_agents:
        best_agent = DeliveryAgent(**available_agents[0])
        estimate = await estimator.estimate_delivery_time(order_obj, best_agent)
        order_obj.estimated_delivery_time = estimate.estimated_time_minutes
    
    await db.orders.insert_one(order_obj.dict())
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    customer_name: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 100
):
    """Enhanced order retrieval with filtering"""
    filter_dict = {}
    
    if status:
        filter_dict["status"] = status
    if assigned_to:
        filter_dict["assigned_to"] = assigned_to
    if customer_name:
        filter_dict["customer_name"] = {"$regex": customer_name, "$options": "i"}
    if priority:
        filter_dict["priority"] = priority
    
    if date_from or date_to:
        date_filter = {}
        if date_from:
            date_filter["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        if date_to:
            date_filter["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        filter_dict["created_at"] = date_filter
    
    orders = await db.orders.find(filter_dict).sort("created_at", -1).limit(limit).to_list(limit)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if order:
        return Order(**order)
    raise HTTPException(status_code=404, detail="Order not found")

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_update: OrderUpdate):
    update_data = order_update.dict(exclude_unset=True)
    if order_update.status == "delivered":
        update_data["delivered_at"] = datetime.utcnow()
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    # Broadcast update to owners
    await manager.broadcast_to_owners(json.dumps({
        "type": "status_update",
        "order_id": order_id,
        "status": order_update.status,
        "agent_id": order_update.assigned_to
    }))
    
    updated_order = await db.orders.find_one({"id": order_id})
    if updated_order:
        return Order(**updated_order)
    raise HTTPException(status_code=404, detail="Order not found")

@api_router.post("/orders/{order_id}/estimate-delivery")
async def estimate_delivery_time(order_id: str, agent_id: Optional[str] = None):
    """Get AI-powered delivery time estimate for an order"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Find agent
    if agent_id:
        agent_data = await db.delivery_agents.find_one({"id": agent_id})
    else:
        # Find best available agent
        available_agents = await db.delivery_agents.find({"is_online": True}).to_list(1)
        agent_data = available_agents[0] if available_agents else None
    
    if not agent_data:
        raise HTTPException(status_code=404, detail="No available delivery agent found")
    
    order_obj = Order(**order)
    agent_obj = DeliveryAgent(**agent_data)
    
    estimate = await estimator.estimate_delivery_time(order_obj, agent_obj)
    
    # Update order with estimate
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"estimated_delivery_time": estimate.estimated_time_minutes}}
    )
    
    return estimate

@api_router.post("/orders/{order_id}/assign-agent")
async def assign_agent_to_order(order_id: str, agent_id: str):
    """Smart agent assignment with delivery time estimation"""
    order = await db.orders.find_one({"id": order_id})
    agent = await db.delivery_agents.find_one({"id": agent_id})
    
    if not order or not agent:
        raise HTTPException(status_code=404, detail="Order or agent not found")
    
    # Calculate delivery estimate
    order_obj = Order(**order)
    agent_obj = DeliveryAgent(**agent)
    estimate = await estimator.estimate_delivery_time(order_obj, agent_obj)
    
    # Update order
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "assigned_to": agent_id,
            "status": "out_for_delivery",
            "estimated_delivery_time": estimate.estimated_time_minutes
        }}
    )
    
    # Notify agent
    await manager.send_to_specific_agent(agent_id, json.dumps({
        "type": "order_assigned",
        "order": order_obj.dict(),
        "estimate": estimate.dict()
    }))
    
    return {"message": "Agent assigned successfully", "estimate": estimate}

@api_router.post("/orders/{order_id}/send-for-delivery")
async def send_order_for_delivery(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status to out for delivery
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "out_for_delivery"}}
    )
    
    # Broadcast to delivery agents
    order_obj = Order(**order)
    order_dict = order_obj.dict()
    # Convert datetime objects to ISO format strings for JSON serialization
    if 'created_at' in order_dict and order_dict['created_at']:
        order_dict['created_at'] = order_dict['created_at'].isoformat()
    if 'delivered_at' in order_dict and order_dict['delivered_at']:
        order_dict['delivered_at'] = order_dict['delivered_at'].isoformat()
    
    await manager.broadcast_to_delivery_agents(json.dumps({
        "type": "new_order",
        "order": order_dict
    }))
    
    return {"message": "Order sent for delivery", "order_id": order_id}

# Enhanced Delivery Agent Management
@api_router.post("/delivery-agents", response_model=DeliveryAgent)
async def create_delivery_agent(agent: DeliveryAgentCreate):
    agent_dict = agent.dict()
    agent_obj = DeliveryAgent(**agent_dict)
    await db.delivery_agents.insert_one(agent_obj.dict())
    return agent_obj

@api_router.get("/delivery-agents", response_model=List[DeliveryAgent])
async def get_delivery_agents():
    agents = await db.delivery_agents.find().to_list(1000)
    return [DeliveryAgent(**agent) for agent in agents]

@api_router.get("/delivery-agents/{agent_id}", response_model=DeliveryAgent)
async def get_delivery_agent(agent_id: str):
    agent = await db.delivery_agents.find_one({"id": agent_id})
    if agent:
        return DeliveryAgent(**agent)
    raise HTTPException(status_code=404, detail="Agent not found")

@api_router.put("/delivery-agents/{agent_id}", response_model=DeliveryAgent)
async def update_delivery_agent(agent_id: str, agent_update: DeliveryAgentUpdate):
    update_data = agent_update.dict(exclude_unset=True)
    await db.delivery_agents.update_one({"id": agent_id}, {"$set": update_data})
    
    updated_agent = await db.delivery_agents.find_one({"id": agent_id})
    if updated_agent:
        return DeliveryAgent(**updated_agent)
    raise HTTPException(status_code=404, detail="Agent not found")

@api_router.get("/delivery-agents/{agent_id}/location")
async def get_agent_real_time_location(agent_id: str):
    """Get real-time location of delivery agent"""
    if agent_id in manager.agent_locations:
        return manager.agent_locations[agent_id]
    
    # Fallback to database location
    agent = await db.delivery_agents.find_one({"id": agent_id})
    if agent and agent.get("current_location"):
        return agent["current_location"]
    
    raise HTTPException(status_code=404, detail="Agent location not found")

@api_router.get("/delivery-agents/{agent_id}/orders")
async def get_agent_orders(agent_id: str, status: Optional[str] = None):
    """Get orders assigned to a specific agent"""
    filter_dict = {"assigned_to": agent_id}
    if status:
        filter_dict["status"] = status
    
    orders = await db.orders.find(filter_dict).sort("created_at", -1).to_list(100)
    return [Order(**order) for order in orders]

# Advanced Analytics and Reporting
@api_router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> AnalyticsData:
    """Get comprehensive analytics dashboard data"""
    
    # Date range filtering
    date_filter = {}
    if date_from:
        date_filter["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
    if date_to:
        date_filter["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
    
    filter_dict = {}
    if date_filter:
        filter_dict["created_at"] = date_filter
    
    # Basic counts
    total_orders = await db.orders.count_documents(filter_dict)
    completed_orders = await db.orders.count_documents({**filter_dict, "status": "delivered"})
    pending_orders = await db.orders.count_documents({**filter_dict, "status": "pending"})
    cancelled_orders = await db.orders.count_documents({**filter_dict, "status": "cancelled"})
    
    # Average delivery time
    delivered_orders = await db.orders.find({
        **filter_dict,
        "status": "delivered",
        "actual_delivery_time": {"$exists": True}
    }).to_list(1000)
    
    avg_delivery_time = 0
    if delivered_orders:
        delivery_times = [order.get("actual_delivery_time", 0) for order in delivered_orders]
        avg_delivery_time = statistics.mean(delivery_times)
    
    # Revenue calculation
    total_revenue = 0
    revenue_orders = await db.orders.find({
        **filter_dict,
        "order_value": {"$exists": True}
    }).to_list(1000)
    
    if revenue_orders:
        total_revenue = sum(order.get("order_value", 0) for order in revenue_orders)
    
    # Top delivery zones (simplified)
    all_orders = await db.orders.find(filter_dict).to_list(1000)
    zone_counts = {}
    for order in all_orders:
        address = order.get("customer_address", "Unknown")
        # Simple zone extraction (you'd use proper geocoding in production)
        zone = address.split(",")[-1].strip() if "," in address else "Unknown"
        zone_counts[zone] = zone_counts.get(zone, 0) + 1
    
    top_zones = [{"zone": zone, "count": count} for zone, count in 
                 sorted(zone_counts.items(), key=lambda x: x[1], reverse=True)[:10]]
    
    # Agent performance
    agents = await db.delivery_agents.find().to_list(100)
    agent_performance = []
    for agent in agents:
        agent_orders = await db.orders.find({"assigned_to": agent["id"]}).to_list(1000)
        completed = len([o for o in agent_orders if o.get("status") == "delivered"])
        avg_time = 0
        if agent_orders:
            delivery_times = [o.get("actual_delivery_time", 0) for o in agent_orders 
                            if o.get("actual_delivery_time")]
            if delivery_times:
                avg_time = statistics.mean(delivery_times)
        
        agent_performance.append({
            "agent_id": agent["id"],
            "name": agent["name"],
            "total_orders": len(agent_orders),
            "completed_orders": completed,
            "avg_delivery_time": avg_time,
            "success_rate": (completed / len(agent_orders) * 100) if agent_orders else 0
        })
    
    # Hourly distribution
    hourly_dist = {str(i): 0 for i in range(24)}
    for order in all_orders:
        hour = order.get("created_at", datetime.utcnow()).hour
        hourly_dist[str(hour)] += 1
    
    # Daily stats (last 7 days)
    daily_stats = []
    for i in range(7):
        date = datetime.utcnow() - timedelta(days=i)
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        day_orders = await db.orders.count_documents({
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        
        daily_stats.append({
            "date": day_start.isoformat(),
            "orders": day_orders
        })
    
    return AnalyticsData(
        total_orders=total_orders,
        completed_orders=completed_orders,
        pending_orders=pending_orders,
        cancelled_orders=cancelled_orders,
        avg_delivery_time=avg_delivery_time,
        total_revenue=total_revenue,
        top_delivery_zones=top_zones,
        agent_performance=agent_performance,
        hourly_distribution=hourly_dist,
        daily_stats=daily_stats
    )

@api_router.get("/analytics/heat-map")
async def get_delivery_heat_map():
    """Get delivery heat map data"""
    orders = await db.orders.find({"customer_location": {"$exists": True}}).to_list(1000)
    
    heat_map_data = []
    for order in orders:
        location = order.get("customer_location")
        if location:
            heat_map_data.append({
                "lat": location.get("latitude"),
                "lng": location.get("longitude"),
                "intensity": 1
            })
    
    return {"heat_map_data": heat_map_data}

# API Access Management
@api_router.post("/api-keys", response_model=APIKey)
async def create_api_key(api_key_create: APIKeyCreate):
    """Create new API key for integration"""
    api_key_dict = api_key_create.dict()
    api_key_obj = APIKey(**api_key_dict)
    await db.api_keys.insert_one(api_key_obj.dict())
    return api_key_obj

@api_router.get("/api-keys", response_model=List[APIKey])
async def get_api_keys():
    """Get all API keys"""
    keys = await db.api_keys.find().to_list(100)
    return [APIKey(**key) for key in keys]

@api_router.delete("/api-keys/{key_id}")
async def delete_api_key(key_id: str):
    """Delete/deactivate API key"""
    result = await db.api_keys.update_one(
        {"id": key_id},
        {"$set": {"is_active": False}}
    )
    if result.modified_count:
        return {"message": "API key deactivated"}
    raise HTTPException(status_code=404, detail="API key not found")

# Integration Hub Endpoints
@api_router.post("/integrations/pos/orders")
async def receive_pos_order(order_data: dict, api_key: APIKey = Depends(get_api_key)):
    """Receive order from POS system"""
    if not api_key or "pos_integration" not in api_key.permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Convert POS order format to our format
    order = OrderCreate(
        customer_name=order_data.get("customer_name"),
        customer_phone=order_data.get("customer_phone"),
        customer_address=order_data.get("customer_address"),
        order_id=order_data.get("external_order_id"),
        order_value=order_data.get("total_amount", 0.0)
    )
    
    return await create_order(order)

@api_router.post("/integrations/accounting/sync")
async def sync_accounting_data(api_key: APIKey = Depends(get_api_key)):
    """Sync order data with accounting system"""
    if not api_key or "accounting_integration" not in api_key.permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Get completed orders for accounting sync
    completed_orders = await db.orders.find({
        "status": "delivered",
        "order_value": {"$exists": True}
    }).to_list(1000)
    
    accounting_data = []
    for order in completed_orders:
        accounting_data.append({
            "order_id": order.get("order_id"),
            "customer_name": order.get("customer_name"),
            "amount": order.get("order_value"),
            "date": order.get("created_at").isoformat() if order.get("created_at") else None,
            "status": "completed"
        })
    
    return {
        "sync_date": datetime.utcnow().isoformat(),
        "records_count": len(accounting_data),
        "data": accounting_data
    }

@api_router.get("/integrations/webhook/orders/{order_id}")
async def order_webhook(order_id: str, api_key: APIKey = Depends(get_api_key)):
    """Webhook endpoint for order updates"""
    if not api_key or "webhook_access" not in api_key.permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return Order(**order)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()