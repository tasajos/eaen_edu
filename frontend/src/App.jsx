import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginEAEN from "./components/LoginEAEN/LoginEAEN";
import DashboardJefe from "./components/Dashboard/Jefeunidad/Dashboardjefe";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginEAEN />} />
        <Route path="/dashboard-jefe" element={<DashboardJefe />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}