const express = require('express');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const router = express.Router();

// Đăng ký người dùng mới
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    
    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    
    // Tạo người dùng mới
    const user = new User({
      name,
      email,
      password,
      phone,
      address
    });
    
    await user.save();
    
    // Tạo token xác thực
    const token = user.generateAuthToken();
    
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Tìm người dùng theo email và mật khẩu
    const user = await User.findByCredentials(email, password);
    
    // Tạo token xác thực
    const token = user.generateAuthToken();
    
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
  }
});

// Lấy thông tin người dùng hiện tại
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Cập nhật thông tin người dùng
router.patch('/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'phone', 'address'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  
  if (!isValidOperation) {
    return res.status(400).json({ message: 'Cập nhật không hợp lệ' });
  }
  
  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    
    res.json(req.user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Đăng xuất
router.post('/logout', auth, async (req, res) => {
  try {
    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 