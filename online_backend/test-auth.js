const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:4321';
let authToken = '';
let userId = '';

// Test user data
const adminUser = {
  name: 'Admin User',
  email: 'admin@test.com',
  password: 'password123',
  role: 'admin'
};

const customerUser = {
  name: 'Customer User',
  email: 'customer@test.com',
  password: 'password123',
  role: 'customer'
};

const deliveryUser = {
  name: 'Delivery User',
  email: 'delivery@test.com',
  password: 'password123',
  role: 'deliveryBoy'
};

// Helper function to log test results
const logResult = (testName, success, response) => {
  console.log(`\n----- ${testName} -----`);
  console.log(`Status: ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
  if (response) {
    if (response.data) {
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } else if (response.message) {
      console.log('Error:', response.message);
    }
  }
};

// Test functions
async function registerUser(user) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, user);
    logResult(`Register ${user.role}`, true, response);
    return response.data;
  } catch (error) {
    logResult(`Register ${user.role}`, false, error.response || error);
    return null;
  }
}

async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    logResult(`Login ${email}`, true, response);
    return response.data;
  } catch (error) {
    logResult(`Login ${email}`, false, error.response || error);
    return null;
  }
}

async function getUserProfile(token) {
  try {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logResult('Get User Profile', true, response);
    return response.data;
  } catch (error) {
    logResult('Get User Profile', false, error.response || error);
    return null;
  }
}

async function accessAdminDashboard(token) {
  try {
    const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logResult('Access Admin Dashboard', true, response);
    return response.data;
  } catch (error) {
    logResult('Access Admin Dashboard', false, error.response || error);
    return null;
  }
}

async function accessCustomerProfile(token) {
  try {
    const response = await axios.get(`${API_URL}/api/customer/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logResult('Access Customer Profile', true, response);
    return response.data;
  } catch (error) {
    logResult('Access Customer Profile', false, error.response || error);
    return null;
  }
}

async function accessDeliveryDashboard(token) {
  try {
    const response = await axios.get(`${API_URL}/api/delivery/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logResult('Access Delivery Dashboard', true, response);
    return response.data;
  } catch (error) {
    logResult('Access Delivery Dashboard', false, error.response || error);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Authentication and Role-Based Access Control Tests');
  
  // Test 1: Register users with different roles
  console.log('\n===== REGISTRATION TESTS =====');
  const adminResult = await registerUser(adminUser);
  const customerResult = await registerUser(customerUser);
  const deliveryResult = await registerUser(deliveryUser);
  
  // Test 2: Login with each user
  console.log('\n===== LOGIN TESTS =====');
  const adminLoginResult = await loginUser(adminUser.email, adminUser.password);
  const customerLoginResult = await loginUser(customerUser.email, customerUser.password);
  const deliveryLoginResult = await loginUser(deliveryUser.email, deliveryUser.password);
  
  if (adminLoginResult) {
    const adminToken = adminLoginResult.token;
    
    // Test 3: Get admin profile
    console.log('\n===== ADMIN USER TESTS =====');
    await getUserProfile(adminToken);
    
    // Test 4: Access admin dashboard with admin token
    await accessAdminDashboard(adminToken);
    
    // Test 5: Try to access customer profile with admin token
    await accessCustomerProfile(adminToken);
    
    // Test 6: Try to access delivery dashboard with admin token
    await accessDeliveryDashboard(adminToken);
  }
  
  if (customerLoginResult) {
    const customerToken = customerLoginResult.token;
    
    // Test 7: Get customer profile
    console.log('\n===== CUSTOMER USER TESTS =====');
    await getUserProfile(customerToken);
    
    // Test 8: Try to access admin dashboard with customer token
    await accessAdminDashboard(customerToken);
    
    // Test 9: Access customer profile with customer token
    await accessCustomerProfile(customerToken);
    
    // Test 10: Try to access delivery dashboard with customer token
    await accessDeliveryDashboard(customerToken);
  }
  
  if (deliveryLoginResult) {
    const deliveryToken = deliveryLoginResult.token;
    
    // Test 11: Get delivery user profile
    console.log('\n===== DELIVERY USER TESTS =====');
    await getUserProfile(deliveryToken);
    
    // Test 12: Try to access admin dashboard with delivery token
    await accessAdminDashboard(deliveryToken);
    
    // Test 13: Try to access customer profile with delivery token
    await accessCustomerProfile(deliveryToken);
    
    // Test 14: Access delivery dashboard with delivery token
    await accessDeliveryDashboard(deliveryToken);
  }
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error.message);
});