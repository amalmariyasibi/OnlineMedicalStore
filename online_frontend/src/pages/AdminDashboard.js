import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getCurrentUser, 
  isAuthenticated,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserData,
  getAllOrders,
  updateOrderStatus,
  getAllPrescriptions,
  updatePrescriptionStatus,
  deletePrescription,
  getSystemSettings,
  updateSystemSettings,
  resetSystemSettings
} from "../firebase";
import { seedOrders } from "../seedOrders";

function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("");
  const [updatingUser, setUpdatingUser] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Prescription management states
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionSearchTerm, setPrescriptionSearchTerm] = useState("");
  const [prescriptionStatusFilter, setPrescriptionStatusFilter] = useState("all");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedPrescriptionStatus, setSelectedPrescriptionStatus] = useState("");
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [updatingPrescription, setUpdatingPrescription] = useState(false);
  
  // Reports & Analytics states
  const [reportType, setReportType] = useState("sales");
  const [reportPeriod, setReportPeriod] = useState("month");
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Settings states
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        navigate("/login");
        return;
      }
      
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        
        // Check if user has admin role
        const userData = await checkUserRole(user.uid);
        if (!userData || userData.role !== "admin") {
          // Not an admin, redirect to unauthorized page
          navigate("/unauthorized");
          return;
        }
        
        // Load all users
        loadUsers();
        
        // Load all orders
        loadOrders();
      } else {
        navigate("/login");
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Load orders when status filter changes
  useEffect(() => {
    if (currentUser) {
      loadOrders();
    }
  }, [statusFilter]);
  
  // Load prescriptions when prescription status filter changes
  useEffect(() => {
    if (currentUser) {
      loadPrescriptions();
    }
  }, [prescriptionStatusFilter]);
  
  // Generate report when report type or period changes
  useEffect(() => {
    if (currentUser && activeTab === "reports") {
      generateReport();
    }
  }, [reportType, reportPeriod, activeTab]);
  
  // Load settings when settings tab is selected
  useEffect(() => {
    if (currentUser && activeTab === "settings") {
      loadSettings();
    }
  }, [activeTab]);

  // Function to get user data (role, etc.)
  const checkUserRole = async (userId) => {
    const result = await getUserData(userId);
    if (result.success) {
      return result.data;
    }
    return null;
  };

  // Load all users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.users);
      } else {
        setError(result.error || "Failed to load users");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  // Load all orders
  const loadOrders = async () => {
    setLoading(true);
    try {
      // Apply status filter if not "all"
      const filters = statusFilter !== "all" ? { status: statusFilter } : {};
      const result = await getAllOrders(filters);
      
      if (result.success) {
        setOrders(result.orders);
      } else {
        setError(result.error || "Failed to load orders");
      }
    } catch (err) {
      setError(err.message || "An error occurred while loading orders");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle order status update
  const handleOrderStatusUpdate = async () => {
    if (!selectedOrder || !selectedOrderStatus) return;
    
    setUpdatingOrder(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await updateOrderStatus(selectedOrder.id, selectedOrderStatus);
      if (result.success) {
        setSuccess(`Order status updated to ${selectedOrderStatus}`);
        
        // Update local orders array
        setOrders(orders.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: selectedOrderStatus, updatedAt: new Date() } 
            : order
        ));
        
        setIsOrderStatusModalOpen(false);
      } else {
        setError(result.error || "Failed to update order status");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setUpdatingOrder(false);
    }
  };
  
  // Load all prescriptions
  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      // Apply status filter if not "all"
      const filters = prescriptionStatusFilter !== "all" ? { status: prescriptionStatusFilter } : {};
      const result = await getAllPrescriptions(filters);
      
      if (result.success) {
        setPrescriptions(result.prescriptions);
      } else {
        setError(result.error || "Failed to load prescriptions");
      }
    } catch (err) {
      setError(err.message || "An error occurred while loading prescriptions");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle prescription status update
  const handlePrescriptionStatusUpdate = async () => {
    if (!selectedPrescription || !selectedPrescriptionStatus) return;
    
    setUpdatingPrescription(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await updatePrescriptionStatus(
        selectedPrescription.id, 
        selectedPrescriptionStatus,
        prescriptionNotes
      );
      
      if (result.success) {
        setSuccess(`Prescription status updated to ${selectedPrescriptionStatus}`);
        
        // Update local prescriptions array
        setPrescriptions(prescriptions.map(prescription => 
          prescription.id === selectedPrescription.id 
            ? { 
                ...prescription, 
                status: selectedPrescriptionStatus,
                notes: prescriptionNotes,
                updatedAt: new Date() 
              } 
            : prescription
        ));
        
        setIsPrescriptionModalOpen(false);
      } else {
        setError(result.error || "Failed to update prescription status");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setUpdatingPrescription(false);
    }
  };
  
  // Load system settings
  const loadSettings = async () => {
    setLoadingSettings(true);
    setError("");
    
    try {
      const result = await getSystemSettings();
      
      if (result.success) {
        setSettings(result.settings);
        setSettingsChanged(false);
      } else {
        setError(result.error || "Failed to load settings");
      }
    } catch (err) {
      setError(err.message || "An error occurred while loading settings");
    } finally {
      setLoadingSettings(false);
    }
  };
  
  // Handle settings update
  const handleSettingsUpdate = async () => {
    if (!settings) return;
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await updateSystemSettings(settings);
      
      if (result.success) {
        setSuccess("Settings updated successfully");
        setSettingsChanged(false);
      } else {
        setError(result.error || "Failed to update settings");
      }
    } catch (err) {
      setError(err.message || "An error occurred while updating settings");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle settings reset
  const handleSettingsReset = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await resetSystemSettings();
      
      if (result.success) {
        setSettings(result.settings);
        setSuccess("Settings reset to defaults");
        setSettingsChanged(false);
        setIsResetModalOpen(false);
      } else {
        setError(result.error || "Failed to reset settings");
      }
    } catch (err) {
      setError(err.message || "An error occurred while resetting settings");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle settings field change
  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setSettingsChanged(true);
  };
  
  // Generate report data based on type and period
  const generateReport = async () => {
    setLoadingReport(true);
    setError("");
    
    try {
      // In a real application, this would fetch data from the backend
      // For now, we'll generate mock data
      
      // Get date range based on period
      const today = new Date();
      let startDate = new Date();
      
      switch (reportPeriod) {
        case "week":
          startDate.setDate(today.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(today.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(today.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(today.getMonth() - 1); // Default to month
      }
      
      // Generate mock data based on report type
      let data = {};
      
      switch (reportType) {
        case "sales":
          // Generate daily sales data
          const salesData = [];
          let currentDate = new Date(startDate);
          
          while (currentDate <= today) {
            // Random sales amount between 1000 and 10000
            const amount = Math.floor(Math.random() * 9000) + 1000;
            salesData.push({
              date: new Date(currentDate),
              amount: amount
            });
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Calculate total sales
          const totalSales = salesData.reduce((sum, item) => sum + item.amount, 0);
          
          // Calculate average daily sales
          const avgDailySales = totalSales / salesData.length;
          
          data = {
            salesData,
            totalSales,
            avgDailySales,
            currency: "₹"
          };
          break;
          
        case "orders":
          // Generate order status data
          const orderStatusData = [
            { status: "pending", count: Math.floor(Math.random() * 20) + 5 },
            { status: "processing", count: Math.floor(Math.random() * 15) + 3 },
            { status: "shipped", count: Math.floor(Math.random() * 25) + 10 },
            { status: "delivered", count: Math.floor(Math.random() * 50) + 20 },
            { status: "cancelled", count: Math.floor(Math.random() * 10) + 1 }
          ];
          
          // Calculate total orders
          const totalOrders = orderStatusData.reduce((sum, item) => sum + item.count, 0);
          
          data = {
            orderStatusData,
            totalOrders
          };
          break;
          
        case "products":
          // Generate top selling products data
          const topProducts = [
            { name: "Paracetamol", sales: Math.floor(Math.random() * 100) + 50 },
            { name: "Aspirin", sales: Math.floor(Math.random() * 90) + 40 },
            { name: "Vitamin C", sales: Math.floor(Math.random() * 80) + 30 },
            { name: "Cough Syrup", sales: Math.floor(Math.random() * 70) + 20 },
            { name: "Antiseptic Cream", sales: Math.floor(Math.random() * 60) + 10 }
          ];
          
          // Sort by sales in descending order
          topProducts.sort((a, b) => b.sales - a.sales);
          
          data = {
            topProducts
          };
          break;
          
        case "customers":
          // Generate customer activity data
          const customerData = [
            { metric: "New Customers", count: Math.floor(Math.random() * 50) + 10 },
            { metric: "Returning Customers", count: Math.floor(Math.random() * 100) + 50 },
            { metric: "Average Order Value", value: Math.floor(Math.random() * 1000) + 500 },
            { metric: "Customer Retention Rate", percentage: Math.floor(Math.random() * 30) + 70 }
          ];
          
          data = {
            customerData
          };
          break;
          
        default:
          data = { error: "Invalid report type" };
      }
      
      setReportData(data);
    } catch (err) {
      setError(err.message || "An error occurred while generating the report");
    } finally {
      setLoadingReport(false);
    }
  };
  
  // Handle seeding sample orders
  const handleSeedOrders = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await seedOrders(true); // Force reseed
      if (result.success) {
        setSuccess("Sample orders have been added successfully!");
        // Reload orders
        loadOrders();
      } else {
        setError(result.error || "Failed to seed orders");
      }
    } catch (err) {
      setError(err.message || "An error occurred while seeding orders");
    } finally {
      setLoading(false);
    }
  };

  // Handle role update
  const handleRoleUpdate = async () => {
    if (!selectedUser || !selectedRole) return;
    
    setUpdatingUser(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await updateUserRole(selectedUser.uid, selectedRole);
      if (result.success) {
        setSuccess(`User role updated to ${selectedRole}`);
        
        // Update local users array
        setUsers(users.map(user => 
          user.uid === selectedUser.uid 
            ? { ...user, role: selectedRole } 
            : user
        ));
        
        setIsModalOpen(false);
      } else {
        setError(result.error || "Failed to update user role");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setUpdatingUser(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setUpdatingUser(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await deleteUser(selectedUser.uid);
      if (result.success) {
        setSuccess("User deleted successfully");
        
        // Remove user from local array
        setUsers(users.filter(user => user.uid !== selectedUser.uid));
        
        setIsDeleteModalOpen(false);
      } else {
        setError(result.error || "Failed to delete user");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setUpdatingUser(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Filter prescriptions based on search term
  const filteredPrescriptions = prescriptions.filter(prescription => 
    (prescription.user?.email && prescription.user.email.toLowerCase().includes(prescriptionSearchTerm.toLowerCase())) ||
    (prescription.user?.displayName && prescription.user.displayName.toLowerCase().includes(prescriptionSearchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render different content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Dashboard Overview</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Key metrics and system information</p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                        <dd className="text-lg font-medium text-gray-900">₹0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by managing your users and products.</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case "users":
        return (
          <div className="space-y-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">User Management</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage user accounts and roles</p>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 m-4 rounded">
                {success}
              </div>
            )}
            
            <div className="px-6 py-4">
              <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search users by email or name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.uid}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {user.photoURL ? (
                                    <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                      <span className="text-gray-600 font-medium">
                                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.displayName || "No Name"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    User ID: {user.uid.substring(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === "admin" 
                                  ? "bg-purple-100 text-purple-800" 
                                  : user.role === "staff" 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {user.role || "customer"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.emailVerified 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {user.emailVerified ? "Verified" : "Not Verified"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRole(user.role || "customer");
                                  setIsModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Edit Role
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        );
        
      case "orders":
        return (
          <div className="space-y-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Order Management</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">View and manage customer orders</p>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 m-4 rounded">
                {success}
              </div>
            )}
            
            <div className="px-6 py-4">
              <div className="flex flex-col md:flex-row justify-between mb-4 space-y-2 md:space-y-0">
                <div className="w-full md:w-1/3">
                  <input
                    type="text"
                    placeholder="Search orders by ID or customer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="w-full md:w-2/3 flex justify-end space-x-2">
                  <button
                    onClick={handleSeedOrders}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Add Sample Orders"}
                  </button>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders
                        .filter(order => 
                          (order.orderId && order.orderId.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
                          (order.customerName && order.customerName.toLowerCase().includes(orderSearchTerm.toLowerCase())) ||
                          (order.shippingAddress && order.shippingAddress.name && 
                           order.shippingAddress.name.toLowerCase().includes(orderSearchTerm.toLowerCase()))
                        )
                        .map((order) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {order.orderId ? order.orderId.substring(0, 8) : order.id.substring(0, 8)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.customerName || 
                                 (order.shippingAddress && order.shippingAddress.name) || 
                                 "Guest User"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.email || (order.shippingAddress && order.shippingAddress.email) || "No email"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.createdAt ? 
                                  (order.createdAt.seconds ? 
                                    new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 
                                    new Date(order.createdAt).toLocaleDateString()
                                  ) : "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.createdAt ? 
                                  (order.createdAt.seconds ? 
                                    new Date(order.createdAt.seconds * 1000).toLocaleTimeString() : 
                                    new Date(order.createdAt).toLocaleTimeString()
                                  ) : ""}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">₹{order.total?.toFixed(2) || "0.00"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                order.status === "delivered" 
                                  ? "bg-green-100 text-green-800" 
                                  : order.status === "shipped" 
                                  ? "bg-blue-100 text-blue-800" 
                                  : order.status === "processing" 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : order.status === "cancelled" 
                                  ? "bg-red-100 text-red-800" 
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Pending"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setSelectedOrderStatus(order.status || "pending");
                                  setIsOrderStatusModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Update Status
                              </button>
                              <button
                                onClick={() => {
                                  // View order details (to be implemented)
                                  console.log("View order details", order);
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {statusFilter !== "all" 
                      ? `No ${statusFilter} orders found. Try changing the filter.` 
                      : "No orders have been placed yet."}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
        
      case "products":
        return (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Product Management</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage medicines and products</p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/admin/products")}
                  className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Manage Products</h3>
                    <p className="mt-1 text-sm text-gray-500">Add, edit, and manage general products</p>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate("/admin/medicines")}
                  className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Manage Medicines</h3>
                    <p className="mt-1 text-sm text-gray-500">Add, edit, and manage medicines</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
        
      case "prescriptions":
        return (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Prescription Verification</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Review and verify prescription uploads</p>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 m-4 rounded">
                {success}
              </div>
            )}
            
            <div className="px-6 py-4">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <div className="mb-4 md:mb-0 md:w-1/3">
                  <input
                    type="text"
                    placeholder="Search by customer name or email"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={prescriptionSearchTerm}
                    onChange={(e) => setPrescriptionSearchTerm(e.target.value)}
                  />
                </div>
                <div className="md:w-1/4">
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={prescriptionStatusFilter}
                    onChange={(e) => setPrescriptionStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              
              {prescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Prescriptions Found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {prescriptionStatusFilter !== "all" 
                      ? `No ${prescriptionStatusFilter} prescriptions found.` 
                      : "No prescriptions have been uploaded yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPrescriptions.map((prescription) => (
                        <tr key={prescription.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prescription.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {prescription.user?.displayName || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {prescription.user?.email || "No email"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prescription.createdAt ? 
                              (prescription.createdAt.seconds ? 
                                new Date(prescription.createdAt.seconds * 1000).toLocaleString() : 
                                new Date(prescription.createdAt).toLocaleString()
                              ) : ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${prescription.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                prescription.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'}`}>
                              {prescription.status ? 
                                prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1) : 
                                "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedPrescription(prescription);
                                setSelectedPrescriptionStatus(prescription.status || "pending");
                                setPrescriptionNotes(prescription.notes || "");
                                setIsPrescriptionModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
        
      case "reports":
        return (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Reports & Analytics</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">View sales reports and analytics</p>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
                {error}
              </div>
            )}
            
            <div className="px-6 py-4">
              <div className="flex flex-col md:flex-row justify-between mb-6">
                <div className="mb-4 md:mb-0 md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="sales">Sales Report</option>
                    <option value="orders">Order Status Report</option>
                    <option value="products">Top Products Report</option>
                    <option value="customers">Customer Analytics</option>
                  </select>
                </div>
                <div className="mb-4 md:mb-0 md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 3 Months</option>
                    <option value="year">Last 12 Months</option>
                  </select>
                </div>
                <div className="md:w-1/3 flex items-end">
                  <button
                    onClick={() => {
                      // In a real application, this would generate a PDF or CSV export
                      alert("Report export functionality would be implemented here");
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    disabled={loadingReport || !reportData}
                  >
                    <div className="flex items-center justify-center">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Report
                    </div>
                  </button>
                </div>
              </div>
              
              {loadingReport ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : reportData ? (
                <div className="mt-6">
                  {reportType === "sales" && (
                    <div>
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Sales Summary</h3>
                          <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            {reportPeriod === "week" ? "Last 7 days" : 
                             reportPeriod === "month" ? "Last 30 days" : 
                             reportPeriod === "quarter" ? "Last 3 months" : "Last 12 months"}
                          </p>
                        </div>
                        <div className="border-t border-gray-200">
                          <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Total Sales</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {reportData.currency}{reportData.totalSales.toLocaleString()}
                              </dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Average Daily Sales</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {reportData.currency}{reportData.avgDailySales.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                      
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Sales Trend</h3>
                        </div>
                        <div className="border-t border-gray-200 p-4">
                          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                            <p className="text-gray-500">Sales chart visualization would appear here</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {reportType === "orders" && (
                    <div>
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Order Status Summary</h3>
                          <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            {reportPeriod === "week" ? "Last 7 days" : 
                             reportPeriod === "month" ? "Last 30 days" : 
                             reportPeriod === "quarter" ? "Last 3 months" : "Last 12 months"}
                          </p>
                        </div>
                        <div className="border-t border-gray-200">
                          <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">Total Orders</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {reportData.totalOrders}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                      
                      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Order Status Distribution</h3>
                        </div>
                        <div className="border-t border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Count
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Percentage
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {reportData.orderStatusData.map((item) => (
                                <tr key={item.status}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                      ${item.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                        item.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                        item.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                        item.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.count}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {((item.count / reportData.totalOrders) * 100).toFixed(1)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {reportType === "products" && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Top Selling Products</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          {reportPeriod === "week" ? "Last 7 days" : 
                           reportPeriod === "month" ? "Last 30 days" : 
                           reportPeriod === "quarter" ? "Last 3 months" : "Last 12 months"}
                        </p>
                      </div>
                      <div className="border-t border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rank
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Units Sold
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.topProducts.map((product, index) => (
                              <tr key={product.name}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  #{index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {product.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {product.sales}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {reportType === "customers" && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Analytics</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          {reportPeriod === "week" ? "Last 7 days" : 
                           reportPeriod === "month" ? "Last 30 days" : 
                           reportPeriod === "quarter" ? "Last 3 months" : "Last 12 months"}
                        </p>
                      </div>
                      <div className="border-t border-gray-200">
                        <dl>
                          {reportData.customerData.map((item) => (
                            <div key={item.metric} className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">{item.metric}</dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {item.count !== undefined ? item.count : 
                                 item.value !== undefined ? `₹${item.value}` : 
                                 item.percentage !== undefined ? `${item.percentage}%` : "N/A"}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Report Data</h3>
                  <p className="mt-1 text-sm text-gray-500">Select a report type and time period to generate a report.</p>
                </div>
              )}
            </div>
          </div>
        );
        
      case "settings":
        return (
          <div>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Settings</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Configure system settings</p>
            </div>
            {loadingSettings ? (
              <div className="flex justify-center items-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : settings ? (
              <div className="px-6 py-4">
                {/* Store Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Store Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                      <input
                        type="text"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.storeName || ""}
                        onChange={(e) => handleSettingsChange("storeName", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Store Email</label>
                      <input
                        type="email"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.storeEmail || ""}
                        onChange={(e) => handleSettingsChange("storeEmail", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Store Phone</label>
                      <input
                        type="text"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.storePhone || ""}
                        onChange={(e) => handleSettingsChange("storePhone", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                      <textarea
                        rows="2"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.storeAddress || ""}
                        onChange={(e) => handleSettingsChange("storeAddress", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Order Settings */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Order Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.taxRate || 0}
                        onChange={(e) => handleSettingsChange("taxRate", parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Fee</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.shippingFee || 0}
                        onChange={(e) => handleSettingsChange("shippingFee", parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.freeShippingThreshold || 0}
                        onChange={(e) => handleSettingsChange("freeShippingThreshold", parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                      <input
                        type="text"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={settings.currency || "₹"}
                        onChange={(e) => handleSettingsChange("currency", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* System Settings */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">System Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="enablePrescriptionVerification"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={settings.enablePrescriptionVerification || false}
                        onChange={(e) => handleSettingsChange("enablePrescriptionVerification", e.target.checked)}
                      />
                      <label htmlFor="enablePrescriptionVerification" className="ml-2 block text-sm text-gray-900">
                        Enable Prescription Verification
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="enableEmailNotifications"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={settings.enableEmailNotifications || false}
                        onChange={(e) => handleSettingsChange("enableEmailNotifications", e.target.checked)}
                      />
                      <label htmlFor="enableEmailNotifications" className="ml-2 block text-sm text-gray-900">
                        Enable Email Notifications
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="enableSmsNotifications"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={settings.enableSmsNotifications || false}
                        onChange={(e) => handleSettingsChange("enableSmsNotifications", e.target.checked)}
                      />
                      <label htmlFor="enableSmsNotifications" className="ml-2 block text-sm text-gray-900">
                        Enable SMS Notifications
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="allowGuestCheckout"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={settings.allowGuestCheckout || false}
                        onChange={(e) => handleSettingsChange("allowGuestCheckout", e.target.checked)}
                      />
                      <label htmlFor="allowGuestCheckout" className="ml-2 block text-sm text-gray-900">
                        Allow Guest Checkout
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="maintenanceMode"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={settings.maintenanceMode || false}
                        onChange={(e) => handleSettingsChange("maintenanceMode", e.target.checked)}
                      />
                      <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                        Maintenance Mode
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-8">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setIsResetModalOpen(true)}
                  >
                    Reset to Defaults
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      !settingsChanged || loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={handleSettingsUpdate}
                    disabled={!settingsChanged || loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
                
                {/* Reset Confirmation Modal */}
                {isResetModalOpen && (
                  <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                      <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                      </div>
                      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                              <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">Reset Settings</h3>
                              <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                  Are you sure you want to reset all settings to their default values? This action cannot be undone.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                          <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={handleSettingsReset}
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={() => setIsResetModalOpen(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Settings</h3>
                <p className="mt-1 text-sm text-gray-500">{error || "Failed to load settings. Please try again."}</p>
                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={loadSettings}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">MediHaven</h1>
            </div>

            {/* Search and User */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search medicines and produ"
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Shopping Cart */}
              <button className="p-2 text-gray-700 hover:text-blue-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600">
                  <span className="text-sm font-medium">Admin Dashboard</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, Admin</p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Manage Users
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`${
                activeTab === "orders"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Manage Orders
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`${
                activeTab === "products"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Manage Products
            </button>
            <button
              onClick={() => setActiveTab("prescriptions")}
              className={`${
                activeTab === "prescriptions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              View Prescriptions
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`${
                activeTab === "reports"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              View Reports
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`${
                activeTab === "settings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderContent()}
        </div>
      </main>
      
      {/* Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Edit User Role
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Change role for user: <span className="font-medium">{selectedUser?.email}</span>
                      </p>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Role
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                        >
                          <option value="customer">Customer</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                    updatingUser ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  onClick={handleRoleUpdate}
                  disabled={updatingUser}
                >
                  {updatingUser ? "Updating..." : "Update Role"}
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={updatingUser}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete User Modal */}
      {isDeleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Delete User
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the user <span className="font-medium">{selectedUser?.email}</span>? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                    updatingUser ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  onClick={handleDeleteUser}
                  disabled={updatingUser}
                >
                  {updatingUser ? "Deleting..." : "Delete User"}
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={updatingUser}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Order Status Update Modal */}
      {isOrderStatusModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Update Order Status
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Update status for order: <span className="font-medium">
                          {selectedOrder?.orderId ? selectedOrder.orderId.substring(0, 8) : selectedOrder?.id.substring(0, 8)}
                        </span>
                      </p>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Status: <span className="font-medium capitalize">{selectedOrder?.status || "pending"}</span>
                        </label>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select New Status
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={selectedOrderStatus}
                          onChange={(e) => setSelectedOrderStatus(e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      
                      {/* Order details summary */}
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Order Summary</h4>
                        <div className="text-sm text-gray-600">
                          <p>Customer: {selectedOrder?.customerName || 
                                        (selectedOrder?.shippingAddress && selectedOrder.shippingAddress.name) || 
                                        "Guest User"}</p>
                          <p>Date: {selectedOrder?.createdAt ? 
                                   (selectedOrder.createdAt.seconds ? 
                                     new Date(selectedOrder.createdAt.seconds * 1000).toLocaleDateString() : 
                                     new Date(selectedOrder.createdAt).toLocaleDateString()
                                   ) : "N/A"}</p>
                          <p>Total: ₹{selectedOrder?.total?.toFixed(2) || "0.00"}</p>
                          <p>Items: {selectedOrder?.items?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                    updatingOrder ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  onClick={handleOrderStatusUpdate}
                  disabled={updatingOrder}
                >
                  {updatingOrder ? "Updating..." : "Update Status"}
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsOrderStatusModalOpen(false)}
                  disabled={updatingOrder}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;