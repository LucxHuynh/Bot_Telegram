const express = require('express');
const passport = require('passport');
const router = express.Router();
const bot = require('../services/telegramBot').bot;

// Route bắt đầu đăng nhập Google
router.get('/google', (req, res, next) => {
  const chatId = req.query.chatId;
  if (!chatId) {
    return res.status(400).send('ChatId is required');
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: chatId // Truyền chatId qua state parameter
  })(req, res, next);
});

// Route callback sau khi đăng nhập Google thành công
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/api/auth/failure' }),
  async (req, res) => {
    try {
      const chatId = req.query.state; // Lấy chatId từ state parameter
      if (!chatId) {
        return res.status(400).send('ChatId not found in state parameter');
      }

      // Lưu thông tin user vào session của bot
      if (!global.sessions) {
        global.sessions = {};
      }
      global.sessions[chatId] = {
        user: req.user
      };

      // Gửi thông báo đăng nhập thành công qua bot
      await bot.sendMessage(chatId, `Đăng nhập Google thành công! Chào mừng ${req.user.name}.`);

      // Chuyển hướng về trang thành công
      res.redirect('/api/auth/success');
    } catch (error) {
      console.error('Lỗi khi xử lý callback Google:', error);
      res.status(500).send('Internal Server Error');
    }
  }
);

// Route khi đăng nhập thất bại
router.get('/failure', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Đăng nhập thất bại</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f2f5;
          }
          .failure-container {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          h1 { color: #d93025; }
          p { color: #5f6368; }
        </style>
      </head>
      <body>
        <div class="failure-container">
          <h1>Đăng nhập thất bại!</h1>
          <p>Vui lòng thử lại hoặc liên hệ admin để được hỗ trợ.</p>
          <p>Bạn có thể đóng tab này và quay lại Telegram Bot.</p>
        </div>
      </body>
    </html>
  `);
});

// Route hiển thị trang thành công
router.get('/success', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Đăng nhập thành công</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f2f5;
          }
          .success-container {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          h1 { color: #1a73e8; }
          p { color: #5f6368; }
        </style>
      </head>
      <body>
        <div class="success-container">
          <h1>Đăng nhập thành công!</h1>
          <p>Bạn có thể đóng tab này và quay lại Telegram Bot.</p>
        </div>
      </body>
    </html>
  `);
});

module.exports = router; 