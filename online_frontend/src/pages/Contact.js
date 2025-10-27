import React, { useState } from "react";

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return alert("Please fill name, email and message.");
    try {
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Contact Us</h1>
          <p className="mt-3 text-gray-600 max-w-2xl">
            We're here to help with orders, prescriptions, accounts, and product questions.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-5">
              <p className="text-sm text-gray-500">Customer Care</p>
              <p className="mt-1 font-semibold text-gray-900">+91 12345 67890</p>
            </div>
            <div className="bg-white border rounded-lg p-5">
              <p className="text-sm text-gray-500">Email</p>
              <a href="mailto:contact@medihaven.com" className="mt-1 font-semibold text-blue-700">contact@medihaven.com</a>
            </div>
            <div className="bg-white border rounded-lg p-5">
              <p className="text-sm text-gray-500">Hours</p>
              <p className="mt-1 font-semibold text-gray-900">Mon–Sat, 9am–7pm</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left - contact details */}
            <aside className="space-y-6">
              <div className="bg-gray-50 border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900">Head Office</h2>
                <p className="mt-2 text-sm text-gray-600">123 Medical Avenue, Healthcare District, City 400001</p>
                <p className="mt-2 text-sm text-gray-600">GST: 27ABCDE1234F1Z5</p>
                <p className="mt-1 text-sm text-gray-600">Drug License: 1234-ABCDE-2025</p>
              </div>
              <div className="bg-gray-50 border rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-900">Support</h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5">
                  <li>Order & delivery status</li>
                  <li>Prescription verification</li>
                  <li>Returns & refunds</li>
                  <li>Account & billing</li>
                </ul>
              </div>
              <div className="bg-gray-50 border rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-900">Follow</h3>
                <div className="mt-3 flex gap-3 text-sm">
                  <a className="text-blue-700" href="#">Facebook</a>
                  <a className="text-blue-700" href="#">Twitter</a>
                  <a className="text-blue-700" href="#">Instagram</a>
                </div>
              </div>
            </aside>

            {/* Right - form */}
            <div className="lg:col-span-2">
              <div className="bg-white border rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Send us a message</h2>
                <p className="mt-1 text-sm text-gray-600">We usually reply within one business day.</p>
                {sent && (
                  <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-3 text-sm text-green-800">
                    Thanks! Your message has been sent.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700">Name</label>
                      <input name="name" value={form.name} onChange={handleChange} type="text" className="mt-1 w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">Email</label>
                      <input name="email" value={form.email} onChange={handleChange} type="email" className="mt-1 w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700">Phone</label>
                      <input name="phone" value={form.phone} onChange={handleChange} type="tel" className="mt-1 w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">Subject</label>
                      <input name="subject" value={form.subject} onChange={handleChange} type="text" className="mt-1 w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Message</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={5} className="mt-1 w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <a href="mailto:contact@medihaven.com" className="text-sm text-blue-700">Prefer email? contact@medihaven.com</a>
                    <button disabled={submitting} type="submit" className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white px-5 py-2 rounded-md text-sm font-medium">
                      {submitting ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="mt-12 bg-gray-50 border rounded-lg h-64 flex items-center justify-center text-gray-500 text-sm">
            Map/locations coming soon
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
