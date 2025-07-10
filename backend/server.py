from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.delivery_agents: List[WebSocket] = []
        self.owners: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_type: str = "unknown"):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_type == "delivery_agent":
            self.delivery_agents.append(websocket)
        elif user_type == "owner":
            self.owners.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.delivery_agents:
            self.delivery_agents.remove(websocket)
        if websocket in self.owners:
            self.owners.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_delivery_agents(self, message: str):
        for connection in self.delivery_agents:
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

manager = ConnectionManager()

# Define Models
class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_phone: str
    customer_address: str
    order_id: str
    status: str = "pending"  # pending, out_for_delivery, delivered
    created_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_to: Optional[str] = None
    delivered_at: Optional[datetime] = None

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_address: str
    order_id: str

class OrderUpdate(BaseModel):
    status: str
    assigned_to: Optional[str] = None

class DeliveryAgent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    is_online: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DeliveryAgentCreate(BaseModel):
    name: str
    phone: str

# WebSocket endpoints
@app.websocket("/ws/delivery/{agent_id}")
async def websocket_delivery_agent(websocket: WebSocket, agent_id: str):
    await manager.connect(websocket, "delivery_agent")
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages from delivery agents
            message_data = json.loads(data)
            if message_data.get("type") == "status_update":
                # Update order status and broadcast to owners
                order_id = message_data.get("order_id")
                new_status = message_data.get("status")
                
                # Update order in database
                await db.orders.update_one(
                    {"id": order_id},
                    {"$set": {"status": new_status, "assigned_to": agent_id}}
                )
                
                # Broadcast status update to owners
                await manager.broadcast_to_owners(json.dumps({
                    "type": "status_update",
                    "order_id": order_id,
                    "status": new_status,
                    "agent_id": agent_id
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/owner/{owner_id}")
async def websocket_owner(websocket: WebSocket, owner_id: str):
    await manager.connect(websocket, "owner")
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages from owners
            message_data = json.loads(data)
            if message_data.get("type") == "send_for_delivery":
                # Broadcast new order to delivery agents
                await manager.broadcast_to_delivery_agents(json.dumps({
                    "type": "new_order",
                    "order": message_data.get("order")
                }))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Restaurant Management System API"}

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_dict = order.dict()
    order_obj = Order(**order_dict)
    await db.orders.insert_one(order_obj.dict())
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    orders = await db.orders.find().sort("created_at", -1).to_list(1000)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if order:
        return Order(**order)
    return {"error": "Order not found"}

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_update: OrderUpdate):
    update_data = order_update.dict(exclude_unset=True)
    if order_update.status == "delivered":
        update_data["delivered_at"] = datetime.utcnow()
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    # Broadcast update to owners
    await manager.broadcast_to_owners(json.dumps({
        "type": "status_update",
        "order_id": order_id,
        "status": order_update.status,
        "agent_id": order_update.assigned_to
    }))
    
    updated_order = await db.orders.find_one({"id": order_id})
    return Order(**updated_order)

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

@api_router.post("/orders/{order_id}/send-for-delivery")
async def send_order_for_delivery(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        return {"error": "Order not found"}
    
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