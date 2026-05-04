import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginEAEN            from "./components/LoginEAEN/LoginEAEN";
import DashboardJefe        from "./components/Dashboard/Jefeunidad/Dashboardjefe";
import GestionUsuarios      from "./components/GestionUsuarios/GestionUsuarios";
import GestionCursos        from "./components/GestionCursos/GestionCursos";
import GestionNotificaciones from "./components/GestionNotificaciones/GestionNotificaciones";
import GestionEvaluaciones from "./components/GestionEvaluaciones/GestionEvaluaciones";
import GestionFinanzas     from "./components/GestionFinanzas/GestionFinanzas";
import ConfigDisciplina    from "./components/Disciplina/Configdisciplina";
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
  if (rol  === "ADMIN_FINANZAS")    return "/gestion-finanzas";
  return "/dashboard-jefe"; // fallback para admins
}

// ─── Guard: solo si está autenticado ────────────────────────
// Wrapper para ConfigDisciplina — selecciona curso
function ConfigDisciplinaWrapper() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState(null);
  const [cursoDetalle, setCursoDetalle] = useState(null);
  const session = (() => { try{ return JSON.parse(localStorage.getItem("eaen_session")||"null"); }catch{ return null; } })();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(()=>{
    fetch(`${API}/cursos`).then(r=>r.json()).then(d=>{ if(Array.isArray(d)){ setCursos(d); if(d.length) setCursoId(d[0].id); }}).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(!cursoId) return;
    fetch(`${API}/cursos/${cursoId}`).then(r=>r.json()).then(d=>setCursoDetalle(d)).catch(()=>{});
  },[cursoId]);

  return (
    <div style={{minHeight:"100vh",background:"#f0f4f8",padding:"24px 32px",fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <div style={{background:"#003366",color:"#fff",borderRadius:14,padding:"18px 24px",marginBottom:20,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <button onClick={()=>navigate(getRolDashboard(session), { replace: true })} style={{background:"rgba(255,255,255,.12)",border:"1.5px solid rgba(255,255,255,.25)",color:"#fff",padding:"7px 16px",borderRadius:9,cursor:"pointer",fontWeight:600,fontSize:13}}>← Volver</button>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:800}}>⚖️ Configuración de Disciplina</div>
          <div style={{fontSize:12,opacity:.7,marginTop:2}}>Define el porcentaje disciplinario por materia</div>
        </div>
        <select value={cursoId||""} onChange={e=>setCursoId(Number(e.target.value))}
          style={{padding:"8px 14px",borderRadius:9,border:"2px solid rgba(255,255,255,.3)",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:13,fontFamily:"inherit"}}>
          {cursos.map(c=><option key={c.id} value={c.id} style={{color:"#1a2535"}}>{c.nombre}</option>)}
        </select>
      </div>
      <ConfigDisciplina cursoId={cursoId} cursoDetalle={cursoDetalle} session={session}/>
    </div>
  );
}

function PrivateRoute({ children, rolesPermitidos }) {
  const session = getSession();
  if (!session) return <Navigate to="/" replace />;

  if (rolesPermitidos && rolesPermitidos.length > 0) {
    const tipo = String(session.tipo_usuario || "").trim();
    const rol  = String(session.rol || "").trim().toUpperCase();
    const tiene = rolesPermitidos.some(r => {
      if (r === "CURSANTE"       && tipo === "Cursante")    return true;
      if (r === "JEFE_ESTUDIOS"  && (rol === "JEFE_ESTUDIOS" || rol === "ADMIN")) return true;
      if (r === "ADMIN_FINANZAS" && rol === "ADMIN_FINANZAS") return true;
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
        <Route path="/gestion-disciplina" element={
          <PrivateRoute rolesPermitidos={["ADMIN","JEFE_ESTUDIOS"]}>
            <ConfigDisciplinaWrapper/>
          </PrivateRoute>
        }/>
        <Route path="/gestion-finanzas" element={
          <PrivateRoute rolesPermitidos={["ADMIN","JEFE_ESTUDIOS","ADMIN_FINANZAS"]}>
            <GestionFinanzas/>
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
