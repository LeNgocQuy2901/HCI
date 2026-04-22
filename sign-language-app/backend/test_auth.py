"""
Test Registration and Login API Endpoints
"""
import requests
import json

API_URL = "http://localhost:8000/api"

def test_registration():
    """Test user registration"""
    print("\n🧪 Testing Registration Endpoint...")
    
    data = {
        "username": "testuser123",
        "email": "test@example.com",
        "password": "SecurePass123",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/register", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            print("✅ Registration successful!")
            return response.json()
        else:
            print(f"❌ Registration failed: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def test_login(email, password):
    """Test user login"""
    print("\n🧪 Testing Login Endpoint...")
    
    data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            return response.json()
        else:
            print(f"❌ Login failed: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def test_invalid_password():
    """Test registration with weak password"""
    print("\n🧪 Testing Invalid Password Validation...")
    
    data = {
        "username": "weakpass",
        "email": "weak@example.com",
        "password": "weak",  # Too weak
        "full_name": "Weak Pass User"
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/register", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 422:  # Validation error
            print("✅ Weak password correctly rejected!")
        else:
            print(f"⚠️ Expected validation error but got: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    print("=" * 60)
    print("AUTHENTICATION API TEST SUITE")
    print("=" * 60)
    
    # Test registration
    reg_result = test_registration()
    
    # Test invalid password
    test_invalid_password()
    
    # Test login
    if reg_result:
        test_login("test@example.com", "SecurePass123")
    
    # Test login with wrong password
    print("\n🧪 Testing Login with Wrong Password...")
    test_login("test@example.com", "WrongPassword123")
    
    print("\n" + "=" * 60)
    print("TEST SUITE COMPLETE")
    print("=" * 60)
