import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getProductById, 
  addProduct, 
  updateProduct, 
  getProductCategories 
} from "../firebase";

function ProductForm() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!productId;
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stockQuantity: "",
    imageUrl: "",
    manufacturer: "",
    dosage: "",
    sideEffects: "",
    requiresPrescription: false
  });
  
  // UI state
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResult = await getProductCategories();
        if (categoriesResult.success) {
          setCategories(categoriesResult.categories);
        }
        
        // If editing, fetch product data
        if (isEditMode) {
          const result = await getProductById(productId);
          if (result.success) {
            const product = result.product;
            setFormData({
              name: product.name || "",
              description: product.description || "",
              price: product.price?.toString() || "",
              category: product.category || "",
              stockQuantity: product.stockQuantity?.toString() || "",
              imageUrl: product.imageUrl || "",
              manufacturer: product.manufacturer || "",
              dosage: product.dosage || "",
              sideEffects: product.sideEffects || "",
              requiresPrescription: product.requiresPrescription || false
            });
          } else {
            setError(result.error || "Failed to load product");
          }
        }
      } catch (err) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setShowNewCategoryInput(true);
      setFormData({
        ...formData,
        category: ""
      });
    } else {
      setFormData({
        ...formData,
        category: value
      });
    }
  };

  const handleNewCategoryChange = (e) => {
    setNewCategory(e.target.value);
    setFormData({
      ...formData,
      category: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name) return "Product name is required";
    if (!formData.price) return "Price is required";
    if (isNaN(parseFloat(formData.price))) return "Price must be a number";
    if (!formData.category) return "Category is required";
    if (formData.stockQuantity && isNaN(parseInt(formData.stockQuantity))) return "Stock quantity must be a number";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    try {
      setSubmitting(true);
      setError("");
      
      // Prepare data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0
      };
      
      let result;
      if (isEditMode) {
        // Update existing product
        result = await updateProduct(productId, productData);
      } else {
        // Add new product
        result = await addProduct(productData);
      }
      
      if (result.success) {
        // Redirect to product management page
        navigate("/admin/products");
      } else {
        setError(result.error || "Failed to save product");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 pb-5">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              {isEditMode ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="mt-2 max-w-4xl text-sm text-gray-500">
              {isEditMode 
                ? "Update product information and inventory" 
                : "Add a new product to your store"}
            </p>
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

          {/* Product form */}
          <form className="mt-6 space-y-8 divide-y divide-gray-200" onSubmit={handleSubmit}>
            <div className="space-y-8 divide-y divide-gray-200">
              {/* Basic Information */}
              <div className="pt-8">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Basic Information</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Product details and general information.
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Product Name */}
                  <div className="sm:col-span-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Product Name *
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="sm:col-span-2">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Price (₹) *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="text"
                        name="price"
                        id="price"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="sm:col-span-3">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    {!showNewCategoryInput ? (
                      <div className="mt-1">
                        <select
                          id="category"
                          name="category"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={formData.category}
                          onChange={handleCategoryChange}
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                          <option value="new">+ Add New Category</option>
                        </select>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <input
                          type="text"
                          id="newCategory"
                          name="newCategory"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newCategory}
                          onChange={handleNewCategoryChange}
                          placeholder="Enter new category name"
                          required
                        />
                        <button
                          type="button"
                          className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                          onClick={() => setShowNewCategoryInput(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stock Quantity */}
                  <div className="sm:col-span-3">
                    <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">
                      Stock Quantity
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        name="stockQuantity"
                        id="stockQuantity"
                        min="0"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={formData.stockQuantity}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Write a detailed description of the product.
                    </p>
                  </div>

                  {/* Image URL */}
                  <div className="sm:col-span-6">
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                      Image URL
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="imageUrl"
                        id="imageUrl"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Enter a URL for the product image.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="pt-8">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Additional Information</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Detailed product specifications and medical information.
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Manufacturer */}
                  <div className="sm:col-span-3">
                    <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">
                      Manufacturer
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="manufacturer"
                        id="manufacturer"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={formData.manufacturer}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Dosage */}
                  <div className="sm:col-span-3">
                    <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">
                      Dosage
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="dosage"
                        id="dosage"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={formData.dosage}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Side Effects */}
                  <div className="sm:col-span-6">
                    <label htmlFor="sideEffects" className="block text-sm font-medium text-gray-700">
                      Side Effects
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="sideEffects"
                        name="sideEffects"
                        rows={3}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={formData.sideEffects}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Requires Prescription */}
                  <div className="sm:col-span-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="requiresPrescription"
                          name="requiresPrescription"
                          type="checkbox"
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          checked={formData.requiresPrescription}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="requiresPrescription" className="font-medium text-gray-700">
                          Requires Prescription
                        </label>
                        <p className="text-gray-500">
                          Check this if a valid prescription is required to purchase this product.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => navigate("/admin/products")}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    submitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : isEditMode ? "Update Product" : "Create Product"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductForm;