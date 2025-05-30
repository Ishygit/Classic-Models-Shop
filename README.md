# 🚗 Classic Models Shop

A modern e-commerce platform for classic model cars and collectibles, built with Node.js, Express, and MySQL. Enjoy features like product browsing, cart management, user authentication, and more.

---

## ✨ Features

### **User Authentication**
- User registration and login
- Secure password hashing
- Session management

### **Product Management**
- Browse and search for model cars
- Detailed product views
- Featured products
- Admin dashboard for product and order management

### **Shopping Cart**
- Add/remove items
- Update quantities
- Real-time price calculations
- Order summary

### **Order Management**
- Secure checkout process
- Order tracking

### **Responsive Design**
- Mobile-friendly interface
- Clean and modern UI

---

## 🛠️ Tech Stack

### **Backend**
- Node.js
- Express.js
- MySQL
- EJS (Template Engine)

### **Frontend**
- HTML, CSS, JavaScript
- Bootstrap 5
- Responsive Design

---

## 📦 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn
- [Git LFS](https://git-lfs.github.com/) (for handling large image files)

---

## 🚀 Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Ishygit/Classic-Models-Shop.git
   cd classicModelShop
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up Git LFS (if not already):**
   ```sh
   git lfs install
   git lfs pull
   ```
4. **Create a `.env` file in the root directory:**
   ```env
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=classicmodels
   PORT=3000
   SESSION_SECRET=your_session_secret
   ```
5. **Import the database schema:**
   ```sh
   mysql -u your_mysql_username -p < classicModelsDB.sql
   ```
6. **Start the development server:**
   ```sh
   npm run dev
   ```
7. **Open your browser and navigate to:**
   [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
classicmodelshop/
├── config/             # Configuration files
├── controllers/        # Controller logic
├── middleware/         # Custom middleware
├── models/             # Database models
├── public/             # Static files (CSS, JS, images)
├── routes/             # Route handlers
├── scripts/            # Setup and utility scripts (not committed)
├── sql/                # SQL schema and procedures
├── views/              # EJS templates
├── .env                # Environment variables (not committed)
├── .gitignore          # Git ignore rules
├── .gitattributes      # Git LFS tracking
├── app.js              # Main application file
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

---

## 👥 User Roles

### **Guest Users**
- Browse products
- View product details
- Add items to cart (requires login to checkout)

### **Registered Users**
- All guest user features
- User authentication
- Cart management
- Order placement and tracking

### **Admin Users**
- Product and order management

---

## 🔒 Security Features
- Password hashing using bcrypt
- Session-based authentication
- Protected routes
- Input validation
- SQL injection prevention

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 👤 Author

Your Name - [@Ishygit](https://github.com/Ishygit)

---

## 🙏 Acknowledgments

- [Bootstrap](https://getbootstrap.com/)
- [Express.js](https://expressjs.com/)
- [MySQL](https://www.mysql.com/)
- [EJS](https://ejs.co/)
- [Node.js](https://nodejs.org/)

 
