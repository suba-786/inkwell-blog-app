const express = require("express");
const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /api/blogs  (protected)
router.post("/", auth, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: "Title and content are required" });

    const blog = await Blog.create({ title, content, category, author: req.userId });
    res.status(201).json({ message: "Blog created", blog });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /api/blogs  (public)
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /api/blogs/:id  (protected, only the author can delete)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: "Invalid blog id" });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    if (blog.author.toString() !== req.userId)
      return res.status(403).json({ message: "You can only delete your own blogs" });

    await blog.deleteOne();
    res.json({ message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
