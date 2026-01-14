// Load environment variables from .env file (for local development)
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "Muthu@97$"; // Use an environment variable in production

const app = express();
const port = 8000;
const cors = require("cors");
// const cors = require("cors");
// app.use(cors({ origin: "https://jacsice-booknest-webapp.onrender.com" })); // Allow only your frontend  // https://books-client-iaft.onrender.com
app.use(cors());

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const { type } = require("os");
const { isModuleNamespaceObject } = require("util/types");
app.listen(port, () => {
  console.log("Server is running on port 8000");
});

mongoose
  .connect(
    "mongodb+srv://muthuanushya:anushya@cluster0.2e7d5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      connectTimeoutMS: 30000, // Optional: increase timeout
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDb", err);
  });

app.get("/", (req, res) => {
  res.json("Hello");
});
const bookSchema = new mongoose.Schema({
  bookTitle: {
    type: String,
  },
  Year: {
    type: String,
  },
  Regulation: {
    type: String,
  },
  department: {
    type: String,
  },
  semester: {
    type: String,
  },
});

const collection = new mongoose.model("books", bookSchema);

const availableSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  available: { type: String, required: true },
  contact: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  requiresPayment: { type: Boolean, default: false },
  userId: { type: String, required: false },
  // Payment fields
  utr: { type: String },
  paidBy: { type: String },
  paymentStatus: { type: String, enum: ["pending", "paid", "verified", "rejected"], default: "pending" },
  paymentVerified: { type: Boolean, default: false },
  paymentDate: { type: Date },
  utrSubmittedDate: { type: Date },
});

const availableCollection = mongoose.model("available", availableSchema);

module.exports = { availableCollection };

const seniorschema = new mongoose.Schema({
  name: { type: String, required: true },
  mailId: { type: String, required: true, unique: true },
  collegeId: { type: String, default: "" },
  contact: { type: String, default: "" },
  googleId: { type: String, unique: true, sparse: true },
  picture: { type: String },
  books: [
    {
      bookTitle: { type: String, required: true },
      Year: { type: String, required: true },
      Regulation: { type: String, required: true },
      sem: { type: String, required: true },
      dep: { type: String, required: true },
      contact: { type: String, required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "seniordata" },
      price: { type: Number, default: 0 },
      requiresPayment: { type: Boolean, default: false },
    },
  ],
});

const seniorCollection = mongoose.model("seniorData", seniorschema);

module.exports = { seniorCollection };

const juniorschema = new mongoose.Schema({
  name: { type: String, required: true },
  mailId: { type: String, required: true, unique: true },
  collegeId: { type: String, default: "" },
  contact: { type: String, default: "" },
  googleId: { type: String, unique: true, sparse: true },
  picture: { type: String },
  books: [
    {
      bookTitle: { type: String, required: true },
      Year: { type: String, required: true },
      Regulation: { type: String, required: true },
      sem: { type: String, required: true },
      dep: { type: String, required: true },
      contact: { type: String, required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "seniordata" },
      price: { type: Number, default: 0 },
      requiresPayment: { type: Boolean, default: false },
    },
  ],
});

const juniorCollection = mongoose.model("juniorData", juniorschema);

module.exports = { juniorCollection };

// User Login
app.post("/otherbooks", async (req, res) => {
  const { title, available, contact, price, requiresPayment, userId } = req.body;

  try {
    // Validate all required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!available || !available.trim()) {
      return res.status(400).json({ message: "Availability is required" });
    }
    if (!contact || contact.trim() === "") {
      return res.status(400).json({ message: "Contact number is required" });
    }
    if (contact.length !== 10) {
      return res.status(400).json({ message: "Contact number must be 10 digits" });
    }
    
    // Parse and validate price (mandatory field, can be 0)
    let parsedPrice = 0;
    let paymentRequired = false;
    
    if (price !== undefined && price !== null && price !== "") {
      parsedPrice = typeof price === 'number' ? price : parseFloat(price);
      if (isNaN(parsedPrice)) {
        parsedPrice = 0;
      }
      if (parsedPrice < 0) {
        return res.status(400).json({ message: "Price cannot be negative" });
      }
      if (parsedPrice > 200) {
        return res.status(400).json({ message: "Price cannot exceed ₹200" });
      }
      if (parsedPrice > 0) {
        paymentRequired = true;
      }
    } else {
      // If price is not provided, default to 0
      parsedPrice = 0;
    }

    // Create the entry
    const newEntry = new availableCollection({
      title,
      available,
      contact,
      price: parsedPrice,
      requiresPayment: paymentRequired,
      userId: userId || null,
    });

    // Save the entry to the database
    await newEntry.save();

    // Return a success response
    res.status(201).json({ 
      message: "Book details added successfully",
      book: newEntry
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    if (error.code === 11000) {
      // Check for duplicate title
      res.status(400).json({ message: "Book title already exists" });
    } else {
      res.status(500).json({ message: "Error adding book details" });
    }
  }
});

app.get("/otherbooks", async (req, res) => {
  try {
    const { userId } = req.query; // Optional userId to filter paid books
    
    // Fetch all available books from the database
    let availableBooksname = await availableCollection.find({});
    
    // Filter books based on payment status:
    // - Free books (price = 0 or no payment required) → show to everyone
    // - Paid books that are verified → only show to the junior who paid
    // - Paid books that are not verified → show to everyone (they can pay)
    availableBooksname = availableBooksname.filter(book => {
      const isFree = !book.requiresPayment && (!book.price || book.price === 0);
      
      if (isFree) {
        return true; // Free books visible to everyone
      }
      
      // Paid books
      if (book.paymentVerified && book.paidBy) {
        // Only show to the junior who paid
        if (userId && book.paidBy.toString() === userId) {
          return true;
        }
        return false; // Hide from others
      }
      
      // Paid but not verified yet - show to everyone so they can pay
      return true;
    });
    
    console.log("Fetched books:", availableBooksname.length); // Log count

    if (availableBooksname.length === 0) {
      return res.status(404).json({ message: "No available books found." });
    }
    // Send the fetched data as a response
    res.status(200).json(availableBooksname);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching available books" });
  }
});

// Delete other book
app.delete("/otherbooks/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    
    const book = await availableCollection.findByIdAndDelete(bookId);
    
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    
    res.status(200).json({ message: "Book removed successfully" });
  } catch (error) {
    console.error("Error deleting other book:", error);
    res.status(500).json({ message: "Error deleting book" });
  }
});

// for senior details

app.post("/seniordetails", async (req, res) => {
  const { name, mailId, collegeId, contact } = req.body;

  // Check if required fields are provided
  if (!name || !mailId || !collegeId || !contact) {
    return res
      .status(400)
      .json({ message: "name, mailId, collegeId, and contact are required" });
  }

  try {
    // Check if any of the provided identifiers (mailId, collegeId, or contact) already exist in the database
    const existingUser = await seniorCollection.findOne({
      $or: [{ mailId: mailId }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "User already registered with this email, college ID, or contact number",
      });
    }

    // If no existing user found, proceed with registration
    const newUser = new seniorCollection({ name, mailId, collegeId, contact });
    await newUser.save();

    res.status(201).json({ message: "Registered successfully" });
  } catch (error) {
    // Handle other errors
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  const { mailId } = req.body;

  if (!mailId) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const existingUser = await seniorCollection.findOne({ mailId });

    if (!existingUser) {
      return res.status(400).json({ message: "Email not registered" });
    }
    console.log("existing user", existingUser);
    // Generate a JWT token
    const token = jwt.sign({ userId: existingUser._id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        userId: existingUser._id,
        mailId: existingUser.mailId,
        name: existingUser.name,
        books: existingUser.books, // Include all books as an array
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/juniordetails", async (req, res) => {
  const { name, mailId, collegeId, contact } = req.body;

  if (!name || !mailId || !collegeId || !contact) {
    return res
      .status(400)
      .json({ message: "name,collegeId and contact required" });
  }

  try {
    const existingUser = await juniorCollection.findOne({ mailId });

    // if (!existingUser) {
    //   return res.status(400).json({ message: "Email not registered" });
    // }
    console.log("existing user", existingUser);
    const newUser = new juniorCollection({ name, mailId, collegeId, contact });
    await newUser.save();
    res.status(201).json({ message: "Registered successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/juniorlogin", async (req, res) => {
  const { mailId } = req.body;

  if (!mailId) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const existingUser = await juniorCollection.findOne({ mailId });

    if (!existingUser) {
      return res.status(400).json({ message: "Email not registered" });
    }
    console.log("existing user junior", existingUser);
    // Generate a JWT token
    const token = jwt.sign({ userId: existingUser._id }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        mailId: existingUser.mailId,
        name: existingUser.name,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Google OAuth Authentication for Senior
app.post("/google-auth-senior", async (req, res) => {
  const { email, name, picture, googleId } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: "Email and name are required" });
  }

  try {
    // Check if user exists
    let user = await seniorCollection.findOne({ 
      $or: [{ mailId: email }, { googleId: googleId }] 
    });

    if (user) {
      // Update user with Google info if not already set
      if (!user.googleId && googleId) {
        user.googleId = googleId;
      }
      if (!user.picture && picture) {
        user.picture = picture;
      }
      await user.save();
    } else {
      // Create new user
      user = new seniorCollection({
        name,
        mailId: email,
        googleId: googleId || null,
        picture: picture || null,
        collegeId: "",
        contact: "",
        books: [],
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Authentication successful",
      token,
      user: {
        userId: user._id,
        mailId: user.mailId,
        name: user.name,
        picture: user.picture,
        books: user.books || [],
      },
      isNewUser: !user.googleId || !user.collegeId,
    });
  } catch (error) {
    console.error("Error during Google auth:", error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "User with this email already exists" 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

// Google OAuth Authentication for Junior
app.post("/google-auth-junior", async (req, res) => {
  const { email, name, picture, googleId } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: "Email and name are required" });
  }

  try {
    // Check if user exists
    let user = await juniorCollection.findOne({ 
      $or: [{ mailId: email }, { googleId: googleId }] 
    });

    if (user) {
      // Update user with Google info if not already set
      if (!user.googleId && googleId) {
        user.googleId = googleId;
      }
      if (!user.picture && picture) {
        user.picture = picture;
      }
      await user.save();
    } else {
      // Create new user
      user = new juniorCollection({
        name,
        mailId: email,
        googleId: googleId || null,
        picture: picture || null,
        collegeId: "",
        contact: "",
        books: [],
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Authentication successful",
      token,
      user: {
        userId: user._id,
        mailId: user.mailId,
        name: user.name,
        picture: user.picture,
      },
      isNewUser: !user.googleId || !user.collegeId,
    });
  } catch (error) {
    console.error("Error during Google auth:", error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "User with this email already exists" 
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});

const availabilityBookSchema = new mongoose.Schema({
  bookTitle: String,
  Year: String,
  Regulation: String,
  department: String,
  semester: String,
  contact: String,
  isAvailable: Boolean,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "seniordata" },
  price: { type: Number, required: false }, // Price for the book - NO DEFAULT to ensure it's always saved
  requiresPayment: { type: Boolean, required: false }, // Whether payment is required - NO DEFAULT to ensure it's always saved
  paymentStatus: { type: String, enum: ["pending", "paid", "verified", "rejected"] }, // Payment status
  utr: { type: String }, // UTR number from junior
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "juniordata" }, // Junior who paid
  paymentVerified: { type: Boolean }, // Admin verification status
  paymentDate: { type: Date }, // Date when payment was made
  utrSubmittedDate: { type: Date }, // Date when UTR was submitted
}, {
  // Ensure all fields are saved, even if they match defaults
  minimize: false,
  // Don't use defaults - we'll set everything explicitly
  strict: true
});
const AvailableBook = mongoose.model("availableBooks", availabilityBookSchema);

// Route to delete a book by ID
app.delete("/books/:seniorId/:bookId", async (req, res) => {
  const { seniorId, bookId } = req.params;

  // Validate ObjectIds
  if (
    !mongoose.Types.ObjectId.isValid(seniorId) ||
    !mongoose.Types.ObjectId.isValid(bookId)
  ) {
    return res.status(400).json({ message: "Invalid senior or book ID" });
  }

  try {
    // Check if the senior exists
    const senior = await seniorCollection.findById(seniorId);
    if (!senior) {
      return res.status(404).json({ message: "Senior not found" });
    }

    // Find the specific book in the senior's collection
    const book = senior.books.find((book) => book._id.toString() === bookId);
    if (!book) {
      return res
        .status(404)
        .json({ message: "Book not found in senior's collection" });
    }

    // Pull the book from the senior's books array
    await seniorCollection.findOneAndUpdate(
      { _id: seniorId, "books._id": bookId },
      { $pull: { books: { _id: bookId } } },
      { new: true }
    );

    // Match the book in the availableBooks collection using multiple fields
    const updatedBook = await AvailableBook.findOneAndUpdate(
      {
        bookTitle: book.bookTitle,
        Year: book.Year, // Corrected to match the schema field name
        Regulation: book.Regulation, // Corrected to match the schema field name
        department: book.dep, // Corrected to match the schema field name
        semester: book.sem, // Corrected to match the schema field name
        contact: book.contact, // Corrected to match the schema field name
      },
      { $set: { isAvailable: false } },
      { new: true }
    );

    if (!updatedBook) {
      return res
        .status(404)
        .json({ message: "Book not found in availableBooks collection" });
    }

    res.status(200).json({
      message: "Book removed successfully and availability updated",
      updatedBook,
    });
  } catch (error) {
    console.error("Error removing book:", error);
    res.status(500).json({ message: "Failed to delete book" });
  }
});

app.post("/availableBooks", async (req, res) => {
  try {
    const {
      bookTitle,
      Year,
      Regulation,
      department,
      semester,
      contact,
      userId,
      price,
      requiresPayment,
    } = req.body;

    console.log("🔍 ===== RECEIVED BOOK DATA FROM FRONTEND =====");
    console.log("Full req.body:", JSON.stringify(req.body, null, 2));
    console.log("Extracted values:", {
      bookTitle,
      Year,
      Regulation,
      department,
      semester,
      contact,
      userId,
      price,
      requiresPayment,
      priceType: typeof price,
      requiresPaymentType: typeof requiresPayment,
      priceValue: price,
      requiresPaymentValue: requiresPayment
    });
    console.log("================================================");

    // Find the user in the seniordata collection by userId
    const user = await seniorCollection.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Parse and validate price - handle both number and string
    console.log("💰 ===== PRICE PROCESSING =====");
    console.log("Raw price received:", price, "Type:", typeof price);
    
    let parsedPrice = 0;
    if (price !== undefined && price !== null && price !== "") {
      parsedPrice = typeof price === 'number' ? price : parseFloat(price);
      console.log("After parseFloat:", parsedPrice);
      if (isNaN(parsedPrice)) {
        console.log("⚠️ Price is NaN, setting to 0");
        parsedPrice = 0;
      }
    } else {
      console.log("⚠️ Price is undefined/null/empty, setting to 0");
    }
    
    // Determine if payment is required and final price
    // SIMPLIFIED LOGIC: If requiresPayment is true OR price > 0, payment is required
    const explicitRequiresPayment = requiresPayment === true || requiresPayment === "true";
    const hasValidPrice = parsedPrice > 0 && parsedPrice <= 200;
    
    // Final decision: payment required if explicitly set OR if price > 0
    const finalRequiresPayment = explicitRequiresPayment || hasValidPrice;
    
    // Final price: Use parsedPrice if it's valid (> 0), otherwise 0
    // CRITICAL: If requiresPayment is true, we MUST have a price > 0
    let finalPrice = parsedPrice > 0 ? parsedPrice : 0;
    
    // If requiresPayment is explicitly true but price is 0, that's an error
    if (explicitRequiresPayment && finalPrice === 0) {
      console.log("⚠️ ERROR: requiresPayment is true but price is 0!");
      console.log("Original price value:", price, "Type:", typeof price);
      console.log("Parsed price:", parsedPrice);
      // Try one more time to parse the price
      if (price !== undefined && price !== null && price !== "") {
        const retryPrice = typeof price === 'number' ? price : parseFloat(String(price));
        if (!isNaN(retryPrice) && retryPrice > 0) {
          console.log("✅ Retry successful, using price:", retryPrice);
          finalPrice = retryPrice;
          parsedPrice = retryPrice;
        } else {
          console.log("❌ Retry failed, price remains 0");
        }
      }
    }
    
    console.log("Price processing result:", {
      originalPrice: price,
      parsedPrice,
      explicitRequiresPayment,
      hasValidPrice,
      originalRequiresPayment: requiresPayment,
      finalRequiresPayment,
      finalPrice,
      "finalPrice type": typeof finalPrice,
      "finalRequiresPayment type": typeof finalRequiresPayment
    });
    console.log("=================================");

    // Validate price if payment is required
    if (finalRequiresPayment && (finalPrice <= 0 || finalPrice > 200)) {
      return res.status(400).json({ message: "Price must be between 1 and 200" });
    }

    // Use findOneAndUpdate with upsert to ensure all fields are saved
    // This approach guarantees that price and requiresPayment are saved
    console.log("💾 ===== SAVING/UPDATING BOOK =====");
    
    // CRITICAL: Build the complete document object - don't use $set, use $setOnInsert for defaults only
    // This ensures ALL fields are saved, including price and requiresPayment even if they're 0/false
    const completeBookData = {
      bookTitle: String(bookTitle),
      Year: String(Year),
      Regulation: String(Regulation),
      department: String(department),
      semester: String(semester),
      contact: String(contact),
      userId: userId,
      isAvailable: true,
      price: Number(finalPrice), // CRITICAL: Explicitly convert to Number - even if 0
      requiresPayment: Boolean(finalRequiresPayment), // CRITICAL: Explicitly convert to Boolean - even if false
      paymentStatus: finalRequiresPayment ? "pending" : "verified",
      paymentVerified: !finalRequiresPayment,
      utr: "",
      paidBy: null,
      paymentDate: null,
      utrSubmittedDate: null
    };
    
    console.log("Complete book data to save:", JSON.stringify(completeBookData, null, 2));
    console.log("Final price being saved:", finalPrice, "Type:", typeof finalPrice, "As Number:", Number(finalPrice));
    console.log("Final requiresPayment being saved:", finalRequiresPayment, "Type:", typeof finalRequiresPayment, "As Boolean:", Boolean(finalRequiresPayment));
    
    // Check if book already exists
    const query = {
      bookTitle,
      Year,
      Regulation,
      department,
      semester,
      userId,
      contact
    };
    
    console.log("Query for finding/updating book:", JSON.stringify(query, null, 2));
    
    let savedBook;
    const existingBook = await AvailableBook.findOne(query);
    
    if (existingBook) {
      // Update existing book - explicitly set all fields
      console.log("📝 Updating existing book:", existingBook._id);
      existingBook.bookTitle = String(bookTitle);
      existingBook.Year = String(Year);
      existingBook.Regulation = String(Regulation);
      existingBook.department = String(department);
      existingBook.semester = String(semester);
      existingBook.contact = String(contact);
      existingBook.userId = userId;
      existingBook.isAvailable = true;
      existingBook.price = Number(finalPrice); // CRITICAL: Explicitly set price
      existingBook.requiresPayment = Boolean(finalRequiresPayment); // CRITICAL: Explicitly set requiresPayment
      existingBook.paymentStatus = finalRequiresPayment ? "pending" : "verified";
      existingBook.paymentVerified = !finalRequiresPayment;
      
      // Mark fields as modified to ensure they're saved
      existingBook.markModified('price');
      existingBook.markModified('requiresPayment');
      existingBook.markModified('paymentStatus');
      existingBook.markModified('paymentVerified');
      
      savedBook = await existingBook.save({ validateBeforeSave: true });
      console.log("✅ Updated existing book");
    } else {
      // Create new book - use constructor to ensure all fields are set
      console.log("📝 Creating new book");
      savedBook = new AvailableBook({
        bookTitle: String(bookTitle),
        Year: String(Year),
        Regulation: String(Regulation),
        department: String(department),
        semester: String(semester),
        contact: String(contact),
        userId: userId,
        isAvailable: true,
        price: Number(finalPrice), // CRITICAL: Explicitly set price
        requiresPayment: Boolean(finalRequiresPayment), // CRITICAL: Explicitly set requiresPayment
        paymentStatus: finalRequiresPayment ? "pending" : "verified",
        paymentVerified: !finalRequiresPayment,
        utr: "",
        paidBy: null,
        paymentDate: null,
        utrSubmittedDate: null
      });
      
      // Mark fields as modified
      savedBook.markModified('price');
      savedBook.markModified('requiresPayment');
      
      await savedBook.save({ validateBeforeSave: true });
      console.log("✅ Created new book");
    }
    
    console.log("✅ Book saved with ID:", savedBook._id);
    console.log("Book price after save:", savedBook.price, "Type:", typeof savedBook.price);
    console.log("Book requiresPayment after save:", savedBook.requiresPayment, "Type:", typeof savedBook.requiresPayment);
    
    console.log("✅ Book saved/updated with ID:", savedBook._id);
    console.log("Saved book price:", savedBook.price, "requiresPayment:", savedBook.requiresPayment);
    
    // CRITICAL VERIFICATION: Check if price was actually saved
    if (finalPrice > 0 && (savedBook.price === undefined || savedBook.price === null || savedBook.price === 0)) {
      console.error("❌❌❌ CRITICAL ERROR: Price was NOT saved correctly!");
      console.error("Expected price:", finalPrice);
      console.error("Actual saved price:", savedBook.price);
      console.error("Saved book object:", JSON.stringify(savedBook.toObject(), null, 2));
      // Try to fix it by updating again
      const fixedBook = await AvailableBook.findByIdAndUpdate(
        savedBook._id,
        { $set: { price: finalPrice, requiresPayment: finalRequiresPayment } },
        { new: true }
      );
      console.log("🔧 Attempted fix - new price:", fixedBook.price);
      // Use the fixed book
      Object.assign(savedBook, fixedBook);
    }
    
    console.log("✅ ===== BOOK SAVED TO DATABASE =====");
    console.log("Saved book ID:", savedBook._id);
    console.log("Saved book direct properties:", {
      price: savedBook.price,
      requiresPayment: savedBook.requiresPayment,
      "price type": typeof savedBook.price,
      "requiresPayment type": typeof savedBook.requiresPayment,
      "price === finalPrice": savedBook.price === finalPrice,
      "requiresPayment === finalRequiresPayment": savedBook.requiresPayment === finalRequiresPayment
    });
    
    // Verify the saved data by fetching it again from database (using lean to get plain object)
    const verifiedBook = await AvailableBook.findById(savedBook._id).lean();
    console.log("✅ VERIFIED - Fetched from DB (lean):", {
      _id: verifiedBook._id,
      bookTitle: verifiedBook.bookTitle,
      price: verifiedBook.price,
      requiresPayment: verifiedBook.requiresPayment,
      paymentStatus: verifiedBook.paymentStatus,
      "price exists": verifiedBook.price !== undefined,
      "Payment exists": verifiedBook.requiresPayment !== undefined,
      "price value": verifiedBook.price,
      "requiresPayment value": verifiedBook.requiresPayment,
      "price === 0": verifiedBook.price === 0,
      "price === 100": verifiedBook.price === 100
    });
    
    // Also check the document directly
    const directBook = await AvailableBook.findById(savedBook._id);
    console.log("✅ VERIFIED - Direct document:", {
      price: directBook.price,
      requiresPayment: directBook.requiresPayment,
      "toObject()": directBook.toObject({ minimize: false })
    });
    
    console.log("Saved book FULL data:", JSON.stringify(verifiedBook, null, 2));
    console.log("=====================================");
    
    // Ensure we use the verified data for response - CRITICAL: Use actual saved values
    let responsePrice = verifiedBook.price !== undefined && verifiedBook.price !== null ? verifiedBook.price : finalPrice;
    let responseRequiresPayment = verifiedBook.requiresPayment !== undefined && verifiedBook.requiresPayment !== null ? verifiedBook.requiresPayment : finalRequiresPayment;
    
    // Final safety check: if we expected a price but got 0, use the finalPrice we calculated
    if (finalPrice > 0 && responsePrice === 0) {
      console.error("⚠️ WARNING: Response price is 0 but should be", finalPrice);
      console.error("Using finalPrice instead:", finalPrice);
      responsePrice = finalPrice;
      responseRequiresPayment = finalRequiresPayment;
    }
    
    console.log("📤 Response values:", {
      responsePrice,
      responseRequiresPayment,
      "responsePrice type": typeof responsePrice,
      "responseRequiresPayment type": typeof responseRequiresPayment
    });

    // Create a plain object to push into the books array
    // CRITICAL: Explicitly include price and requiresPayment even if 0/false
    const seniorBook = {
      bookTitle: String(bookTitle),
      Year: String(Year),
      Regulation: String(Regulation),
      sem: String(semester),
      dep: String(department),
      contact: String(contact),
      userId: userId,
      price: Number(finalPrice), // CRITICAL: Explicitly convert to Number
      requiresPayment: Boolean(finalRequiresPayment), // CRITICAL: Explicitly convert to Boolean
    };

    console.log("Adding book to user's books array:", JSON.stringify(seniorBook, null, 2));
    console.log("Senior book price:", seniorBook.price, "Type:", typeof seniorBook.price);
    console.log("Senior book requiresPayment:", seniorBook.requiresPayment, "Type:", typeof seniorBook.requiresPayment);

    // Check if book already exists in user's books array
    const existingBookIndex = user.books.findIndex(
      (b) =>
        b.bookTitle === bookTitle &&
        b.Year === Year &&
        b.Regulation === Regulation &&
        b.sem === semester &&
        b.dep === department
    );

    if (existingBookIndex >= 0) {
      // Update existing book with new price/payment info
      console.log("Updating existing book in user's array at index:", existingBookIndex);
      user.books[existingBookIndex] = seniorBook;
    } else {
      // Add new book
      console.log("Adding new book to user's array");
      user.books.push(seniorBook);
    }

    // Mark the books array as modified to ensure it's saved
    user.markModified('books');
    await user.save();
    
    // Verify the saved book in user's array
    const savedUser = await seniorCollection.findById(userId);
    const savedBookInArray = savedUser.books.find(
      (b) =>
        b.bookTitle === bookTitle &&
        b.Year === Year &&
        b.Regulation === Regulation
    );
    console.log("✅ Verified book in user's array:", {
      found: !!savedBookInArray,
      price: savedBookInArray?.price,
      requiresPayment: savedBookInArray?.requiresPayment,
      "has price field": savedBookInArray?.price !== undefined,
      "has requiresPayment field": savedBookInArray?.requiresPayment !== undefined
    });

    console.log("Book successfully added to user's list with price:", finalPrice, "requiresPayment:", finalRequiresPayment);

    // Return the saved book with all fields for verification
    // Use verified data to ensure price and requiresPayment are included
    res.status(201).json({ 
      message: "Book added as available.", 
      book: {
        _id: savedBook._id,
        bookTitle: savedBook.bookTitle,
        price: responsePrice, // Use verified price
        requiresPayment: responseRequiresPayment, // Use verified requiresPayment
        paymentStatus: verifiedBook.paymentStatus || (finalRequiresPayment ? "pending" : "verified"),
        paymentVerified: verifiedBook.paymentVerified !== undefined ? verifiedBook.paymentVerified : !finalRequiresPayment,
        contact: savedBook.contact,
        isAvailable: savedBook.isAvailable
      }
    });
  } catch (error) {
    console.error("❌ ===== ERROR DURING BOOK SAVE =====");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
    console.error("====================================");
    res.status(500).json({ 
      message: "Error saving book availability.",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MY_EMAIL || "muthuanushyaprojecthub@gmail.com", // Sender email
    pass: process.env.MY_EMAIL_PASS || "hattsaisxftjxxgb", // App password (remove spaces from: hatt sais xftj xxgb)
  },
});

// Admin email for notifications
const ADMIN_EMAIL = process.env.MY_EMAIL_Admin || "anushyamuthu97@gmail.com";

// Submit UTR number after payment
app.post("/submit-utr", async (req, res) => {
  try {
    const { bookId, utr, juniorId } = req.body;

    console.log("📝 ===== UTR SUBMISSION =====");
    console.log("Request body:", { bookId, utr, juniorId });
    console.log("Junior ID type:", typeof juniorId);
    console.log("Junior ID value:", juniorId);

    if (!bookId || !utr || !juniorId) {
      return res.status(400).json({ message: "Book ID, UTR, and Junior ID are required" });
    }

    // Find the book
    const book = await AvailableBook.findById(bookId);
    if (!book) {
      console.error("❌ Book not found with ID:", bookId);
      return res.status(404).json({ message: "Book not found" });
    }

    // Find the junior user - try both string and ObjectId formats
    let junior = null;
    if (mongoose.Types.ObjectId.isValid(juniorId)) {
      junior = await juniorCollection.findById(juniorId);
      if (!junior) {
        // Try finding by other fields as fallback
        console.log("⚠️ User not found by ID, trying to find by other methods...");
        // This shouldn't happen, but let's log it
      }
    } else {
      console.error("❌ Invalid Junior ID format:", juniorId);
      return res.status(400).json({ message: "Invalid Junior ID format" });
    }

    if (!junior) {
      console.error("❌ Junior user not found with ID:", juniorId);
      console.error("Available junior users count:", await juniorCollection.countDocuments());
      return res.status(404).json({ 
        message: "Junior user not found. Please login again.",
        details: "The user ID provided does not match any user in the database."
      });
    }

    console.log("✅ Junior user found:", {
      id: junior._id,
      name: junior.name,
      email: junior.mailId
    });

    // Update book with UTR
    book.utr = utr;
    book.paidBy = juniorId;
    book.paymentStatus = "paid";
    book.utrSubmittedDate = new Date();
    await book.save();

    // Send email notification to admin
    const acceptUrl = `http://localhost:8000/verify-payment/${bookId}/${utr}/accept`;
    const rejectUrl = `http://localhost:8000/verify-payment/${bookId}/${utr}/reject`;

    const mailOptions = {
      from: process.env.MY_EMAIL || "muthuanushyaprojecthub@gmail.com",
      to: ADMIN_EMAIL,
      subject: `Payment UTR Verification Request - Book: ${book.bookTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #cc9b89;">Payment UTR Verification Request</h2>
          <p><strong>Book Title:</strong> ${book.bookTitle}</p>
          <p><strong>Year:</strong> ${book.Year}</p>
          <p><strong>Department:</strong> ${book.department}</p>
          <p><strong>Price:</strong> ₹${book.price}</p>
          <p><strong>Junior Name:</strong> ${junior.name}</p>
          <p><strong>Junior Email:</strong> ${junior.mailId}</p>
          <p><strong>UTR Number:</strong> ${utr}</p>
          <p><strong>Submitted Date:</strong> ${new Date().toLocaleString()}</p>
          <div style="margin: 30px 0;">
            <a href="${acceptUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px; display: inline-block;">
              Accept & Show Contact
            </a>
            <a href="${rejectUrl}" 
               style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reject
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">Click Accept to verify payment and make contact visible to the junior.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: "UTR submitted successfully. Admin will verify and notify you.",
      book 
    });
  } catch (error) {
    console.error("Error submitting UTR:", error);
    res.status(500).json({ message: "Error submitting UTR" });
  }
});

// Admin approval endpoint (called from email link)
app.get("/verify-payment/:bookId/:utr/:action", async (req, res) => {
  try {
    const { bookId, utr, action } = req.params;

    const book = await AvailableBook.findById(bookId);
    if (!book) {
      return res.status(404).send("<h1>Book not found</h1>");
    }

    if (book.utr !== utr) {
      return res.status(400).send("<h1>Invalid UTR</h1>");
    }

    if (action === "accept") {
      book.paymentStatus = "verified";
      book.paymentVerified = true;
      book.paymentDate = new Date();
      await book.save();

      // Notify junior via email
      const junior = await juniorCollection.findById(book.paidBy);
      if (junior) {
        const mailOptions = {
          from: process.env.MY_EMAIL || "muthuanushyaprojecthub@gmail.com",
          to: junior.mailId,
          subject: "Payment Verified - Contact Details Now Available",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">Payment Verified Successfully!</h2>
              <p>Your payment for <strong>${book.bookTitle}</strong> has been verified.</p>
              <p>You can now view the contact details in the BookNest application.</p>
              <p><strong>Contact Number:</strong> ${book.contact}</p>
              <p>Thank you for using BookNest!</p>
            </div>
          `,
        };
        await transporter.sendMail(mailOptions);
      }

      return res.send(`
        <html>
          <head>
            <title>Payment Verified</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #f2bfac, #ffe4d6); }
              .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              h1 { color: #4CAF50; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✓ Payment Verified</h1>
              <p>Contact details have been made visible to the junior.</p>
              <p>You can close this window.</p>
            </div>
          </body>
        </html>
      `);
    } else if (action === "reject") {
      book.paymentStatus = "rejected";
      book.paymentVerified = false;
      await book.save();

      return res.send(`
        <html>
          <head>
            <title>Payment Rejected</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #f2bfac, #ffe4d6); }
              .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              h1 { color: #f44336; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✗ Payment Rejected</h1>
              <p>Payment has been rejected. Please contact the admin for more information.</p>
            </div>
          </body>
        </html>
      `);
    }

    res.status(400).send("<h1>Invalid action</h1>");
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send("<h1>Error verifying payment</h1>");
  }
});

// Get payment status for a book
app.get("/payment-status/:bookId/:juniorId", async (req, res) => {
  try {
    const { bookId, juniorId } = req.params;

    const book = await AvailableBook.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if book requires payment (either requiresPayment flag OR price > 0)
    const needsPayment = book.requiresPayment || (book.price && book.price > 0);

    // Check if this junior has paid for this book
    const canViewContact = book.paymentVerified && 
                          book.paidBy && 
                          book.paidBy.toString() === juniorId;

    res.json({
      requiresPayment: needsPayment,
      price: book.price || 0,
      paymentStatus: book.paymentStatus || "pending",
      paymentVerified: book.paymentVerified || false,
      canViewContact: canViewContact || !needsPayment,
      contact: (canViewContact || !needsPayment) ? book.contact : null,
    });
  } catch (error) {
    console.error("Error getting payment status:", error);
    res.status(500).json({ message: "Error getting payment status" });
  }
});

// Submit UTR for other books
app.post("/submit-utr-otherbook", async (req, res) => {
  try {
    const { bookId, utr, userId } = req.body;

    console.log("📝 ===== UTR SUBMISSION (OTHER BOOK) =====");
    console.log("Request body:", { bookId, utr, userId });

    if (!bookId || !utr || !userId) {
      return res.status(400).json({ message: "Book ID, UTR, and User ID are required" });
    }

    // Find the book in availableCollection
    const book = await availableCollection.findById(bookId);
    if (!book) {
      console.error("❌ Book not found with ID:", bookId);
      return res.status(404).json({ message: "Book not found" });
    }

    // Find the user (could be senior or junior)
    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      // Try junior first
      user = await juniorCollection.findById(userId);
      if (!user) {
        // Try senior
        user = await seniorCollection.findById(userId);
      }
    }

    if (!user) {
      console.error("❌ User not found with ID:", userId);
      return res.status(404).json({ 
        message: "User not found. Please login again."
      });
    }

    console.log("✅ User found:", {
      id: user._id,
      name: user.name,
      email: user.mailId
    });

    // Update book with UTR
    book.utr = utr;
    book.paidBy = userId;
    book.paymentStatus = "paid";
    book.utrSubmittedDate = new Date();
    await book.save();

    // Send email notification to admin
    const acceptUrl = `http://localhost:8000/verify-payment-otherbook/${bookId}/${utr}/accept`;
    const rejectUrl = `http://localhost:8000/verify-payment-otherbook/${bookId}/${utr}/reject`;

    const mailOptions = {
      from: process.env.MY_EMAIL || "muthuanushyaprojecthub@gmail.com",
      to: ADMIN_EMAIL,
      subject: `Payment UTR Verification Request - Other Book: ${book.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #cc9b89;">Payment UTR Verification Request (Other Book)</h2>
          <p><strong>Book Title:</strong> ${book.title}</p>
          <p><strong>Availability:</strong> ${book.available}</p>
          <p><strong>Price:</strong> ₹${book.price}</p>
          <p><strong>User Name:</strong> ${user.name}</p>
          <p><strong>User Email:</strong> ${user.mailId}</p>
          <p><strong>UTR Number:</strong> ${utr}</p>
          <p><strong>Submitted Date:</strong> ${new Date().toLocaleString()}</p>
          <div style="margin: 30px 0;">
            <a href="${acceptUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px; display: inline-block;">
              Accept & Show Contact
            </a>
            <a href="${rejectUrl}" 
               style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reject
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">Click Accept to verify payment and make contact visible to the user.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Send confirmation email to user
    const userMailOptions = {
      from: process.env.MY_EMAIL || "muthuanushyaprojecthub@gmail.com",
      to: user.mailId,
      subject: "UTR Submitted - Payment Verification Pending",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #cc9b89;">UTR Submitted Successfully</h2>
          <p>Your UTR number for <strong>${book.title}</strong> has been submitted.</p>
          <p><strong>UTR Number:</strong> ${utr}</p>
          <p>Admin will verify your payment and notify you via email once verified.</p>
          <p>You will be able to view the contact details after verification.</p>
          <p>Thank you for using BookNest!</p>
        </div>
      `,
    };

    await transporter.sendMail(userMailOptions);

    res.status(200).json({ 
      message: "UTR submitted successfully. Admin will verify and notify you.",
      book 
    });
  } catch (error) {
    console.error("Error submitting UTR:", error);
    res.status(500).json({ message: "Error submitting UTR" });
  }
});

// Admin approval endpoint for other books (called from email link)
app.get("/verify-payment-otherbook/:bookId/:utr/:action", async (req, res) => {
  try {
    const { bookId, utr, action } = req.params;

    const book = await availableCollection.findById(bookId);
    if (!book) {
      return res.status(404).send("<h1>Book not found</h1>");
    }

    if (book.utr !== utr) {
      return res.status(400).send("<h1>Invalid UTR</h1>");
    }

    if (action === "accept") {
      book.paymentStatus = "verified";
      book.paymentVerified = true;
      book.paymentDate = new Date();
      await book.save();

      // Notify user via email
      let user = null;
      if (book.paidBy) {
        if (mongoose.Types.ObjectId.isValid(book.paidBy)) {
          user = await juniorCollection.findById(book.paidBy);
          if (!user) {
            user = await seniorCollection.findById(book.paidBy);
          }
        }
      }

      if (user) {
        const mailOptions = {
          from: process.env.MY_EMAIL || "muthuanushyaprojecthub@gmail.com",
          to: user.mailId,
          subject: "Payment Verified - Contact Details Now Available",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">Payment Verified Successfully!</h2>
              <p>Your payment for <strong>${book.title}</strong> has been verified.</p>
              <p>You can now view the contact details in the BookNest application.</p>
              <p><strong>Contact Number:</strong> ${book.contact}</p>
              <p>Thank you for using BookNest!</p>
            </div>
          `,
        };
        await transporter.sendMail(mailOptions);
      }

      return res.send(`
        <html>
          <head>
            <title>Payment Verified</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #f2bfac, #ffe4d6); }
              .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              h1 { color: #4CAF50; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✓ Payment Verified</h1>
              <p>Contact details have been made visible to the user.</p>
              <p>You can close this window.</p>
            </div>
          </body>
        </html>
      `);
    } else if (action === "reject") {
      book.paymentStatus = "rejected";
      book.paymentVerified = false;
      await book.save();

      return res.send(`
        <html>
          <head>
            <title>Payment Rejected</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #f2bfac, #ffe4d6); }
              .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              h1 { color: #f44336; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✗ Payment Rejected</h1>
              <p>Payment has been rejected. Please contact the admin for more information.</p>
            </div>
          </body>
        </html>
      `);
    }

    res.status(400).send("<h1>Invalid action</h1>");
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).send("<h1>Error verifying payment</h1>");
  }
});

// Get payment status for other books
app.get("/payment-status-otherbook/:bookId/:userId", async (req, res) => {
  try {
    const { bookId, userId } = req.params;

    const book = await availableCollection.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Check if book requires payment
    const needsPayment = book.requiresPayment || (book.price && book.price > 0);

    // Check if this user has paid for this book
    const canViewContact = book.paymentVerified && 
                          book.paidBy && 
                          book.paidBy.toString() === userId;

    // Determine payment status: if no UTR exists, payment hasn't been initiated
    let paymentStatus = "not_initiated";
    if (book.utr && book.utr.trim() !== "") {
      // UTR exists, use the actual payment status
      paymentStatus = book.paymentStatus || "pending";
    } else if (book.paymentStatus && book.paymentStatus !== "pending") {
      // If paymentStatus is set to something other than default pending, use it
      paymentStatus = book.paymentStatus;
    }

    res.json({
      requiresPayment: needsPayment,
      price: book.price || 0,
      paymentStatus: paymentStatus,
      paymentVerified: book.paymentVerified || false,
      canViewContact: canViewContact || !needsPayment,
      contact: (canViewContact || !needsPayment) ? book.contact : null,
    });
  } catch (error) {
    console.error("Error getting payment status:", error);
    res.status(500).json({ message: "Error getting payment status" });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Get token from 'Bearer <token>'

  if (!token) {
    return res
      .status(401)
      .json({ message: "Token not found, authorization denied" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("Decoded User ID:", decoded.userId);
    req.userId = decoded.userId; // Add userId to request object
    console.log("...........", req.userId);
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(403).json({ message: "Token is not valid" });
  }
};

// FOR SENIOR
app.get("/user-details", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId; // Retrieved from token
    console.log("Fetching details for User ID:", userId);

    // Fetch the user's details from the database
    const user = await seniorCollection.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with user details
    res.status(200).json({
      message: "User details retrieved successfully",
      user: {
        mailId: user.mailId,
        name: user.name,
        books: user.books, // Example: Books associated with the user
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//FOR JUNIOR

app.get("/junior-details", authenticateToken, async (req, res) => {
  try {
    const userId = req.userId; // Retrieved from token
    console.log("Fetching details for User ID:", userId);

    // Fetch the user's details from the database
    const user = await juniorCollection.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with user details
    res.status(200).json({
      message: "User details retrieved successfully",
      user: {
        userId: user._id, // CRITICAL: Include userId for UTR submission and other operations
        mailId: user.mailId,
        name: user.name,
        picture: user.picture,
        books: user.books, // Example: Books associated with the user
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const insertInitialData = async () => {
  try {
    console.log("Checking MongoDB connection...");

    // Retrieve all existing books
    // const existingBooks = await collection.find();

    // Define initial data to be inserted
    const initialData = [
      {
        bookTitle: "MA8151 ENGINEERING MATHEMATICS 1",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "CY8151 ENGINEERING CHEMISTRY",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "PH8151 Engineering Physics",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8151 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8152 Engineering Graphics",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "HS8151 Communicative English",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8161 Problem Solving and Python Programming Laboratory",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "BS8161 Physics and chemistry Laboratory",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "I sem",
      },

      //---------------------------------------------SECOND SEM-----------------------------------------//

      {
        bookTitle: "HS8251 Technical English",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "MA8251 Engineering Mathematics 2",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "PH8252 Physics for Information Science",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "BE8255 Basic Electrical and Electronics Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "CS8251 Programming in C",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE8261 Engineering Practices Laboratory",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "CS8261 C Programming Laboratory",
        Year: "I Year",
        Regulation: "2017",
        department: "CSE",
        semester: "II sem",
      },

      //-----------------------------------------Third Sem----------------------------------------------//

      {
        bookTitle: "MA8351 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8351 Digital Principles and System Design",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8391 Data Structures",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8392 Object-Oriented Programming",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8395 Communication Engineering",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8381 Data Structures Laboratory",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8383 Object-Oriented Programming Laboratory",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "HS8381 Interpersonal Skills/Listening & Speaking",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8382 Digital Systems Laboratory",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "III sem",
      },
      //-----------------------------------------Fourth Sem----------------------------------------------//

      {
        bookTitle: "MA8402 Probability and Queueing Theory",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8491 Computer Architecture",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8492 Database Management Systems",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8451 Design and Analysis of Algorithms",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8493 Operating Systems",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8494 Software Engineering",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8481 Database Management Systems Laboratory",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8461 Operating Systems Laboratory",
        Year: "II Year",
        Regulation: "2017",
        department: "CSE",
        semester: "IV sem",
      },

      //-----------------------------------------Fifth Sem----------------------------------------------//

      {
        bookTitle: "MA8551 Algebra and Number Theory",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8591 Computer Networks",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "EC8691 Microprocessors and Microcontrollers",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8501 Theory of Computation",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8592 Object-Oriented Analysis and Design",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "OCE552 Geographic Information System",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8581 Networks Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8582 Object-Oriented Analysis and Design Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "V sem",
      },

      //-----------------------------------------sixth Sem----------------------------------------------//

      {
        bookTitle: "CS8651 Internet Programming",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8691 Artificial Intelligence",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8601 Mobile Computing",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8602 Compiler Design",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8603 Distributed Systems",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "HS8581 Professional communication",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8661 Internet Programming Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8662 Mobile Application Development Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8611 Mini Project Idea",
        Year: "III Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VI sem",
      },

      //-----------------------------------------seventh Sem----------------------------------------------//

      {
        bookTitle: "MG8591 Principles of Management",
        Year: "IV Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "CS8792 Cryptography and Network Security",
        Year: "IV Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "CS8791 Cloud computing",
        Year: "IV Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "IT8075 Software Project Management",
        Year: "IV Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "OBM752 Hospital Management",
        Year: "IV Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "CS8711 Cloud Computing Laboratory",
        Year: "IV Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "IT8761 Security Laboratory",
        Year: "IV Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VII sem",
      },

      //-----------------------------------------Eighth Sem----------------------------------------------//

      {
        bookTitle: "CS8811 Project Work",
        Year: "IV Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VIII sem",
      },
      {
        bookTitle: "IT8073 Information Security",
        Year: "IV Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VIII sem",
      },

      {
        bookTitle: "CS8080 Information Retrieval Techniques",
        Year: "IV Year",
        Regulation: "2017",
        department: "CSE",
        semester: "VIII sem",
      },

      //-----------------------------------------ECE First sem----------------------------------------------//
      {
        bookTitle: "MA8151 Engineering Mathematics I",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "PH8151 Engineering Physics",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "CY8151 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8151 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8152 Engineering Graphics",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "HS8151 Communicative English",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "I sem",
      },

      //-----------------------------------------ECE Second Sem----------------------------------------------//
      {
        bookTitle: "MA8251 Engineering Mathematics II",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "PH8253 Physics for Electronics Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle:
          "BE8255 Basic Electrical, Electronics and Measurement Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "CS8251 Programming in C",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "HS8251 Technical English",
        Year: "I Year",
        Regulation: "2017",
        department: "ECE",
        semester: "II sem",
      },

      //-----------------------------------------ECE III Sem----------------------------------------------//
      {
        bookTitle: "MA8352 Linear Algebra and Partial Differential Equations",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8351 Electronic Circuits I",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8352 Signals and Systems",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8391 Control Systems Engineering",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8392 Digital Electronics",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8361 Analog and Digital Circuits Laboratory",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "III sem",
      },

      //-----------------------------------------ECE IV Sem----------------------------------------------//
      {
        bookTitle: "MA8451 Probability and Random Processes",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "EC8452 Electromagnetic Fields",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "EC8491 Communication Theory",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "EC8451 Electronic Circuits II",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "GE8292 Engineering Mechanics",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "EC8461 Circuits Design and Simulation Laboratory",
        Year: "II Year",
        Regulation: "2017",
        department: "ECE",
        semester: "IV sem",
      },

      //-----------------------------------------ECE V Sem----------------------------------------------//
      {
        bookTitle: "EC8501 Digital Communication",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "EC8553 Discrete-Time Signal Processing",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "EC8552 Computer Architecture and Organization",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "EC8502 Microprocessors and Microcontrollers",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "EC8511 Digital Signal Processing Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "EC8512 Microprocessors and Microcontrollers Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "V sem",
      },

      //-----------------------------------------ECE VI Sem----------------------------------------------//
      {
        bookTitle: "EC8651 Transmission Lines and RF Systems",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VI sem",
      },
      {
        bookTitle: "EC8652 VLSI Design",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VI sem",
      },
      {
        bookTitle: "EC8653 Antennas and Wave Propagation",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VI sem",
      },
      {
        bookTitle: "MG8591 Principles of Management",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VI sem",
      },
      {
        bookTitle: "EC8661 VLSI Design Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VI sem",
      },

      //-----------------------------------------ECE VII Sem----------------------------------------------//
      {
        bookTitle: "EC8701 Antennas and Microwave Engineering",
        Year: "IV Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VII sem",
      },
      {
        bookTitle: "EC8751 Optical Communication",
        Year: "IV Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VII sem",
      },
      {
        bookTitle: "EC8702 Embedded and Real-Time Systems",
        Year: "IV Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VII sem",
      },
      {
        bookTitle: "EC8703 Ad Hoc and Wireless Sensor Networks",
        Year: "IV Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VII sem",
      },

      //-----------------------------------------ECE VIII Sem----------------------------------------------//
      {
        bookTitle: "EC8811 Project Work",
        Year: "IV Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VIII sem",
      },
      {
        bookTitle: "GE8077 Total Quality Management",
        Year: "IV Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VIII sem",
      },
      {
        bookTitle: "EC8093 Internet of Things",
        Year: "IV Year",
        Regulation: "2017",
        department: "ECE",
        semester: "VIII sem",
      },

      //-----------------------------------------EEE I Sem---------------------------------------------//

      {
        bookTitle: "HS8151 Communicative English",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "MA8151 Engineering Mathematics I",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "PH8151 Engineering Physics",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "CY8151 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8151 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8152 Engineering Graphics",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "I sem",
      },

      //-----------------------------------------EEE II Sem----------------------------------------------//
      {
        bookTitle: "HS8251 Technical English",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "MA8251 Engineering Mathematics II",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "PH8253 Physics for Electrical Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle:
          "BE8255 Basic Electrical, Electronics and Measurement Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "CS8251 Programming in C",
        Year: "I Year",
        Regulation: "2017",
        department: "EEE",
        semester: "II sem",
      },

      //-----------------------------------------EEE III Sem---------------------------------------------//
      {
        bookTitle: "MA8353 Transforms and Partial Differential Equations",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "EE8351 Digital Logic Circuits",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "EE8301 Electrical Machines I",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "EE8302 Electro Magnetic Theory",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8353 Electron Devices and Circuits",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "EE8311 Electrical Machines Laboratory I",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "III sem",
      },

      //-----------------------------------------EEE IV Sem----------------------------------------------//
      {
        bookTitle: "MA8491 Numerical Methods",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "EE8401 Electrical Machines II",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "EE8402 Transmission and Distribution",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "EE8403 Measurements and Instrumentation",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "EE8451 Linear Integrated Circuits and Applications",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "IC8451 Control Systems",
        Year: "II Year",
        Regulation: "2017",
        department: "EEE",
        semester: "IV sem",
      },

      //-----------------------------------------EEE V Sem----------------------------------------------//
      {
        bookTitle: "EE8501 Power System Analysis",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "EE8551 Microprocessors and Microcontrollers",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "EE8552 Power Electronics",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "EE8591 Digital Signal Processing",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8392 Object Oriented Programming",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "EE8511 Control and Instrumentation Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "V sem",
      },

      //-----------------------------------------EEE VI Sem----------------------------------------------//

      {
        bookTitle: "EE8601 Solid State Drives",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "EE8602 Protection and Switchgear",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "EE8691 Embedded Systems",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "EE8005 Special Electrical Machines",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "OAN551 Sensors and Transducers",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "EE8611 Mini Project",
        Year: "III Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VI sem",
      },

      //-----------------------------------------EEE VII Sem----------------------------------------------//
      {
        bookTitle: "EE8701 High Voltage Engineering",
        Year: "IV Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VII sem",
      },
      {
        bookTitle: "EE8702 Power System Operation and Control",
        Year: "IV Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VII sem",
      },
      {
        bookTitle: "EE8703 Renewable Energy Systems",
        Year: "IV Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "IV Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VII sem",
      },
      {
        bookTitle: "Open Elective I",
        Year: "IV Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VII sem",
      },

      //-----------------------------------------EEE VIII Sem----------------------------------------------//

      {
        bookTitle: "EE8811 Project Work",
        Year: "IV Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VIII sem",
      },
      {
        bookTitle: "EE8002 Design of Electrical Apparatus",
        Year: "IV Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VIII sem",
      },
      {
        bookTitle: "Open Elective II",
        Year: "IV Year",
        Regulation: "2017",
        department: "EEE",
        semester: "VIII sem",
      },

      //-----------------------------------------IT I sem----------------------------------------------//

      {
        bookTitle: "HS8151 Communicative English",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "MA8151 Engineering Mathematics I",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "PH8151 Engineering Physics",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "CY8151 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "GE8151 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "GE8152 Engineering Graphics",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "I sem",
      },

      //-----------------------------------------IT II sem----------------------------------------------//
      {
        bookTitle: "HS8251 Technical English",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "MA8251 Engineering Mathematics II",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "PH8252 Physics for Information Technology",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle:
          "BE8255 Basic Electrical, Electronics and Instrumentation Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "CS8251 Programming in C",
        Year: "I Year",
        Regulation: "2017",
        department: "IT",
        semester: "II sem",
      },

      //-----------------------------------------IT III sem----------------------------------------------//
      {
        bookTitle: "MA8351 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS8351 Digital Principles and System Design",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS8391 Data Structures",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "EC8395 Communication Engineering",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS8392 Object Oriented Programming",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS8381 Data Structures Laboratory",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS8383 Object Oriented Programming Laboratory",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "III sem",
      },

      //-----------------------------------------IT IV sem----------------------------------------------//
      {
        bookTitle: "MA8402 Probability and Queueing Theory",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8491 Computer Architecture",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8492 Database Management Systems",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8451 Design and Analysis of Algorithms",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "IT8401 Information Theory and Coding",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8494 Software Engineering",
        Year: "II Year",
        Regulation: "2017",
        department: "IT",
        semester: "IV sem",
      },

      //-----------------------------------------IT V sem----------------------------------------------//
      {
        bookTitle: "CS8591 Computer Networks",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "CS8501 Theory of Computation",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "IT8501 Web Technology",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "CS8592 Object Oriented Analysis and Design",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "OCE551 Environmental and Social Impact Assessment",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "CS8582 Object Oriented Analysis and Design Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "V sem",
      },

      //-----------------------------------------IT VI sem----------------------------------------------//
      {
        bookTitle: "CS8651 Internet Programming",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8691 Artificial Intelligence",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "IT8601 Computational Intelligence",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "IT8602 Mobile Communication",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8603 Distributed Systems",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8661 Internet Programming Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "IT",
        semester: "VI sem",
      },

      //-----------------------------------------IT VII sem----------------------------------------------//
      {
        bookTitle: "MG8591 Principles of Management",
        Year: "IV Year",
        Regulation: "2017",
        department: "IT",
        semester: "VII sem",
      },
      {
        bookTitle: "CS8792 Cryptography and Network Security",
        Year: "IV Year",
        Regulation: "2017",
        department: "IT",
        semester: "VII sem",
      },
      {
        bookTitle: "IT8701 Information Management",
        Year: "IV Year",
        Regulation: "2017",
        department: "IT",
        semester: "VII sem",
      },
      {
        bookTitle: "IT8702 Business Intelligence",
        Year: "IV Year",
        Regulation: "2017",
        department: "IT",
        semester: "VII sem",
      },
      {
        bookTitle: "Open Elective I",
        Year: "IV Year",
        Regulation: "2017",
        department: "IT",
        semester: "VII sem",
      },

      //-----------------------------------------IT VIII sem----------------------------------------------//
      {
        bookTitle: "IT8811 Project Work",
        Year: "IV Year",
        Regulation: "2017",
        department: "IT",
        semester: "VIII sem",
      },
      {
        bookTitle: "Open Elective II",
        Year: "IV Year",
        Regulation: "2017",
        department: "IT",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective V",
        Year: "IV Year",
        Regulation: "2017",
        department: "IT",
        semester: "VIII sem",
      },

      //-----------------------------------------Mechanical I sem----------------------------------------------//

      {
        bookTitle: "HS8151 Communicative English",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "MA8151 Engineering Mathematics I",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "PH8151 Engineering Physics",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "CY8151 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "GE8151 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "GE8152 Engineering Graphics",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "I sem",
      },

      //-----------------------------------------Mechanical II sem----------------------------------------------//
      {
        bookTitle: "HS8251 Technical English",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "MA8251 Engineering Mathematics II",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "PH8253 Physics for Mechanical Sciences",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle:
          "BE8253 Basic Electrical, Electronics and Instrumentation Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "GE8292 Engineering Mechanics",
        Year: "I Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "II sem",
      },

      //-----------------------------------------Mechanical III sem----------------------------------------------//
      {
        bookTitle: "MA8353 Transforms and Partial Differential Equations",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "ME8391 Engineering Thermodynamics",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "CE8394 Fluid Mechanics and Machinery",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "ME8351 Manufacturing Technology I",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "EE8353 Electrical Drives and Controls",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "ME8361 Manufacturing Technology Laboratory I",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "ME8381 Computer Aided Machine Drawing",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "III sem",
      },

      //-----------------------------------------Mechanical IV sem----------------------------------------------//
      {
        bookTitle: "MA8452 Statistics and Numerical Methods",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "ME8492 Kinematics of Machinery",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "ME8451 Manufacturing Technology II",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "ME8491 Engineering Metallurgy",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "CE8491 Strength of Materials for Mechanical Engineers",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "ME8462 Manufacturing Technology Laboratory II",
        Year: "II Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "IV sem",
      },

      //-----------------------------------------Mechanical V sem----------------------------------------------//
      {
        bookTitle: "ME8595 Thermal Engineering I",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "V sem",
      },
      {
        bookTitle: "ME8593 Design of Machine Elements",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "V sem",
      },
      {
        bookTitle: "ME8501 Metrology and Measurements",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "V sem",
      },
      {
        bookTitle: "ME8594 Dynamics of Machines",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "V sem",
      },
      {
        bookTitle: "OAI551 Operations Research",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "V sem",
      },
      {
        bookTitle: "ME8511 Kinematics and Dynamics Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "V sem",
      },

      //-----------------------------------------Mechanical VI sem----------------------------------------------//
      {
        bookTitle: "ME8651 Design of Transmission Systems",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VI sem",
      },
      {
        bookTitle: "ME8691 Computer Aided Design and Manufacturing",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VI sem",
      },
      {
        bookTitle: "ME8693 Heat and Mass Transfer",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VI sem",
      },
      {
        bookTitle: "ME8692 Finite Element Analysis",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VI sem",
      },
      {
        bookTitle: "ME8694 Hydraulics and Pneumatics",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VI sem",
      },
      {
        bookTitle: "ME8681 CAD/CAM Laboratory",
        Year: "III Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VI sem",
      },

      //-----------------------------------------Mechanical VII sem----------------------------------------------//
      {
        bookTitle: "ME8792 Power Plant Engineering",
        Year: "IV Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VII sem",
      },
      {
        bookTitle: "ME8793 Process Planning and Cost Estimation",
        Year: "IV Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VII sem",
      },
      {
        bookTitle: "OIM751 Operations Research",
        Year: "IV Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "IV Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VII sem",
      },
      {
        bookTitle: "Open Elective I",
        Year: "IV Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VII sem",
      },

      //-----------------------------------------Mechanical VIII sem----------------------------------------------//

      {
        bookTitle: "ME8811 Project Work",
        Year: "IV Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "IV Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "IV Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VIII sem",
      },
      {
        bookTitle: "Open Elective II",
        Year: "IV Year",
        Regulation: "2017",
        department: "Mechanical",
        semester: "VIII sem",
      },

      //-----------------------------------------CSE I sem 2021----------------------------------------------//

      // Semester I
      {
        bookTitle: "HS3152 Professional English - I",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "MA3151 Matrices and Calculus",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "PH3151 Engineering Physics",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "CY3151 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE3151 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE3152 தமிழர் மரபு / Heritage of Tamils",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: " GE3171 Problem Solving and Python Programming Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "BS3171 Physics and Chemistry Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: ". GE3172 English Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },

      // Semester II
      {
        bookTitle: " HS3252 Professional English - II",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "MA3251 Statistics and Numerical Methods",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: " PH3256 Physics for Information Science",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "BE3251 Basic Electrical and Electronics Engineering",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: " GE3251 Engineering Graphics",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "CS3251 Programming in C",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE3252 Tamils and Technology",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE3271 Engineering Practices Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "CS3271 Programming in C Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE3272 Communication Laboratory / Foreign Language",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },

      // Semester III
      {
        bookTitle: "MA3354 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3351 Digital Principles and Computer Organization",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3352 Foundations of Data Science",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: " CS3301 Data Structures",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3391 Object Oriented Programming",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3311 Data Structures Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3381 Object Oriented Programming Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3361 Data Science Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },

      // Semester IV
      {
        bookTitle: "CS3452 Theory of Computation",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3491 Artificial Intelligence and Machine Learning",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3492 Database Management Systems",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3401  Algorithms",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3451 Introduction to Operating Systems",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: " GE3451 Environmental Sciences and Sustainability",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3461  Operating Systems Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3481 Database Management Systems Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },

      // Semester V
      {
        bookTitle: "CS3591 Computer Networks",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS3501 Compiler Design",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CB3491 Cryptography and Cyber Security",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS3551 Distributed Computing",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },

      // Semester VI
      {
        bookTitle: "CCS356 Object Oriented Software Engineering",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS3691 Embedded Systems and IoT",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Open Elective – I",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Mandatory Course II",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },

      // Semester VII
      {
        bookTitle: "GE3791 Human Values and Ethics",
        Year: "IV Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "HS3152 Professional English - I",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "MA3151 Matrices and Calculus",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "PH3151 Engineering Physics",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "CY3151 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE3151 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE3152 Heritage of Tamils",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE3171 Problem Solving and Python Programming Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "BS3171 Physics and Chemistry Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE3172 English Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "I sem",
      },

      // Semester II
      {
        bookTitle: "HS3252 Professional English - II",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "MA3251 Statistics and Numerical Methods",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "PH3256 Physics for Information Science",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "BE3251 Basic Electrical and Electronics Engineering",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE3251 Engineering Graphics",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "CS3251 Programming in C",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE3252 Tamils and Technology",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "NCC Credit Course Level 1",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE3271 Engineering Practices Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "CS3271 Programming in C Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE3272 Communication Laboratory / Foreign Language",
        Year: "I Year",
        Regulation: "2021",
        department: "CSE",
        semester: "II sem",
      },

      // Semester III
      {
        bookTitle: "MA3354 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3351 Digital Principles and Computer Organization",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3352 Foundations of Data Science",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CD3291 Data Structures and Algorithms",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3391 Object Oriented Programming",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CD3281 Data Structures and Algorithms Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3381 Object Oriented Programming Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS3361 Data Science Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "GE3361 Professional Development",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "III sem",
      },

      // Semester IV
      {
        bookTitle: "CS3452 Theory of Computation",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3491 Artificial Intelligence and Machine Learning",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3492 Database Management Systems",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "IT3401 Web Essentials",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3451 Introduction to Operating Systems",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "GE3451 Environmental Sciences and Sustainability",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "NCC Credit Course Level 2",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3461 Operating Systems Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3481 Database Management Systems Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "CSE",
        semester: "IV sem",
      },

      // Semester V
      {
        bookTitle: "CS3591 Computer Networks",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "IT3501 Full Stack Web Development",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS3551 Distributed Computing",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS3691 Embedded Systems and IoT",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "Mandatory Course - I",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "IT3511 Full Stack Web Development Laboratory",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "V sem",
      },

      // Semester VI
      {
        bookTitle: "CCS356 Object Oriented Software Engineering",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Open Elective – I",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective V",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective VI",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "Mandatory Course - II",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "NCC Credit Course Level 3",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "IT3681 Mobile Applications Development Laboratory",
        Year: "III Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VI sem",
      },

      // Semester VII / VIII
      {
        bookTitle: "GE3791 Human Values and Ethics for IT",
        Year: "IV Year",
        Regulation: "2021",
        department: "CSE",
        semester: "VII/VIII",
      },

      // Semester I
      {
        bookTitle: "Professional English - I",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "Matrices and Calculus",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "Engineering Physics",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "Engineering Chemistry",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "Heritage of Tamils",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "Problem Solving and Python Programming Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "Physics and Chemistry Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "English Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "I sem",
      },

      // Semester II
      {
        bookTitle: "Professional English - II",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "Statistics and Numerical Methods",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "Physics for Electrical Engineering",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "Basic Civil and Mechanical Engineering",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "Engineering Graphics",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "Electric Circuit Analysis",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "Tamils and Technology",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "Engineering Practices Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "Electric Circuits Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "Communication Laboratory / Foreign Language",
        Year: "I Year",
        Regulation: "2021",
        department: "EEE",
        semester: "II sem",
      },

      // Semester III
      {
        bookTitle: "Probability and Complex Functions",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "Electromagnetic Fields",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "Digital Logic Circuits",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "Electron Devices and Circuits",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "Electrical Machines - I",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "C Programming and Data Structures",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "Electronic Devices and Circuits Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "Electrical Machines Laboratory – I",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "C Programming and Data Structures Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "Professional Development",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "III sem",
      },

      // Semester IV
      {
        bookTitle: "Environmental Sciences and Sustainability",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "Transmission and Distribution",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "Linear Integrated Circuits",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "Measurements and Instrumentation",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "Microprocessor and Microcontroller",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "Electrical Machines - II",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "Electrical Machines Laboratory - II",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "Linear and Digital Circuits Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "Microprocessor and Microcontroller Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "EEE",
        semester: "IV sem",
      },

      // Semester V
      {
        bookTitle: "Power System Analysis",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "Power Electronics",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "Control Systems",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "Power Electronics Laboratory",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "Control and Instrumentation Laboratory",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "V sem",
      },

      // Semester VI
      {
        bookTitle: "Protection and Switchgear",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "Power System Operation and Control",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "Open Elective – I",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective V",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective VI",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "Power System Laboratory",
        Year: "III Year",
        Regulation: "2021",
        department: "EEE",
        semester: "VI sem",
      },

      // Semester VII/VIII
      {
        bookTitle: "High Voltage Engineering",
        Year: "IV Year",
        Regulation: "2021",
        department: "EEE",
        semester: "VII/VIII sem",
      },
      {
        bookTitle: "Human Values and Ethics",
        Year: "IV Year",
        Regulation: "2021",
        department: "EEE",
        semester: "VII/VIII sem",
      },

      // Semester I
      {
        bookTitle: "HS3152 Professional English - I",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "MA3151 Matrices and Calculus",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "PH3151 Engineering Physics",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "CY3151 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "GE3151 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "GE3152 தமிழர்மரபு / Heritage of Tamils",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "I sem",
      },
      // Practical
      {
        bookTitle: "GE3171 Problem Solving and Python Programming Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "BS3171 Physics and Chemistry Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "GE3172 English Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "I sem",
      },

      // Semester II
      {
        bookTitle: "HS3252 Professional English - II",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "MA3251 Statistics and Numerical Methods",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "PH3256 Physics for Information Science",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "BE3251 Basic Electrical and Electronics Engineering",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "GE3251 Engineering Graphics",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "CS3251 Programming in C",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "GE3252 தமிழரும் ததொழில்நுட்பமும் / Tamils and Technology",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "NCC Credit Course Level 1",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },
      // Practical
      {
        bookTitle: "GE3271 Engineering Practices Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "CS3271 Programming in C Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "GE3272 Communication Laboratory / Foreign Language",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "II sem",
      },

      // Semester III
      {
        bookTitle: "MA3354 Discrete Mathematics",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS3351 Digital Principles and Computer Organization",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS3352 Foundations of Data Science",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CD3291 Data Structures and Algorithms",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS3391 Object Oriented Programming",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "III sem",
      },
      // Practical
      {
        bookTitle: "CD3281 Data Structures and Algorithms Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS3381 Object Oriented Programming Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS3361 Data Science Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "GE3361 Professional Development",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "III sem",
      },

      // Semester IV
      {
        bookTitle: "CS3452 Theory of Computation",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3491 Artificial Intelligence and Machine Learning",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3492 Database Management Systems",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "IT3401 Web Essentials",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3451 Introduction to Operating Systems",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "GE3451 Environmental Sciences and Sustainability",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "NCC Credit Course Level 2",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "IV sem",
      },
      // Practical
      {
        bookTitle: "CS3461 Operating Systems Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS3481 Database Management Systems Laboratory",
        Year: "I Year",
        Regulation: "2021",
        department: "IT",
        semester: "IV sem",
      },

      // Semester V
      {
        bookTitle: "CS3591 Computer Networks",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "IT3501 Full Stack Web Development",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "CS3551 Distributed Computing",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "CS3691 Embedded Systems and IoT",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "Mandatory Course- I",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "V sem",
      },
      // Practical
      {
        bookTitle: "IT3511 Full Stack Web Development Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "V sem",
      },

      // Semester VI
      {
        bookTitle: "CCS356 Object Oriented Software Engineering",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "Open Elective – I",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective V",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective VI",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "Mandatory Course-II",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "NCC Credit Course Level 3",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "VI sem",
      },
      // Practical
      {
        bookTitle: "IT3681 Mobile Applications Development Laboratory",
        Year: "II Year",
        Regulation: "2021",
        department: "IT",
        semester: "VI sem",
      },

      // Semester VII
      {
        bookTitle: "GE3791 Human Values and Ethics",
        Year: "III Year",
        Regulation: "2021",
        department: "IT",
        semester: "VII sem",
      },
      // Add any additional semester courses as needed

      {
        bookTitle: "Professional English - I",
        Year: "I Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "Matrices and Calculus",
        Year: "I Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "Engineering Physics",
        Year: "I Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "Engineering Chemistry",
        Year: "I Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "Heritage of Tamils",
        Year: "I Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "Professional English - II",
        Year: "II Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "Statistics and Numerical Methods",
        Year: "II Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "Materials Science",
        Year: "II Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "Basic Electrical and Electronics Engineering",
        Year: "II Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "Engineering Graphics",
        Year: "II Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "Tamils and Technology",
        Year: "II Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "Engineering Mechanics",
        Year: "III Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "Engineering Thermodynamics",
        Year: "III Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "Fluid Mechanics and Machinery",
        Year: "III Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "Engineering Materials and Metallurgy",
        Year: "III Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "Manufacturing Processes",
        Year: "III Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "Theory of Machines",
        Year: "IV Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "Thermal Engineering",
        Year: "IV Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "Hydraulics and Pneumatics",
        Year: "IV Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "Manufacturing Technology",
        Year: "IV Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "Strength of Materials",
        Year: "IV Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "Design of Machine Elements",
        Year: "V Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "V sem",
      },
      {
        bookTitle: "Metrology and Measurements",
        Year: "V Year",
        Regulation: "2021",
        department: "Mechanical",
        semester: "V sem",
      },

      {
        bookTitle: "Professional English - I",
        Year: "I Year",
        Regulation: "2021",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "Matrices and Calculus",
        Year: "I Year",
        Regulation: "2021",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "Engineering Physics",
        Year: "I Year",
        Regulation: "2021",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "Engineering Chemistry",
        Year: "I Year",
        Regulation: "2021",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2021",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "Heritage of Tamils",
        Year: "I Year",
        Regulation: "2021",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "Professional English - II",
        Year: "II Year",
        Regulation: "2021",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "Statistics and Numerical Methods",
        Year: "II Year",
        Regulation: "2021",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "Physics for Electronics Engineering",
        Year: "II Year",
        Regulation: "2021",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "Electrical and Instrumentation Engineering",
        Year: "II Year",
        Regulation: "2021",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "Engineering Graphics",
        Year: "II Year",
        Regulation: "2021",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "Circuit Analysis",
        Year: "II Year",
        Regulation: "2021",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "Tamils and Technology",
        Year: "II Year",
        Regulation: "2021",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "Random Processes and Linear Algebra",
        Year: "III Year",
        Regulation: "2021",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "C Programming and Data Structures",
        Year: "III Year",
        Regulation: "2021",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "Signals and Systems",
        Year: "III Year",
        Regulation: "2021",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "Electronic Devices and Circuits",
        Year: "III Year",
        Regulation: "2021",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "Control Systems",
        Year: "III Year",
        Regulation: "2021",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "Digital Systems Design",
        Year: "III Year",
        Regulation: "2021",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "Electromagnetic Fields",
        Year: "IV Year",
        Regulation: "2021",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "Networks and Security",
        Year: "IV Year",
        Regulation: "2021",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "Linear Integrated Circuits",
        Year: "IV Year",
        Regulation: "2021",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "Digital Signal Processing",
        Year: "IV Year",
        Regulation: "2021",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "Communication Systems",
        Year: "IV Year",
        Regulation: "2021",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "Wireless Communication",
        Year: "V Year",
        Regulation: "2021",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "VLSI and Chip Design",
        Year: "V Year",
        Regulation: "2021",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "Transmission lines and RF Systems",
        Year: "V Year",
        Regulation: "2021",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "Embedded Systems and IOT Design",
        Year: "VI Year",
        Regulation: "2021",
        department: "ECE",
        semester: "VI sem",
      },
      {
        bookTitle: "Artificial Intelligence and Machine Learning",
        Year: "VI Year",
        Regulation: "2021",
        department: "ECE",
        semester: "VI sem",
      },
      {
        bookTitle: "Human Values and Ethics",
        Year: "VII / VIII",
        Regulation: "2021",
        department: "ECE",
        semester: "VII / VIII sem",
      },

      {
        bookTitle: "Professional English - I",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "I sem",
      },
      {
        bookTitle: "Matrices and Calculus",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "I sem",
      },
      {
        bookTitle: "Engineering Physics",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "I sem",
      },
      {
        bookTitle: "Engineering Chemistry",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "I sem",
      },
      {
        bookTitle: "Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "I sem",
      },
      {
        bookTitle: "Heritage of Tamils",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "I sem",
      },

      {
        bookTitle: "Professional English - II",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "Statistics and Numerical Methods",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "Physics for Information Science",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "Basic Electrical and Electronics Engineering",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "Engineering Graphics",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "Data Structures Design",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "Tamils and Technology",
        Year: "I Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "II sem",
      },

      {
        bookTitle: "Discrete Mathematics",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "III sem",
      },
      {
        bookTitle: "Digital Principles and Computer Organization",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "III sem",
      },
      {
        bookTitle: "Database Design and Management",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "III sem",
      },
      {
        bookTitle: "Design and Analysis of Algorithms",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "III sem",
      },
      {
        bookTitle: "Data Exploration and Visualization",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "III sem",
      },
      {
        bookTitle: "Artificial Intelligence",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "III sem",
      },

      {
        bookTitle: "Probability and Statistics",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "IV sem",
      },
      {
        bookTitle: "Operating Systems",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "IV sem",
      },
      {
        bookTitle: "Machine Learning",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "IV sem",
      },
      {
        bookTitle: "Fundamentals of Data Science and Analytics",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "IV sem",
      },
      {
        bookTitle: "Computer Networks",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "IV sem",
      },
      {
        bookTitle: "Environmental Sciences and Sustainability",
        Year: "II Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "IV sem",
      },

      {
        bookTitle: "Deep Learning",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "V sem",
      },
      {
        bookTitle: "Data and Information Security",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "V sem",
      },
      {
        bookTitle: "Distributed Computing",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "V sem",
      },
      {
        bookTitle: "Big Data Analytics",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "V sem",
      },
      {
        bookTitle: "Mandatory Course-I",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "V sem",
      },

      {
        bookTitle: "Embedded Systems and IoT",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "Artificial Intelligence and Machine Learning",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "Open Elective– I",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective V",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective VI",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "Mandatory Course-II",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "NCC Credit Course Level 3",
        Year: "III Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "VI sem",
      },

      {
        bookTitle: "Human Values and Ethics",
        Year: "IV Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "VII sem",
      },
      {
        bookTitle: "Open Elective I",
        Year: "IV Year",
        Regulation: "2021",
        department: "AI & DS",
        semester: "VII sem",
      },

      // ========== REGULATION 2025 BOOKS ==========
      
      // CSE - I Year - I Semester
      {
        bookTitle: "MA8251 Engineering Mathematics - I",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "PH8251 Engineering Physics",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "CY8251 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8251 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8252 Engineering Graphics",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "HS8251 Communicative English",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8261 Problem Solving and Python Programming Laboratory",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "I sem",
      },
      {
        bookTitle: "BS8261 Physics and Chemistry Laboratory",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "I sem",
      },

      // CSE - I Year - II Semester
      {
        bookTitle: "MA8252 Engineering Mathematics - II",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "PH8252 Materials Science",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "BE8251 Basic Electrical and Electronics Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE8292 Engineering Mechanics",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "CS8251 Programming in C",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "GE8261 Communicative English Laboratory",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "II sem",
      },
      {
        bookTitle: "CS8261 C Programming Laboratory",
        Year: "I Year",
        Regulation: "2025",
        department: "CSE",
        semester: "II sem",
      },

      // CSE - II Year - III Semester
      {
        bookTitle: "MA8351 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8351 Digital Principles and System Design",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8391 Data Structures",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8392 Object Oriented Programming",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8395 Communication Engineering",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8381 Data Structures Laboratory",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8383 Object Oriented Programming Laboratory",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "III sem",
      },
      {
        bookTitle: "CS8382 Digital Systems Laboratory",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "III sem",
      },

      // CSE - II Year - IV Semester
      {
        bookTitle: "MA8402 Probability and Queueing Theory",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8491 Computer Architecture",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8492 Database Management Systems",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8451 Design and Analysis of Algorithms",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8493 Operating Systems",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8481 Database Management Systems Laboratory",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8461 Operating Systems Laboratory",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "IV sem",
      },
      {
        bookTitle: "HS8461 Advanced Reading and Writing",
        Year: "II Year",
        Regulation: "2025",
        department: "CSE",
        semester: "IV sem",
      },

      // CSE - III Year - V Semester
      {
        bookTitle: "MA8551 Algebra and Number Theory",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8591 Computer Networks",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8592 Object Oriented Analysis and Design",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8501 Theory of Computation",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8593 Compiler Design",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8581 Networks Laboratory",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8582 Object Oriented Analysis and Design Laboratory",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "V sem",
      },
      {
        bookTitle: "CS8583 Compiler Design Laboratory",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "V sem",
      },

      // CSE - III Year - VI Semester
      {
        bookTitle: "CS8651 Internet Programming",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8691 Artificial Intelligence",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8601 Mobile Computing",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8602 Wireless Communication",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8603 Distributed Systems",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8661 Internet Programming Laboratory",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8662 Mobile Application Development Laboratory",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VI sem",
      },
      {
        bookTitle: "GE8761 Professional Communication Laboratory",
        Year: "III Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VI sem",
      },

      // CSE - IV Year - VII Semester
      {
        bookTitle: "CS8791 Cryptography and Network Security",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "CS8792 Cloud Computing",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "CS8793 Cloud Services and IoT",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "CS8701 Computational Intelligence",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "CS8711 Cloud Computing Laboratory",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VII sem",
      },
      {
        bookTitle: "GE8791 Soft Skills",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VII sem",
      },

      // CSE - IV Year - VIII Semester
      {
        bookTitle: "CS8801 Digital Image Processing",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VIII sem",
      },
      {
        bookTitle: "CS8802 Human Computer Interaction",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VIII sem",
      },
      {
        bookTitle: "Open Elective",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VIII sem",
      },
      {
        bookTitle: "Project Work",
        Year: "IV Year",
        Regulation: "2025",
        department: "CSE",
        semester: "VIII sem",
      },

      // IT - I Year - I Semester
      {
        bookTitle: "MA8251 Engineering Mathematics - I",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "PH8251 Engineering Physics",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "CY8251 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "GE8251 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "GE8252 Engineering Graphics",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "I sem",
      },
      {
        bookTitle: "HS8251 Communicative English",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "I sem",
      },

      // IT - I Year - II Semester
      {
        bookTitle: "MA8252 Engineering Mathematics - II",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "PH8252 Materials Science",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "BE8251 Basic Electrical and Electronics Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "IT8251 Programming in C",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "II sem",
      },
      {
        bookTitle: "HS8252 Technical English",
        Year: "I Year",
        Regulation: "2025",
        department: "IT",
        semester: "II sem",
      },

      // IT - II Year - III Semester
      {
        bookTitle: "MA8351 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2025",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS8391 Data Structures",
        Year: "II Year",
        Regulation: "2025",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS8392 Object Oriented Programming",
        Year: "II Year",
        Regulation: "2025",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "CS8351 Digital Principles and System Design",
        Year: "II Year",
        Regulation: "2025",
        department: "IT",
        semester: "III sem",
      },
      {
        bookTitle: "EC8395 Communication Engineering",
        Year: "II Year",
        Regulation: "2025",
        department: "IT",
        semester: "III sem",
      },

      // IT - II Year - IV Semester
      {
        bookTitle: "MA8402 Probability and Queueing Theory",
        Year: "II Year",
        Regulation: "2025",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8491 Computer Architecture",
        Year: "II Year",
        Regulation: "2025",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8492 Database Management Systems",
        Year: "II Year",
        Regulation: "2025",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8451 Design and Analysis of Algorithms",
        Year: "II Year",
        Regulation: "2025",
        department: "IT",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8493 Operating Systems",
        Year: "II Year",
        Regulation: "2025",
        department: "IT",
        semester: "IV sem",
      },

      // IT - III Year - V Semester
      {
        bookTitle: "CS8591 Computer Networks",
        Year: "III Year",
        Regulation: "2025",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "IT8501 Web Technology",
        Year: "III Year",
        Regulation: "2025",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "CS8592 Object Oriented Analysis and Design",
        Year: "III Year",
        Regulation: "2025",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "CS8593 Compiler Design",
        Year: "III Year",
        Regulation: "2025",
        department: "IT",
        semester: "V sem",
      },
      {
        bookTitle: "IT8511 Software Engineering",
        Year: "III Year",
        Regulation: "2025",
        department: "IT",
        semester: "V sem",
      },

      // IT - III Year - VI Semester
      {
        bookTitle: "CS8691 Artificial Intelligence",
        Year: "III Year",
        Regulation: "2025",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "IT8601 Computational Intelligence",
        Year: "III Year",
        Regulation: "2025",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8601 Mobile Computing",
        Year: "III Year",
        Regulation: "2025",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "IT8651 Service Oriented Architecture",
        Year: "III Year",
        Regulation: "2025",
        department: "IT",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "III Year",
        Regulation: "2025",
        department: "IT",
        semester: "VI sem",
      },

      // IT - IV Year - VII Semester
      {
        bookTitle: "CS8791 Cryptography and Network Security",
        Year: "IV Year",
        Regulation: "2025",
        department: "IT",
        semester: "VII sem",
      },
      {
        bookTitle: "IT8701 Cloud Computing",
        Year: "IV Year",
        Regulation: "2025",
        department: "IT",
        semester: "VII sem",
      },
      {
        bookTitle: "IT8702 Internet of Things",
        Year: "IV Year",
        Regulation: "2025",
        department: "IT",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "IV Year",
        Regulation: "2025",
        department: "IT",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "IV Year",
        Regulation: "2025",
        department: "IT",
        semester: "VII sem",
      },
      {
        bookTitle: "Open Elective",
        Year: "IV Year",
        Regulation: "2025",
        department: "IT",
        semester: "VII sem",
      },

      // IT - IV Year - VIII Semester
      {
        bookTitle: "IT8801 Social Network Analysis",
        Year: "IV Year",
        Regulation: "2025",
        department: "IT",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "IV Year",
        Regulation: "2025",
        department: "IT",
        semester: "VIII sem",
      },
      {
        bookTitle: "Project Work",
        Year: "IV Year",
        Regulation: "2025",
        department: "IT",
        semester: "VIII sem",
      },

      // ECE - I Year - I Semester
      {
        bookTitle: "MA8251 Engineering Mathematics - I",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "PH8251 Engineering Physics",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "CY8251 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8251 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8252 Engineering Graphics",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "I sem",
      },
      {
        bookTitle: "HS8251 Communicative English",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "I sem",
      },

      // ECE - I Year - II Semester
      {
        bookTitle: "MA8252 Engineering Mathematics - II",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "PH8252 Materials Science",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "BE8251 Basic Electrical and Electronics Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "GE8292 Engineering Mechanics",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "II sem",
      },
      {
        bookTitle: "HS8252 Technical English",
        Year: "I Year",
        Regulation: "2025",
        department: "ECE",
        semester: "II sem",
      },

      // ECE - II Year - III Semester
      {
        bookTitle: "MA8351 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8351 Electron Devices and Circuits",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8392 Digital Electronics",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8393 Fundamentals of Data Structures in C",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8394 Analog and Digital Communication",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "III sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "III sem",
      },

      // ECE - II Year - IV Semester
      {
        bookTitle: "MA8402 Probability and Queueing Theory",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "EC8452 Electronic Circuits II",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "EC8491 Communication Theory",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "EC8451 Electromagnetic Fields",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "EC8453 Linear Integrated Circuits",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "IV sem",
      },
      {
        bookTitle: "EC8461 Circuits and Simulation Integrated Laboratory",
        Year: "II Year",
        Regulation: "2025",
        department: "ECE",
        semester: "IV sem",
      },

      // ECE - III Year - V Semester
      {
        bookTitle: "EC8551 Control System Engineering",
        Year: "III Year",
        Regulation: "2025",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "EC8552 Discrete Time Signal Processing",
        Year: "III Year",
        Regulation: "2025",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "EC8591 Wireless Communication",
        Year: "III Year",
        Regulation: "2025",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "EC8592 Antenna and Wave Propagation",
        Year: "III Year",
        Regulation: "2025",
        department: "ECE",
        semester: "V sem",
      },
      {
        bookTitle: "EC8501 Transmission Lines and RF Systems",
        Year: "III Year",
        Regulation: "2025",
        department: "ECE",
        semester: "V sem",
      },

      // ECE - III Year - VI Semester
      {
        bookTitle: "EC8691 Microprocessors and Microcontrollers",
        Year: "III Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VI sem",
      },
      {
        bookTitle: "EC8652 Wireless Networks",
        Year: "III Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VI sem",
      },
      {
        bookTitle: "EC8651 Transmission Lines and Waveguides",
        Year: "III Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VI sem",
      },
      {
        bookTitle: "EC8601 Solid State Drives",
        Year: "III Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "III Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VI sem",
      },

      // ECE - IV Year - VII Semester
      {
        bookTitle: "EC8791 Embedded and Real Time Systems",
        Year: "IV Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VII sem",
      },
      {
        bookTitle: "EC8701 Ad Hoc and Wireless Sensor Networks",
        Year: "IV Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VII sem",
      },
      {
        bookTitle: "EC8702 Optical Communication",
        Year: "IV Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "IV Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "IV Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VII sem",
      },
      {
        bookTitle: "Open Elective",
        Year: "IV Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VII sem",
      },

      // ECE - IV Year - VIII Semester
      {
        bookTitle: "EC8801 VLSI Design",
        Year: "IV Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VIII sem",
      },
      {
        bookTitle: "EC8802 Medical Electronics",
        Year: "IV Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "IV Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VIII sem",
      },
      {
        bookTitle: "Project Work",
        Year: "IV Year",
        Regulation: "2025",
        department: "ECE",
        semester: "VIII sem",
      },

      // EEE - I Year - I Semester
      {
        bookTitle: "MA8251 Engineering Mathematics - I",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "PH8251 Engineering Physics",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "CY8251 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8251 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "GE8252 Engineering Graphics",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "I sem",
      },
      {
        bookTitle: "HS8251 Communicative English",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "I sem",
      },

      // EEE - I Year - II Semester
      {
        bookTitle: "MA8252 Engineering Mathematics - II",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "BE8251 Basic Electrical and Electronics Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "EE8251 Circuit Theory",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "II sem",
      },
      {
        bookTitle: "HS8252 Technical English",
        Year: "I Year",
        Regulation: "2025",
        department: "EEE",
        semester: "II sem",
      },

      // EEE - II Year - III Semester
      {
        bookTitle: "MA8351 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2025",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "EE8351 Digital Logic Circuits",
        Year: "II Year",
        Regulation: "2025",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "EE8391 Electromagnetic Theory",
        Year: "II Year",
        Regulation: "2025",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "EE8352 Electrical Machines I",
        Year: "II Year",
        Regulation: "2025",
        department: "EEE",
        semester: "III sem",
      },
      {
        bookTitle: "EC8395 Communication Engineering",
        Year: "II Year",
        Regulation: "2025",
        department: "EEE",
        semester: "III sem",
      },

      // EEE - II Year - IV Semester
      {
        bookTitle: "MA8402 Probability and Queueing Theory",
        Year: "II Year",
        Regulation: "2025",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "EE8401 Electrical Machines II",
        Year: "II Year",
        Regulation: "2025",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "EE8402 Transmission and Distribution",
        Year: "II Year",
        Regulation: "2025",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "EE8403 Measurements and Instrumentation",
        Year: "II Year",
        Regulation: "2025",
        department: "EEE",
        semester: "IV sem",
      },
      {
        bookTitle: "EE8451 Linear Integrated Circuits and Applications",
        Year: "II Year",
        Regulation: "2025",
        department: "EEE",
        semester: "IV sem",
      },

      // EEE - III Year - V Semester
      {
        bookTitle: "EE8551 Power System Analysis",
        Year: "III Year",
        Regulation: "2025",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "EE8552 Microprocessors and Microcontrollers",
        Year: "III Year",
        Regulation: "2025",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "EE8591 Power Electronics",
        Year: "III Year",
        Regulation: "2025",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "EE8592 Solid State Drives",
        Year: "III Year",
        Regulation: "2025",
        department: "EEE",
        semester: "V sem",
      },
      {
        bookTitle: "EE8501 Control Systems",
        Year: "III Year",
        Regulation: "2025",
        department: "EEE",
        semester: "V sem",
      },

      // EEE - III Year - VI Semester
      {
        bookTitle: "EE8691 Power System Operation and Control",
        Year: "III Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "EE8692 Protection and Switchgear",
        Year: "III Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "EE8601 Solid State Drives",
        Year: "III Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "EE8602 Power Quality",
        Year: "III Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "III Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VI sem",
      },

      // EEE - IV Year - VII Semester
      {
        bookTitle: "EE8791 Power Electronics for Renewable Energy Systems",
        Year: "IV Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VII sem",
      },
      {
        bookTitle: "EE8701 High Voltage Engineering",
        Year: "IV Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VII sem",
      },
      {
        bookTitle: "EE8702 Electrical System Design",
        Year: "IV Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "IV Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "IV Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VII sem",
      },
      {
        bookTitle: "Open Elective",
        Year: "IV Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VII sem",
      },

      // EEE - IV Year - VIII Semester
      {
        bookTitle: "EE8801 Smart Grid",
        Year: "IV Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VIII sem",
      },
      {
        bookTitle: "EE8802 Electric and Hybrid Vehicles",
        Year: "IV Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "IV Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VIII sem",
      },
      {
        bookTitle: "Project Work",
        Year: "IV Year",
        Regulation: "2025",
        department: "EEE",
        semester: "VIII sem",
      },

      // Mechanical - I Year - I Semester
      {
        bookTitle: "MA8251 Engineering Mathematics - I",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "PH8251 Engineering Physics",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "CY8251 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "GE8251 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "GE8252 Engineering Graphics",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "I sem",
      },
      {
        bookTitle: "HS8251 Communicative English",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "I sem",
      },

      // Mechanical - I Year - II Semester
      {
        bookTitle: "MA8252 Engineering Mathematics - II",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "ME8291 Engineering Mechanics",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "ME8292 Manufacturing Technology",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "II sem",
      },
      {
        bookTitle: "HS8252 Technical English",
        Year: "I Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "II sem",
      },

      // Mechanical - II Year - III Semester
      {
        bookTitle: "MA8351 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "ME8391 Engineering Thermodynamics",
        Year: "II Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "ME8392 Fluid Mechanics and Machinery",
        Year: "II Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "ME8393 Manufacturing Processes",
        Year: "II Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "III sem",
      },
      {
        bookTitle: "ME8394 Strength of Materials for Mechanical Engineers",
        Year: "II Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "III sem",
      },

      // Mechanical - II Year - IV Semester
      {
        bookTitle: "MA8402 Probability and Queueing Theory",
        Year: "II Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "ME8491 Kinematics of Machinery",
        Year: "II Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "ME8492 Engineering Materials and Metallurgy",
        Year: "II Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "ME8493 Thermal Engineering",
        Year: "II Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "IV sem",
      },
      {
        bookTitle: "ME8494 Applied Hydraulics and Pneumatics",
        Year: "II Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "IV sem",
      },

      // Mechanical - III Year - V Semester
      {
        bookTitle: "ME8591 Design of Machine Elements",
        Year: "III Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "V sem",
      },
      {
        bookTitle: "ME8592 Dynamics of Machines",
        Year: "III Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "V sem",
      },
      {
        bookTitle: "ME8593 Heat and Mass Transfer",
        Year: "III Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "V sem",
      },
      {
        bookTitle: "ME8594 Production Technology",
        Year: "III Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "V sem",
      },
      {
        bookTitle: "ME8501 Metrology and Measurements",
        Year: "III Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "V sem",
      },

      // Mechanical - III Year - VI Semester
      {
        bookTitle: "ME8691 Mechatronics",
        Year: "III Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VI sem",
      },
      {
        bookTitle: "ME8692 Power Plant Engineering",
        Year: "III Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VI sem",
      },
      {
        bookTitle: "ME8693 Process Planning and Cost Estimation",
        Year: "III Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VI sem",
      },
      {
        bookTitle: "ME8601 Automobile Engineering",
        Year: "III Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "III Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VI sem",
      },

      // Mechanical - IV Year - VII Semester
      {
        bookTitle: "ME8791 Computer Aided Design and Manufacturing",
        Year: "IV Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VII sem",
      },
      {
        bookTitle: "ME8792 Robotics",
        Year: "IV Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VII sem",
      },
      {
        bookTitle: "ME8793 Finite Element Analysis",
        Year: "IV Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "IV Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "IV Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VII sem",
      },
      {
        bookTitle: "Open Elective",
        Year: "IV Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VII sem",
      },

      // Mechanical - IV Year - VIII Semester
      {
        bookTitle: "ME8801 Energy Engineering",
        Year: "IV Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VIII sem",
      },
      {
        bookTitle: "ME8802 Project Engineering and Management",
        Year: "IV Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "IV Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VIII sem",
      },
      {
        bookTitle: "Project Work",
        Year: "IV Year",
        Regulation: "2025",
        department: "Mechanical",
        semester: "VIII sem",
      },

      // CIVIL - I Year - I Semester
      {
        bookTitle: "MA8251 Engineering Mathematics - I",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "I sem",
      },
      {
        bookTitle: "PH8251 Engineering Physics",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "I sem",
      },
      {
        bookTitle: "CY8251 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "I sem",
      },
      {
        bookTitle: "GE8251 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "I sem",
      },
      {
        bookTitle: "GE8252 Engineering Graphics",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "I sem",
      },
      {
        bookTitle: "HS8251 Communicative English",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "I sem",
      },

      // CIVIL - I Year - II Semester
      {
        bookTitle: "MA8252 Engineering Mathematics - II",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "II sem",
      },
      {
        bookTitle: "CE8291 Mechanics of Solids",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "II sem",
      },
      {
        bookTitle: "CE8292 Construction Materials",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "II sem",
      },
      {
        bookTitle: "HS8252 Technical English",
        Year: "I Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "II sem",
      },

      // CIVIL - II Year - III Semester
      {
        bookTitle: "MA8351 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "III sem",
      },
      {
        bookTitle: "CE8391 Construction Techniques and Practices",
        Year: "II Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "III sem",
      },
      {
        bookTitle: "CE8392 Strength of Materials",
        Year: "II Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "III sem",
      },
      {
        bookTitle: "CE8393 Fluid Mechanics",
        Year: "II Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "III sem",
      },
      {
        bookTitle: "CE8394 Surveying",
        Year: "II Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "III sem",
      },

      // CIVIL - II Year - IV Semester
      {
        bookTitle: "MA8402 Probability and Queueing Theory",
        Year: "II Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "IV sem",
      },
      {
        bookTitle: "CE8491 Soil Mechanics",
        Year: "II Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "IV sem",
      },
      {
        bookTitle: "CE8492 Concrete Technology",
        Year: "II Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "IV sem",
      },
      {
        bookTitle: "CE8493 Highway Engineering",
        Year: "II Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "IV sem",
      },
      {
        bookTitle: "CE8494 Applied Hydraulic Engineering",
        Year: "II Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "IV sem",
      },

      // CIVIL - III Year - V Semester
      {
        bookTitle: "CE8591 Foundation Engineering",
        Year: "III Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "V sem",
      },
      {
        bookTitle: "CE8592 Structural Analysis I",
        Year: "III Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "V sem",
      },
      {
        bookTitle: "CE8593 Railway, Airport and Harbour Engineering",
        Year: "III Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "V sem",
      },
      {
        bookTitle: "CE8594 Environmental Engineering I",
        Year: "III Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "V sem",
      },
      {
        bookTitle: "CE8501 Design of Reinforced Cement Concrete Elements",
        Year: "III Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "V sem",
      },

      // CIVIL - III Year - VI Semester
      {
        bookTitle: "CE8691 Prestressed Concrete Structures",
        Year: "III Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VI sem",
      },
      {
        bookTitle: "CE8692 Structural Analysis II",
        Year: "III Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VI sem",
      },
      {
        bookTitle: "CE8693 Design of Steel Structures",
        Year: "III Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VI sem",
      },
      {
        bookTitle: "CE8694 Environmental Engineering II",
        Year: "III Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "III Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VI sem",
      },

      // CIVIL - IV Year - VII Semester
      {
        bookTitle: "CE8791 Design of Reinforced Concrete and Brick Masonry Structures",
        Year: "IV Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VII sem",
      },
      {
        bookTitle: "CE8792 Irrigation Engineering",
        Year: "IV Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VII sem",
      },
      {
        bookTitle: "CE8793 Estimation, Costing and Valuation Engineering",
        Year: "IV Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "IV Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "IV Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VII sem",
      },
      {
        bookTitle: "Open Elective",
        Year: "IV Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VII sem",
      },

      // CIVIL - IV Year - VIII Semester
      {
        bookTitle: "CE8801 Earthquake Resistant Design of Structures",
        Year: "IV Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VIII sem",
      },
      {
        bookTitle: "CE8802 Professional Practice, Law and Ethics",
        Year: "IV Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "IV Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VIII sem",
      },
      {
        bookTitle: "Project Work",
        Year: "IV Year",
        Regulation: "2025",
        department: "CIVIL",
        semester: "VIII sem",
      },

      // AI & DS - I Year - I Semester
      {
        bookTitle: "MA8251 Engineering Mathematics - I",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "I sem",
      },
      {
        bookTitle: "PH8251 Engineering Physics",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "I sem",
      },
      {
        bookTitle: "CY8251 Engineering Chemistry",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "I sem",
      },
      {
        bookTitle: "GE8251 Problem Solving and Python Programming",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "I sem",
      },
      {
        bookTitle: "GE8252 Engineering Graphics",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "I sem",
      },
      {
        bookTitle: "HS8251 Communicative English",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "I sem",
      },

      // AI & DS - I Year - II Semester
      {
        bookTitle: "MA8252 Engineering Mathematics - II",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "AD8251 Fundamentals of Data Science",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "CS8391 Data Structures",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "BE8251 Basic Electrical and Electronics Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "GE8291 Environmental Science and Engineering",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "II sem",
      },
      {
        bookTitle: "HS8252 Technical English",
        Year: "I Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "II sem",
      },

      // AI & DS - II Year - III Semester
      {
        bookTitle: "MA8351 Discrete Mathematics",
        Year: "II Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "III sem",
      },
      {
        bookTitle: "AD8351 Linear Algebra and Applications",
        Year: "II Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "III sem",
      },
      {
        bookTitle: "CS8392 Object Oriented Programming",
        Year: "II Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "III sem",
      },
      {
        bookTitle: "AD8391 Database Management Systems",
        Year: "II Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "III sem",
      },
      {
        bookTitle: "AD8392 Statistical Methods and Analytics",
        Year: "II Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "III sem",
      },

      // AI & DS - II Year - IV Semester
      {
        bookTitle: "MA8402 Probability and Queueing Theory",
        Year: "II Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "IV sem",
      },
      {
        bookTitle: "AD8491 Machine Learning Techniques",
        Year: "II Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "IV sem",
      },
      {
        bookTitle: "AD8492 Deep Learning Fundamentals",
        Year: "II Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8491 Computer Architecture",
        Year: "II Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "IV sem",
      },
      {
        bookTitle: "CS8451 Design and Analysis of Algorithms",
        Year: "II Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "IV sem",
      },

      // AI & DS - III Year - V Semester
      {
        bookTitle: "AD8591 Natural Language Processing",
        Year: "III Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "V sem",
      },
      {
        bookTitle: "AD8592 Computer Vision",
        Year: "III Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "V sem",
      },
      {
        bookTitle: "AD8593 Reinforcement Learning",
        Year: "III Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "V sem",
      },
      {
        bookTitle: "AD8594 Big Data Analytics",
        Year: "III Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "V sem",
      },
      {
        bookTitle: "Professional Elective I",
        Year: "III Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "V sem",
      },

      // AI & DS - III Year - VI Semester
      {
        bookTitle: "AD8691 Deep Learning Applications",
        Year: "III Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "AD8692 Intelligent Agents and Multi-Agent Systems",
        Year: "III Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "AD8693 Data Mining and Warehousing",
        Year: "III Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "CS8691 Artificial Intelligence",
        Year: "III Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VI sem",
      },
      {
        bookTitle: "Professional Elective II",
        Year: "III Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VI sem",
      },

      // AI & DS - IV Year - VII Semester
      {
        bookTitle: "AD8791 Explainable AI",
        Year: "IV Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VII sem",
      },
      {
        bookTitle: "AD8792 Edge Computing and AI",
        Year: "IV Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VII sem",
      },
      {
        bookTitle: "AD8793 AI for Healthcare",
        Year: "IV Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective III",
        Year: "IV Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VII sem",
      },
      {
        bookTitle: "Professional Elective IV",
        Year: "IV Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VII sem",
      },
      {
        bookTitle: "Open Elective",
        Year: "IV Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VII sem",
      },

      // AI & DS - IV Year - VIII Semester
      {
        bookTitle: "AD8801 AI Ethics and Governance",
        Year: "IV Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VIII sem",
      },
      {
        bookTitle: "AD8802 AI Project Management",
        Year: "IV Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VIII sem",
      },
      {
        bookTitle: "Professional Elective V",
        Year: "IV Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VIII sem",
      },
      {
        bookTitle: "Project Work",
        Year: "IV Year",
        Regulation: "2025",
        department: "AI & DS",
        semester: "VIII sem",
      },
    ];

    // Loop through the initial data and check if each book already exists
    for (const book of initialData) {
      const existingBooks = await collection.findOne({
        bookTitle: book.bookTitle,
        Year: book.Year,
        Regulation: book.Regulation,
        department: book.department,
        semester: book.semester,
      });

      // If the book does not exist, insert it
      if (!existingBooks) {
        // Use create or insertMany on the model
        await collection.create(book); // Correct method to insert a single document
        console.log(`Inserted: ${book.bookTitle}`);
      } else {
        // console.log(`Already exists: ${book.bookTitle}`);
      }
    }
  } catch (error) {
    console.error("Error during data insertion:", error);
  }
};

insertInitialData();
app.get("/getbooks", (req, res) => {
  collection
    .find()
    .then((books) => res.json(books))
    .catch((err) => res.status(500).json(err));
});

app.get("/availableBooks", async (req, res) => {
  try {
    const books = await AvailableBook.find({ isAvailable: true }); // Fetch only available books
    
    console.log("📚 ===== FETCHING AVAILABLE BOOKS =====");
    console.log("Total books found:", books.length);
    books.forEach((book, index) => {
      console.log(`Book ${index + 1}:`, {
        _id: book._id,
        bookTitle: book.bookTitle,
        price: book.price,
        requiresPayment: book.requiresPayment,
        "price in DB": book.price,
        "requiresPayment in DB": book.requiresPayment
      });
    });
    console.log("=======================================");
    
    // Don't send contact for paid books - let frontend handle it based on payment status
    const booksWithSafeContact = books.map(book => {
      const bookObj = book.toObject({ minimize: false }); // CRITICAL: minimize: false to include all fields
      
      // Ensure price and requiresPayment are always included (even if undefined in old documents)
      // Default to 0 and false if not present
      if (bookObj.price === undefined || bookObj.price === null) {
        bookObj.price = 0;
      } else {
        // Ensure price is a number
        bookObj.price = Number(bookObj.price);
      }
      
      if (bookObj.requiresPayment === undefined || bookObj.requiresPayment === null) {
        bookObj.requiresPayment = false;
      } else {
        // Ensure requiresPayment is a boolean
        bookObj.requiresPayment = Boolean(bookObj.requiresPayment);
      }
      
      // Log each book's price for debugging
      if (bookObj.price > 0 || bookObj.requiresPayment) {
        console.log(`📖 Book "${bookObj.bookTitle}": price=${bookObj.price}, requiresPayment=${bookObj.requiresPayment}`);
      }
      
      // If book requires payment and payment is not verified, don't send contact
      if ((bookObj.requiresPayment || (bookObj.price && bookObj.price > 0)) && !book.paymentVerified) {
        bookObj.contact = null; // Hide contact on backend for security
      }
      return bookObj;
    });
    res.status(200).json(booksWithSafeContact); // Send the list of books as a JSON response
  } catch (error) {
    console.error("Error fetching available books:", error);
    res.status(500).json({ message: "Error fetching available books." });
  }
});

module.exports = collection;
module.exports = AvailableBook;
