const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập' });
    }
    
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Tìm người dùng
    const user = await User.findOne({ _id: decoded._id });
    
    if (!user) {
      throw new Error();
    }
    
    // Lưu thông tin người dùng vào request
    req.token = token;
    req.user = user;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Vui lòng đăng nhập' });
  }
};

module.exports = auth; 