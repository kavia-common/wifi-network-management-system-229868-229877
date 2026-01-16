import React from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "../layout/AppShell";
import { RequireAdmin, RequireAuth } from "../components/RouteGuards";
import { DashboardPage } from "../pages/DashboardPage";
import { NetworksPage } from "../pages/NetworksPage";
import { AccessPointsPage } from "../pages/AccessPointsPage";
import { AccessPointDetailsPage } from "../pages/AccessPointDetailsPage";
import { ClientsPage } from "../pages/ClientsPage";
import { AlertsPage } from "../pages/AlertsPage";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { SettingsPage } from "../pages/SettingsPage";
import { LoginPage } from "../pages/LoginPage";

// PUBLIC_INTERFACE
export function AppRoutes() {
  /** Defines app routes using react-router-dom. */
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/networks"
          element={
            <RequireAuth>
              <NetworksPage />
            </RequireAuth>
          }
        />
        <Route
          path="/access-points"
          element={
            <RequireAuth>
              <AccessPointsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/access-points/:apId"
          element={
            <RequireAuth>
              <AccessPointDetailsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/clients"
          element={
            <RequireAuth>
              <ClientsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/alerts"
          element={
            <RequireAuth>
              <AlertsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAdmin>
              <AdminUsersPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<div className="op-card">Not found</div>} />
      </Route>
    </Routes>
  );
}
