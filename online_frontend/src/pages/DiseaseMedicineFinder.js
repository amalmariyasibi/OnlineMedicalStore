import React, { useEffect, useState } from "react";

const DiseaseMedicineFinder = () => {
  const [diseases, setDiseases] = useState([]);
  const [loadingDiseases, setLoadingDiseases] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedDiseaseId, setSelectedDiseaseId] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDiseases = async () => {
      try {
        setLoadingDiseases(true);
        setError("");
        const res = await fetch("/api/ml/diseases");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load diseases");
        }
        setDiseases(data.diseases || []);
      } catch (e) {
        console.error("Failed to load diseases", e);
        setError(e.message || "Failed to load diseases");
      } finally {
        setLoadingDiseases(false);
      }
    };
    loadDiseases();
  }, []);

  const handleSearch = async (options = {}) => {
    try {
      setLoadingResult(true);
      setError("");
      setResult(null);

      const params = new URLSearchParams();
      const diseaseIdToUse = options.diseaseId ?? selectedDiseaseId;
      const queryToUse = options.query ?? query;

      if (diseaseIdToUse) params.append("diseaseId", diseaseIdToUse);
      if (queryToUse) params.append("q", queryToUse);

      if (!diseaseIdToUse && !queryToUse) {
        setError("Please select a disease or enter symptoms.");
        setLoadingResult(false);
        return;
      }

      const res = await fetch(`/api/ml/recommend-medicines?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "No recommendations found");
      }
      setResult(data);
    } catch (e) {
      console.error("Failed to get recommendations", e);
      setError(e.message || "Failed to get recommendations");
    } finally {
      setLoadingResult(false);
    }
  };

  const handleDiseaseClick = (disease) => {
    setSelectedDiseaseId(disease.id);
    setQuery(disease.name);
    handleSearch({ diseaseId: disease.id, query: disease.name });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-green-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mr-3 text-gray-600 hover:text-gray-900"
          >
            f
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Disease-Based Medicine Finder</h1>
            <p className="text-sm text-gray-500">AI-powered medicine recommendations by symptoms</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 mb-1">Search by Symptoms or Disease</h2>
              <p className="text-xs text-gray-500 mb-3">Enter symptoms or select a common disease</p>

              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <span className="text-gray-400">
                      
                    </span>
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., fever, headache, cold..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  disabled={loadingResult}
                >
                  {loadingResult ? "Finding medicines..." : "Find Medicines"}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 mb-1">Common Diseases</h2>
              <p className="text-xs text-gray-500 mb-3">Select to get AI recommendations</p>

              {loadingDiseases && (
                <p className="text-xs text-gray-500">Loading diseases...</p>
              )}

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {diseases.map((disease) => (
                  <button
                    key={disease.id}
                    type="button"
                    onClick={() => handleDiseaseClick(disease)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left text-sm ${
                      selectedDiseaseId === disease.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-400 hover:bg-green-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                          
                        </span>
                        <span className="font-medium text-gray-900">{disease.name}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500 truncate">
                        {disease.symptoms.join(", ")}
                      </p>
                    </div>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                      {disease.category}
                    </span>
                  </button>
                ))}

                {!loadingDiseases && diseases.length === 0 && (
                  <p className="text-xs text-gray-500">No disease metadata available.</p>
                )}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm h-full flex flex-col items-center justify-center p-8 text-center">
              {!result && !error && !loadingResult && (
                <div>
                  <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-gradient-to-tr from-green-500 to-blue-500 flex items-center justify-center text-white">
                    
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">AI-Powered Medicine Finder</h2>
                  <p className="text-sm text-gray-500 max-w-md">
                    Select a disease or search by symptoms to get personalized medicine recommendations using a simple machine learning algorithm.
                  </p>
                </div>
              )}

              {error && (
                <div className="w-full max-w-xl mb-4 text-left">
                  <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                </div>
              )}

              {loadingResult && (
                <div className="mt-4 text-sm text-gray-500">Analyzing symptoms and finding suitable medicines...</div>
              )}

              {result && !loadingResult && (
                <div className="w-full max-w-2xl text-left">
                  <h2 className="text-base font-semibold text-gray-900 mb-1">
                    Recommended Medicines for {result.disease?.name}
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">
                    Category: {result.disease?.category}  a0 a0 b7 a0 a0 Common symptoms: {(result.disease?.symptoms || []).join(", ")}
                  </p>

                  <div className="space-y-3">
                    {(result.medicines || []).map((med) => (
                      <div
                        key={med.id}
                        className="rounded-lg border border-gray-200 p-3 flex justify-between items-start"
                      >
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900">{med.name}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              med.otc
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {med.otc ? "OTC" : "Prescription"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">Dosage: {med.dosage}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.disclaimer && (
                    <p className="mt-4 text-[11px] text-gray-400 leading-snug">
                      {result.disclaimer}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseMedicineFinder;
