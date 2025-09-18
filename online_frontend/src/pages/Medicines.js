import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllMedicines, getMedicineCategories } from "../firebase";

function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [prescriptionFilter, setPrescriptionFilter] = useState("all"); // "all", "required", "notRequired"
  const [nonExpiredOnly, setNonExpiredOnly] = useState(true);

  useEffect(() => {
    const fetchMedicinesAndCategories = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResult = await getMedicineCategories();
        if (categoriesResult.success) {
          setCategories(categoriesResult.categories);
        }
        
        // Fetch medicines with filters
        const filters = {
          category: selectedCategory === "all" ? null : selectedCategory,
          searchTerm: searchTerm,
          inStock: inStockOnly ? true : undefined,
          requiresPrescription: prescriptionFilter === "all" 
            ? undefined 
            : prescriptionFilter === "required",
          nonExpired: nonExpiredOnly
        };
        
        const result = await getAllMedicines(filters);
        if (result.success) {
          setMedicines(result.medicines);
          setError("");
        } else {
          setError(result.error || "Failed to load medicines");
        }
      } catch (err) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMedicinesAndCategories();
  }, [selectedCategory, searchTerm, inStockOnly, prescriptionFilter, nonExpiredOnly]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleInStockChange = (e) => {
    setInStockOnly(e.target.checked);
  };

  const handlePrescriptionFilterChange = (e) => {
    setPrescriptionFilter(e.target.value);
  };

  const handleNonExpiredChange = (e) => {
    setNonExpiredOnly(e.target.checked);
  };

  // Function to check if a medicine is expired
  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    return expiryDate < today;
  };

  // Function to check if a medicine is expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiryDate > today && expiryDate <= thirtyDaysFromNow;
  };

  // Function to format date as DD/MM/YYYY
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Medicines</h1>
        <p className="mt-4 max-w-xl text-sm text-gray-700">
          Browse our wide selection of medications and health products
        </p>

        {/* Filters */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Category filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Prescription filter */}
            <div>
              <label htmlFor="prescription" className="block text-sm font-medium text-gray-700">
                Prescription
              </label>
              <select
                id="prescription"
                name="prescription"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={prescriptionFilter}
                onChange={handlePrescriptionFilterChange}
              >
                <option value="all">All Medicines</option>
                <option value="required">Prescription Required</option>
                <option value="notRequired">No Prescription</option>
              </select>
            </div>

            {/* Checkbox filters */}
            <div className="sm:col-span-2 flex flex-col space-y-4">
              <div className="flex items-center">
                <input
                  id="inStock"
                  name="inStock"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={inStockOnly}
                  onChange={handleInStockChange}
                />
                <label htmlFor="inStock" className="ml-2 block text-sm text-gray-700">
                  In Stock Only
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="nonExpired"
                  name="nonExpired"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={nonExpiredOnly}
                  onChange={handleNonExpiredChange}
                />
                <label htmlFor="nonExpired" className="ml-2 block text-sm text-gray-700">
                  Hide Expired Medicines
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Medicine grid */}
            {medicines.length === 0 ? (
              <div className="mt-12 text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
              </div>
            ) : (
              <div className="mt-12 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                {medicines.map((medicine) => (
                  <div key={medicine.id} className="group relative">
                    <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                      <img
                        src={medicine.imageUrl || "https://via.placeholder.com/300x300?text=No+Image"}
                        alt={medicine.name}
                        className="w-full h-full object-center object-cover lg:w-full lg:h-full"
                      />
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div>
                        <h3 className="text-sm text-gray-700">
                          <Link to={`/medicines/${medicine.id}`}>
                            <span aria-hidden="true" className="absolute inset-0" />
                            {medicine.name}
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{medicine.category}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {medicine.requiresPrescription && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Prescription
                            </span>
                          )}
                          {isExpired(medicine.expiryDate) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Expired
                            </span>
                          )}
                          {isExpiringSoon(medicine.expiryDate) && !isExpired(medicine.expiryDate) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Expiring Soon
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">₹{medicine.price.toFixed(2)}</p>
                    </div>
                    <div className="mt-2">
                      {medicine.stockQuantity > 0 ? (
                        <span className="text-xs text-green-600">In Stock ({medicine.stockQuantity})</span>
                      ) : (
                        <span className="text-xs text-red-600">Out of Stock</span>
                      )}
                    </div>
                    {medicine.expiryDate && (
                      <div className="mt-1 text-xs text-gray-500">
                        Expires: {formatDate(medicine.expiryDate)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Medicines;