const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const router = express.Router();

// Lấy tất cả đơn hàng của người dùng
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product');
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lấy chi tiết đơn hàng theo ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('items.product');
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tạo đơn hàng mới
router.post('/', auth, async (req, res) => {
  try {
    const { shippingAddress, phone, paymentMethod, notes } = req.body;
    
    // Kiểm tra giỏ hàng
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }
    
    // Tính tổng tiền và tạo danh sách sản phẩm
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of cart.items) {
      // Kiểm tra số lượng tồn kho
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm "${item.product.name}" chỉ còn ${item.product.stock} sản phẩm trong kho`
        });
      }
      
      const itemPrice = item.product.price * item.quantity;
      totalAmount += itemPrice;
      
      orderItems.push({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      });
      
      // Cập nhật số lượng tồn kho
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity }
      });
    }
    
    // Tạo đơn hàng mới
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      phone,
      paymentMethod,
      notes,
      status: 'pending',
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending'
    });
    
    await order.save();
    
    // Xóa giỏ hàng
    await cart.clearCart();
    
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Hủy đơn hàng
router.patch('/cancel/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Chỉ có thể hủy đơn hàng ở trạng thái "pending" hoặc "confirmed"
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({ message: 'Không thể hủy đơn hàng ở trạng thái này' });
    }
    
    // Cập nhật trạng thái đơn hàng
    order.status = 'cancelled';
    await order.save();
    
    // Hoàn lại số lượng tồn kho
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cập nhật trạng thái đơn hàng (chỉ admin)
router.patch('/status/:id', auth, admin, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Cập nhật trạng thái đơn hàng
    if (status) {
      order.status = status;
    }
    
    // Cập nhật trạng thái thanh toán
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    
    await order.save();
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Lấy tất cả đơn hàng (chỉ admin)
router.get('/admin/all', auth, admin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    // Lọc theo trạng thái
    if (status) {
      query.status = status;
    }
    
    // Phân trang
    const skip = (Number(page) - 1) * Number(limit);
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .limit(Number(limit))
      .skip(skip);
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 