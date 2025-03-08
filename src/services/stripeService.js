require('dotenv').config();

let stripe = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized successfully');
  } else {
    console.error('WARNING: STRIPE_SECRET_KEY is not configured');
  }
} catch (error) {
  console.error('Error initializing Stripe:', error.message);
}

const createPaymentSession = async ({ orderId, items, chatId }) => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please check your environment variables.');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      metadata: {
        orderId: orderId.toString(),
        chatId: chatId.toString()
      },
      line_items: items.map(item => ({
        price_data: {
          currency: 'vnd',
          product_data: {
            name: item.name,
            description: item.description,
            images: item.image ? [item.image] : [],
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      success_url: `${process.env.APP_URL}/api/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/api/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
    });

    return session;
  } catch (error) {
    console.error('Lỗi khi tạo phiên thanh toán Stripe:', error);
    throw error;
  }
};

// Kiểm tra trạng thái thanh toán
const checkPaymentStatus = async (sessionId) => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please check your environment variables.');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status === 'paid';
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
    throw error;
  }
};

module.exports = {
  createPaymentSession,
  checkPaymentStatus,
  stripe
}; 