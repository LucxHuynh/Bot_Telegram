# Ứng Dụng Bán Điện Thoại Kết Nối Với Telegram Bot

Ứng dụng backend cho cửa hàng bán điện thoại kết nối với Telegram Bot, cho phép người dùng thực hiện các thao tác như đăng nhập, đăng ký, xem sản phẩm, tìm kiếm, thêm vào giỏ hàng và đặt hàng thông qua Telegram.

## Cài Đặt

1. Clone repository:
```
git clone <repository-url>
cd phone-shop-bot
```

2. Cài đặt các dependencies:
```
npm install
```

3. Tạo file `.env` với các biến môi trường cần thiết:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/phone-shop
JWT_SECRET=your_jwt_secret_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
NODE_ENV=development
```

4. Khởi động server:
```
npm start
```

## Tạo Telegram Bot

1. Mở Telegram và tìm kiếm `@BotFather`
2. Gửi lệnh `/newbot` và làm theo hướng dẫn để tạo bot mới
3. Sau khi tạo xong, bạn sẽ nhận được token của bot
4. Sao chép token và thêm vào file `.env` với key `TELEGRAM_BOT_TOKEN`

## Các Lệnh Telegram Bot

Bot hỗ trợ các lệnh sau:

- `/start` - Hiển thị thông tin chào mừng và danh sách lệnh
- `/dangnhap` - Đăng nhập vào tài khoản
- `/dangnhap_google` - Đăng nhập bằng Google
- `/dangky` - Đăng ký tài khoản mới
- `/dangxuat` - Đăng xuất khỏi tài khoản
- `/sanpham` - Xem tất cả sản phẩm
- `/timkiem <từ khóa>` - Tìm kiếm sản phẩm
- `/giohang` - Xem giỏ hàng của bạn
- `/dathang` - Đặt hàng
- `/donhang` - Xem đơn hàng của bạn
- `/taikhoan` - Xem thông tin tài khoản

## API Endpoints

### Người Dùng

- `POST /api/users/register` - Đăng ký người dùng mới
- `POST /api/users/login` - Đăng nhập
- `GET /api/users/me` - Lấy thông tin người dùng hiện tại
- `PATCH /api/users/me` - Cập nhật thông tin người dùng
- `POST /api/users/logout` - Đăng xuất

### Sản Phẩm

- `GET /api/products` - Lấy tất cả sản phẩm
- `GET /api/products/:id` - Lấy sản phẩm theo ID
- `GET /api/products/search/:keyword` - Tìm kiếm sản phẩm
- `POST /api/products` - Tạo sản phẩm mới (chỉ admin)
- `PATCH /api/products/:id` - Cập nhật sản phẩm (chỉ admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (chỉ admin)

### Giỏ Hàng

- `GET /api/cart` - Lấy giỏ hàng của người dùng
- `POST /api/cart/add` - Thêm sản phẩm vào giỏ hàng
- `PATCH /api/cart/update` - Cập nhật số lượng sản phẩm trong giỏ hàng
- `DELETE /api/cart/remove/:productId` - Xóa sản phẩm khỏi giỏ hàng
- `DELETE /api/cart/clear` - Xóa tất cả sản phẩm trong giỏ hàng

### Đơn Hàng

- `GET /api/orders` - Lấy tất cả đơn hàng của người dùng
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng theo ID
- `POST /api/orders` - Tạo đơn hàng mới
- `PATCH /api/orders/cancel/:id` - Hủy đơn hàng
- `PATCH /api/orders/status/:id` - Cập nhật trạng thái đơn hàng (chỉ admin)
- `GET /api/orders/admin/all` - Lấy tất cả đơn hàng (chỉ admin)

## Công Nghệ Sử Dụng

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- node-telegram-bot-api

## Tác Giả

[Tên Tác Giả]

## Giấy Phép

ISC 