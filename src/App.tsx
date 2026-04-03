/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ReportWaste from "./pages/ReportWaste";
import CollectWaste from "./pages/CollectWaste";
import Map from "./pages/Map";
import Rewards from "./pages/Rewards";
import Login from "./pages/Login";
import Register from "./pages/Register";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="report" element={<ReportWaste />} />
            <Route path="collect" element={<CollectWaste />} />
            <Route path="map" element={<Map />} />
            <Route path="rewards" element={<Rewards />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
