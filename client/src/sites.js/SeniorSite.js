import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";

export default function SeniorSite() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [otherBooks, setOtherBooks] = useState([]);

  const handleDelete = async (seniorId, bookId) => {
    const confirmDelete = window.confirm(
      "Do you really want to remove this book?"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:8000/books/${seniorId}/${bookId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Book removed successfully!");

        // Update the books state
        const updatedBooks = books.filter((book) => book._id !== bookId);
        setBooks(updatedBooks);

        // Update user in localStorage
        const updatedUser = { ...user, books: updatedBooks };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        alert(data.message || "Failed to remove the book.");
      }
    } catch (error) {
      console.error("Error removing book:", error);
      alert("An error occurred. Please try again.");
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser?.books) {
      setBooks(storedUser.books);
    }
    
    // Fetch other books added by this senior
    const fetchOtherBooks = async () => {
      try {
        const response = await axios.get("http://localhost:8000/otherbooks");
        // Filter books added by this senior
        const seniorOtherBooks = response.data.filter(
          book => book.userId && book.userId === storedUser?.userId
        );
        setOtherBooks(seniorOtherBooks);
      } catch (error) {
        console.error("Error fetching other books:", error);
      }
    };
    
    if (storedUser?.userId) {
      fetchOtherBooks();
    }
  }, []);
  
  const handleDeleteOtherBook = async (bookId) => {
    const confirmDelete = window.confirm(
      "Do you really want to remove this book?"
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `http://localhost:8000/otherbooks/${bookId}`
      );

      if (response.status === 200) {
        alert("Book removed successfully!");
        // Update the other books state
        setOtherBooks(prev => prev.filter(book => book._id !== bookId));
      } else {
        alert("Failed to remove the book.");
      }
    } catch (error) {
      console.error("Error removing other book:", error);
      alert("An error occurred. Please try again.");
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

        {/* Regular Books Table */}
        <div className="w-full pt-4 sm:pt-6 pb-6 px-2 sm:px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl text-center mb-4 sm:mb-6 font-bold px-2" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
            Regular Books
          </h2>
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
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '15%' }}>
                    Contact
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '17%' }}>
                    Remove
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y" style={{ borderColor: '#e8e0d8' }}>
                {books.length > 0 ? (
                  books.map((book, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#faf8f5' }}>
                      <td className="px-2 sm:px-4 py-2 text-sm sm:text-base">
                        {book.bookTitle}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap font-semibold text-sm sm:text-base">
                        {book.Regulation}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base hidden sm:table-cell">{book.sem}</td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base hidden md:table-cell">{book.Year}</td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base hidden lg:table-cell">{book.dep}</td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base">{book.contact}</td>
                      <td className="px-2 sm:px-4 py-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(user.userId, book._id);
                          }}
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
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center" style={{ color: '#c9a8a8' }}>
                      <p className="text-base sm:text-lg font-semibold">No books added yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Other Books Table */}
        {otherBooks.length > 0 && (
          <div className="w-full pt-4 sm:pt-6 pb-6 px-2 sm:px-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl text-center mb-4 sm:mb-6 font-bold px-2" style={{ color: '#3d2f2f', fontFamily: 'serif' }}>
              Other Books
            </h2>
            <div className="overflow-x-auto rounded-lg shadow-sm border" style={{ borderColor: '#e8e0d8', backgroundColor: '#fff', borderWidth: '1px' }}>
              <table className="bg-white rounded-lg w-full min-w-[600px] sm:min-w-0" style={{ tableLayout: 'auto' }}>
                <thead>
                  <tr style={{ background: '#f5f1eb' }}>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '30%' }}>
                      Title
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '25%' }}>
                      Availability
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '15%' }}>
                      Price
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '15%' }}>
                      Contact
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#3d2f2f', width: '15%' }}>
                      Remove
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y" style={{ borderColor: '#e8e0d8' }}>
                  {otherBooks.map((book, index) => (
                    <tr key={book._id || index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#faf8f5' }}>
                      <td className="px-2 sm:px-4 py-2 text-sm sm:text-base">
                        {book.title}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base">
                        {book.available}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap font-semibold text-sm sm:text-base">
                        ₹{book.price || 0}
                      </td>
                      <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base">
                        {book.contact}
                      </td>
                      <td className="px-2 sm:px-4 py-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteOtherBook(book._id);
                          }}
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
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
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
    </>
  );
}
