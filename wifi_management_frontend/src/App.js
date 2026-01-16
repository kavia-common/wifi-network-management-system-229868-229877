import React from "react";
import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { AppRoutes } from "./routes/AppRoutes";
import { AuthProvider } from "./state/AuthContext";
import { AppStateProvider } from "./state/AppStateContext";
import { ToastProvider, ToastRegion } from "./state/ToastContext";

// PUBLIC_INTERFACE
function App() {
  /** App entry: global providers + router + routes. */
  return (
    <AppStateProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <ToastRegion />
        </AuthProvider>
      </ToastProvider>
    </AppStateProvider>
  );
}

export default App;
