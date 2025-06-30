require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const authRouter = require("./src/routes/authRouter");
const ItemRoutes = require("./src/routes/itemRoute");
const CategoryRoutes = require("./src/routes/categoryRoute");

const app = express();
const PORT = process.env.PORT || 8000;

// ✅ CORRECT CORS SETUP (only once)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Global Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api", ItemRoutes);
app.use("/api", CategoryRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Hello, Gursha Diaries 👋🍲");
});

// DB + Server Startup
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

startServer();
