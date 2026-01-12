import React from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
export default function SeniorSite() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);

  const handleDelete = async (seniorId, bookId) => {
    const confirmDelete = window.confirm(
      "Do you really want to remove this book?"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `https://books-serverside.onrender.com/books/${seniorId}/${bookId}`,
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
  }, []);

  return (
    <>
      <div className="bg-gradient-to-r bg-[#25154d] p-4">
        {/* Navbar container */}
        <div className="flex items-center justify-between flex-wrap space-y-4 md:space-y-0 md:flex-nowrap">
          {/* Left side: User info */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 text-white">
            {user ? (
              <div className="flex flex-col items-center md:items-start">
                <h1 className="text-lg md:text-xl font-semibold">
                  Welcome, {user.name || user.mailId}
                </h1>
                <p className="text-sm">{user.mailId}</p>
              </div>
            ) : (
              <p className="text-sm">Loading...</p>
            )}
          </div>

          {/* Center: Logo and Title */}
          <div className="flex items-center justify-center p-4 bg-gradient-to-r bg-[#25154d]">
            <img
              src="/logo.jpeg" // Assuming the logo is placed in the public/images directory
              alt="BookBuddy Logo"
              className="h-16 w-16 mr-4 md:h-20 md:w-20 rounded-full"
            />
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-4xl text-white p-6 text-center">
              BookNest - Universal Platform
            </h1>
          </div>
          {/* Right side: Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("userType");
                navigate("/dashboard");
              }}
              className="bg-violet-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition duration-200"
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Book Title
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Regulation
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Semester
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remove
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {books.map((book, index) => (
              <tr key={index}>
                <td className="px-4 py-2 whitespace-nowrap">
                  {book.bookTitle}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {book.Regulation}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{book.sem}</td>
                <td className="px-4 py-2 whitespace-nowrap">{book.Year}</td>
                <td className="px-4 py-2 whitespace-nowrap">{book.dep}</td>
                <td className="px-4 py-2 whitespace-nowrap">{book.contact}</td>

                <td className="px-4 py-2 whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(user.userId, book._id);
                    }}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    Remove Availability
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
