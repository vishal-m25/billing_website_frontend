// src/router.tsx
import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import BillingPage from "./pages/BillingPage";
import InventoryPage from "./pages/InventoryPage";
import CustomerPage from "./pages/CustomerPage";
import InvoicePage from "./pages/InvoicePage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";

const isAuthenticated = () =>
  localStorage.getItem("authToken") !== null;

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <LoginPage />,
    },
    {
      path: "/home",
      element: isAuthenticated() ? (
        <MainLayout>
          <BillingPage />
        </MainLayout>
      ) : (
        <Navigate to="/" />
      ),
    },
    {
      path: "/inventory",
      element: isAuthenticated() ? (
        <MainLayout>
          <InventoryPage />
        </MainLayout>
      ) : (
        <Navigate to="/" />
      ),
    },
    {
      path: "/customers",
      element: isAuthenticated() ? (
        <MainLayout>
          <CustomerPage />
        </MainLayout>
      ) : (
        <Navigate to="/" />
      ),
    },
    {
      path: "/invoices",
      element: isAuthenticated() ? (
        <MainLayout>
          <InvoicePage />
        </MainLayout>
      ) : (
        <Navigate to="/" />
      ),
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
  {
    future: {
       v7_startTransition: true,
    v7_relativeSplatPath: true,
    },
  }
);
