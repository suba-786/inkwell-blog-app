require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const blogRoutes = require("./routes/blogs");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Blog API is running" }));
app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
