# 🎓 IBIK Attendance System - Frontend

A professional Face Recognition based attendance management system built with React 19, TypeScript, and Tailwind CSS 4.

## ✨ Features

- **🔐 Secure Authentication**: Role-based access control for Users and Administrators.
- **📸 Face Recognition**: Advanced attendance logging using facial feature mapping.
- **📊 Admin Dashboard**: Comprehensive management of user attendance, data filtering, and server-side pagination.
- **📥 Excel Export**: Generate attendance reports with a single click, synchronized with active filters.
- **⏱️ Real-time Tracking**: Accurate lateness calculation and attendance status monitoring.
- **🎨 Modern UI**: Premium, responsive design with glassmorphism effects and smooth micro-animations.

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Navigation**: [React Router 7](https://reactrouter.com/)
- **API Client**: [Axios](https://axios-http.com/)

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Backend server](https://github.com/PabloRaka/attendance-server.git) running (FastAPI)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attandance/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root of the frontend directory:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `src/components`: Reusable UI components (Sidebar, Tables, Modals).
- `src/pages`: Application views (Dashboard, Admin, History, Profile).
- `src/context`: Auth and Global State management.
- `src/lib`: Utility functions and API configurations.
- `src/assets`: Static assets and styling tokens.

## 📝 License

This project is developed for internal use at IBIK. All rights reserved.
