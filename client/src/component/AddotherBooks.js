import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

const AddotherBooks = () => {
  const [title, setTitle] = useState("");
  const [available, setAvailable] = useState("");
  const [contact, setcontact] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUtrModal, setShowUtrModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem("user"));
  
  // Check if amount is added (payment required)
  const hasAmount = amount && parseFloat(amount) > 0 && parseFloat(amount) <= 200;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all mandatory fields
    if (!title || !title.trim()) {
      setMessage("Title is required");
      setMessageColor("red");
      return;
    }
    if (!available || !available.trim()) {
      setMessage("Availability is required");
      setMessageColor("red");
      return;
    }
    if (!contact || contact.length !== 10) {
      setMessage("Please enter a valid 10-digit contact number");
      setMessageColor("red");
      return;
    }
    
    // Validate amount (mandatory, can be 0)
    const amountValue = amount && amount.trim() !== "" ? parseFloat(amount) : 0;
    if (isNaN(amountValue) || amountValue < 0) {
      setMessage("Please enter a valid amount (0 or more)");
      setMessageColor("red");
      return;
    }
    if (amountValue > 200) {
      setMessage("Amount cannot exceed ₹200");
      setMessageColor("red");
      return;
    }
    
    // Submit book (with or without payment - seniors just submit, no UTR needed)
    await submitBook(amountValue > 0, amountValue);
  };
  
  const submitBook = async (requiresPayment, price) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/otherbooks`,
        {
          title,
          available,
          contact,
          price: price,
          requiresPayment: requiresPayment,
          userId: user?.userId || null,
        }
      );

      // Clear form after successful submission
      setMessage(response.data.message);
      setMessageColor("green");
      setTitle("");
      setAvailable("");
      setcontact("");
      setAmount("");
    } catch (error) {
      setMessage(
        "Error: " +
          (error.response ? error.response.data.message : error.message)
      );
      setMessageColor("red");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen" style={{ background: '#f0d4ce' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 shadow-sm border-b gap-3 sm:gap-0" style={{ background: '#f0d4ce', borderColor: '#c9a8a8' }}>
          {/* Left side: User info */}
          <div className="flex flex-col items-center sm:items-start w-full sm:w-auto" style={{ color: '#5a4a4a' }}>
            {user ? (
              <div className="flex flex-col items-center sm:items-start">
                <h1 className="text-base sm:text-lg md:text-xl font-semibold" style={{ fontFamily: 'sans-serif' }}>
                  Welcome, {user.name || user.mailId}
                </h1>
                <p className="text-xs sm:text-sm opacity-80 break-all text-center sm:text-left">{user.mailId}</p>
              </div>
            ) : (
              <p className="text-xs sm:text-sm">Loading...</p>
            )}
          </div>

          <div className="flex items-center justify-center p-1 sm:p-2 md:p-4 order-first sm:order-none">
            <img
              src="/muthura-logo.png"
              alt="MUTHURA.IN Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 mr-1 sm:mr-2 md:mr-4 rounded-full shadow-md"
            />
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-center font-bold tracking-tight" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
              BookNest
            </h1>
          </div>
          
          {/* Right side: Button */}
          <div className="flex items-center justify-center w-full sm:w-auto">
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate("/listavailablebooks");
              }}
              className="py-2 px-3 sm:py-2 sm:px-4 md:py-3 md:px-6 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 hover:scale-105 shadow-sm w-full sm:w-auto"
              style={{ 
                background: '#c9a8a8',
                color: '#fff',
                border: '1px solid #b89595'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d4a5a5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#c9a8a8';
              }}
            >
              Back
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center p-3 sm:p-4 py-8 sm:py-12">
          <div className="w-full max-w-md rounded-lg shadow-sm border px-4 sm:px-6 md:px-8 py-6 sm:py-8" style={{ 
            background: '#fef9f6',
            borderColor: '#e8e0d8',
            borderWidth: '1px'
          }}>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
              Add Available Books
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3 sm:mb-4">
                <label
                  className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2"
                  htmlFor="title"
                  style={{ color: '#3d2f2f', fontFamily: 'sans-serif' }}
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:ring-2 shadow-sm text-sm sm:text-base"
                  style={{ 
                    borderColor: '#e8e0d8', 
                    backgroundColor: '#fff',
                    color: '#3d2f2f'
                  }}
                  required
                />
              </div>

              <div className="mb-3 sm:mb-4">
                <label
                  className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2"
                  htmlFor="available"
                  style={{ color: '#3d2f2f', fontFamily: 'sans-serif' }}
                >
                  Availability
                </label>
                <input
                  type="text"
                  id="available"
                  value={available}
                  onChange={(e) => setAvailable(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:ring-2 shadow-sm text-sm sm:text-base"
                  style={{ 
                    borderColor: '#e8e0d8', 
                    backgroundColor: '#fff',
                    color: '#3d2f2f'
                  }}
                  required
                />
              </div>

              <div className="mb-3 sm:mb-4">
                <label
                  className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2"
                  htmlFor="amount"
                  style={{ color: '#3d2f2f', fontFamily: 'sans-serif' }}
                >
                  Amount (Enter 0 if free - Max ₹200)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 200)) {
                      setAmount(value);
                    }
                  }}
                  min="0"
                  max="200"
                  step="0.01"
                  placeholder="Enter amount (0-200)"
                  className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:ring-2 shadow-sm text-sm sm:text-base"
                  style={{ 
                    borderColor: '#e8e0d8', 
                    backgroundColor: '#fff',
                    color: '#3d2f2f'
                  }}
                  required
                />
                {amount && parseFloat(amount) > 200 && (
                  <p className="text-red-500 text-xs mt-1">Amount cannot exceed ₹200</p>
                )}
              </div>

              <div className="mb-4 sm:mb-6">
                <label
                  className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2"
                  htmlFor="contact"
                  style={{ color: '#3d2f2f', fontFamily: 'sans-serif' }}
                >
                  Contact
                </label>
                <input
                  type="text"
                  id="contact"
                  value={contact}
                  onChange={(e) => setcontact(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:ring-2 shadow-sm text-sm sm:text-base"
                  style={{ 
                    borderColor: '#e8e0d8', 
                    backgroundColor: '#fff',
                    color: '#3d2f2f'
                  }}
                  required
                  maxLength="10"
                  placeholder="10-digit contact number"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-bold transition-all duration-300 hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: '#c9a8a8',
                    color: '#fff',
                    border: '1px solid #b89595'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) e.currentTarget.style.background = '#d4a5a5';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) e.currentTarget.style.background = '#c9a8a8';
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Add Book"}
                </button>
              </div>

              {message && (
                <h1 style={{ color: messageColor }} className="mt-4 text-center font-semibold">
                  {message}
                </h1>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 py-6 text-center" style={{ color: '#5a4a4a' }}>
          <p className="text-sm md:text-base font-semibold" style={{ fontFamily: 'sans-serif' }}>
            © 2024 BookNest - Connecting students across all colleges
          </p>
        </div>
      </div>

    </>
  );
};

export default AddotherBooks;
