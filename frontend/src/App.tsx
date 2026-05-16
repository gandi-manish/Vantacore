import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/loginpage";
import { DashboardLayout } from "./layouts/dashboardlayout";
import { DashboardPage } from "./pages/dashboardpage";
import { ProtectedRoute } from "./routes/protectedroute";
import { IncidentsPage } from "./pages/incidentspage";
import { FileMonitorPage } from "./pages/filemonitorpage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="/dashboard/files" element={<FileMonitorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}