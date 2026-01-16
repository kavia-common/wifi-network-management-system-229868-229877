import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import NetworksListPage from "./pages/networks/NetworksListPage";
import NetworkDetailPage from "./pages/networks/NetworkDetailPage";
import ClientsListPage from "./pages/clients/ClientsListPage";
import ClientDetailPage from "./pages/clients/ClientDetailPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";

// PUBLIC_INTERFACE
function App() {
  /** Root application component defining all routes and the top-level app shell. */
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* Default route */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<DashboardPage />} />

        {/* Networks: list + detail scaffold */}
        <Route path="networks" element={<NetworksListPage />} />
        <Route path="networks/:networkId" element={<NetworkDetailPage />} />

        {/* Clients: list + detail scaffold */}
        <Route path="clients" element={<ClientsListPage />} />
        <Route path="clients/:clientId" element={<ClientDetailPage />} />

        <Route path="settings" element={<SettingsPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
