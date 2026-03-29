# TaskPro Backend API

A robust Node.js and Express backend for the TaskPro management application, featuring secure authentication, resource ownership management, and integrated cloud storage.

## 🚀 Technologies Used
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Security:** JWT (Access & Refresh tokens), Bcrypt password hashing
- **Storage:** Cloudinary (for user avatars and dashboard backgrounds)
- **Communication:** Nodemailer (for help requests and account confirmations)
- **Documentation:** Swagger UI

## 🛠 Features
- **User Authentication:** Registration, login, and secure session management with token rotation.
- **Resource Management:** Create and manage Dashboards, Columns, and Cards with strict ownership verification.
- **Drag & Drop API:** Optimized endpoints for reordering cards and moving them between columns.
- **Profile Customization:** Support for user avatars and custom UI themes.
- **Automated Emailing:** Send confirmation emails and support requests via dedicated mail service.

## ⚙️ Setup Instructions
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rudopulos/TaskPro_BackEnd.git
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    -   Copy `.env.example` to a new file named `.env`.
    -   Fill in your MongoDB connection string, JWT secrets, Cloudinary credentials, and Email settings.
4.  **Run the application:**
    -   Development: `npm run start:dev`
    -   Production: `npm run start`

## 📚 API Documentation
Once the server is running, you can explore and test the API endpoints using the Swagger documentation:
`http://localhost:5000/api-docs`
