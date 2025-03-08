const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const axios = require('axios');

// Khởi tạo bot với token từ biến môi trường
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Lưu trữ phiên đăng nhập của người dùng
global.sessions = {};

// Cấu hình Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Tìm user theo Google ID
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // Nếu không tìm thấy, tạo user mới
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // Tạo mật khẩu ngẫu nhiên
          isGoogleUser: true
        });
        await user.save();

        // Tạo giỏ hàng cho người dùng mới
        const newCart = new Cart({ user: user._id, items: [] });
        await newCart.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Hàm khởi động bot
const start = () => {
  console.log('Telegram Bot đã khởi động');

  // Xử lý lệnh /start
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const message = `
Chào mừng đến với cửa hàng điện thoại!

Các lệnh có sẵn:
/dangnhap - Đăng nhập vào tài khoản
/dangnhap_google - Đăng nhập bằng Google
/dangky - Đăng ký tài khoản mới
/dangxuat - Đăng xuất khỏi tài khoản
/sanpham - Xem tất cả sản phẩm
/timkiem <từ khóa> - Tìm kiếm sản phẩm
/giohang - Xem giỏ hàng của bạn
/dathang - Đặt hàng
/donhang - Xem đơn hàng của bạn
/taikhoan - Xem thông tin tài khoản
    `;
    bot.sendMessage(chatId, message);
  });

  // Xử lý lệnh /dangky
  bot.onText(/\/dangky/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Kiểm tra nếu đã đăng nhập
    if (sessions[chatId]) {
      return bot.sendMessage(chatId, 'Bạn đã đăng nhập. Vui lòng đăng xuất trước khi đăng ký tài khoản mới.');
    }

    // Bắt đầu quá trình đăng ký
    sessions[chatId] = { registering: true, step: 'email' };
    bot.sendMessage(chatId, 'Vui lòng nhập email của bạn:');
  });

  // Xử lý lệnh /dangnhap
  bot.onText(/\/dangnhap/, (msg) => {
    const chatId = msg.chat.id;
    
    // Kiểm tra nếu đã đăng nhập
    if (sessions[chatId] && sessions[chatId].user) {
      return bot.sendMessage(chatId, 'Bạn đã đăng nhập rồi.');
    }

    // Bắt đầu quá trình đăng nhập
    sessions[chatId] = { loggingIn: true, step: 'email' };
    bot.sendMessage(chatId, 'Vui lòng nhập email của bạn:');
  });

  // Xử lý lệnh /dangnhap_google
  bot.onText(/\/dangnhap_google/, (msg) => {
    const chatId = msg.chat.id;
    
    // Kiểm tra nếu đã đăng nhập
    if (sessions[chatId] && sessions[chatId].user) {
      return bot.sendMessage(chatId, 'Bạn đã đăng nhập rồi.');
    }

    // Tạo URL đăng nhập Google
    const authUrl = `${process.env.APP_URL}/api/auth/google?chatId=${chatId}`;
    
    // Gửi URL đăng nhập dạng text
    bot.sendMessage(chatId, `Nhấn vào link sau để đăng nhập bằng Google:\n${authUrl}`);
  });

  // Xử lý lệnh /dangxuat
  bot.onText(/\/dangxuat/, (msg) => {
    const chatId = msg.chat.id;
    
    // Kiểm tra nếu đã đăng nhập
    if (!sessions[chatId] || !sessions[chatId].user) {
      return bot.sendMessage(chatId, 'Bạn chưa đăng nhập.');
    }

    // Xóa phiên đăng nhập
    delete sessions[chatId];
    bot.sendMessage(chatId, 'Đã đăng xuất thành công.');
  });

  // Xử lý lệnh /sanpham
  bot.onText(/\/sanpham/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Tạo keyboard với các danh mục
      const keyboard = {
        inline_keyboard: [
          [{ text: '📱 Apple', callback_data: 'category_Apple' }],
          [{ text: '📱 Samsung', callback_data: 'category_Samsung' }],
          [{ text: '📱 Xiaomi', callback_data: 'category_Xiaomi' }],
          [{ text: '📱 Other', callback_data: 'category_Other' }]
        ]
      };
      
      bot.sendMessage(chatId, 'Chọn danh mục sản phẩm:', {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh mục:', error);
      bot.sendMessage(chatId, 'Đã xảy ra lỗi khi lấy danh mục sản phẩm.');
    }
  });

  // Xử lý khi người dùng chọn danh mục
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (data.startsWith('category_')) {
      const category = data.split('_')[1];
      try {
        // Lấy sản phẩm theo danh mục
        const products = await Product.find({ brand: category });
        
        if (products.length === 0) {
          return bot.sendMessage(chatId, `Không có sản phẩm nào trong danh mục ${category}.`);
        }

        // Hiển thị từng sản phẩm với nút "Thêm vào giỏ hàng"
        for (const product of products) {
          const message = `
📱 ${product.name}
💰 Giá: ${product.price.toLocaleString('vi-VN')} VNĐ
📦 Còn lại: ${product.stock} sản phẩm
📝 Mô tả: ${product.description}

🔍 Thông số kỹ thuật:
• Màn hình: ${product.specifications.screen}
• CPU: ${product.specifications.processor}
• RAM: ${product.specifications.ram}
• Bộ nhớ: ${product.specifications.storage}
• Camera: ${product.specifications.camera}
• Pin: ${product.specifications.battery}
• Hệ điều hành: ${product.specifications.operatingSystem}
`;

          const keyboard = {
            inline_keyboard: [
              [{ text: '🛒 Thêm vào giỏ hàng', callback_data: `add_to_cart_${product._id}` }]
            ]
          };

          await bot.sendMessage(chatId, message, {
            reply_markup: keyboard
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy sản phẩm:', error);
        bot.sendMessage(chatId, 'Đã xảy ra lỗi khi lấy danh sách sản phẩm.');
      }
    } else if (data.startsWith('add_to_cart_')) {
      // Kiểm tra đăng nhập
      if (!sessions[chatId] || !sessions[chatId].user) {
        return bot.sendMessage(chatId, 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.\nSử dụng lệnh /dangnhap');
      }

      const productId = data.split('add_to_cart_')[1];
      try {
        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId);
        if (!product) {
          return bot.sendMessage(chatId, 'Không tìm thấy sản phẩm.');
        }

        // Kiểm tra còn hàng
        if (product.stock <= 0) {
          return bot.sendMessage(chatId, 'Sản phẩm đã hết hàng.');
        }

        // Lưu productId vào session để xử lý số lượng
        sessions[chatId].addingToCart = {
          productId,
          productName: product.name,
          stock: product.stock
        };

        // Hiển thị keyboard với các số lượng phổ biến
        const quantities = [1, 2, 3, 5];
        const keyboard = {
          inline_keyboard: [
            quantities.map(qty => ({
              text: `${qty}`,
              callback_data: `qty_${qty}`
            })),
            [{ text: '🔢 Nhập số khác', callback_data: 'qty_custom' }]
          ]
        };

        bot.sendMessage(chatId, `Chọn số lượng cho ${product.name} (còn ${product.stock} sản phẩm):`, {
          reply_markup: keyboard
        });
      } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error);
        bot.sendMessage(chatId, 'Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng.');
      }
    } else if (data.startsWith('qty_')) {
      const session = sessions[chatId];
      if (!session || !session.addingToCart) {
        return bot.sendMessage(chatId, 'Có lỗi xảy ra. Vui lòng thử lại.');
      }

      if (data === 'qty_custom') {
        session.addingToCart.waitingForQuantity = true;
        bot.sendMessage(chatId, `Vui lòng nhập số lượng (tối đa ${session.addingToCart.stock}):`);
        return;
      }

      const quantity = parseInt(data.split('qty_')[1]);
      await addToCart(chatId, session.addingToCart.productId, quantity);
    } else if (data.startsWith('cart_')) {
      const [action, itemId] = data.split('_').slice(1);
      
      try {
        const cart = await Cart.findOne({ user: sessions[chatId].user._id }).populate('items.product');
        const item = cart.items.find(i => i._id.toString() === itemId);
        
        if (!item) {
          return bot.answerCallbackQuery(callbackQuery.id, 'Sản phẩm không còn trong giỏ hàng.');
        }

        switch (action) {
          case 'increase':
            if (item.quantity < item.product.stock) {
              item.quantity += 1;
              await cart.save();
              await showCart(chatId);
            } else {
              bot.answerCallbackQuery(callbackQuery.id, 'Số lượng đã đạt tối đa trong kho.');
            }
            break;

          case 'decrease':
            if (item.quantity > 1) {
              item.quantity -= 1;
              await cart.save();
              await showCart(chatId);
            } else {
              bot.answerCallbackQuery(callbackQuery.id, 'Số lượng tối thiểu là 1. Nhấn 🗑️ để xóa sản phẩm.');
            }
            break;

          case 'remove':
            cart.items = cart.items.filter(i => i._id.toString() !== itemId);
            await cart.save();
            await showCart(chatId);
            break;
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật giỏ hàng:', error);
        bot.answerCallbackQuery(callbackQuery.id, 'Đã xảy ra lỗi khi cập nhật giỏ hàng.');
      }
    } else if (data === 'payment_stripe') {
      try {
        // Lấy thông tin giỏ hàng
        const cart = await Cart.findOne({ userId: chatId });
        if (!cart || !cart.items.length) {
          await bot.sendMessage(chatId, '❌ Giỏ hàng của bạn đang trống!');
          return;
        }

        // Tạo đơn hàng
        const order = await Order.create({
          userId: chatId,
          items: cart.items,
          total: cart.total,
          status: 'pending'
        });

        // Tạo session thanh toán Stripe
        const response = await axios.post(`${process.env.APP_URL}/api/payment/create-checkout-session`, {
          orderId: order._id,
          items: cart.items.map(item => ({
            name: item.productName,
            description: `Số lượng: ${item.quantity}`,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.imageUrl
          })),
          chatId: chatId
        });

        // Gửi link thanh toán với nút bấm
        const paymentMessage = '💳 Vui lòng click vào nút bên dưới để thanh toán:\n\n' +
                             '⚠️ Link thanh toán sẽ hết hạn sau 30 phút.';
        
        await bot.sendMessage(chatId, paymentMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔗 Thanh toán ngay', url: response.data.url }]
            ]
          }
        });

        // Không xóa giỏ hàng ngay, đợi thanh toán thành công
        
      } catch (error) {
        console.error('Lỗi khi xử lý thanh toán:', error);
        await bot.sendMessage(chatId, '❌ Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại sau.');
      }
    } else if (data.startsWith('view_order_')) {
      const orderId = data.split('view_order_')[1];
      try {
        const order = await Order.findOne({
          _id: orderId,
          user: sessions[chatId].user._id
        }).populate('items.product');

        if (!order) {
          return bot.answerCallbackQuery(callbackQuery.id, 'Không tìm thấy đơn hàng.');
        }

        // Hiển thị chi tiết đơn hàng
        let message = `📦 Chi tiết đơn hàng #${order._id}\n\n`;
        message += `📅 Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}\n`;
        message += `📍 Địa chỉ: ${order.shippingAddress}\n`;
        message += `📱 Số điện thoại: ${order.phone}\n`;
        message += `💳 Phương thức thanh toán: ${order.paymentMethod}\n`;
        message += `📊 Trạng thái: ${getOrderStatusText(order.status)}\n\n`;
        
        message += '🛍️ Danh sách sản phẩm:\n';
        order.items.forEach((item, index) => {
          message += `\n${index + 1}. ${item.product.name}\n`;
          message += `   Số lượng: ${item.quantity}\n`;
          message += `   Đơn giá: ${item.price.toLocaleString('vi-VN')} VNĐ\n`;
          message += `   Thành tiền: ${(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ\n`;
        });

        message += `\n💰 Tổng tiền: ${order.totalAmount.toLocaleString('vi-VN')} VNĐ`;

        await bot.sendMessage(chatId, message);
        await bot.answerCallbackQuery(callbackQuery.id);
      } catch (error) {
        console.error('Lỗi khi xem chi tiết đơn hàng:', error);
        bot.answerCallbackQuery(callbackQuery.id, 'Đã xảy ra lỗi khi xem chi tiết đơn hàng.');
      }
    }

    // Xóa dấu loading trên nút
    bot.answerCallbackQuery(callbackQuery.id);
  });

  // Xử lý lệnh /timkiem
  bot.onText(/\/timkiem (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const keyword = match[1];
    
    try {
      // Tìm kiếm sản phẩm theo từ khóa
      const products = await Product.find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } }
        ]
      }).limit(10);
      
      if (products.length === 0) {
        return bot.sendMessage(chatId, `Không tìm thấy sản phẩm nào với từ khóa "${keyword}".`);
      }

      // Hiển thị kết quả tìm kiếm
      let message = `Kết quả tìm kiếm cho "${keyword}":\n\n`;
      products.forEach((product, index) => {
        message += `${index + 1}. ${product.name}\n`;
        message += `   Giá: ${product.price.toLocaleString('vi-VN')} VNĐ\n`;
        message += `   Mô tả: ${product.description.substring(0, 50)}...\n\n`;
      });
      
      message += 'Để xem chi tiết sản phẩm, hãy gửi: /sanpham_<id>';
      
      bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm sản phẩm:', error);
      bot.sendMessage(chatId, 'Đã xảy ra lỗi khi tìm kiếm sản phẩm.');
    }
  });

  // Xử lý lệnh /giohang
  bot.onText(/\/giohang/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Kiểm tra nếu đã đăng nhập
    if (!sessions[chatId] || !sessions[chatId].user) {
      return bot.sendMessage(chatId, 'Vui lòng đăng nhập để xem giỏ hàng.');
    }

    try {
      await showCart(chatId);
    } catch (error) {
      console.error('Lỗi khi lấy giỏ hàng:', error);
      bot.sendMessage(chatId, 'Đã xảy ra lỗi khi lấy giỏ hàng.');
    }
  });

  // Xử lý lệnh /dathang
  bot.onText(/\/dathang/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Kiểm tra nếu đã đăng nhập
    if (!sessions[chatId] || !sessions[chatId].user) {
      return bot.sendMessage(chatId, 'Vui lòng đăng nhập để đặt hàng.');
    }

    try {
      // Lấy giỏ hàng của người dùng
      const cart = await Cart.findOne({ user: sessions[chatId].user._id }).populate('items.product');
      
      if (!cart || cart.items.length === 0) {
        return bot.sendMessage(chatId, 'Giỏ hàng của bạn đang trống.');
      }

      // Bắt đầu quá trình đặt hàng
      sessions[chatId].ordering = true;
      sessions[chatId].orderStep = 'address';
      
      bot.sendMessage(chatId, 'Vui lòng nhập địa chỉ giao hàng:');
    } catch (error) {
      console.error('Lỗi khi bắt đầu đặt hàng:', error);
      bot.sendMessage(chatId, 'Đã xảy ra lỗi khi bắt đầu đặt hàng.');
    }
  });

  // Xử lý lệnh /donhang
  bot.onText(/\/donhang/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Kiểm tra nếu đã đăng nhập
    if (!sessions[chatId] || !sessions[chatId].user) {
      return bot.sendMessage(chatId, 'Vui lòng đăng nhập để xem đơn hàng.');
    }

    try {
      // Lấy danh sách đơn hàng của người dùng
      const orders = await Order.find({ user: sessions[chatId].user._id })
        .sort({ createdAt: -1 })
        .populate('items.product');
      
      if (orders.length === 0) {
        return bot.sendMessage(chatId, 'Bạn chưa có đơn hàng nào.');
      }

      // Hiển thị danh sách đơn hàng với nút xem chi tiết
      let message = 'Danh sách đơn hàng của bạn:\n\n';
      const inlineKeyboard = [];
      
      orders.forEach((order, index) => {
        message += `${index + 1}. Mã đơn hàng: ${order._id}\n`;
        message += `   Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}\n`;
        message += `   Tổng tiền: ${order.totalAmount.toLocaleString('vi-VN')} VNĐ\n`;
        message += `   Trạng thái: ${getOrderStatusText(order.status)}\n\n`;

        // Thêm nút xem chi tiết cho mỗi đơn hàng
        inlineKeyboard.push([{
          text: `📋 Xem chi tiết đơn #${index + 1}`,
          callback_data: `view_order_${order._id}`
        }]);
      });
      
      await bot.sendMessage(chatId, message, {
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      bot.sendMessage(chatId, 'Đã xảy ra lỗi khi lấy danh sách đơn hàng.');
    }
  });

  // Xử lý lệnh /taikhoan
  bot.onText(/\/taikhoan/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Kiểm tra nếu đã đăng nhập
    if (!sessions[chatId] || !sessions[chatId].user) {
      return bot.sendMessage(chatId, 'Vui lòng đăng nhập để xem thông tin tài khoản.');
    }

    try {
      // Lấy thông tin người dùng từ database
      const user = await User.findById(sessions[chatId].user._id);
      
      if (!user) {
        delete sessions[chatId];
        return bot.sendMessage(chatId, 'Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.');
      }

      // Hiển thị thông tin tài khoản
      let message = 'Thông tin tài khoản của bạn:\n\n';
      message += `Họ tên: ${user.name}\n`;
      message += `Email: ${user.email}\n`;
      message += `Số điện thoại: ${user.phone || 'Chưa cập nhật'}\n`;
      message += `Địa chỉ: ${user.address || 'Chưa cập nhật'}\n`;
      
      bot.sendMessage(chatId, message);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin tài khoản:', error);
      bot.sendMessage(chatId, 'Đã xảy ra lỗi khi lấy thông tin tài khoản.');
    }
  });

  // Xử lý tin nhắn thông thường
  bot.on('message', async (msg) => {
    if (msg.text.startsWith('/')) return; // Bỏ qua các lệnh
    
    const chatId = msg.chat.id;
    const text = msg.text;
    
    // Nếu không có phiên làm việc
    if (!sessions[chatId]) return;
    
    // Xử lý nhập số lượng tùy chỉnh
    if (sessions[chatId].addingToCart?.waitingForQuantity) {
      const quantity = parseInt(text);
      if (isNaN(quantity) || quantity <= 0) {
        return bot.sendMessage(chatId, 'Vui lòng nhập một số hợp lệ lớn hơn 0.');
      }
      
      if (quantity > sessions[chatId].addingToCart.stock) {
        return bot.sendMessage(chatId, `Số lượng không được vượt quá ${sessions[chatId].addingToCart.stock}.`);
      }
      
      await addToCart(chatId, sessions[chatId].addingToCart.productId, quantity);
      return;
    }
    
    // Xử lý đăng ký
    if (sessions[chatId].registering) {
      handleRegistration(chatId, text);
      return;
    }
    
    // Xử lý đăng nhập
    if (sessions[chatId].loggingIn) {
      handleLogin(chatId, text);
      return;
    }
    
    // Xử lý đặt hàng
    if (sessions[chatId].ordering) {
      handleOrdering(chatId, text);
      return;
    }
  });
};

// Hàm xử lý đăng ký
const handleRegistration = async (chatId, text) => {
  const session = sessions[chatId];
  
  if (session.step === 'email') {
    // Kiểm tra email hợp lệ
    if (!isValidEmail(text)) {
      return bot.sendMessage(chatId, 'Email không hợp lệ. Vui lòng nhập lại:');
    }
    
    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email: text.toLowerCase() });
    if (existingUser) {
      return bot.sendMessage(chatId, 'Email đã được sử dụng. Vui lòng nhập email khác:');
    }
    
    session.email = text.toLowerCase();
    session.step = 'name';
    bot.sendMessage(chatId, 'Vui lòng nhập họ tên của bạn:');
  } else if (session.step === 'name') {
    session.name = text;
    session.step = 'password';
    bot.sendMessage(chatId, 'Vui lòng nhập mật khẩu của bạn (ít nhất 6 ký tự):');
  } else if (session.step === 'password') {
    if (text.length < 6) {
      return bot.sendMessage(chatId, 'Mật khẩu phải có ít nhất 6 ký tự. Vui lòng nhập lại:');
    }
    
    session.password = text;
    session.step = 'phone';
    bot.sendMessage(chatId, 'Vui lòng nhập số điện thoại của bạn:');
  } else if (session.step === 'phone') {
    session.phone = text;
    session.step = 'address';
    bot.sendMessage(chatId, 'Vui lòng nhập địa chỉ của bạn:');
  } else if (session.step === 'address') {
    session.address = text;
    
    try {
      // Tạo người dùng mới
      const newUser = new User({
        name: session.name,
        email: session.email,
        password: session.password, // Mật khẩu sẽ được hash tự động bởi middleware
        phone: session.phone,
        address: session.address
      });
      
      await newUser.save();
      
      // Tạo giỏ hàng cho người dùng mới
      const newCart = new Cart({
        user: newUser._id,
        items: []
      });
      
      await newCart.save();
      
      // Đăng nhập người dùng
      delete session.registering;
      delete session.step;
      session.user = newUser;
      
      bot.sendMessage(chatId, 'Đăng ký thành công! Bạn đã được đăng nhập tự động.');
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      bot.sendMessage(chatId, 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.');
      delete sessions[chatId];
    }
  }
};

// Hàm xử lý đăng nhập
const handleLogin = async (chatId, text) => {
  const session = sessions[chatId];
  
  if (session.step === 'email') {
    session.email = text.toLowerCase();
    session.step = 'password';
    bot.sendMessage(chatId, 'Vui lòng nhập mật khẩu của bạn:');
  } else if (session.step === 'password') {
    try {
      // Tìm người dùng theo email
      const user = await User.findOne({ email: session.email });
      
      if (!user) {
        delete sessions[chatId];
        return bot.sendMessage(chatId, 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
      }
      
      // Kiểm tra mật khẩu
      const isMatch = await bcrypt.compare(text, user.password);
      
      if (!isMatch) {
        delete sessions[chatId];
        return bot.sendMessage(chatId, 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
      }
      
      // Đăng nhập thành công
      delete session.loggingIn;
      delete session.step;
      session.user = user;
      
      bot.sendMessage(chatId, `Đăng nhập thành công! Chào mừng ${user.name}.`);
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      bot.sendMessage(chatId, 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.');
      delete sessions[chatId];
    }
  }
};

// Xử lý đặt hàng
const handleOrdering = async (chatId, text) => {
  const session = sessions[chatId];
  
  if (session.orderStep === 'address') {
    session.orderAddress = text;
    session.orderStep = 'phone';
    bot.sendMessage(chatId, 'Vui lòng nhập số điện thoại nhận hàng:');
  } else if (session.orderStep === 'phone') {
    session.orderPhone = text;
    session.orderStep = 'payment';
    
    // Hiển thị các phương thức thanh toán
    bot.sendMessage(chatId, 'Chọn phương thức thanh toán:\n1. Thanh toán khi nhận hàng (COD)\n2. Thanh toán bằng thẻ (Stripe)\n\nVui lòng nhập số tương ứng:');
  } else if (session.orderStep === 'payment') {
    let paymentMethod;
    
    if (text === '1') {
      paymentMethod = 'COD';
    } else if (text === '2') {
      paymentMethod = 'Stripe';
    } else {
      return bot.sendMessage(chatId, 'Lựa chọn không hợp lệ. Vui lòng nhập 1 hoặc 2:');
    }
    
    try {
      // Lấy giỏ hàng của người dùng
      const cart = await Cart.findOne({ user: session.user._id }).populate('items.product');
      
      if (!cart || cart.items.length === 0) {
        delete session.ordering;
        delete session.orderStep;
        return bot.sendMessage(chatId, 'Giỏ hàng của bạn đang trống. Không thể đặt hàng.');
      }
      
      // Tính tổng tiền
      let totalAmount = 0;
      const orderItems = cart.items.map(item => {
        const itemPrice = item.product.price * item.quantity;
        totalAmount += itemPrice;
        
        return {
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price
        };
      });
      
      // Tạo đơn hàng mới
      const newOrder = new Order({
        user: session.user._id,
        items: orderItems,
        totalAmount,
        shippingAddress: session.orderAddress,
        phone: session.orderPhone,
        paymentMethod,
        status: 'pending'
      });
      
      await newOrder.save();

      if (paymentMethod === 'Stripe') {
        // Tạo session thanh toán Stripe
        const response = await axios.post(`${process.env.APP_URL}/api/payment/create-checkout-session`, {
          orderId: newOrder._id,
          items: cart.items.map(item => ({
            name: item.product.name,
            description: `Số lượng: ${item.quantity}`,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.imageUrl
          })),
          chatId: chatId
        });

        // Gửi link thanh toán với nút bấm
        const paymentMessage = '💳 Vui lòng click vào nút bên dưới để thanh toán:\n\n' +
                             '⚠️ Link thanh toán sẽ hết hạn sau 30 phút.';
        
        await bot.sendMessage(chatId, paymentMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔗 Thanh toán ngay', url: response.data.url }]
            ]
          }
        });

        // Không xóa giỏ hàng ngay, đợi thanh toán thành công
        
      } else {
        // Xóa giỏ hàng nếu là COD
        cart.items = [];
        await cart.save();
        
        // Hoàn thành đặt hàng
        delete session.ordering;
        delete session.orderStep;
        delete session.orderAddress;
        delete session.orderPhone;
        
        bot.sendMessage(chatId, `Đặt hàng thành công! Mã đơn hàng của bạn là: ${newOrder._id}\n\nCảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi.`);
      }
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      bot.sendMessage(chatId, 'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại sau.');
      delete session.ordering;
      delete session.orderStep;
    }
  }
};

// Hàm kiểm tra email hợp lệ
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Hàm lấy text trạng thái đơn hàng
const getOrderStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Đang xử lý';
    case 'confirmed':
      return 'Đã xác nhận';
    case 'shipping':
      return 'Đang giao hàng';
    case 'delivered':
      return 'Đã giao hàng';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

// Hàm thêm vào giỏ hàng
const addToCart = async (chatId, productId, quantity) => {
  try {
    const session = sessions[chatId];
    const productName = session.addingToCart.productName; // Lưu tên sản phẩm trước
    
    // Tìm hoặc tạo giỏ hàng
    let cart = await Cart.findOne({ user: session.user._id });
    if (!cart) {
      cart = new Cart({ user: session.user._id, items: [] });
    }

    // Thêm sản phẩm vào giỏ hàng
    await cart.addItem(productId, quantity);

    // Xóa trạng thái chờ số lượng
    delete session.addingToCart;

    bot.sendMessage(chatId, `Đã thêm ${quantity} sản phẩm ${productName} vào giỏ hàng!\nDùng lệnh /giohang để xem giỏ hàng.`);
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error);
    bot.sendMessage(chatId, 'Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng.');
  }
};

// Thêm hàm hiển thị giỏ hàng
const showCart = async (chatId) => {
  const cart = await Cart.findOne({ user: sessions[chatId].user._id }).populate('items.product');
  
  if (!cart || cart.items.length === 0) {
    return bot.sendMessage(chatId, 'Giỏ hàng của bạn đang trống.');
  }

  let message = 'Giỏ hàng của bạn:\n\n';
  let totalPrice = 0;
  const inlineKeyboard = [];
  
  cart.items.forEach((item, index) => {
    const itemPrice = item.product.price * item.quantity;
    totalPrice += itemPrice;
    
    message += `${index + 1}. ${item.product.name}\n`;
    message += `   Số lượng: ${item.quantity}\n`;
    message += `   Đơn giá: ${item.product.price.toLocaleString('vi-VN')} VNĐ\n`;
    message += `   Thành tiền: ${itemPrice.toLocaleString('vi-VN')} VNĐ\n\n`;

    // Thêm nút điều chỉnh cho mỗi sản phẩm
    inlineKeyboard.push([
      { text: '➖', callback_data: `cart_decrease_${item._id}` },
      { text: `${item.quantity}`, callback_data: 'ignore' },
      { text: '➕', callback_data: `cart_increase_${item._id}` },
      { text: '🗑️', callback_data: `cart_remove_${item._id}` }
    ]);
  });
  
  message += `Tổng cộng: ${totalPrice.toLocaleString('vi-VN')} VNĐ\n\n`;
  message += 'Để đặt hàng, hãy gửi: /dathang';

  await bot.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });
};

module.exports = {
  start,
  bot
}; 