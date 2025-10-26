import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  getCurrentUser, 
  isAuthenticated,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserData,
  getAllOrders,
  onOrdersUpdate,
  updateOrderStatus,
  assignDeliveryPerson,
  getAllPrescriptions,
  updatePrescriptionStatus,
  deletePrescription,
  getSystemSettings,
  updateSystemSettings,
  resetSystemSettings
} from "../firebase";
import { seedOrders } from "../seedOrders";
import AddDummyProducts from "../components/AddDummyProducts";
import LiveCartActivity from "../components/LiveCartActivity";
import AdminProducts from "./AdminProducts";

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("");
  const [updatingUser, setUpdatingUser] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState("");
  
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
        
        // If URL has tab query, switch to that tab
        try {
          const qp = new URLSearchParams(location.search);
          const tab = qp.get("tab");
          const allowed = ["overview","users","orders","prescriptions","reports","settings"];
          if (tab && allowed.includes(tab)) {
            setActiveTab(tab);
          }
        } catch (e) {}

        // Load all users
        loadUsers();
        
        // Load all orders
        loadOrders();
      } else {
        navigate("/login");
      }
    };
    
    checkAuth();
  }, [navigate, location.search]);
  
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
  
  // Set up real-time listener for orders
  const [ordersUnsubscribe, setOrdersUnsubscribe] = useState(null);
  
  useEffect(() => {
    // Clean up previous listener if it exists
    if (ordersUnsubscribe) {
      ordersUnsubscribe();
    }
    
    // Set up new listener with current filters
    const filters = statusFilter !== "all" ? { status: statusFilter } : {};
    const unsubscribe = onOrdersUpdate(filters, (result) => {
      if (result.success) {
        setOrders(result.orders);
      } else {
        setError(result.error || "Failed to load orders");
      }
      setLoading(false);
    });
    
    setOrdersUnsubscribe(unsubscribe);
    
    // Clean up listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [statusFilter]);
  
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

  // Assign delivery person to order
  const handleAssignDelivery = async () => {
    if (!selectedOrder || !selectedDeliveryPersonId) return;
    setUpdatingOrder(true);
    setError("");
    setSuccess("");
    try {
      const result = await assignDeliveryPerson(selectedOrder.id, selectedDeliveryPersonId);
      if (result.success) {
        setSuccess("Delivery person assigned successfully");
        // Update local state
        const deliveryUser = users.find(u => u.uid === selectedDeliveryPersonId);
        setOrders(orders.map(order => 
          order.id === selectedOrder.id
            ? {
                ...order,
                deliveryPersonId: selectedDeliveryPersonId,
                deliveryPersonName: deliveryUser?.displayName || deliveryUser?.email,
                status: "Ready for Delivery",
                updatedAt: new Date()
              }
            : order
        ));
        setIsAssignModalOpen(false);
      } else {
        setError(result.error || "Failed to assign delivery person");
      }
    } catch (err) {
      setError(err.message || "An error occurred while assigning delivery person");
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

  // Filter users based on search term and exclude admin users
  const filteredUsers = users.filter(user => 
    // Exclude users with admin role
    user.role !== "admin" && (
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
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
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <dd className="text-lg font-medium text-gray-900">{orders.length}</dd>
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
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Orders</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {orders.filter(order => order.status === "pending").length}
                        </dd>
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
                        <dd className="text-lg font-medium text-gray-900">
                          ₹{orders.reduce((total, order) => total + (order.totalAmount || order.total || 0), 0).toFixed(2)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Orders</h3>
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.slice(0, 5).map((order) => (
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
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.createdAt ? 
                                  (order.createdAt.seconds ? 
                                    new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 
                                    new Date(order.createdAt).toLocaleDateString()
                                  ) : "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">₹{(order.totalAmount || order.total || 0).toFixed(2)}</div>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No recent orders</p>
                  </div>
                )}

      {/* Assign Delivery Modal */}
      {isAssignModalOpen && (
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
                      Assign Delivery Person
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Order: <span className="font-medium">{selectedOrder?.orderId ? selectedOrder.orderId.substring(0,8) : selectedOrder?.id?.substring(0,8)}</span>
                      </p>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Delivery Person</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={selectedDeliveryPersonId}
                        onChange={(e)=>setSelectedDeliveryPersonId(e.target.value)}
                      >
                        <option value="">-- Choose --</option>
                        {users
                          .filter(u => u.role === "delivery" || u.role === "delivery boy" || u.role === "deliveryboy")
                          .map(u => (
                            <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>
                          ))}
                      </select>
                      {selectedOrder?.deliveryPersonId && (
                        <p className="mt-3 text-sm text-gray-600">Currently assigned to: <span className="font-medium">{selectedOrder.deliveryPersonName || selectedOrder.deliveryPersonId}</span></p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                    updatingOrder ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  onClick={handleAssignDelivery}
                  disabled={updatingOrder || !selectedDeliveryPersonId}
                >
                  {updatingOrder ? "Assigning..." : "Assign"}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsAssignModalOpen(false)}
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
                    <option value="Ready for Delivery">Ready for Delivery</option>
                    <option value="Out for Delivery">Out for Delivery</option>
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
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Update Status
                              </button>
                              <button
                                onClick={() => {
                                  navigate(`/admin/orders/assign/${order.id}`);
                                }}
                                className="ml-4 text-indigo-600 hover:text-indigo-900"
                              >
                                {order.deliveryPersonId ? "Reassign Delivery" : "Assign Delivery"}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding sample orders.</p>
                </div>
              )}
            </div>
          </div>
        );
        
      case "prescriptions":
        return (
          <div className="space-y-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Prescription Management</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">View and manage customer prescriptions</p>
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
                    placeholder="Search prescriptions by user email or name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={prescriptionSearchTerm}
                    onChange={(e) => setPrescriptionSearchTerm(e.target.value)}
                  />
              </div>
              
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prescription ID
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
                      {filteredPrescriptions.length > 0 ? (
                        filteredPrescriptions.map((prescription) => (
                          <tr key={prescription.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {prescription.id.substring(0, 8)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {prescription.user?.email || "No Email"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {prescription.user?.displayName || "No Name"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {prescription.createdAt ? 
                                  (prescription.createdAt.seconds ? 
                                    new Date(prescription.createdAt.seconds * 1000).toLocaleDateString() : 
                                    new Date(prescription.createdAt).toLocaleDateString()
                                  ) : "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {prescription.createdAt ? 
                                  (prescription.createdAt.seconds ? 
                                    new Date(prescription.createdAt.seconds * 1000).toLocaleTimeString() : 
                                    new Date(prescription.createdAt).toLocaleTimeString()
                                  ) : ""}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                prescription.status === "approved" 
                                  ? "bg-green-100 text-green-800" 
                                  : prescription.status === "pending" 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : prescription.status === "rejected" 
                                  ? "bg-red-100 text-red-800" 
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {prescription.status ? prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1) : "Pending"}
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
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Update Status
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            No prescriptions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        );
        
      case "reports":
        return (
          <div className="space-y-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Reports & Analytics</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Generate and view reports</p>
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
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="sales">Sales Report</option>
                    <option value="orders">Order Status Report</option>
                    <option value="products">Top Selling Products</option>
                    <option value="customers">Customer Activity</option>
                  </select>
                </div>
                
                <div className="w-full md:w-2/3 flex justify-end space-x-2">
                  <select
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>
              </div>
              
              {loadingReport ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Render different report views based on report type */}
                  {reportType === "sales" && reportData?.salesData && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Sales Report</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Total Sales</p>
                          <p className="text-xl font-bold text-blue-700">{reportData.currency}{reportData.totalSales?.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Average Daily Sales</p>
                          <p className="text-xl font-bold text-green-700">{reportData.currency}{reportData.avgDailySales?.toFixed(2)}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Days</p>
                          <p className="text-xl font-bold text-purple-700">{reportData.salesData.length}</p>
                        </div>
                      </div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sales Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.salesData.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {item.date instanceof Date ? item.date.toLocaleDateString() : new Date(item.date).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {reportData.currency}{item.amount?.toLocaleString()}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {reportType === "orders" && reportData?.orderStatusData && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Order Status Report</h4>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Total Orders</p>
                          <p className="text-xl font-bold text-blue-700">{reportData.totalOrders?.toLocaleString()}</p>
                        </div>
                        {reportData.orderStatusData.map((item, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 capitalize">{item.status}</p>
                            <p className="text-xl font-bold text-gray-700">{item.count}</p>
                          </div>
                        ))}
                      </div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.orderStatusData.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 capitalize">
                                  {item.status}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {item.count}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {reportType === "products" && reportData?.topProducts && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Top Selling Products</h4>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sales Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.topProducts.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {item.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {item.sales}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {reportType === "customers" && reportData?.customerData && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Customer Activity</h4>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Metric
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.customerData.map((item, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {item.metric}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {item.count !== undefined ? item.count : 
                                   item.value !== undefined ? `${reportData.currency || '₹'}${item.value}` : 
                                   item.percentage !== undefined ? `${item.percentage}%` : 'N/A'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {!reportData && (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No data available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
        
      case "settings":
        return (
          <div className="space-y-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">System Settings</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Configure system settings</p>
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
              {loadingSettings ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storeName" className="text-sm font-medium text-gray-700">
                      Store Name
                    </label>
                    <input
                      type="text"
                      id="storeName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storeName || ""}
                      onChange={(e) => handleSettingsChange("storeName", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storeAddress" className="text-sm font-medium text-gray-700">
                      Store Address
                    </label>
                    <input
                      type="text"
                      id="storeAddress"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storeAddress || ""}
                      onChange={(e) => handleSettingsChange("storeAddress", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storePhone" className="text-sm font-medium text-gray-700">
                      Store Phone
                    </label>
                    <input
                      type="text"
                      id="storePhone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storePhone || ""}
                      onChange={(e) => handleSettingsChange("storePhone", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storeEmail" className="text-sm font-medium text-gray-700">
                      Store Email
                    </label>
                    <input
                      type="email"
                      id="storeEmail"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storeEmail || ""}
                      onChange={(e) => handleSettingsChange("storeEmail", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storeCurrency" className="text-sm font-medium text-gray-700">
                      Store Currency
                    </label>
                    <input
                      type="text"
                      id="storeCurrency"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storeCurrency || ""}
                      onChange={(e) => handleSettingsChange("storeCurrency", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storeTaxRate" className="text-sm font-medium text-gray-700">
                      Store Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      id="storeTaxRate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storeTaxRate || ""}
                      onChange={(e) => handleSettingsChange("storeTaxRate", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storeShippingFee" className="text-sm font-medium text-gray-700">
                      Store Shipping Fee
                    </label>
                    <input
                      type="number"
                      id="storeShippingFee"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storeShippingFee || ""}
                      onChange={(e) => handleSettingsChange("storeShippingFee", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storePaymentMethods" className="text-sm font-medium text-gray-700">
                      Store Payment Methods
                    </label>
                    <input
                      type="text"
                      id="storePaymentMethods"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storePaymentMethods || ""}
                      onChange={(e) => handleSettingsChange("storePaymentMethods", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storeReturnPolicy" className="text-sm font-medium text-gray-700">
                      Store Return Policy
                    </label>
                    <textarea
                      id="storeReturnPolicy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storeReturnPolicy || ""}
                      onChange={(e) => handleSettingsChange("storeReturnPolicy", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storePrivacyPolicy" className="text-sm font-medium text-gray-700">
                      Store Privacy Policy
                    </label>
                    <textarea
                      id="storePrivacyPolicy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storePrivacyPolicy || ""}
                      onChange={(e) => handleSettingsChange("storePrivacyPolicy", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between">
                    <label htmlFor="storeTermsOfService" className="text-sm font-medium text-gray-700">
                      Store Terms of Service
                    </label>
                    <textarea
                      id="storeTermsOfService"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={settings?.storeTermsOfService || ""}
                      onChange={(e) => handleSettingsChange("storeTermsOfService", e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleSettingsUpdate}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!settingsChanged}
                    >
                      Save Changes
                    </button>
                    
                    <button
                      onClick={() => setIsResetModalOpen(true)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      case "products":
        return (
          <div className="bg-white">
            <AdminProducts />
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
            {/* Logo removed to avoid duplicate branding on Admin page */}

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

              {/* Shopping Cart removed per admin request */}

              {/* User dropdown removed to avoid duplicate 'Admin Dashboard' text */}
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
                          <option value="delivery">Delivery</option>
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
      
      {/* Prescription Status Update Modal */}
      {isPrescriptionModalOpen && (
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
                      Update Prescription Status
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Update status for prescription: <span className="font-medium">
                          {selectedPrescription?.id.substring(0, 8)}
                        </span>
                      </p>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Status: <span className="font-medium capitalize">{selectedPrescription?.status || "pending"}</span>
                        </label>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select New Status
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={selectedPrescriptionStatus}
                          onChange={(e) => setSelectedPrescriptionStatus(e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                          value={prescriptionNotes}
                          onChange={(e) => setPrescriptionNotes(e.target.value)}
                          placeholder="Add any notes about this prescription status change..."
                        />
                      </div>
                      
                      {/* Prescription details summary */}
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Prescription Summary</h4>
                        <div className="text-sm text-gray-600">
                          <p>User: {selectedPrescription?.user?.displayName || selectedPrescription?.user?.email || "Unknown User"}</p>
                          <p>Date: {selectedPrescription?.createdAt ? 
                                   (selectedPrescription.createdAt.seconds ? 
                                     new Date(selectedPrescription.createdAt.seconds * 1000).toLocaleDateString() : 
                                     new Date(selectedPrescription.createdAt).toLocaleDateString()
                                   ) : "N/A"}</p>
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
                    updatingPrescription ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  onClick={handlePrescriptionStatusUpdate}
                  disabled={updatingPrescription}
                >
                  {updatingPrescription ? "Updating..." : "Update Status"}
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsPrescriptionModalOpen(false)}
                  disabled={updatingPrescription}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Reset Confirmation Modal */}
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
  );
}

export default AdminDashboard;