import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, orderBy, doc, setDoc } from "firebase/firestore";
import { getUserData } from "../firebase";

// Reuse the simple AI-style analyzer: uses purchase history to predict when medicines may run out
const calculateRefillReminders = (orders) => {
  const medicineHistory = new Map();

  orders.forEach((order) => {
    if (!order.items || !order.createdAtDate) return;

    order.items.forEach((item) => {
      const name = item.name || item.medicineName || "Medicine";
      if (!medicineHistory.has(name)) {
        medicineHistory.set(name, []);
      }
      medicineHistory.get(name).push({
        date: order.createdAtDate,
        quantity: item.quantity || 1,
      });
    });
  });

  const msPerDay = 1000 * 60 * 60 * 24;
  const today = new Date();
  const reminders = [];

  medicineHistory.forEach((purchases, medicineName) => {
    if (purchases.length < 2) {
      return;
    }

    purchases.sort((a, b) => a.date - b.date);

    const intervals = [];
    for (let i = 1; i < purchases.length; i++) {
      const diffDays = (purchases[i].date - purchases[i - 1].date) / msPerDay;
      if (diffDays > 0) {
        intervals.push(diffDays);
      }
    }

    if (intervals.length === 0) {
      return;
    }

    const avgInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
    const lastPurchaseDate = purchases[purchases.length - 1].date;
    const daysSinceLast = (today - lastPurchaseDate) / msPerDay;

    const rawDaysLeft = avgInterval - daysSinceLast;
    const daysLeft = Math.round(rawDaysLeft);

    if (rawDaysLeft <= 7) {
      const urgency = rawDaysLeft <= 3 ? "urgent" : "soon";
      reminders.push({
        medicineName,
        daysLeft: daysLeft < 0 ? 0 : daysLeft,
        urgency,
      });
    }
  });

  reminders.sort((a, b) => a.daysLeft - b.daysLeft);
  return reminders;
};

function HealthProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refillRecommendations, setRefillRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState("metrics");
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(true);
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);
  const [showDietPanel, setShowDietPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editAge, setEditAge] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editHealthScore, setEditHealthScore] = useState("");

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (currentUser.role === "admin") {
      navigate("/admin");
      return;
    }

    if (currentUser.role === "delivery") {
      navigate("/delivery");
      return;
    }

    const fetchData = async () => {
      try {
        // Load user profile details from Firestore (age, gender, etc.)
        if (currentUser?.uid) {
          try {
            const result = await getUserData(currentUser.uid);
            if (result.success) {
              setUserDetails(result.data || null);
            } else {
              setUserDetails(null);
            }
          } catch (detailErr) {
            console.error("Error loading user details for health profile:", detailErr);
            setUserDetails(null);
          } finally {
            setLoadingUserDetails(false);
          }
        } else {
          setLoadingUserDetails(false);
        }

        const ordersQuery = query(
          collection(db, "orders"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(ordersQuery);
        const ordersData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          let createdAtDate = null;
          let createdAtFormatted = "Unknown date";

          if (data.createdAt) {
            if (typeof data.createdAt.toDate === "function") {
              createdAtDate = data.createdAt.toDate();
              createdAtFormatted = createdAtDate.toLocaleDateString();
            } else if (data.createdAt instanceof Date) {
              createdAtDate = data.createdAt;
              createdAtFormatted = createdAtDate.toLocaleDateString();
            } else if (typeof data.createdAt === "string") {
              createdAtDate = new Date(data.createdAt);
              createdAtFormatted = createdAtDate.toLocaleDateString();
            } else {
              createdAtFormatted = data.createdAt.toString();
            }
          }

          return {
            id: doc.id,
            ...data,
            createdAt: createdAtFormatted,
            createdAtDate,
          };
        });

        setOrders(ordersData);
        setRefillRecommendations(calculateRefillReminders(ordersData));
      } catch (err) {
        console.error("Error fetching orders for health profile:", err);
        setOrders([]);
        setRefillRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mr-3 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className="h-4 w-4 mr-1"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Health Profile &amp; Diet Management
            </h1>
            <p className="text-sm text-gray-600">
              Personalized health tracking with AI recommendations.
            </p>
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => {
                setShowEditPanel((prev) => !prev);
                if (!showEditPanel) {
                  setEditAge(userDetails?.age ? String(userDetails.age) : "");
                  setEditGender(userDetails?.gender || "");
                  setEditHealthScore(
                    typeof userDetails?.healthScore === "number"
                      ? String(userDetails.healthScore)
                      : ""
                  );
                }
              }}
              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border border-purple-100 shadow-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 mr-2">
                      <svg
                        className="h-5 w-5 text-purple-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </span>
                    AI Health Recommendations
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Personalized refill alerts based on your previous medicine purchases.
                  </p>
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                    Medication Refill
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    Analyzing your orders to generate refill reminders...
                  </span>
                </div>
              ) : refillRecommendations.length === 0 ? (
                <div className="bg-white/70 border border-dashed border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start">
                    <span className="mt-1 mr-3 text-gray-400">
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                        />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        No refill alerts right now.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        We will notify you here when our system detects that a medicine you
                        frequently purchase may be running low.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <Link
                      to="/medicines"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Refill Medicines
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {refillRecommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg p-4 bg-white/80 border ${
                        rec.urgency === "urgent" ? "border-red-200" : "border-yellow-200"
                      }`}
                    >
                      <div className="flex items-start">
                        <span
                          className={`mt-1 mr-3 inline-flex items-center justify-center h-7 w-7 rounded-full ${
                            rec.urgency === "urgent"
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          <svg
                            className="h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"
                            />
                          </svg>
                        </span>
                        <div>
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {rec.medicineName}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                rec.urgency === "urgent"
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              }`}
                            >
                              {rec.urgency === "urgent" ? "Urgent" : "Refill Soon"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {rec.daysLeft === 0
                              ? "Based on your past orders, this medicine may already be running low."
                              : `Based on your past orders, this medicine may run out in approximately ${rec.daysLeft} day${
                                  rec.daysLeft === 1 ? "" : "s"
                                }.`}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center space-x-2">
                        <Link
                          to="/medicines"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Reorder Now
                        </Link>
                        <Link
                          to="/orders"
                          className="inline-flex items-center px-3 py-1.5 border border-gray-200 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          View History
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs for Metrics / History / Allergies / Diet Plan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex space-x-4 border-b border-gray-100 mb-4 text-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab("metrics")}
                  className={`px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === "metrics"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Metrics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === "history"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  History
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("allergies")}
                  className={`px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === "allergies"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Allergies
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("diet")}
                  className={`px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === "diet"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Diet Plan
                </button>
              </div>

              {activeTab === "metrics" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Current Health Metrics
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Example values shown below. These can be connected to real
                    health data in the future.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">Blood Pressure</p>
                      <p className="text-lg font-semibold text-gray-900">120/80</p>
                      <p className="text-[11px] text-gray-500">mmHg</p>
                    </div>
                    <div className="rounded-lg border border-yellow-100 bg-yellow-50 px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">Blood Sugar</p>
                      <p className="text-lg font-semibold text-gray-900">110</p>
                      <p className="text-[11px] text-gray-500">mg/dL</p>
                    </div>
                    <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">Heart Rate</p>
                      <p className="text-lg font-semibold text-gray-900">72</p>
                      <p className="text-[11px] text-gray-500">bpm</p>
                    </div>
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">BMI</p>
                      <p className="text-lg font-semibold text-gray-900">24.5</p>
                      <p className="text-[11px] text-gray-500">kg/m²</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Medical History
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Sample conditions are shown for design. You can later
                    connect this to real medical history data.
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="border border-gray-100 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">Hypertension</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">Diagnosed: 06/15/2022</p>
                      <p className="text-xs text-gray-500">
                        Current medications: Amlodipine 5mg, Losartan 50mg
                      </p>
                    </div>
                    <div className="border border-gray-100 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">Vitamin D Deficiency</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-700 border border-gray-200">
                          Resolved
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">Diagnosed: 01/10/2023</p>
                      <p className="text-xs text-gray-500">
                        Previous medications: Vitamin D3 60K
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "allergies" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Allergies
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    List of known allergies and reactions. Replace sample
                    values with real data when available.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="border border-red-100 bg-red-50 rounded-lg px-4 py-3">
                      <p className="font-medium text-gray-900 mb-1">Penicillin</p>
                      <p className="text-xs text-gray-600">Reaction: Rash and itching</p>
                    </li>
                    <li className="border border-yellow-100 bg-yellow-50 rounded-lg px-4 py-3">
                      <p className="font-medium text-gray-900 mb-1">Peanuts</p>
                      <p className="text-xs text-gray-600">Reaction: Mild swelling</p>
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === "diet" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    AI-Generated Diet Plan
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Sample diet plan based on common health goals. You can
                    later generate this using real AI models.
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="border border-green-100 bg-green-50 rounded-lg px-4 py-3">
                      <p className="font-medium text-gray-900 mb-1">Breakfast</p>
                      <p className="text-xs text-gray-600">
                        Oats with nuts and berries, one cup of green tea.
                      </p>
                    </div>
                    <div className="border border-green-100 bg-green-50 rounded-lg px-4 py-3">
                      <p className="font-medium text-gray-900 mb-1">Lunch</p>
                      <p className="text-xs text-gray-600">
                        Grilled chicken with brown rice and mixed vegetables.
                      </p>
                    </div>
                    <div className="border border-green-100 bg-green-50 rounded-lg px-4 py-3">
                      <p className="font-medium text-gray-900 mb-1">Dinner</p>
                      <p className="text-xs text-gray-600">
                        Fish with salad and a small portion of quinoa.
                      </p>
                    </div>
                    <div className="border border-green-100 bg-green-50 rounded-lg px-4 py-3">
                      <p className="font-medium text-gray-900 mb-1">Snacks</p>
                      <p className="text-xs text-gray-600">
                        Greek yogurt with fruits or a handful of nuts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Profile Summary
              </h3>
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-semibold mr-3">
                  {currentUser?.displayName
                    ? currentUser.displayName.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser?.displayName || "User"}
                  </p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 space-y-1 mb-2">
                <p>
                  <span className="font-semibold">Age:</span>{" "}
                  {userDetails?.age || "Not set"}
                </p>
                <p>
                  <span className="font-semibold">Gender:</span>{" "}
                  {userDetails?.gender || "Not set"}
                </p>
                <p>
                  <span className="font-semibold">Health Score:</span>{" "}
                  {typeof userDetails?.healthScore === "number"
                    ? `${userDetails.healthScore} / 100`
                    : "Not calculated"}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                This panel can be extended with age, gender, health score, and more.
              </p>
            </div>

            {showEditPanel && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Edit Health Profile
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowEditPanel(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Update age, gender and health score for better AI
                  recommendations.
                </p>
                <form
                  className="space-y-3 text-xs"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!currentUser?.uid) return;
                    try {
                      setSavingProfile(true);
                      const userRef = doc(db, "users", currentUser.uid);
                      const payload = {};
                      if (editAge) payload.age = Number(editAge);
                      if (editGender) payload.gender = editGender;
                      if (editHealthScore) payload.healthScore = Number(editHealthScore);

                      await setDoc(userRef, payload, { merge: true });

                      setUserDetails((prev) => ({
                        ...(prev || {}),
                        ...payload,
                      }));
                      setShowEditPanel(false);
                    } catch (saveErr) {
                      console.error("Failed to save health profile:", saveErr);
                    } finally {
                      setSavingProfile(false);
                    }
                  }}
                >
                  <label className="block">
                    <span className="text-gray-700">Age</span>
                    <input
                      type="number"
                      min="0"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className="mt-1 block w-full border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700">Gender</span>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="mt-1 block w-full border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-gray-700">Health Score (0 - 100)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editHealthScore}
                      onChange={(e) => setEditHealthScore(e.target.value)}
                      className="mt-1 block w-full border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className={`mt-1 w-full px-3 py-2 rounded-md text-white text-xs font-medium bg-blue-600 hover:bg-blue-700 ${
                      savingProfile ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowSchedulePanel(true);
                    setShowDietPanel(false);
                  }}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-left"
                >
                  Schedule Checkup
                </button>
                <Link
                  to="/medicines"
                  className="block w-full px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-left"
                >
                  Refill Medicines
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setShowDietPanel(true);
                    setShowSchedulePanel(false);
                  }}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-left"
                >
                  Update Diet Goals
                </button>
              </div>
            </div>

            {showSchedulePanel && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Schedule Health Checkup
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSchedulePanel(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  This is a sample panel. You can later connect it to a real
                  appointment booking system.
                </p>
                <div className="space-y-2 text-xs">
                  <label className="block">
                    <span className="text-gray-700">Preferred Date</span>
                    <input
                      type="date"
                      className="mt-1 block w-full border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700">Checkup Type</span>
                    <select className="mt-1 block w-full border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option>General Health Checkup</option>
                      <option>Diabetes Review</option>
                      <option>Heart Health Screening</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className="mt-2 w-full px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                  >
                    Save Checkup Reminder
                  </button>
                </div>
              </div>
            )}

            {showDietPanel && (
              <div className="bg-white rounded-xl shadow-sm border border-green-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Update Diet Goals
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowDietPanel(false)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Define your target calories and focus areas. These settings
                  can be used later to personalise AI diet plans.
                </p>
                <div className="space-y-2 text-xs">
                  <label className="block">
                    <span className="text-gray-700">Daily Calorie Target</span>
                    <input
                      type="number"
                      placeholder="e.g. 1800"
                      className="mt-1 block w-full border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700">Primary Goal</span>
                    <select className="mt-1 block w-full border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500">
                      <option>Weight Loss</option>
                      <option>Maintain Weight</option>
                      <option>Muscle Gain</option>
                      <option>Diabetes Management</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    className="mt-2 w-full px-3 py-2 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700"
                  >
                    Save Diet Goals
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthProfile;
