const admin = (req, res, next) => {
  // Kiểm tra nếu người dùng là admin
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }
};

module.exports = admin; 