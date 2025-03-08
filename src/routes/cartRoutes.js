const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const router = express.Router();

// Lấy giỏ hàng của người dùng
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
      // Nếu chưa có giỏ hàng, tạo mới
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Thêm sản phẩm vào giỏ hàng
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    // Kiểm tra số lượng hợp lệ
    if (quantity <= 0) {
      return res.status(400).json({ message: 'Số lượng phải lớn hơn 0' });
    }
    
    // Kiểm tra số lượng tồn kho
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm trong kho không đủ' });
    }
    
    // Tìm hoặc tạo giỏ hàng
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }
    
    // Thêm sản phẩm vào giỏ hàng
    await cart.addItem(productId, quantity);
    
    // Lấy giỏ hàng đã cập nhật với thông tin sản phẩm
    cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.patch('/update', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Kiểm tra số lượng hợp lệ
    if (quantity < 0) {
      return res.status(400).json({ message: 'Số lượng không hợp lệ' });
    }
    
    // Tìm giỏ hàng
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }
    
    // Cập nhật số lượng sản phẩm
    await cart.updateItemQuantity(productId, quantity);
    
    // Lấy giỏ hàng đã cập nhật với thông tin sản phẩm
    cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Tìm giỏ hàng
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }
    
    // Xóa sản phẩm khỏi giỏ hàng
    await cart.removeItem(productId);
    
    // Lấy giỏ hàng đã cập nhật với thông tin sản phẩm
    cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Xóa tất cả sản phẩm trong giỏ hàng
router.delete('/clear', auth, async (req, res) => {
  try {
    // Tìm giỏ hàng
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }
    
    // Xóa tất cả sản phẩm trong giỏ hàng
    await cart.clearCart();
    
    res.json({ message: 'Đã xóa tất cả sản phẩm trong giỏ hàng' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 