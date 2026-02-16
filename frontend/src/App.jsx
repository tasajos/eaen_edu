import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginEAEN from "./components/LoginEAEN/LoginEAEN";
import DashboardJefe from "./components/Dashboard/Jefeunidad/Dashboardjefe";
import GestionUsuarios from "./components/GestionUsuarios/GestionUsuarios";
import GestionCursos from "./components/GestionCursos/GestionCursos";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginEAEN />} />
        <Route path="/dashboard-jefe" element={<DashboardJefe />} />
        <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
         <Route path="/gestion-cursos" element={<GestionCursos />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}