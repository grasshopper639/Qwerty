#!/usr/bin/env python3
"""
Backend API Testing for Restaurant Management System
Tests all REST API endpoints and WebSocket functionality
"""

import asyncio
import json
import requests
import websockets
import uuid
from datetime import datetime
import time

# Backend URL from frontend/.env
BACKEND_URL = "https://7b778c88-08b3-41b3-b60e-981a95b91649.preview.emergentagent.com"
API_BASE_URL = f"{BACKEND_URL}/api"
WS_BASE_URL = BACKEND_URL.replace("https://", "wss://")

class RestaurantAPITester:
    def __init__(self):
        self.test_results = []
        self.created_orders = []
        self.created_agents = []
        
    def log_test(self, test_name, success, message="", data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if data and not success:
            print(f"   Data: {data}")
    
    def test_health_check(self):
        """Test GET /api/ endpoint"""
        try:
            response = requests.get(f"{API_BASE_URL}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"API is running - {data.get('message', '')}")
                return True
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_create_order(self):
        """Test POST /api/orders endpoint"""
        try:
            order_data = {
                "customer_name": "Maria Rodriguez",
                "customer_phone": "+1-555-0123",
                "customer_address": "123 Oak Street, Downtown, City 12345",
                "order_id": f"ORD-{uuid.uuid4().hex[:8].upper()}"
            }
            
            response = requests.post(f"{API_BASE_URL}/orders", json=order_data, timeout=10)
            
            if response.status_code == 200:
                order = response.json()
                self.created_orders.append(order['id'])
                self.log_test("Create Order", True, f"Order created with ID: {order['id']}")
                return order
            else:
                self.log_test("Create Order", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test("Create Order", False, f"Error: {str(e)}")
            return None
    
    def test_get_orders(self):
        """Test GET /api/orders endpoint"""
        try:
            response = requests.get(f"{API_BASE_URL}/orders", timeout=10)
            
            if response.status_code == 200:
                orders = response.json()
                self.log_test("Get Orders", True, f"Retrieved {len(orders)} orders")
                return orders
            else:
                self.log_test("Get Orders", False, f"Status code: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Get Orders", False, f"Error: {str(e)}")
            return None
    
    def test_update_order_status(self, order_id):
        """Test PUT /api/orders/{order_id} endpoint"""
        try:
            update_data = {
                "status": "out_for_delivery",
                "assigned_to": "agent_001"
            }
            
            response = requests.put(f"{API_BASE_URL}/orders/{order_id}", json=update_data, timeout=10)
            
            if response.status_code == 200:
                updated_order = response.json()
                self.log_test("Update Order Status", True, f"Order {order_id} status updated to: {updated_order['status']}")
                return updated_order
            else:
                self.log_test("Update Order Status", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test("Update Order Status", False, f"Error: {str(e)}")
            return None
    
    def test_send_order_for_delivery(self, order_id, token=None):
        """Test POST /api/orders/{order_id}/send-for-delivery endpoint"""
        try:
            headers = {}
            if token:
                headers["Authorization"] = f"Bearer {token}"
                
            response = requests.post(f"{API_BASE_URL}/orders/{order_id}/send-for-delivery", headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                self.log_test("Send Order for Delivery", True, f"Order {order_id} sent for delivery")
                return result
            else:
                self.log_test("Send Order for Delivery", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test("Send Order for Delivery", False, f"Error: {str(e)}")
            return None
    
    def test_create_delivery_agent(self):
        """Test POST /api/delivery-agents endpoint"""
        try:
            agent_data = {
                "name": "Carlos Martinez",
                "phone": "+1-555-0456"
            }
            
            response = requests.post(f"{API_BASE_URL}/delivery-agents", json=agent_data, timeout=10)
            
            if response.status_code == 200:
                agent = response.json()
                self.created_agents.append(agent['id'])
                self.log_test("Create Delivery Agent", True, f"Agent created with ID: {agent['id']}")
                return agent
            else:
                self.log_test("Create Delivery Agent", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test("Create Delivery Agent", False, f"Error: {str(e)}")
            return None
    
    def test_get_delivery_agents(self):
        """Test GET /api/delivery-agents endpoint"""
        try:
            response = requests.get(f"{API_BASE_URL}/delivery-agents", timeout=10)
            
            if response.status_code == 200:
                agents = response.json()
                self.log_test("Get Delivery Agents", True, f"Retrieved {len(agents)} delivery agents")
                return agents
            else:
                self.log_test("Get Delivery Agents", False, f"Status code: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Get Delivery Agents", False, f"Error: {str(e)}")
            return None

    def test_register_restaurant_owner(self):
        """Test POST /api/auth/register endpoint for restaurant owner"""
        try:
            user_data = {
                "username": f"restaurant_owner_{uuid.uuid4().hex[:8]}",
                "email": f"owner_{uuid.uuid4().hex[:8]}@restaurant.com",
                "password": "SecurePass123!",
                "role": "restaurant_owner",
                "name": "Maria Rodriguez",
                "phone": "+1-555-0123"
            }
            
            response = requests.post(f"{API_BASE_URL}/auth/register", json=user_data, timeout=10)
            
            if response.status_code == 200:
                user = response.json()
                self.log_test("Register Restaurant Owner", True, f"Restaurant owner registered with ID: {user['id']}")
                return user
            else:
                self.log_test("Register Restaurant Owner", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test("Register Restaurant Owner", False, f"Error: {str(e)}")
            return None

    def test_register_delivery_agent_user(self):
        """Test POST /api/auth/register endpoint for delivery agent"""
        try:
            user_data = {
                "username": f"delivery_agent_{uuid.uuid4().hex[:8]}",
                "email": f"agent_{uuid.uuid4().hex[:8]}@delivery.com",
                "password": "SecurePass123!",
                "role": "delivery_agent",
                "name": "Carlos Martinez",
                "phone": "+1-555-0456"
            }
            
            response = requests.post(f"{API_BASE_URL}/auth/register", json=user_data, timeout=10)
            
            if response.status_code == 200:
                user = response.json()
                self.log_test("Register Delivery Agent User", True, f"Delivery agent user registered with ID: {user['id']}")
                return user
            else:
                self.log_test("Register Delivery Agent User", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test("Register Delivery Agent User", False, f"Error: {str(e)}")
            return None

    def test_login_restaurant_owner(self, username, password):
        """Test POST /api/auth/login endpoint for restaurant owner"""
        try:
            login_data = {
                "username": username,
                "password": password
            }
            
            response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                login_result = response.json()
                if login_result['user']['role'] == 'restaurant_owner':
                    self.log_test("Login Restaurant Owner", True, f"Restaurant owner logged in successfully, token received")
                    return login_result
                else:
                    self.log_test("Login Restaurant Owner", False, f"Wrong role returned: {login_result['user']['role']}")
                    return None
            else:
                self.log_test("Login Restaurant Owner", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test("Login Restaurant Owner", False, f"Error: {str(e)}")
            return None

    def test_login_delivery_agent(self, username, password):
        """Test POST /api/auth/login endpoint for delivery agent"""
        try:
            login_data = {
                "username": username,
                "password": password
            }
            
            response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                login_result = response.json()
                if login_result['user']['role'] == 'delivery_agent':
                    self.log_test("Login Delivery Agent", True, f"Delivery agent logged in successfully, token received")
                    return login_result
                else:
                    self.log_test("Login Delivery Agent", False, f"Wrong role returned: {login_result['user']['role']}")
                    return None
            else:
                self.log_test("Login Delivery Agent", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test("Login Delivery Agent", False, f"Error: {str(e)}")
            return None

    def test_authenticated_order_creation(self, token):
        """Test POST /api/orders endpoint with authentication"""
        try:
            order_data = {
                "customer_name": "Isabella Garcia",
                "customer_phone": "+1-555-0789",
                "customer_address": "789 Maple Avenue, Uptown, City 54321",
                "order_id": f"AUTH-ORD-{uuid.uuid4().hex[:8].upper()}"
            }
            
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.post(f"{API_BASE_URL}/orders", json=order_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                order = response.json()
                self.created_orders.append(order['id'])
                self.log_test("Authenticated Order Creation", True, f"Authenticated order created with ID: {order['id']}")
                return order
            else:
                self.log_test("Authenticated Order Creation", False, f"Status code: {response.status_code}, Response: {response.text}")
                return None
        except Exception as e:
            self.log_test("Authenticated Order Creation", False, f"Error: {str(e)}")
            return None

    async def test_websocket_owner_connection(self):
        """Test WebSocket connection for restaurant owner"""
        try:
            owner_id = "owner_001"
            ws_url = f"{WS_BASE_URL}/ws/owner/{owner_id}"
            
            async with websockets.connect(ws_url) as websocket:
                self.log_test("Owner WebSocket Connection", True, f"Connected to {ws_url}")
                
                # Test sending a message
                test_message = {
                    "type": "send_for_delivery",
                    "order": {
                        "id": "test_order_001",
                        "customer_name": "Test Customer",
                        "customer_address": "Test Address"
                    }
                }
                
                await websocket.send(json.dumps(test_message))
                self.log_test("Owner WebSocket Send", True, "Message sent successfully")
                
                return True
                
        except Exception as e:
            self.log_test("Owner WebSocket Connection", False, f"Error: {str(e)}")
            return False

    async def test_websocket_delivery_agent_connection(self):
        """Test WebSocket connection for delivery agent"""
        try:
            agent_id = "agent_001"
            ws_url = f"{WS_BASE_URL}/ws/delivery/{agent_id}"
            
            async with websockets.connect(ws_url) as websocket:
                self.log_test("Delivery Agent WebSocket Connection", True, f"Connected to {ws_url}")
                
                # Test sending a status update
                status_update = {
                    "type": "status_update",
                    "order_id": "test_order_001",
                    "status": "delivered"
                }
                
                await websocket.send(json.dumps(status_update))
                self.log_test("Delivery Agent WebSocket Send", True, "Status update sent successfully")
                
                return True
                
        except Exception as e:
            self.log_test("Delivery Agent WebSocket Connection", False, f"Error: {str(e)}")
            return False

    async def test_websocket_real_time_communication(self):
        """Test real-time communication between owner and delivery agent"""
        try:
            owner_id = "owner_test"
            agent_id = "agent_test"
            
            # Create connections for both owner and delivery agent
            owner_ws_url = f"{WS_BASE_URL}/ws/owner/{owner_id}"
            agent_ws_url = f"{WS_BASE_URL}/ws/delivery/{agent_id}"
            
            async with websockets.connect(owner_ws_url) as owner_ws, \
                       websockets.connect(agent_ws_url) as agent_ws:
                
                self.log_test("Real-time Communication Setup", True, "Both WebSocket connections established")
                
                # Simulate owner sending order for delivery
                order_message = {
                    "type": "send_for_delivery",
                    "order": {
                        "id": "realtime_test_order",
                        "customer_name": "John Doe",
                        "customer_address": "456 Pine Street",
                        "customer_phone": "+1-555-0789"
                    }
                }
                
                await owner_ws.send(json.dumps(order_message))
                
                # Try to receive message on delivery agent side (with timeout)
                try:
                    message = await asyncio.wait_for(agent_ws.recv(), timeout=5.0)
                    received_data = json.loads(message)
                    
                    if received_data.get("type") == "new_order":
                        self.log_test("Real-time Order Broadcast", True, "Order successfully broadcasted to delivery agent")
                    else:
                        self.log_test("Real-time Order Broadcast", False, f"Unexpected message type: {received_data.get('type')}")
                        
                except asyncio.TimeoutError:
                    self.log_test("Real-time Order Broadcast", False, "No message received within timeout")
                
                # Simulate delivery agent status update
                status_update = {
                    "type": "status_update",
                    "order_id": "realtime_test_order",
                    "status": "delivered"
                }
                
                await agent_ws.send(json.dumps(status_update))
                
                # Try to receive status update on owner side
                try:
                    message = await asyncio.wait_for(owner_ws.recv(), timeout=5.0)
                    received_data = json.loads(message)
                    
                    if received_data.get("type") == "status_update":
                        self.log_test("Real-time Status Update", True, "Status update successfully broadcasted to owner")
                    else:
                        self.log_test("Real-time Status Update", False, f"Unexpected message type: {received_data.get('type')}")
                        
                except asyncio.TimeoutError:
                    self.log_test("Real-time Status Update", False, "No status update received within timeout")
                
                return True
                
        except Exception as e:
            self.log_test("Real-time Communication", False, f"Error: {str(e)}")
            return False

    def run_rest_api_tests(self):
        """Run all REST API tests"""
        print("🚀 Starting REST API Tests...")
        print("=" * 50)
        
        # Test health check first
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Test authentication endpoints
        print("\n🔐 Testing Authentication...")
        restaurant_owner = self.test_register_restaurant_owner()
        delivery_agent_user = self.test_register_delivery_agent_user()
        
        restaurant_login = None
        delivery_login = None
        
        if restaurant_owner:
            restaurant_login = self.test_login_restaurant_owner(restaurant_owner['username'], "SecurePass123!")
        
        if delivery_agent_user:
            delivery_login = self.test_login_delivery_agent(delivery_agent_user['username'], "SecurePass123!")
        
        # Test order management (both authenticated and non-authenticated)
        print("\n📦 Testing Order Management...")
        order = self.test_create_order()
        self.test_get_orders()
        
        # Test authenticated order creation if we have a restaurant owner token
        if restaurant_login:
            self.test_authenticated_order_creation(restaurant_login['token'])
        
        if order:
            self.test_update_order_status(order['id'])
            self.test_send_order_for_delivery(order['id'])
        
        # Test delivery agent management
        print("\n🚚 Testing Delivery Agent Management...")
        agent = self.test_create_delivery_agent()
        self.test_get_delivery_agents()
        
        return True

    async def run_websocket_tests(self):
        """Run all WebSocket tests"""
        print("\n🔌 Starting WebSocket Tests...")
        print("=" * 50)
        
        await self.test_websocket_owner_connection()
        await self.test_websocket_delivery_agent_connection()
        await self.test_websocket_real_time_communication()

    def print_summary(self):
        """Print test summary"""
        print("\n📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for test in self.test_results:
                if not test['success']:
                    print(f"  - {test['test']}: {test['message']}")
        
        print(f"\nCreated {len(self.created_orders)} test orders")
        print(f"Created {len(self.created_agents)} test delivery agents")

async def main():
    """Main test runner"""
    tester = RestaurantAPITester()
    
    print("🍕 Restaurant Management System - Backend API Testing")
    print("=" * 60)
    print(f"Testing Backend URL: {BACKEND_URL}")
    print(f"API Base URL: {API_BASE_URL}")
    print(f"WebSocket Base URL: {WS_BASE_URL}")
    print("=" * 60)
    
    # Run REST API tests
    tester.run_rest_api_tests()
    
    # Run WebSocket tests
    await tester.run_websocket_tests()
    
    # Print summary
    tester.print_summary()
    
    return tester.test_results

if __name__ == "__main__":
    asyncio.run(main())