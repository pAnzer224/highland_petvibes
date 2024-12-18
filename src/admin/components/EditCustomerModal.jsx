import React, { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
import { toast } from "react-toastify";

function EditCustomerModal({ isOpen, onClose, customer, onUpdateCustomer }) {
  const [customerData, setCustomerData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    status: "Active",
  });

  useEffect(() => {
    if (customer) {
      setCustomerData({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        status: customer.status,
      });
    }
  }, [customer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!customerData.name || !customerData.email) {
      toast.error("Name and email are required");
      return;
    }

    onUpdateCustomer(customerData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
      <div className="bg-background w-full max-w-md mx-4 rounded-xl shadow-xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text/60 hover:text-text transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-0">
          <h2 className="text-xl font-nunito-bold text-green2 flex items-center">
            <UserPlus className="mr-2 text-primary size-6" />
            Edit Customer
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-nunito-bold text-text/80 mb-2"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={customerData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border-2 border-green3 rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter customer's full name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-nunito-bold text-text/80 mb-2"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={customerData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border-2 border-green3 rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter customer's email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-nunito-bold text-text/80 mb-2"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={customerData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border-2 border-green3 rounded-lg focus:outline-none focus:border-primary transition-colors"
              placeholder="Enter customer's phone number"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-nunito-bold text-text/80 mb-2"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={customerData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border-2 border-green3 rounded-lg focus:outline-none focus:border-primary transition-colors"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 bg-background border-2 border-green3 text-text rounded-full hover:bg-green3/20 transition-colors font-nunito"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/80 transition-colors font-nunito"
            >
              Update Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCustomerModal;