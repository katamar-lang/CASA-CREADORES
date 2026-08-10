import { Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminPanel } from "./pages/AdminPanel";
import { BrandDashboard } from "./pages/BrandDashboard";
import { CampaignCreate } from "./pages/CampaignCreate";
import { CampaignDetail } from "./pages/CampaignDetail";
import { Creators } from "./pages/Creators";
import { CreatorDashboard } from "./pages/CreatorDashboard";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { VerifyEmail } from "./pages/VerifyEmail";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route
            path="/marca"
            element={
              <ProtectedRoute allowedRoles={["MARCA"]}>
                <BrandDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marca/campanas/nueva"
            element={
              <ProtectedRoute allowedRoles={["MARCA"]}>
                <CampaignCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marca/creadores"
            element={
              <ProtectedRoute allowedRoles={["MARCA"]}>
                <Creators />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campanas/:id"
            element={
              <ProtectedRoute>
                <CampaignDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/creador"
            element={
              <ProtectedRoute allowedRoles={["CREADOR"]}>
                <CreatorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
