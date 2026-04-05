import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import ProductDetails from './pages/Products/ProductDetails';
import Customers from './pages/Customers/Customers';
import Bookings from './pages/Bookings/Bookings';
import BookingDetails from './pages/Bookings/BookingDetails';
import Transactions from './pages/Transactions/Transactions';
import Inventory from './pages/Inventory/Inventory';
import Login from './pages/Auth/Login';

// New imports
import { AuthProvider, useAuth } from './context/AuthContext';
import UserList from './pages/Users/UserList';
import RoleList from './pages/Roles/RoleList';
import RoleAccess from './pages/RoleAccess/RoleAccess';
import ModuleList from './pages/Modules/ModuleList';
import PermissionGuard from './components/PermissionGuard';
import ShopBranchMaster from './pages/ShopsBranches/ShopBranchMaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<PermissionGuard moduleKey="PRODUCT_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}><Products /></PermissionGuard>} />
              <Route path="products/:id" element={<PermissionGuard moduleKey="PRODUCT_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}><ProductDetails /></PermissionGuard>} />
              <Route path="customers" element={<PermissionGuard moduleKey="CUSTOMER_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}><Customers /></PermissionGuard>} />
              <Route path="bookings" element={<PermissionGuard moduleKey="BOOKING_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}><Bookings /></PermissionGuard>} />
              <Route path="bookings/:id" element={<PermissionGuard moduleKey="BOOKING_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}><BookingDetails /></PermissionGuard>} />
              <Route path="transactions" element={<PermissionGuard moduleKey="TRANSACTION_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}><Transactions /></PermissionGuard>} />
              <Route path="inventory" element={<PermissionGuard moduleKey="INVENTORY_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}><Inventory /></PermissionGuard>} />
              <Route path="shop-branch" element={<ShopBranchMaster />} />
              
              {/* New Routes */}
              <Route 
                path="users" 
                element={
                  <PermissionGuard moduleKey="USER_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}>
                    <UserList />
                  </PermissionGuard>
                } 
              />
              <Route 
                path="roles" 
                element={
                  <PermissionGuard moduleKey="ROLE_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}>
                    <RoleList />
                  </PermissionGuard>
                } 
              />
              <Route 
                path="role-access" 
                element={
                  <PermissionGuard moduleKey="ROLE_ACCESS_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}>
                    <RoleAccess />
                  </PermissionGuard>
                } 
              />
              <Route 
                path="modules" 
                element={
                  <PermissionGuard moduleKey="MODULE_MANAGEMENT" action="READ" fallback={<Navigate to="/" />}>
                    <ModuleList />
                  </PermissionGuard>
                } 
              />
            </Route>
          </Routes>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
