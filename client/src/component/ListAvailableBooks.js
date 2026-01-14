import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ListAvailableBooks() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [contactDetails, setContactDetails] = useState({});

  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [bookname, setbookname] = useState("");

  const [error, setError] = useState("");
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedBookIndex, setSelectedBookIndex] = useState(null);
  const [price, setPrice] = useState("");
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch books from the backend
  useEffect(() => {
    axios
      .get("http://localhost:8000/getbooks")
      .then((response) => {
        setBooks(response.data);
      })
      .catch((err) => console.log(err));
  }, []);

  // Filter books based on year, department, regulation, semester
  useEffect(() => {
    const filtered = books.filter((book) => {
      return (
        (selectedYear === "" || selectedYear === book.Year) &&
        (selectedRegulation === "" || selectedRegulation === book.Regulation) &&
        (selectedSemester === "" || selectedSemester === book.semester) &&
        (selectedDepartment === "" || selectedDepartment === book.department) &&
        (bookname === "" ||
          (book.bookTitle &&
            book.bookTitle.toLowerCase().includes(bookname.toLowerCase())))
      );
    });
    setFilteredBooks(filtered);
  }, [
    books,
    selectedYear,
    selectedRegulation,
    selectedSemester,
    selectedDepartment,
    bookname,
  ]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("token"); // Retrieve token from localStorage

        const response = await axios.get(
          "http://localhost:8000/user-details",
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include token in the request
            },
          }
        );

        setUser(response.data.user); // Save user details
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch user details");
      }
    };

    fetchUserDetails();
  }, []);

  // Handle contact input for each book separately
  const handleContactChange = (event, index) => {
    const value = event.target.value;
    if (/^\d{0,10}$/.test(value)) {
      // Validate 10 digits
      setContactDetails((prev) => ({
        ...prev,
        [index]: value,
      }));
    }
  };

  // Handle book availability activation
  const handleActivate = async (book, index) => {
    const contact = contactDetails[index] || "";

    if (contact.length !== 10) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    // Ask if they want to add a price
    const wantsPayment = window.confirm(
      "Do you want to add a price to this book? (Maximum ₹200)\n\nClick OK to add price, Cancel for free book."
    );

    if (wantsPayment) {
      // Show price input modal
      setSelectedBookIndex(index);
      setShowPriceModal(true);
      setRequiresPayment(true);
    } else {
      // Add as free book
      await submitBook(book, index, contact, false, 0);
    }
  };

  // Submit book with or without price
  const submitBook = async (book, index, contact, requiresPayment, price) => {
    // Check if user is available
    if (!user || !user.userId) {
      alert("User not found. Please login again.");
      return;
    }
    
    // Parse price - if requiresPayment is true, use the price, otherwise 0
    let priceValue = 0;
    
    // Handle price: can be number, string, or undefined
    if (requiresPayment === true) {
      if (price !== undefined && price !== null && price !== "") {
        // Price is provided - parse it
        priceValue = typeof price === 'number' ? price : parseFloat(price);
        if (isNaN(priceValue) || priceValue <= 0) {
          alert("Invalid price. Please enter a valid amount.");
          return;
        }
        if (priceValue > 200) {
          alert("Price cannot exceed ₹200.");
          return;
        }
      } else {
        // requiresPayment is true but no price provided
        alert("Please enter a valid price for this book.");
        return;
      }
    } else {
      // Free book - price is 0
      priceValue = 0;
    }
    
    const bookDetails = {
      bookTitle: book.bookTitle,
      Year: book.Year,
      Regulation: book.Regulation,
      department: book.department,
      semester: book.semester,
      contact,
      isAvailable: true,
      userId: user.userId,
      requiresPayment: requiresPayment === true,
      price: priceValue,
    };

    console.log("🚀 ===== FRONTEND: SUBMITTING BOOK =====");
    console.log("Full bookDetails object:", JSON.stringify(bookDetails, null, 2));
    console.log("Key values:", {
      price: bookDetails.price,
      requiresPayment: bookDetails.requiresPayment,
      priceType: typeof bookDetails.price,
      requiresPaymentType: typeof bookDetails.requiresPayment,
      priceValue: bookDetails.price,
      requiresPaymentValue: bookDetails.requiresPayment
    });
    console.log("========================================");

    try {
      const response = await axios.post(
        "http://localhost:8000/availableBooks",
        bookDetails
      );

      const message = response.data.message || "Book added successfully!";
      if (response.data.book) {
        console.log("✅ Book saved successfully with details:", response.data.book);
        alert(`${message}\n\nPrice: ₹${response.data.book.price || 0}\nRequires Payment: ${response.data.book.requiresPayment ? 'Yes' : 'No'}`);
      } else {
        alert(message);
      }

      // Clear the contact detail after successful submission
      setContactDetails((prev) => ({
        ...prev,
        [index]: "",
      }));

      // Reset modal state
      setShowPriceModal(false);
      setSelectedBookIndex(null);
      setPrice("");
      setRequiresPayment(false);
      setIsSubmitting(false);
    } catch (err) {
      console.error("❌ ===== ERROR SUBMITTING BOOK =====");
      console.error("Error object:", err);
      console.error("Error response:", err.response);
      console.error("Error message:", err.message);
      console.error("====================================");
      
      // Reset submitting state on error
      setIsSubmitting(false);
      
      // Don't close modal on error - let user try again
      if (err.response && err.response.status === 409) {
        alert("You have already added the book details.");
        // Close modal even for duplicate error
        setShowPriceModal(false);
        setSelectedBookIndex(null);
        setPrice("");
        setRequiresPayment(false);
      } else if (err.response && err.response.data && err.response.data.message) {
        alert(`Error: ${err.response.data.message}\n\nPlease check the price and try again.`);
        // Keep modal open so user can fix and retry
      } else {
        console.error("Error:", err);
        alert(`Error adding book: ${err.message || "Unknown error"}\n\nPlease try again.`);
        // Keep modal open so user can retry
      }
    }
  };

  // Handle price submission
  const handlePriceSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate call");
      return;
    }
    
    console.log("💰 ===== HANDLE PRICE SUBMIT CALLED =====");
    console.log("Price state:", price);
    console.log("Selected book index:", selectedBookIndex);
    console.log("Filtered books length:", filteredBooks.length);
    
    if (!price || price.trim() === "") {
      alert("Please enter a price");
      return;
    }

    const priceValue = parseFloat(price);
    console.log("Parsed price value:", priceValue);
    
    if (isNaN(priceValue) || priceValue <= 0 || priceValue > 200) {
      alert("Price must be between ₹1 and ₹200");
      return;
    }

    if (selectedBookIndex === null || selectedBookIndex === undefined) {
      alert("Book selection error. Please try again.");
      setShowPriceModal(false);
      return;
    }

    const book = filteredBooks[selectedBookIndex];
    const contact = contactDetails[selectedBookIndex] || "";
    
    console.log("Book from filteredBooks:", book);
    console.log("Contact from contactDetails:", contact);
    
    if (!book) {
      alert("Book not found. Please try again.");
      return;
    }
    
    if (!contact || contact.length !== 10) {
      alert("Please enter a valid 10-digit contact number");
      return;
    }
    
    console.log("💰 ===== SUBMITTING BOOK WITH PRICE =====");
    console.log("Price:", priceValue, "Type:", typeof priceValue);
    console.log("Book:", book.bookTitle);
    console.log("Contact:", contact);
    console.log("Requires Payment: true");
    console.log("Book index:", selectedBookIndex);
    console.log("========================================");
    
    setIsSubmitting(true);
    try {
      // Call submitBook and await it to ensure it completes
      await submitBook(book, selectedBookIndex, contact, true, priceValue);
    } catch (error) {
      console.error("Error in handlePriceSubmit:", error);
      alert("Failed to submit book. Please try again.");
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
                navigate("/seniorsite");
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
              Your site
            </button>
          </div>
        </div>

      <div className="container mx-auto px-2 sm:px-4 pt-4 sm:pt-6 pb-2">
        <div className="p-3 sm:p-4 rounded-lg shadow-sm border m-1 sm:m-2 mx-auto w-full" style={{ 
          background: '#fef9f6',
          borderColor: '#e8e0d8',
          borderWidth: '1px'
        }}>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full">
          {/* Book Name Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:flex-1 sm:min-w-[280px]">
            <label className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: '#3d2f2f', fontFamily: 'sans-serif', minWidth: '90px' }}>
              Book Name:
            </label>
            <input
              type="text"
              value={bookname}
              onChange={(e) => setbookname(e.target.value)}
              placeholder="Enter book name"
              className="w-full sm:flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-sm shadow-sm"
              style={{ borderColor: '#e8e0d8', backgroundColor: '#fff' }}
            />
          </div>
          
          {/* Regulation Dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:flex-1 sm:min-w-[220px]">
            <label className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: '#3d2f2f', fontFamily: 'sans-serif', minWidth: '90px' }}>
              Regulation:
            </label>
            <select
              value={selectedRegulation}
              onChange={(e) => setSelectedRegulation(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-1 text-sm"
              style={{ borderColor: '#e8e0d8', minWidth: '120px' }}
            >
              <option value="">All</option>
              <option value="2017">2017</option>
              <option value="2021">2021</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Department Dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:flex-1 sm:min-w-[200px]">
            <label className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: '#3d2f2f', fontFamily: 'sans-serif', minWidth: '90px' }}>
              Department:
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-1 text-sm"
              style={{ borderColor: '#e8e0d8', minWidth: '120px' }}
            >
              <option value="">All</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="Mechanical">Mechanical</option>
              <option value="CIVIL">CIVIL</option>
              <option value="AI & DS">AI & DS</option>
            </select>
          </div>

          {/* Semester Dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:flex-1 sm:min-w-[180px]">
            <label className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: '#3d2f2f', fontFamily: 'sans-serif', minWidth: '80px' }}>
              Semester:
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-1 text-sm"
              style={{ borderColor: '#e8e0d8', minWidth: '110px' }}
            >
              <option value="">All</option>
              <option value="I sem">I sem</option>
              <option value="II sem">II sem</option>
              <option value="III sem">III sem</option>
              <option value="IV sem">IV sem</option>
              <option value="V sem">V sem</option>
              <option value="VI sem">VI sem</option>
              <option value="VII sem">VII sem</option>
              <option value="VIII sem">VIII sem</option>
            </select>
          </div>

          {/* Year Dropdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:flex-1 sm:min-w-[150px]">
            <label className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: '#3d2f2f', fontFamily: 'sans-serif', minWidth: '50px' }}>Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-1 text-sm"
              style={{ borderColor: '#e8e0d8', minWidth: '100px' }}
            >
              <option value="">All</option>
              <option value="I Year">I Year</option>
              <option value="II Year">II Year</option>
              <option value="III Year">III Year</option>
              <option value="IV Year">IV Year</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center items-center py-3 sm:py-4 px-2">
        <button
          onClick={() => navigate("/addotherbooks")}
          className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-sm text-sm sm:text-base font-semibold transition-all duration-300 hover:scale-105"
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
          Other books? Add here
        </button>
      </div>

      <div className="w-full pt-2 pb-6 px-2 sm:px-4">
        <div className="overflow-x-auto rounded-lg shadow-sm border" style={{ borderColor: '#e8e0d8', backgroundColor: '#fff', borderWidth: '1px' }}>
          <table className="bg-white rounded-lg w-full min-w-[800px] sm:min-w-0" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr style={{ background: '#f5f1eb' }}>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '30%' }}>
                  Book Title
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '10%' }}>
                  Regulation
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: '#3d2f2f', width: '10%' }}>
                  Semester
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: '#3d2f2f', width: '8%' }}>
                  Year
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider hidden lg:table-cell" style={{ color: '#3d2f2f', width: '12%' }}>
                  Department
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '15%' }}>
                  Contact
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '15%' }}>
                  Availability
                </th>
              </tr>
            </thead>
          <tbody className="bg-white divide-y" style={{ borderColor: '#e8e0d8' }}>
            {filteredBooks.map((book, index) => (
              <tr key={index} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#faf8f5' }}>
                <td className="px-2 sm:px-4 py-2 text-sm sm:text-base">
                  {book.bookTitle}
                </td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap font-semibold text-sm sm:text-base">
                  {book.Regulation}
                </td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base hidden sm:table-cell">{book.semester}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base hidden md:table-cell">{book.Year}</td>
                <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base hidden lg:table-cell">
                  {book.department}
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <input
                    type="text"
                    value={contactDetails[index] || ""}
                    onChange={(e) => handleContactChange(e, index)}
                    placeholder="10 digits"
                    className="px-2 sm:px-3 py-1.5 sm:py-2 border-2 rounded-lg focus:outline-none focus:ring-2 block w-full text-xs sm:text-sm shadow-sm"
                    style={{ borderColor: '#cc9b89', backgroundColor: '#fff' }}
                  />
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <button
                    onClick={() => handleActivate(book, index)}
                    disabled={
                      !contactDetails[index] ||
                      contactDetails[index].length !== 10
                    }
                    className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap w-full sm:w-auto"
                    style={{ 
                      background: '#c9a8a8',
                      color: '#fff',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = '#d4a5a5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = '#c9a8a8';
                      }
                    }}
                  >
                    Activate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Price Input Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 max-w-md w-full border" style={{ borderColor: '#e8e0d8', backgroundColor: '#fef9f6' }}>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
              Add Price for Book
            </h2>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: '#5a4a4a', fontFamily: 'sans-serif' }}>
              Enter the price for this book (Maximum ₹200)
            </p>
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm sm:text-base font-semibold mb-2" style={{ color: '#3d2f2f', fontFamily: 'sans-serif' }}>
                Price (₹)
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={price}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (parseFloat(val) >= 1 && parseFloat(val) <= 200)) {
                    setPrice(val);
                  }
                }}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none shadow-sm text-sm sm:text-base"
                style={{ borderColor: '#e8e0d8' }}
                placeholder="Enter price (1-200)"
                autoFocus
              />
              <p className="text-xs sm:text-sm mt-1" style={{ color: '#8a7a7a' }}>
                Maximum price: ₹200
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                onClick={handlePriceSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: isSubmitting ? '#d0d0d0' : '#c9a8a8',
                  color: '#fff',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#d4a5a5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#c9a8a8';
                  }
                }}
              >
                {isSubmitting ? "Adding..." : "Add Book"}
              </button>
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setPrice("");
                  setRequiresPayment(false);
                  setSelectedBookIndex(null);
                }}
                className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-bold transition-all duration-300 border"
                style={{ borderColor: '#e8e0d8', color: '#5a4a4a', backgroundColor: '#fff' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
  
        <div className="mt-8 py-6 text-center" style={{ color: '#5a4a4a' }}>
          <p className="text-sm md:text-base font-semibold" style={{ fontFamily: 'sans-serif' }}>
            © 2024 BookNest - Connecting students across all colleges
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

export default ListAvailableBooks;
