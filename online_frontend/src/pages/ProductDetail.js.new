import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../firebase";

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description"); // "description", "features", "reviews"

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const result = await getProductById(productId);
        
        if (result.success) {
          setProduct(result.product);
          setError("");
        } else {
          setError(result.error || "Failed to load product");
        }
      } catch (err) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (product?.stockQuantity || 1)) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    // This will be implemented when we build the cart functionality
    alert(`Added ${quantity} of ${product.name} to cart`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-center text-lg font-medium text-gray-900">Error Loading Product</h3>
          <p className="mt-1 text-center text-sm text-gray-500">{error || "Product not found"}</p>
          <div className="mt-6">
            <button
              type="button"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => navigate("/products")}
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <div className="flex items-center">
                <a href="/" className="text-gray-400 hover:text-gray-500">Home</a>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <a href="/products" className="ml-2 text-gray-400 hover:text-gray-500">Products</a>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <span className="ml-2 text-gray-500" aria-current="page">{product.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            <div className="mt-6 w-full aspect-w-1 aspect-h-1 rounded-lg overflow-hidden lg:mt-0 border border-gray-200 shadow-sm">
              <img
                src={product.imageUrl || "https://via.placeholder.com/600x600?text=No+Image"}
                alt={product.name}
                className="w-full h-full object-center object-cover"
              />
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
            
            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-2">
              {product.isNew && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  New
                </span>
              )}
              {product.isPopular && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Popular
                </span>
              )}
              {product.isBestSeller && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Best Seller
                </span>
              )}
            </div>
            
            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl text-gray-900">₹{product.price.toFixed(2)}</p>
            </div>

            {/* Stock status */}
            <div className="mt-3">
              {product.stockQuantity > 0 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  In Stock ({product.stockQuantity} available)
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Category */}
            <div className="mt-3">
              <span className="text-sm text-gray-600">Category: </span>
              <span className="text-sm font-medium text-gray-900">{product.category}</span>
            </div>

            {/* Short description */}
            <div className="mt-4">
              <p className="text-base text-gray-500">{product.shortDescription || product.description?.substring(0, 150)}</p>
            </div>

            {/* Add to cart */}
            {product.stockQuantity > 0 && (
              <div className="mt-8">
                <div className="flex items-center">
                  <label htmlFor="quantity" className="mr-3 text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="1"
                    max={product.stockQuantity}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md w-16"
                    value={quantity}
                    onChange={handleQuantityChange}
                  />
                </div>
                
                <div className="mt-4 flex">
                  <button
                    type="button"
                    className="w-full bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={handleAddToCart}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            )}

            {/* Delivery info */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-sm font-medium text-gray-900">Delivery Information</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-3 text-sm text-gray-600">Free delivery for orders above ₹500</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-3 text-sm text-gray-600">Delivery within 24-48 hours</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-3 text-sm text-gray-600">Easy returns within 7 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16 border-t border-gray-200 pt-10">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("description")}
                className={`${
                  activeTab === "description"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("features")}
                className={`${
                  activeTab === "features"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Features & Specifications
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`${
                  activeTab === "reviews"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Reviews
              </button>
            </nav>
          </div>

          {/* Tab content */}
          <div className="mt-6">
            {activeTab === "description" && (
              <div className="prose prose-sm max-w-none text-gray-500">
                <p>{product.description}</p>
                {product.longDescription && (
                  <div className="mt-4">
                    <p>{product.longDescription}</p>
                  </div>
                )}
                {product.usageInstructions && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900">Usage Instructions</h3>
                    <p className="mt-2">{product.usageInstructions}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "features" && (
              <div>
                <h3 className="text-sm font-medium text-gray-900">Product Features</h3>
                <div className="mt-4">
                  {product.features ? (
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-500">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No features specified for this product.</p>
                  )}
                </div>

                <h3 className="mt-8 text-sm font-medium text-gray-900">Specifications</h3>
                <div className="mt-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    {product.manufacturer && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                        <dd className="mt-1 text-sm text-gray-900">{product.manufacturer}</dd>
                      </div>
                    )}
                    {product.material && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Material</dt>
                        <dd className="mt-1 text-sm text-gray-900">{product.material}</dd>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                        <dd className="mt-1 text-sm text-gray-900">{product.dimensions}</dd>
                      </div>
                    )}
                    {product.weight && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Weight</dt>
                        <dd className="mt-1 text-sm text-gray-900">{product.weight}</dd>
                      </div>
                    )}
                    {product.warranty && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Warranty</dt>
                        <dd className="mt-1 text-sm text-gray-900">{product.warranty}</dd>
                      </div>
                    )}
                    {product.countryOfOrigin && (
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Country of Origin</dt>
                        <dd className="mt-1 text-sm text-gray-900">{product.countryOfOrigin}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
                <div className="mt-4">
                  {product.reviews && product.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {product.reviews.map((review, index) => (
                        <div key={index} className="border-b border-gray-200 pb-6">
                          <div className="flex items-center">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{review.name}</h4>
                              <div className="mt-1 flex items-center">
                                {/* Star rating */}
                                <div className="flex items-center">
                                  {[0, 1, 2, 3, 4].map((rating) => (
                                    <svg
                                      key={rating}
                                      className={`h-5 w-5 ${
                                        review.rating > rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="ml-2 text-sm text-gray-500">{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 space-y-6 text-sm text-gray-600">
                            <p>{review.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No reviews yet for this product.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-10">
            <h2 className="text-xl font-bold text-gray-900">Related Products</h2>
            <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {product.relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 overflow-hidden group-hover:opacity-75 lg:h-80 lg:aspect-none">
                    <img
                      src={relatedProduct.imageUrl || "https://via.placeholder.com/300x300?text=No+Image"}
                      alt={relatedProduct.name}
                      className="w-full h-full object-center object-cover lg:w-full lg:h-full"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          <a href={`/products/${relatedProduct.id}`}>
                            <span aria-hidden="true" className="absolute inset-0" />
                            {relatedProduct.name}
                          </a>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{relatedProduct.category}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">₹{relatedProduct.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;