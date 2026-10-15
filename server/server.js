const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static QR code images and assets from the client public folder
app.use(express.static(path.join(__dirname, "../client/public")));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for physical file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eprint-db')
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Order Schema with Multiple Files and Instructions support
const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  copies: { type: Number, required: true },
  paperSize: { type: String, required: true },
  printType: { type: String, required: true },
  sides: { type: String, required: true },
  instructions: { type: String },
  paymentMethod: { type: String, required: true },
  estimatedCost: { type: Number, required: true },
  status: { type: String, default: "Pending" },
  filePaths: [{ type: String }]
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);

// Create Order with Multiple File Uploads
app.post('/api/orders', upload.array('documents', 200), async (req, res) => {
  try {
    const filePaths = req.files ? req.files.map(f => f.path) : [];
    const newOrder = new Order({
      orderNumber: req.body.orderNumber,
      copies: req.body.copies,
      paperSize: req.body.paperSize,
      printType: req.body.printType,
      sides: req.body.sides,
      instructions: req.body.instructions || "",
      paymentMethod: req.body.paymentMethod,
      estimatedCost: req.body.estimatedCost,
      status: "Pending",
      filePaths: filePaths
    });
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error saving order:", error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware to verify JWT token for Admin routes
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

  jwt.verify(token, 'your_jwt_secret_key', (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    req.user = user;
    next();
  });
}

// Admin Login Route (Returns a JWT token)
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  if (password === "groupwork") {
    const token = jwt.sign({ role: "admin" }, 'your_jwt_secret_key', { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Incorrect password." });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
app.put('/api/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order (Protected)
app.delete('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));