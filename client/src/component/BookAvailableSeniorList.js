import { useEffect, useState } from "react";
import axios from "axios";
import { IoCall } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

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
  const user = JSON.parse(localStorage.getItem("user"));

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem("token"); // Retrieve token from localStorage

        const response = await axios.get(
          "https://books-serverside.onrender.com/junior-details",
          {
            headers: {
              Authorization: `Bearer ${token}`, // Include token in the request
            },
          }
        );

        console.log("hello", response.data.user); // Save user details
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch user details");
      }
    };

    fetchUserDetails();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(
          "https://books-serverside.onrender.com/availableBooks"
        );
        setAvailableBooks(response.data);
      } catch (error) {
        console.error("Error fetching books:", error);
        setError(error.response ? error.response.data.message : error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const fetchOtherBooks = async () => {
    setLoadingOther(true); // Set loading state
    try {
      const response = await axios.get(
        "https://books-serverside.onrender.com/otherbooks"
      );
      setOtherAvailableBooks(response.data);
    } catch (error) {
      console.error("Error fetching other available books:", error);
      setError(error.response ? error.response.data.message : error.message);
    } finally {
      setLoadingOther(false); // Reset loading state
    }
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

          <div className="flex items-center justify-center p-4 bg-gradient-to-r bg-[#25154d]">
            <img
              src="/logo.jpeg" // Assuming the logo is placed in the public/images directory
              alt="BookBuddy Logo"
              className="h-16 w-16 mr-4 md:h-20 md:w-20 rounded-full"
            />
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-4xl text-white p-6 text-center">
              JACSICE BookNest
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
              className="bg-white text-[#25154d] py-2 px-4 rounded-lg font-medium hover:bg-lime-500 hover:text-white transition duration-200"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6 bg-violet-600 rounded m-2 mx-auto w-full lg:w-2/3">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4 w-full ">
          <label className="text-2xl font-bold text-black lg:w-1/4">
            Filter by book name
          </label>
          <input
            type="text"
            value={bookname}
            onChange={(e) => setbookname(e.target.value)}
            placeholder="Enter book name"
            className=" lg:w-2/5 px-3 py-2 border rounded-md  focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus:ring-2  block w-full sm:text-sm border-black"
          />
        </div>
        {/* Regulation Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4 w-full">
          <label className="text-2xl font-bold text-black lg:w-1/4">
            Regulation
          </label>
          <select
            value={selectedRegulation}
            onChange={(e) => setSelectedRegulation(e.target.value)}
            className="w-full lg:w-2/5 px-3 py-2 bg-white border border-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>
              Select a Regulation
            </option>
            <option value="2017">2017</option>
            <option value="2021">2021</option>
          </select>
        </div>

        {/* Department Dropdown */}
        <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4 w-full">
          <label className="text-2xl font-bold text-black lg:w-1/4">
            Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full lg:w-2/5 px-3 py-2 bg-white border border-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>
              Select a Department
            </option>
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
        <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4 w-full">
          <label className="text-2xl font-bold text-black lg:w-1/4">
            Semester
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full lg:w-2/5 px-3 py-2 bg-white border border-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>
              Select a Semester
            </option>
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
        <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4 w-full">
          <label className="text-2xl font-bold text-black lg:w-1/4">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full lg:w-2/5 px-3 py-2 bg-white border border-black rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>
              Select a Year
            </option>
            <option value="I Year">I Year</option>
            <option value="II Year">II Year</option>
            <option value="III Year">III Year</option>
            <option value="IV Year">IV Year</option>
          </select>
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBooks.length > 0 ? (
              filteredBooks
                .slice() // Create a shallow copy to avoid mutating the original array
                .sort((a, b) => b.isAvailable - a.isAvailable) // Sort: true (1) before false (0)

                .map((book, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {book.bookTitle}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {book.Regulation}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {book.semester}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{book.Year}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {book.department}
                    </td>
                    <td className="px-4 py-2 text-1xl whitespace-nowrap">
                      <a
                        className={`flex items-center justify-center rounded p-2  space-x-3 ${
                          book.isAvailable
                            ? "bg-green-300 cursor-pointer" // Active styling
                            : "bg-gray-300 cursor-not-allowed" // Disabled styling
                        }`}
                        href={book.isAvailable ? `tel:${book.contact}` : "#"}
                        onClick={(e) => {
                          if (!book.isAvailable) e.preventDefault(); // Prevent default action if unavailable
                        }}
                      >
                        <IoCall
                          className={`text-2xl ${
                            book.isAvailable ? "text-blue-500" : "text-gray-500"
                          }`} // Icon color changes based on availability
                        />
                        <span
                          className={`${
                            book.isAvailable ? "text-black" : "text-gray-500"
                          }`} // Text color changes based on availability
                        >
                          {book.contact}
                        </span>
                      </a>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-2  text-center text-red-600 text-3xl"
                >
                  No books available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center">
        <button
          onClick={fetchOtherBooks}
          className="bg-violet-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300"
        >
          {loadingOther ? "Loading..." : "Other Available books here"}
        </button>
      </div>

      {otherAvailableBooks.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <h2 className="text-xl text-center mb-4">Other Available Books</h2>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {otherAvailableBooks.map((book, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap">{book.title}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {book.available}
                  </td>
                  <td className="px-4 py-2 text-1xl whitespace-nowrap">
                    <a
                      className="flex items-center justify-center bg-green-300 rounded p-2 space-x-3 w-64" // Add space-x-4 here
                      href={`tel:${book.contact}`}
                    >
                      <IoCall className="text-blue-500 text-2xl" />
                      <span>{book.contact}</span>{" "}
                      {/* Wrap the contact in a span to ensure proper spacing */}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default BookAvailableSeniorList;
