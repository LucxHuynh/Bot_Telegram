const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const telegramBot = require('../services/telegramBot');

// Route tạo phiên thanh toán
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { orderId, items, chatId } = req.body;
    
    const session = await stripeService.createPaymentSession({
      orderId,
      items,
      chatId
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Lỗi khi tạo phiên thanh toán:', error);
    res.status(500).json({ error: 'Không thể tạo phiên thanh toán' });
  }
});

// Route kiểm tra trạng thái thanh toán
router.get('/check-payment-status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const isPaid = await stripeService.checkPaymentStatus(sessionId);
    res.json({ paid: isPaid });
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
    res.status(500).json({ error: 'Không thể kiểm tra trạng thái thanh toán' });
  }
});

// Trang thành công
router.get('/success', async (req, res) => {
  const { session_id } = req.query;
  
  try {
    // Kiểm tra trạng thái thanh toán
    const session = await stripeService.stripe.checkout.sessions.retrieve(session_id);
    const isPaid = session.payment_status === 'paid';
    
    if (isPaid) {
      // Cập nhật trạng thái đơn hàng
      const orderId = session.metadata.orderId;
      const chatId = session.metadata.chatId;
      
      await Order.findByIdAndUpdate(orderId, {
        status: 'confirmed',
        paymentStatus: 'paid'
      });

      // Gửi thông báo qua Telegram
      if (chatId) {
        await telegramBot.bot.sendMessage(
          chatId,
          '✅ Thanh toán thành công! Cảm ơn bạn đã đặt hàng.\n\n' +
          'Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ thông báo khi đơn hàng được giao đi.'
        );
      }

      // Xóa giỏ hàng
      if (chatId) {
        await Cart.findOneAndDelete({ userId: chatId });
      }
    }

    res.send(`
      <html>
        <head>
          <title>Thanh toán thành công</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background-color: #f0f2f5;
            }
            .success-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .success { 
              color: #4CAF50; 
              font-size: 24px; 
              margin-bottom: 20px;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="success-container">
            <div class="icon">✅</div>
            <h1 class="success">Thanh toán thành công!</h1>
            <p>Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.</p>
            <p>Bạn có thể quay lại Telegram để xem thông tin đơn hàng.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Lỗi khi xử lý thanh toán thành công:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Lỗi xử lý thanh toán</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background-color: #f0f2f5;
            }
            .error-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .error { 
              color: #f44336; 
              font-size: 24px; 
              margin-bottom: 20px;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <div class="icon">❌</div>
            <h1 class="error">Đã có lỗi xảy ra</h1>
            <p>Vui lòng kiểm tra lại trạng thái đơn hàng trong Telegram Bot.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// Trang hủy
router.get('/cancel', async (req, res) => {
  const { chatId } = req.query;
  
  try {
    const session = await stripeService.stripe.checkout.sessions.retrieve(chatId);
    
    if (session.metadata.chatId) {
      await telegramBot.bot.sendMessage(
        session.metadata.chatId,
        '❌ Thanh toán đã bị hủy.\n' +
        'Bạn có thể thử thanh toán lại hoặc chọn phương thức thanh toán khác.'
      );
    }

    res.send(`
      <html>
        <head>
          <title>Thanh toán bị hủy</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background-color: #f0f2f5;
            }
            .cancel-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 40px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .cancel { 
              color: #f44336; 
              font-size: 24px; 
              margin-bottom: 20px;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="cancel-container">
            <div class="icon">❌</div>
            <h1 class="cancel">Thanh toán đã bị hủy</h1>
            <p>Bạn có thể quay lại Telegram để thử thanh toán lại hoặc chọn phương thức thanh toán khác.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Lỗi khi xử lý hủy thanh toán:', error);
    res.status(500).send('Đã có lỗi xảy ra');
  }
});

module.exports = router; 