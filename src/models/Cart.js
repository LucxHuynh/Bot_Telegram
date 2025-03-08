const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    }
  }]
}, {
  timestamps: true
});

// Phương thức tính tổng tiền giỏ hàng
cartSchema.methods.getTotalPrice = async function() {
  const cart = this;
  let total = 0;
  
  await cart.populate('items.product');
  
  cart.items.forEach(item => {
    total += item.product.price * item.quantity;
  });
  
  return total;
};

// Phương thức thêm sản phẩm vào giỏ hàng
cartSchema.methods.addItem = async function(productId, quantity = 1) {
  const cart = this;
  const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId.toString());
  
  if (existingItemIndex !== -1) {
    // Nếu sản phẩm đã có trong giỏ hàng, tăng số lượng
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Nếu sản phẩm chưa có trong giỏ hàng, thêm mới
    cart.items.push({
      product: productId,
      quantity
    });
  }
  
  return cart.save();
};

// Phương thức cập nhật số lượng sản phẩm trong giỏ hàng
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const cart = this;
  const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId.toString());
  
  if (existingItemIndex !== -1) {
    if (quantity <= 0) {
      // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ hàng
      cart.items.splice(existingItemIndex, 1);
    } else {
      // Cập nhật số lượng
      cart.items[existingItemIndex].quantity = quantity;
    }
    
    return cart.save();
  }
  
  return cart;
};

// Phương thức xóa sản phẩm khỏi giỏ hàng
cartSchema.methods.removeItem = async function(productId) {
  const cart = this;
  cart.items = cart.items.filter(item => item.product.toString() !== productId.toString());
  
  return cart.save();
};

// Phương thức xóa tất cả sản phẩm trong giỏ hàng
cartSchema.methods.clearCart = async function() {
  const cart = this;
  cart.items = [];
  
  return cart.save();
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 