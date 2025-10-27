import React from "react";

function About() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">About MediHaven</h1>
              <p className="mt-4 text-lg text-gray-600">
                Your trusted online medical store for authentic medicines, wellness products, and
                healthcare essentials delivered fast and safely.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-blue-200 text-blue-700">Licensed Pharmacy</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-blue-200 text-blue-700">Secure Payments</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-blue-200 text-blue-700">Verified Suppliers</span>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-xl bg-white shadow-sm p-6">
                <dl className="grid grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm text-gray-500">Medicines & Products</dt>
                    <dd className="text-3xl font-semibold text-gray-900">5,000+</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Happy Customers</dt>
                    <dd className="text-3xl font-semibold text-gray-900">50k+</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Across Cities</dt>
                    <dd className="text-3xl font-semibold text-gray-900">120+</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Average Delivery</dt>
                    <dd className="text-3xl font-semibold text-gray-900">24–48h</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              <p className="mt-4 text-gray-600">
                We are on a mission to make quality healthcare accessible and affordable. From
                genuine prescription medicines to OTC wellness products, we ensure authenticity,
                transparency, and speed at every step of your journey.
              </p>
            </div>
            <div className="bg-gray-50 border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900">What we ensure</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5">
                <li>100% genuine, batch-traceable products</li>
                <li>Cold chain compliance for temperature‑sensitive items</li>
                <li>Pharmacist guidance for prescription medicines</li>
                <li>Transparent pricing and clear return policy</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900">Our Values</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900">Trust</h3>
              <p className="mt-2 text-sm text-gray-600">We partner only with verified manufacturers and distributors.</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900">Care</h3>
              <p className="mt-2 text-sm text-gray-600">Customer well‑being guides our product selection and service.</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900">Speed</h3>
              <p className="mt-2 text-sm text-gray-600">Smart logistics ensure fast and safe deliveries to your doorstep.</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <h3 className="font-semibold text-gray-900">Security</h3>
              <p className="mt-2 text-sm text-gray-600">Secure checkout and privacy‑first data practices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team (placeholder avatars) */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Leadership Team</h2>
            <p className="text-sm text-gray-500">Experienced pharmacists, clinicians, and technologists.</p>
          </div>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {["A","B","C","D","E"].map((l, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                  {l}
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">Team Member</p>
                <p className="text-xs text-gray-500">Pharmacist</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm font-medium text-gray-900">Licensed & Regulated</p>
              <p className="mt-1 text-sm text-gray-600">Operates under applicable pharmacy regulations.</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm font-medium text-gray-900">Quality Assurance</p>
              <p className="mt-1 text-sm text-gray-600">Multi‑step QA checks before dispatch.</p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <p className="text-sm font-medium text-gray-900">Data Security</p>
              <p className="mt-1 text-sm text-gray-600">Industry‑standard encryption and secure payments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <dl className="mt-6 space-y-6">
            <div className="bg-gray-50 border rounded-lg p-5">
              <dt className="font-medium text-gray-900">Do you require prescriptions?</dt>
              <dd className="mt-2 text-sm text-gray-700">Only for medicines flagged as prescription‑only at checkout. Non‑prescription items can be ordered directly.</dd>
            </div>
            <div className="bg-gray-50 border rounded-lg p-5">
              <dt className="font-medium text-gray-900">How fast is delivery?</dt>
              <dd className="mt-2 text-sm text-gray-700">Most orders are delivered within 24–48 hours depending on your location and product availability.</dd>
            </div>
            <div className="bg-gray-50 border rounded-lg p-5">
              <dt className="font-medium text-gray-900">Are products genuine?</dt>
              <dd className="mt-2 text-sm text-gray-700">Yes. We source only from authorized suppliers and maintain batch traceability.</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-white">Everything you need for everyday care</h2>
          <p className="mt-3 text-gray-300">Browse our catalogue and get essentials delivered fast.</p>
          <a href="/products" className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium">Shop Now</a>
        </div>
      </section>
    </div>
  );
}

export default About;
