const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Log tất cả các biến môi trường (ẩn giá trị nhạy cảm)
console.log('Environment variables loaded:', {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '***' : undefined,
  STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY ? '***' : undefined,
  MONGODB_URI: process.env.MONGODB_URI ? '***' : undefined,
  NODE_ENV: process.env.NODE_ENV,
});

const config = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publicKey: process.env.STRIPE_PUBLIC_KEY,
  },
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
  },
};

// Kiểm tra các biến môi trường bắt buộc
const requiredEnvs = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLIC_KEY',
  'MONGODB_URI',
  'TELEGRAM_BOT_TOKEN',
];

const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
if (missingEnvs.length > 0) {
  console.error('Missing required environment variables:', missingEnvs);
}

module.exports = config; 