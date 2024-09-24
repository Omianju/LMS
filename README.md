# Learning Management System (LMS) Backend

Welcome to the **Learning Management System (LMS) Backend**. This project provides a comprehensive backend for managing course data, users, and analytics. It supports CRUD operations, dashboard data provision, scheduled cron jobs, and implements a highly secure authentication system with automatic token refreshing every 5 minutes.

## Features

- **User Management**: Add, update, delete, and search for users (teachers, students, and admins).
- **Course Management**: Perform CRUD operations for courses and track student progress.
- **Dashboard Analytics**: Provide data for visualizations such as user activity, course engagement, etc.
- **Secure Authentication**: Implement JWT-based authentication with refresh tokens, and automatically refresh tokens every 5 minutes for enhanced security.
- **Role-based Access Control (RBAC)**: Only authorized users can access specific routes and perform operations.
- **Cron Jobs**: Automate tasks like data backups, sending email reminders, and updating statistics at regular intervals.
- **Support File Upload**: Support for file uploads (e.g., course materials).
## Tech Stack

- **Node.js**: Server-side runtime environment
- **Express.js**: Web framework for handling API requests and middleware
- **MongoDB**: NoSQL database to store user, course, and progress data
- **Mongoose**: ODM for MongoDB, providing schema-based data models
- **JWT (JSON Web Tokens)**: For authentication and authorization
- **Bcrypt**: For hashing user passwords before storing them securely
- **Nodemailer**: For email notifications
- **Node-cron**: For scheduling automated tasks
- **Cors**: For configuring cross-origin resource sharing

## Authentication and Security

The backend implements a **JWT-based authentication system** with the following features:
- **Access Token**: Short-lived token (15 minutes) used for accessing protected resources.
- **Refresh Token**: Long-lived token (7 days) stored securely and used to generate new access tokens.
- **Automatic Token Refresh**: The refresh token is used to obtain a new access token every 5 minutes to ensure uninterrupted and secure sessions.
- **Password Hashing**: User passwords are hashed using **bcrypt** to store them securely.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Omianju/LMS-Backend.git
   cd lms-backend
