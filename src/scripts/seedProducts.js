require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const seedProducts = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('📦 Đã kết nối MongoDB');

    // Xóa tất cả sản phẩm cũ
    await Product.deleteMany({});
    console.log('🗑️ Đã xóa sản phẩm cũ');

    // Thêm sản phẩm mới
    await Product.insertMany([
      // 📱 Apple (5 sản phẩm)
      {
        name: "iPhone 15 Pro Max",
        description: "Flagship Apple, camera ProRAW, màn hình 120Hz.",
        price: 32990,
        stock: 10,
        imageUrl: "https://example.com/iphone15promax.jpg",
        brand: "Apple",
        category: "Smartphone",
        specifications: {
          screen: "6.7 inch OLED",
          processor: "A17 Pro",
          ram: "8GB",
          storage: "256GB",
          camera: "48MP + 12MP + 12MP",
          battery: "4422mAh",
          operatingSystem: "iOS 17"
        }
      },
      {
        name: "iPhone 14 Pro",
        description: "Màn hình 120Hz, Dynamic Island, camera 48MP.",
        price: 27990,
        stock: 8,
        imageUrl: "https://example.com/iphone14pro.jpg",
        brand: "Apple",
        category: "Smartphone",
        specifications: {
          screen: "6.1 inch OLED",
          processor: "A16 Bionic",
          ram: "6GB",
          storage: "128GB",
          camera: "48MP + 12MP + 12MP",
          battery: "3200mAh",
          operatingSystem: "iOS 16"
        }
      },
      {
        name: "iPhone 13 Mini",
        description: "Nhỏ gọn, chip A15 Bionic, Face ID.",
        price: 18990,
        stock: 15,
        imageUrl: "https://example.com/iphone13mini.jpg",
        brand: "Apple",
        category: "Smartphone",
        specifications: {
          screen: "5.4 inch OLED",
          processor: "A15 Bionic",
          ram: "4GB",
          storage: "128GB",
          camera: "12MP + 12MP",
          battery: "2438mAh",
          operatingSystem: "iOS 15"
        }
      },
      {
        name: "iPhone SE 2022",
        description: "Chip A15 Bionic, Touch ID, giá tốt.",
        price: 14990,
        stock: 20,
        imageUrl: "https://example.com/iphonese2022.jpg",
        brand: "Apple",
        category: "Smartphone",
        specifications: {
          screen: "4.7 inch IPS",
          processor: "A15 Bionic",
          ram: "4GB",
          storage: "64GB",
          camera: "12MP",
          battery: "2018mAh",
          operatingSystem: "iOS 15"
        }
      },
      {
        name: "iPhone 12",
        description: "Thiết kế vuông, màn hình OLED, 5G.",
        price: 16990,
        stock: 12,
        imageUrl: "https://example.com/iphone12.jpg",
        brand: "Apple",
        category: "Smartphone",
        specifications: {
          screen: "6.1 inch OLED",
          processor: "A14 Bionic",
          ram: "4GB",
          storage: "64GB",
          camera: "12MP + 12MP",
          battery: "2815mAh",
          operatingSystem: "iOS 14"
        }
      },

      // 📱 Samsung (5 sản phẩm)
      {
        name: "Samsung Galaxy S23 Ultra",
        description: "Màn hình Dynamic AMOLED 2X, S-Pen, camera 200MP.",
        price: 29990,
        stock: 8,
        imageUrl: "https://example.com/s23ultra.jpg",
        brand: "Samsung",
        category: "Smartphone",
        specifications: {
          screen: "6.8 inch Dynamic AMOLED 2X",
          processor: "Snapdragon 8 Gen 2",
          ram: "12GB",
          storage: "256GB",
          camera: "200MP + 12MP + 10MP + 10MP",
          battery: "5000mAh",
          operatingSystem: "Android 13"
        }
      },
      {
        name: "Samsung Galaxy Z Fold 4",
        description: "Màn hình gập AMOLED 120Hz, chip Snapdragon 8 Gen 2.",
        price: 39990,
        stock: 5,
        imageUrl: "https://example.com/zfold4.jpg",
        brand: "Samsung",
        category: "Smartphone",
        specifications: {
          screen: "7.6 inch Dynamic AMOLED 2X",
          processor: "Snapdragon 8+ Gen 1",
          ram: "12GB",
          storage: "256GB",
          camera: "50MP + 12MP + 10MP",
          battery: "4400mAh",
          operatingSystem: "Android 12"
        }
      },
      {
        name: "Samsung Galaxy S22+",
        description: "Chip Exynos 2200, màn hình AMOLED 120Hz.",
        price: 24990,
        stock: 12,
        imageUrl: "https://example.com/s22plus.jpg",
        brand: "Samsung",
        category: "Smartphone",
        specifications: {
          screen: "6.6 inch Dynamic AMOLED 2X",
          processor: "Exynos 2200",
          ram: "8GB",
          storage: "128GB",
          camera: "50MP + 12MP + 10MP",
          battery: "4500mAh",
          operatingSystem: "Android 12"
        }
      },
      {
        name: "Samsung Galaxy A73",
        description: "Camera 108MP, màn hình 120Hz, pin 5000mAh.",
        price: 13990,
        stock: 18,
        imageUrl: "https://example.com/a73.jpg",
        brand: "Samsung",
        category: "Smartphone",
        specifications: {
          screen: "6.7 inch Super AMOLED",
          processor: "Snapdragon 778G",
          ram: "8GB",
          storage: "128GB",
          camera: "108MP + 12MP + 5MP + 5MP",
          battery: "5000mAh",
          operatingSystem: "Android 12"
        }
      },
      {
        name: "Samsung Galaxy M54",
        description: "Màn hình 120Hz, pin 6000mAh, giá tốt.",
        price: 11990,
        stock: 20,
        imageUrl: "https://example.com/m54.jpg",
        brand: "Samsung",
        category: "Smartphone",
        specifications: {
          screen: "6.7 inch Super AMOLED",
          processor: "Exynos 1380",
          ram: "8GB",
          storage: "128GB",
          camera: "108MP + 8MP + 2MP",
          battery: "6000mAh",
          operatingSystem: "Android 13"
        }
      },

      // 📱 Xiaomi (5 sản phẩm)
      {
        name: "Xiaomi 13 Pro",
        description: "Chip Snapdragon 8 Gen 2, camera Leica, màn hình 120Hz.",
        price: 19990,
        stock: 15,
        imageUrl: "https://example.com/xiaomi13pro.jpg",
        brand: "Xiaomi",
        category: "Smartphone",
        specifications: {
          screen: "6.73 inch AMOLED",
          processor: "Snapdragon 8 Gen 2",
          ram: "12GB",
          storage: "256GB",
          camera: "50MP + 50MP + 50MP",
          battery: "4820mAh",
          operatingSystem: "Android 13"
        }
      },
      {
        name: "Xiaomi 12T Pro",
        description: "Snapdragon 8+ Gen 1, màn AMOLED 120Hz.",
        price: 16990,
        stock: 10,
        imageUrl: "https://example.com/xiaomi12tpro.jpg",
        brand: "Xiaomi",
        category: "Smartphone",
        specifications: {
          screen: "6.67 inch AMOLED",
          processor: "Snapdragon 8+ Gen 1",
          ram: "12GB",
          storage: "256GB",
          camera: "200MP + 8MP + 2MP",
          battery: "5000mAh",
          operatingSystem: "Android 12"
        }
      },
      {
        name: "Xiaomi Redmi Note 12 Pro",
        description: "Dimensity 1080, camera 50MP OIS.",
        price: 12990,
        stock: 20,
        imageUrl: "https://example.com/redminote12pro.jpg",
        brand: "Xiaomi",
        category: "Smartphone",
        specifications: {
          screen: "6.67 inch AMOLED",
          processor: "Dimensity 1080",
          ram: "8GB",
          storage: "128GB",
          camera: "50MP + 8MP + 2MP",
          battery: "5000mAh",
          operatingSystem: "Android 12"
        }
      },
      {
        name: "Xiaomi Poco F4 GT",
        description: "Chip Snapdragon 8 Gen 1, sạc 120W.",
        price: 15990,
        stock: 18,
        imageUrl: "https://example.com/pocof4gt.jpg",
        brand: "Xiaomi",
        category: "Smartphone",
        specifications: {
          screen: "6.67 inch AMOLED",
          processor: "Snapdragon 8 Gen 1",
          ram: "12GB",
          storage: "256GB",
          camera: "64MP + 8MP + 2MP",
          battery: "4700mAh",
          operatingSystem: "Android 12"
        }
      },
      {
        name: "Xiaomi Black Shark 5",
        description: "Gaming phone, màn hình 144Hz, tản nhiệt tốt.",
        price: 17990,
        stock: 14,
        imageUrl: "https://example.com/blackshark5.jpg",
        brand: "Xiaomi",
        category: "Smartphone",
        specifications: {
          screen: "6.67 inch AMOLED",
          processor: "Snapdragon 8 Gen 1",
          ram: "12GB",
          storage: "256GB",
          camera: "64MP + 13MP + 2MP",
          battery: "4650mAh",
          operatingSystem: "Android 12"
        }
      },

      // 📱 Other (5 sản phẩm)
      {
        name: "Realme GT Neo 5",
        description: "Dimensity 8100, màn hình AMOLED 144Hz.",
        price: 13990,
        stock: 20,
        imageUrl: "https://example.com/realmegtneo5.jpg",
        brand: "Realme",
        category: "Smartphone",
        specifications: {
          screen: "6.7 inch AMOLED",
          processor: "Dimensity 8100",
          ram: "8GB",
          storage: "128GB",
          camera: "64MP + 8MP + 2MP",
          battery: "5000mAh",
          operatingSystem: "Android 13"
        }
      },
      {
        name: "OnePlus 11",
        description: "Snapdragon 8 Gen 2, màn hình LTPO 120Hz.",
        price: 18990,
        stock: 15,
        imageUrl: "https://example.com/oneplus11.jpg",
        brand: "OnePlus",
        category: "Smartphone",
        specifications: {
          screen: "6.7 inch AMOLED",
          processor: "Snapdragon 8 Gen 2",
          ram: "12GB",
          storage: "256GB",
          camera: "50MP + 48MP + 32MP",
          battery: "5000mAh",
          operatingSystem: "Android 13"
        }
      },
      {
        name: "OPPO Find X6 Pro",
        description: "Màn hình QHD+, camera Hasselblad.",
        price: 21990,
        stock: 7,
        imageUrl: "https://example.com/findx6pro.jpg",
        brand: "OPPO",
        category: "Smartphone",
        specifications: {
          screen: "6.82 inch AMOLED",
          processor: "Snapdragon 8 Gen 2",
          ram: "12GB",
          storage: "256GB",
          camera: "50MP + 50MP + 50MP",
          battery: "5000mAh",
          operatingSystem: "Android 13"
        }
      },
      {
        name: "Vivo X90 Pro",
        description: "MediaTek Dimensity 9200, camera Zeiss.",
        price: 20990,
        stock: 10,
        imageUrl: "https://example.com/x90pro.jpg",
        brand: "Vivo",
        category: "Smartphone",
        specifications: {
          screen: "6.78 inch AMOLED",
          processor: "Dimensity 9200",
          ram: "12GB",
          storage: "256GB",
          camera: "50MP + 50MP + 12MP",
          battery: "4870mAh",
          operatingSystem: "Android 13"
        }
      },
      {
        name: "Nubia Red Magic 8 Pro",
        description: "Gaming phone, màn hình 165Hz, tản nhiệt tốt.",
        price: 19990,
        stock: 8,
        imageUrl: "https://example.com/redmagic8pro.jpg",
        brand: "Nubia",
        category: "Smartphone",
        specifications: {
          screen: "6.8 inch AMOLED",
          processor: "Snapdragon 8 Gen 2",
          ram: "12GB",
          storage: "256GB",
          camera: "50MP + 8MP + 2MP",
          battery: "6000mAh",
          operatingSystem: "Android 13"
        }
      }
    ]);

    console.log('✅ Đã thêm sản phẩm thành công!');
  } catch (error) {
    console.error('❌ Lỗi khi thêm sản phẩm:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Đã ngắt kết nối MongoDB');
    process.exit();
  }
};

seedProducts(); 