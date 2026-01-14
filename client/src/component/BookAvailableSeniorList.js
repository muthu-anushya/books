import { useEffect, useState } from "react";
import axios from "axios";
import { IoCall } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

function BookAvailableSeniorList() {
  const [availableBooks, setAvailableBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [otherAvailableBooks, setOtherAvailableBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOther, setLoadingOther] = useState(false); // New loading state for other books
  const [error, setError] = useState(null);

  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [bookname, setbookname] = useState("");
  const [user, setUser] = useState(null);
  const [paymentStatuses, setPaymentStatuses] = useState({});
  const [otherBookPaymentStatuses, setOtherBookPaymentStatuses] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUtrModal, setShowUtrModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedOtherBook, setSelectedOtherBook] = useState(null);
  const [utr, setUtr] = useState("");
  const [upiCopied, setUpiCopied] = useState(false);
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Get user from localStorage first
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }

    // Also fetch from backend to ensure we have latest data
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          `${API_BASE_URL}/junior-details`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.user) {
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        // Don't set error here, just use localStorage user
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/availableBooks`
        );
        setAvailableBooks(response.data);
        
        // Fetch payment status for each book that requires payment (check requiresPayment OR price > 0)
        const currentUser = user || JSON.parse(localStorage.getItem("user"));
        if (currentUser && currentUser.userId) {
          const statusPromises = response.data
            .filter(book => {
              // Check if book requires payment - handle undefined/null values
              const hasExplicitRequiresPayment = book.requiresPayment === true;
              const hasPrice = book.price !== undefined && book.price !== null && book.price > 0;
              return hasExplicitRequiresPayment || hasPrice;
            })
            .map(async (book) => {
              try {
                const statusRes = await axios.get(
                  `${API_BASE_URL}/payment-status/${book._id}/${currentUser.userId}`
                );
                return { bookId: book._id, status: statusRes.data };
              } catch (err) {
                console.error(`Error fetching payment status for book ${book._id}:`, err);
                return { bookId: book._id, status: null };
              }
            });
          
          const statuses = await Promise.all(statusPromises);
          const statusMap = {};
          statuses.forEach(({ bookId, status }) => {
            if (status) {
              statusMap[bookId] = status;
            }
          });
          setPaymentStatuses(statusMap);
        } else {
          console.warn("User not available for payment status check");
        }
      } catch (error) {
        console.error("Error fetching books:", error);
        setError(error.response ? error.response.data.message : error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [user]);

  // Refresh books when user changes
  useEffect(() => {
    if (user && user.userId) {
      // Re-fetch payment statuses when user is available
      const refreshPaymentStatuses = async () => {
        if (availableBooks.length > 0) {
          const statusPromises = availableBooks
            .filter(book => {
              // Check if book requires payment - handle undefined/null values
              const hasExplicitRequiresPayment = book.requiresPayment === true;
              const hasPrice = book.price !== undefined && book.price !== null && book.price > 0;
              return hasExplicitRequiresPayment || hasPrice;
            })
            .map(async (book) => {
              try {
                const statusRes = await axios.get(
                  `${API_BASE_URL}/payment-status/${book._id}/${user.userId}`
                );
                return { bookId: book._id, status: statusRes.data };
              } catch (err) {
                return { bookId: book._id, status: null };
              }
            });
          
          const statuses = await Promise.all(statusPromises);
          const statusMap = {};
          statuses.forEach(({ bookId, status }) => {
            if (status) {
              statusMap[bookId] = status;
            }
          });
          setPaymentStatuses(prev => ({ ...prev, ...statusMap }));
        }
      };
      refreshPaymentStatuses();
    }
  }, [user, availableBooks]);

  // Handle payment button click
  const handlePaymentClick = (book) => {
    setSelectedBook(book);
    setShowPaymentModal(true);
  };

  // Handle UTR submission
  const handleUtrSubmit = async () => {
    if (!utr || (!selectedBook && !selectedOtherBook)) {
      alert("Please enter UTR number");
      return;
    }

    if (isSubmittingUtr) {
      return; // Prevent double submission
    }

    setIsSubmittingUtr(true);

    let currentUser = user || JSON.parse(localStorage.getItem("user"));
    
    // If userId is missing, try to fetch user details from backend
    if (!currentUser || !currentUser.userId) {
      console.log("⚠️ User ID missing, fetching from backend...");
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get(
            `${API_BASE_URL}/junior-details`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.data.user && response.data.user.userId) {
            currentUser = response.data.user;
            setUser(currentUser);
            localStorage.setItem("user", JSON.stringify(currentUser));
            console.log("✅ User details fetched:", currentUser);
          }
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    }

    if (!currentUser || !currentUser.userId) {
      alert("User not found. Please login again.");
      setIsSubmittingUtr(false);
      return;
    }

    const bookToSubmit = selectedBook || selectedOtherBook;
    const isOtherBook = !!selectedOtherBook;
    const endpoint = isOtherBook ? "/submit-utr-otherbook" : "/submit-utr";
    const statusEndpoint = isOtherBook 
      ? `/payment-status-otherbook/${bookToSubmit._id}/${currentUser.userId}`
      : `/payment-status/${bookToSubmit._id}/${currentUser.userId}`;

    console.log("📝 Submitting UTR with:", {
      bookId: bookToSubmit._id,
      utr: utr,
      userId: currentUser.userId,
      isOtherBook
    });

    try {
      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        {
          bookId: bookToSubmit._id,
          utr: utr,
          [isOtherBook ? 'userId' : 'juniorId']: currentUser.userId,
        }
      );

      alert("UTR submitted successfully! Admin will verify and notify you via email.");
      setShowUtrModal(false);
      setUtr("");
      
      // Refresh payment status
      const statusRes = await axios.get(`${API_BASE_URL}${statusEndpoint}`);
      if (isOtherBook) {
        setOtherBookPaymentStatuses(prev => ({
          ...prev,
          [bookToSubmit._id]: statusRes.data
        }));
      } else {
        setPaymentStatuses(prev => ({
          ...prev,
          [bookToSubmit._id]: statusRes.data
        }));
      }
      
      setSelectedBook(null);
      setSelectedOtherBook(null);
    } catch (error) {
      alert(error.response?.data?.message || "Error submitting UTR. Please try again.");
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  // Get payment status for a book
  const getPaymentInfo = (book) => {
    // Check if book requires payment (either requiresPayment flag OR price > 0)
    // Handle both explicit requiresPayment flag and price-based detection
    const hasExplicitRequiresPayment = book.requiresPayment === true;
    const hasPrice = book.price !== undefined && book.price !== null && book.price > 0;
    const needsPayment = hasExplicitRequiresPayment || hasPrice;
    const bookPrice = book.price !== undefined && book.price !== null ? book.price : 0;
    
    // FREE BOOK - No payment needed (only if explicitly not requiring payment AND no price)
    if (!needsPayment) {
      return { canViewContact: true, contact: book.contact };
    }
    
    // PAID BOOK - Check payment status from backend
    const status = paymentStatuses[book._id];
    
    // If status not loaded yet, hide contact and show payment button
    if (!status) {
      return { canViewContact: false, needsPayment: true, price: bookPrice };
    }
    
    // Payment verified - Show contact
    if (status.canViewContact && status.contact) {
      return { canViewContact: true, contact: status.contact };
    }
    
    // Payment submitted but waiting verification
    if (status.paymentStatus === "paid" || status.paymentStatus === "pending") {
      return { canViewContact: false, needsUtr: true, price: status.price || bookPrice };
    }
    
    // Payment verified but contact not available (shouldn't happen, but safety check)
    if (status.paymentVerified && status.canViewContact) {
      return { canViewContact: true, contact: book.contact };
    }
    
    // Needs payment
    return { canViewContact: false, needsPayment: true, price: status.price || bookPrice };
  };

  const fetchOtherBooks = async () => {
    setLoadingOther(true); // Set loading state
    try {
      const loggedInUser = user || JSON.parse(localStorage.getItem("user"));
      const userId = loggedInUser?.userId ? `?userId=${loggedInUser.userId}` : '';
      const response = await axios.get(
        `${API_BASE_URL}/otherbooks${userId}`
      );
      setOtherAvailableBooks(response.data);
      
      // Fetch payment statuses for other books that require payment
      if (loggedInUser && loggedInUser.userId) {
        const statusPromises = response.data
          .filter(book => {
            const hasPrice = book.price !== undefined && book.price !== null && book.price > 0;
            return hasPrice;
          })
          .map(async (book) => {
            try {
              const statusRes = await axios.get(
                `${API_BASE_URL}/payment-status-otherbook/${book._id}/${loggedInUser.userId}`
              );
              return { bookId: book._id, status: statusRes.data };
            } catch (err) {
              console.error(`Error fetching payment status for other book ${book._id}:`, err);
              return { bookId: book._id, status: null };
            }
          });
        
        const statuses = await Promise.all(statusPromises);
        const statusMap = {};
        statuses.forEach(({ bookId, status }) => {
          if (status) {
            statusMap[bookId] = status;
          }
        });
        setOtherBookPaymentStatuses(statusMap);
      }
    } catch (error) {
      console.error("Error fetching other available books:", error);
      setError(error.response ? error.response.data.message : error.message);
    } finally {
      setLoadingOther(false); // Reset loading state
    }
  };
  
  // Get payment info for other books
  const getOtherBookPaymentInfo = (book) => {
    const hasPrice = book.price !== undefined && book.price !== null && book.price > 0;
    if (!hasPrice) {
      return { canViewContact: true, contact: book.contact, needsPayment: false };
    }
    
    const status = otherBookPaymentStatuses[book._id];
    
    // If no status exists, show Pay Now button
    if (!status) {
      return { canViewContact: false, needsPayment: true, price: book.price };
    }
    
    // If payment is verified, show contact
    if (status.paymentVerified && status.canViewContact) {
      return { canViewContact: true, contact: status.contact || book.contact, needsPayment: false };
    }
    
    // If payment status is "not_initiated", show Pay Now button
    if (status.paymentStatus === "not_initiated") {
      return { canViewContact: false, needsPayment: true, price: status.price || book.price };
    }
    
    // If UTR has been submitted (paymentStatus is "paid" or "pending"), show pending message
    if (status.paymentStatus === "paid" || status.paymentStatus === "pending") {
      return { canViewContact: false, needsUtr: true, price: status.price || book.price };
    }
    
    // Default: show Pay Now button
    return { canViewContact: false, needsPayment: true, price: status.price || book.price };
  };
  
  // Handle payment click for other books
  const handleOtherBookPaymentClick = (book) => {
    setSelectedOtherBook(book);
    setShowPaymentModal(true);
  };

  useEffect(() => {
    const filtered = availableBooks.filter((book) => {
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
    availableBooks,
    selectedYear,
    selectedRegulation,
    selectedSemester,
    selectedDepartment,
    bookname,
  ]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

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
                  Welcome, {user.name || user.mailId || "User"}
                </h1>
                <p className="text-xs sm:text-sm opacity-80 break-all text-center sm:text-left">{user.mailId || ""}</p>
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
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("userType");
                navigate("/dashboard");
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
              Log Out
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
      
      <div className="w-full pt-2 pb-6 px-2 sm:px-4">
        <div className="overflow-x-auto rounded-lg shadow-sm border" style={{ borderColor: '#e8e0d8', backgroundColor: '#fff', borderWidth: '1px' }}>
          <table className="bg-white rounded-lg w-full min-w-[800px] sm:min-w-0" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr style={{ background: '#f5f1eb' }}>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '28%' }}>
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
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '8%' }}>
                  Price
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '24%' }}>
                  Action / Contact
                </th>
              </tr>
            </thead>
          <tbody className="bg-white divide-y" style={{ borderColor: '#e8e0d8' }}>
            {filteredBooks.length > 0 ? (
              filteredBooks
                .slice() // Create a shallow copy to avoid mutating the original array
                .sort((a, b) => b.isAvailable - a.isAvailable) // Sort: true (1) before false (0)

                .map((book, index) => (
                  <tr key={index} className="hover:bg-opacity-50 transition-colors" style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#faf8f5' }}>
                    <td className="px-2 sm:px-4 py-2 text-sm sm:text-base">
                      {book.bookTitle}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap font-semibold text-sm sm:text-base">
                      {book.Regulation}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base hidden sm:table-cell">
                      {book.semester}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base hidden md:table-cell">{book.Year}</td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base hidden lg:table-cell">
                      {book.department}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-center text-sm sm:text-base">
                      {(() => {
                        // Handle undefined/null price values
                        const bookPrice = (book.price !== undefined && book.price !== null) ? book.price : 0;
                        const hasExplicitRequiresPayment = book.requiresPayment === true;
                        const hasPrice = bookPrice > 0;
                        const needsPayment = hasExplicitRequiresPayment || hasPrice;
                        
                        if (needsPayment && bookPrice > 0) {
                          return <span className="font-bold" style={{ color: '#c9a8a8' }}>₹{bookPrice}</span>;
                        } else if (needsPayment && bookPrice === 0) {
                          // Book requires payment but price is missing - show error state
                          return <span className="font-semibold text-xs" style={{ color: '#c9a8a8' }}>Price Missing</span>;
                        } else {
                          return <span className="font-semibold" style={{ color: '#8a9a8a' }}>FREE</span>;
                        }
                      })()}
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      {book.isAvailable ? (
                        (() => {
                          const paymentInfo = getPaymentInfo(book);
                          
                          // Show contact if payment info says we can view it (either free book or payment verified)
                          if (paymentInfo.canViewContact && paymentInfo.contact) {
                            // Check if this is a paid book that was verified
                            const isPaidBook = book.requiresPayment === true || (book.price !== undefined && book.price !== null && book.price > 0);
                            
                            return (
                              <a
                                className="flex items-center justify-center rounded-lg p-1.5 sm:p-2 space-x-1 sm:space-x-3 cursor-pointer transition-all duration-300 hover:scale-105 shadow-sm text-xs sm:text-sm"
                                style={{ 
                                  background: '#c9a8a8',
                                }}
                                href={`tel:${paymentInfo.contact}`}
                              >
                                <IoCall className="text-lg sm:text-2xl" style={{ color: '#fff' }} />
                                <span className="font-semibold" style={{ color: '#fff' }}>{paymentInfo.contact}</span>
                                {isPaidBook && (
                                  <span className="text-xs bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold hidden sm:inline" style={{ color: '#c9a8a8' }}>Verified</span>
                                )}
                              </a>
                            );
                          }
                          
                          // NEEDS PAYMENT - Show Pay button
                          if (paymentInfo.needsPayment) {
                            return (
                              <div className="flex flex-col items-center gap-1 sm:gap-2">
                                <button
                                  onClick={() => handlePaymentClick(book)}
                                  className="flex items-center justify-center rounded-lg p-1.5 sm:p-2 px-2 sm:px-4 text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 shadow-sm w-full sm:w-auto"
                                  style={{ background: '#c9a8a8', color: '#fff' }}
                                >
                                  <span>💰 Pay ₹{paymentInfo.price}</span>
                                </button>
                                <span className="text-xs hidden sm:inline" style={{ color: '#8a7a7a' }}>Contact hidden until payment</span>
                              </div>
                            );
                          }
                          
                          // NEEDS UTR SUBMISSION - Show Submit UTR button
                          if (paymentInfo.needsUtr) {
                            return (
                              <div className="flex flex-col items-center gap-1 sm:gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedBook(book);
                                    setShowUtrModal(true);
                                  }}
                                  className="flex items-center justify-center rounded-lg p-1.5 sm:p-2 px-2 sm:px-4 text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 shadow-sm w-full sm:w-auto"
                                  style={{ background: '#c9a8a8', color: '#fff' }}
                                >
                                  <span>📝 Submit UTR</span>
                                </button>
                                <span className="text-xs hidden sm:inline" style={{ color: '#8a7a7a' }}>Payment done? Submit UTR</span>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="flex items-center justify-center">
                              <span className="text-sm" style={{ color: '#8a7a7a' }}>Loading payment status...</span>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex items-center justify-center rounded-lg p-2 space-x-3 cursor-not-allowed shadow-sm" style={{ backgroundColor: '#f0f0f0' }}>
                          <IoCall className="text-2xl" style={{ color: '#8a7a7a' }} />
                          <span className="font-medium" style={{ color: '#8a7a7a' }}>Not Available</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-2 text-center text-3xl"
                  style={{ color: '#c9a8a8' }}
                >
                  No books available
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="flex justify-center items-center py-3 sm:py-4 px-2">
        <button
          onClick={fetchOtherBooks}
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
          {loadingOther ? "Loading..." : "Other Available books here"}
        </button>
      </div>

      {otherAvailableBooks.length > 0 && (
        <div className="container mx-auto px-2 sm:px-4 pb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl text-center mb-4 sm:mb-6 font-bold px-2" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>Other Available Books</h2>
          <div className="overflow-x-auto rounded-lg shadow-sm border" style={{ borderColor: '#e8e0d8', backgroundColor: '#fff', borderWidth: '1px' }}>
            <table className="min-w-[600px] sm:min-w-full bg-white rounded-lg">
              <thead>
                <tr style={{ background: '#f5f1eb' }}>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f' }}>
                    Title
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f' }}>
                    Availability
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f' }}>
                    Price
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f' }}>
                    Contact
                  </th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y" style={{ borderColor: '#e8e0d8' }}>
              {otherAvailableBooks.map((book, index) => {
                const paymentInfo = getOtherBookPaymentInfo(book);
                return (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#faf8f5' }}>
                    <td className="px-2 sm:px-4 py-2 text-sm sm:text-base">{book.title}</td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base">
                      {book.available}
                    </td>
                    <td className="px-2 sm:px-4 py-2 whitespace-nowrap font-semibold text-sm sm:text-base">
                      ₹{book.price || 0}
                    </td>
                    <td className="px-2 sm:px-4 py-2">
                      {paymentInfo.canViewContact ? (
                        <a
                          className="flex items-center justify-center rounded-lg p-1.5 sm:p-2 space-x-1 sm:space-x-3 cursor-pointer transition-all duration-300 hover:scale-105 shadow-sm text-xs sm:text-sm w-full sm:w-auto sm:min-w-[200px]"
                          style={{ 
                            background: '#c9a8a8',
                          }}
                          href={`tel:${paymentInfo.contact}`}
                        >
                          <IoCall className="text-lg sm:text-2xl" style={{ color: '#fff' }} />
                          <span className="font-semibold" style={{ color: '#fff' }}>{paymentInfo.contact}</span>
                        </a>
                      ) : paymentInfo.needsPayment ? (
                        <button
                          onClick={() => handleOtherBookPaymentClick(book)}
                          className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-105 shadow-sm whitespace-nowrap w-full sm:w-auto"
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
                          Pay Now (₹{paymentInfo.price})
                        </button>
                      ) : (
                        <span className="text-xs sm:text-sm" style={{ color: '#8a7a7a' }}>
                          Payment verification pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
      
        {/* Footer */}
        <div className="mt-8 py-6 text-center" style={{ color: '#5a4a4a' }}>
          <p className="text-sm md:text-base font-semibold" style={{ fontFamily: 'sans-serif' }}>
            © 2024 BookNest - Connecting students across all colleges
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (selectedBook || selectedOtherBook) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 max-w-md w-full border overflow-y-auto max-h-[90vh]" style={{ borderColor: '#e8e0d8', backgroundColor: '#fef9f6' }}>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
              Payment Required
            </h2>
            <div className="mb-4 sm:mb-6">
              <p className="mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: '#5a4a4a', fontFamily: 'sans-serif' }}>
                <strong>Book:</strong> {selectedBook ? selectedBook.bookTitle : selectedOtherBook?.title}
              </p>
              <p className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: '#c9a8a8' }}>
                Price: ₹{selectedBook ? selectedBook.price : selectedOtherBook?.price}
              </p>
              <p className="mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: '#5a4a4a', fontFamily: 'sans-serif' }}>
                Please make the payment to the following UPI ID:
              </p>
              <div className="p-3 sm:p-4 rounded-lg mb-3 sm:mb-4 border" style={{ backgroundColor: '#faf8f5', borderColor: '#e8e0d8' }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <p className="font-mono text-sm sm:text-base md:text-lg font-bold break-all sm:break-normal" style={{ color: '#5a4a4a' }}>
                    anushyamuthu97@okhdfcbank
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText('anushyamuthu97@okhdfcbank');
                        setUpiCopied(true);
                        setTimeout(() => setUpiCopied(false), 2000);
                      } catch (err) {
                        console.error('Failed to copy:', err);
                      }
                    }}
                    className="px-3 py-1.5 sm:py-1 text-xs sm:text-sm rounded shadow-sm transition-colors w-full sm:w-auto"
                    style={{ 
                      background: upiCopied ? '#d4a5a5' : '#c9a8a8',
                      color: '#fff'
                    }}
                    onMouseEnter={(e) => {
                      if (!upiCopied) e.currentTarget.style.background = '#d4a5a5';
                    }}
                    onMouseLeave={(e) => {
                      if (!upiCopied) e.currentTarget.style.background = '#c9a8a8';
                    }}
                  >
                    {upiCopied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              
              {/* Payment Link Button */}
              <div className="mb-3 sm:mb-4">
                <a
                  href={`upi://pay?pa=anushyamuthu97@okhdfcbank&am=${selectedBook ? selectedBook.price : selectedOtherBook?.price}&cu=INR&tn=Book Payment - ${selectedBook ? selectedBook.bookTitle : selectedOtherBook?.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-bold transition-all duration-300 hover:scale-105 shadow-sm"
                  style={{ 
                    background: '#c9a8a8',
                    color: '#fff',
                  }}
                  onClick={(e) => {
                    // Fallback for devices that don't support UPI links
                    if (!e.defaultPrevented) {
                      // Try alternative UPI link format
                      const price = selectedBook ? selectedBook.price : selectedOtherBook?.price;
                      const upiLink = `tez://pay?pa=anushyamuthu97@okhdfcbank&am=${price}&cu=INR&tn=Book Payment`;
                      window.location.href = upiLink;
                    }
                  }}
                >
                  <span className="mr-2">💳</span>
                  Pay ₹{selectedBook ? selectedBook.price : selectedOtherBook?.price} Now
                </a>
                <p className="text-xs mt-2 text-center" style={{ color: '#8a7a7a' }}>
                  Click to open UPI payment app
                </p>
              </div>
              
                <p className="text-xs sm:text-sm mb-3 sm:mb-4" style={{ color: '#8a7a7a', fontFamily: 'sans-serif' }}>
                  After payment, click "I've Paid" to submit your UTR number.
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setShowUtrModal(true);
                }}
                className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-bold transition-all duration-300"
                style={{ 
                  background: '#c9a8a8',
                  color: '#fff',
                }}
              >
                I've Paid - Submit UTR
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBook(null);
                  setSelectedOtherBook(null);
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

      {/* UTR Submission Modal */}
      {showUtrModal && (selectedBook || selectedOtherBook) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 max-w-md w-full border" style={{ borderColor: '#e8e0d8', backgroundColor: '#fef9f6' }}>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
              Submit UTR Number
            </h2>
            <div className="mb-4 sm:mb-6">
              <p className="mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: '#5a4a4a', fontFamily: 'sans-serif' }}>
                <strong>Book:</strong> {selectedBook ? selectedBook.bookTitle : selectedOtherBook?.title}
              </p>
              <p className="mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: '#5a4a4a', fontFamily: 'sans-serif' }}>
                Enter the UTR (Unique Transaction Reference) number from your payment:
              </p>
              <input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none mb-2 shadow-sm text-sm sm:text-base"
                style={{ borderColor: '#e8e0d8' }}
                placeholder="Enter UTR number"
                autoFocus
              />
              <p className="text-xs sm:text-sm" style={{ color: '#8a7a7a' }}>
                Admin will verify your payment and notify you via email.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                onClick={handleUtrSubmit}
                disabled={isSubmittingUtr}
                className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: '#c9a8a8',
                  color: '#fff',
                }}
              >
                {isSubmittingUtr ? "Submitting..." : "Submit UTR"}
              </button>
              <button
                onClick={() => {
                  setShowUtrModal(false);
                  setUtr("");
                  setSelectedBook(null);
                  setSelectedOtherBook(null);
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
    </div>
    </>
  );
}

export default BookAvailableSeniorList;
