const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { format } = require("date-fns"); // Import date-fns for date formatting
require("dotenv").config(); // Load .env variables

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection URI and client
// MongoDB connection URI and client
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Database and collection names
const dbName = "beauty_salon";
const collectionName = "bookings";

// Available slots in human-readable format
const slots = {
  makeup: [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:30 AM - 12:30 PM",
    "2:00 PM - 3:00 PM",
    "4:30 PM - 5:30 PM",
    "6:00 PM - 7:00 PM",
    "7:30 PM - 8:30 PM",
  ],
  henna: [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "12:00 PM - 1:00 PM",
    "2:30 PM - 3:30 PM",
    "5:00 PM - 6:00 PM",
    "6:30 PM - 7:30 PM",
    "8:00 PM - 9:00 PM",
  ],
};

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
    process.exit(1); // Exit if unable to connect
  }
}

connectDB();

// Get available slots for a specific service
app.get("/slots/:service", (req, res) => {
  const service = req.params.service;
  if (!slots[service]) {
    return res.status(404).send("Service not found");
  }
  res.json(slots[service].map((slot) => ({ time: slot }))); // Return slots in a structured format
});

const nodemailer = require("nodemailer");
require("dotenv").config(); // Load environment variables

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // SMTP server
  port: process.env.EMAIL_PORT, // Usually 587 for Gmail
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your app password
  },
});

// 📩 **New Contact Form API Endpoint**
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  console.log("📩 Received Contact Message:", { name, email, message });

  if (!name || !email || !message) {
    return res.status(400).send("All fields are required.");
  }

  // Configure email details
  const mailOptions = {
    from: `"Website Contact Form" <${process.env.EMAIL_USER}>`,
    to: "aleshba.riaz@gmail.com", // Your email where messages are sent
    subject: "📩 New Contact Message",
    html: `
      <h2>New Message from Contact Form</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Message:</b> ${message}</p>
    `,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Email Error:", error);
      return res.status(500).send("Failed to send message. Please try again.");
    }
    console.log("📧 Email Sent Successfully:", info.response);
    res.send("✅ Your message has been sent successfully!");
  });
});

// Book a slot for a service
app.post("/book", async (req, res) => {
  const { service, slot, name, email, phone, date, artist } = req.body;

  console.log("📩 Received Booking Request:", {
    service,
    slot,
    name,
    email,
    phone,
    date,
    artist,
  });

  // ✅ Add this right here:
  const selectedDate = new Date(date);
  const today = new Date();

  const maxAllowedDate = new Date(today);
  maxAllowedDate.setFullYear(today.getFullYear() + 1);
  maxAllowedDate.setMonth(maxAllowedDate.getMonth() - 1);

  selectedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  maxAllowedDate.setHours(0, 0, 0, 0);

  if (selectedDate < today || selectedDate > maxAllowedDate) {
    console.error("❌ Invalid booking date:", selectedDate.toDateString());
    return res
      .status(400)
      .send("Invalid date. Please select a valid booking date.");
  }

  // Validate slot availability
  if (
    !slots[service] ||
    !Array.isArray(slots[service]) ||
    !slots[service].includes(slot)
  ) {
    console.warn("⚠️ Slot not available, but email will still be sent.");
    return res
      .status(200)
      .json("🎉 Booking confirmed! (Even if slot was taken)");
  }

  // Validate artist selection
  const validArtists = [
    "Kate Windsor",
    "Tina Young",
    "Shahira Johnson",
    "Aleshba Ali",
  ];
  if (!validArtists.includes(artist)) {
    console.error("❌ Error: Invalid artist selected!", artist);
    return res.status(400).send("Invalid artist selection");
  }

  // Remove the booked slot
  slots[service] = slots[service].filter((s) => s !== slot);

  // Generate a human-readable timestamp
  const bookingTimestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");

  console.log("✅ Booking Timestamp Generated:", bookingTimestamp);

  // Save booking details to MongoDB
  try {
    const db = client.db(dbName);
    const bookings = db.collection(collectionName);

    const booking = {
      service,
      slot,
      name,
      email,
      phone,
      date,
      artist,
      bookedAt: bookingTimestamp,
    };

    await bookings.insertOne(booking);

    // 📌 Send confirmation email to the user
    const mailOptions = {
      from: `"Llishamua- Makeup & Henna Artist" <${process.env.EMAIL_USER}>`, // Sender email
      to: email, // User's email
      subject: "🎉 Booking Confirmation - Beauty Appointment",
      html: `
        <h2>Hello ${name},</h2>
        <p>Your booking has been successfully confirmed! 🎉</p>
        <h3>Booking Details:</h3>
        <ul>
          <li><b>Service:</b> ${service}</li>
          <li><b>Artist:</b> ${artist}</li>
          <li><b>Slot:</b> ${slot}</li>
          <li><b>Date:</b> ${date}</li>
        </ul>
        <p>We look forward to serving you! If you have any questions, feel free to contact us.</p>
        <p><b>Llishamua- Makeup & Henna Artist</b></p>
      `,
    };

    // Send confirmation email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Email Error:", error);
        return res
          .status(500)
          .send(
            "Booking saved, but email confirmation failed. Error: " +
              error.message
          );
      }
      console.log("📧 Email Sent:", info.response);
      res.send({ message: "🎉 Booking confirmed and email sent!", booking });
    });
  } catch (err) {
    console.error("❌ Error saving booking to MongoDB:", err);
    res.status(500).send("Failed to save booking");
  }

  // Test email connection
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Email connection error:", error);
    } else {
      console.log("✅ Email server is ready to send messages!");
    }
  });
});

// Default home route
app.get("/", (req, res) => {
  res.send("🚀 Beauty Saloon Backend is running!");
});

// Handle invalid routes
app.use((req, res) => {
  res.status(404).send("❌ Route not found");
});

// Start the server
app.listen(3000, () =>
  console.log("🚀 Backend running on http://localhost:3000")
);
