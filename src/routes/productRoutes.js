const express = require('express');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const router = express.Router();

// Lấy tất cả sản phẩm
router.get('/', async (req, res) => {
  try {
    const { brand, category, minPrice, maxPrice, sort, limit = 10, page = 1 } = req.query;
    const query = {};
    
    // Lọc theo thương hiệu
    if (brand) {
      query.brand = brand;
    }
    
    // Lọc theo danh mục
    if (category) {
      query.category = category;
    }
    
    // Lọc theo giá
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Chỉ hiển thị sản phẩm đang hoạt động
    query.isActive = true;
    
    // Sắp xếp
    const sortOptions = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Mặc định sắp xếp theo thời gian tạo giảm dần
    }
    
    // Phân trang
    const skip = (Number(page) - 1) * Number(limit);
    
    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip(skip);
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lấy sản phẩm theo ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tìm kiếm sản phẩm
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { limit = 10, page = 1 } = req.query;
    
    const query = {
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ],
      isActive: true
    };
    
    // Phân trang
    const skip = (Number(page) - 1) * Number(limit);
    
    const products = await Product.find(query)
      .limit(Number(limit))
      .skip(skip);
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tạo sản phẩm mới (chỉ admin)
router.post('/', auth, admin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cập nhật sản phẩm (chỉ admin)
router.patch('/:id', auth, admin, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'name', 'description', 'price', 'imageUrl', 'brand', 'category',
    'stock', 'specifications', 'isActive', 'discount'
  ];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));
  
  if (!isValidOperation) {
    return res.status(400).json({ message: 'Cập nhật không hợp lệ' });
  }
  
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    updates.forEach(update => product[update] = req.body[update]);
    await product.save();
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Xóa sản phẩm (chỉ admin)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    res.json({ message: 'Đã xóa sản phẩm' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 