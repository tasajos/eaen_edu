import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginEAEN            from "./components/LoginEAEN/LoginEAEN";
import DashboardJefe        from "./components/Dashboard/Jefeunidad/Dashboardjefe";
import GestionUsuarios      from "./components/GestionUsuarios/GestionUsuarios";
import GestionCursos        from "./components/GestionCursos/GestionCursos";
import GestionNotificaciones from "./components/GestionNotificaciones/GestionNotificaciones";
import GestionEvaluaciones from "./components/GestionEvaluaciones/GestionEvaluaciones";
import GestionEducativa     from "./components/GestionEducativa/GestionEducativa";
import DashboardDocente     from "./components/Dashboard/Docente/Dashboarddocente";
import DashboardCursante    from "./components/Dashboard/Cursante/Dashboardcursante";
import DashboardJefeCurso   from "./components/Dashboard/JefeCurso/Dashboardjefecurso";

// ─── Helper: leer sesión ────────────────────────────────────
function getSession() {
  try { return JSON.parse(localStorage.getItem("eaen_session") || "null"); }
  catch { return null; }
}

function getRolDashboard(session) {
  if (!session) return "/";
  const tipo = String(session.tipo_usuario || "").trim();
  const rol  = String(session.rol || "").trim().toUpperCase();
  if (tipo === "Cursante")          return "/dashboard-cursante";
  if (rol  === "JEFE_ESTUDIOS")     return "/dashboard-jefe";
  if (rol  === "ADMIN")             return "/dashboard-jefe";
  if (rol  === "DOCENTE")           return "/dashboard-docente";
  if (rol  === "JEFE_CURSO")        return "/dashboard-jefe-curso";
  return "/dashboard-jefe"; // fallback para admins
}

// ─── Guard: solo si está autenticado ────────────────────────
function PrivateRoute({ children, rolesPermitidos }) {
  const session = getSession();
  if (!session) return <Navigate to="/" replace />;

  if (rolesPermitidos && rolesPermitidos.length > 0) {
    const tipo = String(session.tipo_usuario || "").trim();
    const rol  = String(session.rol || "").trim().toUpperCase();
    const tiene = rolesPermitidos.some(r => {
      if (r === "CURSANTE"       && tipo === "Cursante")    return true;
      if (r === "JEFE_ESTUDIOS"  && (rol === "JEFE_ESTUDIOS" || rol === "ADMIN")) return true;
      if (r === rol) return true;
      return false;
    });
    if (!tiene) return <Navigate to={getRolDashboard(session)} replace />;
  }
  return children;
}

// ─── Guard: solo si NO está autenticado (para login) ────────
function PublicRoute({ children }) {
  const session = getSession();
  if (session) return <Navigate to={getRolDashboard(session)} replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta pública: login */}
        <Route path="/" element={
          <PublicRoute><LoginEAEN /></PublicRoute>
        }/>

        {/* Dashboard Jefe de Estudios (máximo rol) */}
        <Route path="/dashboard-jefe" element={
          <PrivateRoute rolesPermitidos={["JEFE_ESTUDIOS","ADMIN"]}>
            <DashboardJefe />
          </PrivateRoute>
        }/>

        {/* Módulos del Jefe de Estudios */}
        <Route path="/gestion-usuarios" element={
          <PrivateRoute rolesPermitidos={["JEFE_ESTUDIOS","ADMIN"]}>
            <GestionUsuarios />
          </PrivateRoute>
        }/>
        <Route path="/gestion-cursos" element={
          <PrivateRoute rolesPermitidos={["JEFE_ESTUDIOS","ADMIN"]}>
            <GestionCursos />
          </PrivateRoute>
        }/>
        <Route path="/gestion-notificaciones" element={
          <PrivateRoute rolesPermitidos={["JEFE_ESTUDIOS","ADMIN"]}>
            <GestionNotificaciones />
          </PrivateRoute>
        }/>
        <Route path="/gestion-evaluaciones" element={
          <PrivateRoute rolesPermitidos={["ADMIN","JEFE_ESTUDIOS","JEFE_CURSO"]}>
            <GestionEvaluaciones/>
          </PrivateRoute>
        }/>
        <Route path="/gestion-educativa" element={
          <PrivateRoute rolesPermitidos={["JEFE_ESTUDIOS","ADMIN"]}>
            <GestionEducativa />
          </PrivateRoute>
        }/>

        {/* Dashboard Docente */}
        <Route path="/dashboard-docente" element={
          <PrivateRoute rolesPermitidos={["DOCENTE"]}>
            <DashboardDocente />
          </PrivateRoute>
        }/>

        {/* Dashboard Cursante */}
        <Route path="/dashboard-cursante" element={
          <PrivateRoute rolesPermitidos={["CURSANTE"]}>
            <DashboardCursante />
          </PrivateRoute>
        }/>

        {/* Dashboard Jefe de Curso */}
        <Route path="/dashboard-jefe-curso" element={
          <PrivateRoute rolesPermitidos={["JEFE_CURSO"]}>
            <DashboardJefeCurso />
          </PrivateRoute>
        }/>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}