const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  imageUrl: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  specifications: {
    screen: {
      type: String,
      trim: true
    },
    processor: {
      type: String,
      trim: true
    },
    ram: {
      type: String,
      trim: true
    },
    storage: {
      type: String,
      trim: true
    },
    camera: {
      type: String,
      trim: true
    },
    battery: {
      type: String,
      trim: true
    },
    operatingSystem: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Phương thức tính giá sau khi giảm giá
productSchema.methods.getDiscountedPrice = function() {
  const product = this;
  if (product.discount > 0) {
    return product.price * (1 - product.discount / 100);
  }
  return product.price;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 