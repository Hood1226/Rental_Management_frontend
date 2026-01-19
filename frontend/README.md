# Rental Management System - Frontend

React 18 application with Vite for Rental and Sales Management System.

## Technology Stack
- React 18.2
- Vite 5.0
- React Router DOM 6.20
- TanStack Query (React Query) 5.12
- Axios 1.6
- React Hook Form 7.48
- Zustand 4.4 (State Management)
- Tailwind CSS 3.3
- Lucide React (Icons)

## Prerequisites
- Node.js 18+ and npm/yarn

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure
```
src/
├── components/      # Reusable components
│   └── Layout/     # Layout components (Sidebar, Header)
├── pages/          # Page components
│   ├── Auth/      # Authentication pages
│   ├── Dashboard/ # Dashboard page
│   ├── Products/  # Products page
│   ├── Customers/ # Customers page
│   ├── Bookings/  # Bookings page
│   └── Inventory/ # Inventory page
├── services/       # API service functions
├── store/          # Zustand stores
└── App.jsx         # Main app component
```

## Features
- User authentication
- Product management
- Customer management
- Booking management (Rent/Sale)
- Inventory tracking
- Responsive design


