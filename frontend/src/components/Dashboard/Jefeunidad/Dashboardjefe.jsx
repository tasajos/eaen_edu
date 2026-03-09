import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardJefe.css";
import { useNotificaciones } from "../../../hooks/useNotificaciones";
import { NotificacionesPanel, NotifBell } from "../../Shared/NotificacionesPanel";
import "../../Shared/NotificacionesPanel.css";

export default function DashboardJefe() {
  const [open, setOpen] = useState(false);
  const [vistaNotif, setVistaNotif] = useState(false);
  const navigate = useNavigate();

  const { notifs, noLeidas, loading: loadingNotifs, marcarLeida, marcarTodasLeidas } = useNotificaciones(30);

  return (
    <div className="eaen-dash">
      {/* Sidebar */}
      <nav className={`sidebar ${open ? "open" : ""}`}>
        <h2>Panel Jefe de Estudios</h2>
        <ul>
          <li><button className="navlink" onClick={() => navigate("/gestion-usuarios")}>👥 Gestión de Usuarios</button></li>
          <li><button className="navlink" onClick={() => navigate("/gestion-cursos")}>📚 Gestión de Cursos</button></li>
          <li><button className="navlink" onClick={() => navigate("/gestion-notificaciones")}>🔔 Gestión de Notificaciones</button></li>
          <li><button className="navlink" onClick={() => navigate("/gestion-educativa")}>🎓 Gestión Educativa</button></li>
          <li><button className="navlink" onClick={() => navigate("/gestion-evaluaciones")}>📋 Evaluaciones Inst.</button></li>
          <li>
            <button className="navlink" onClick={() => setVistaNotif(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 8 }}>
              🔔 Mis Notificaciones
              {noLeidas > 0 && <span className="np-sidebar-badge">{noLeidas}</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Toggle mobile */}
      <button className="sidebar-toggle" onClick={() => setOpen(v => !v)}>☰</button>

      {/* Main */}
      <div className="main-content">
        <header className="header">
          <img src="/eaen.png" alt="Logo EAEN" className="header-logo" />
          <h1>Dashboard Jefe de Estudios - EAEN Avaroa</h1>
          <div className="profile">
            <div className="avatar" aria-hidden="true">JE</div>
            <span>Jefe de Estudios</span>
            <button className="logout-btn" onClick={() => { localStorage.removeItem("eaen_session"); navigate("/"); }}>
              Logout
            </button>
          </div>
          <NotifBell noLeidas={noLeidas} onClick={() => setVistaNotif(v => !v)} />
        </header>

        <section className="dashboard-grid">
          <Card icon="👥" title="Gestión de Usuarios"
            desc="Administre usuarios: oficiales, personal civil y estudiantes de postgrado."
            onAccess={() => navigate("/gestion-usuarios")} />
          <Card icon="📚" title="Gestión de Cursos"
            desc="Cree y edite cursos para formación superior militar y civil."
            onAccess={() => navigate("/gestion-cursos")} />
          <Card icon="🔔" title="Gestión de Notificaciones"
            desc="Envíe alertas y actualizaciones a usuarios."
            onAccess={() => navigate("/gestion-notificaciones")} />
          <Card icon="📋" title="Evaluaciones Institucionales"
            desc="Habilite y gestione evaluaciones entre cursantes y a docentes."
            onAccess={() => navigate("/gestion-evaluaciones")} />
          <Card icon="🎓" title="Gestión Educativa"
            desc="Supervise evaluaciones, calificaciones y progreso académico."
            onAccess={() => navigate("/gestion-educativa")} />
        </section>

        <footer className="footer">
          <p>&copy; 2026 Escuela de Altos Estudios Nacionales. Todos los derechos reservados.</p>
        </footer>
      </div>

      {/* ── Drawer de notificaciones ── */}
      {vistaNotif && (
        <div className="notif-overlay" onClick={() => setVistaNotif(false)}>
          <div className="notif-drawer" onClick={e => e.stopPropagation()}>
            <div className="notif-drawer-header">
              <h3>🔔 Notificaciones institucionales</h3>
              <button className="notif-drawer-close" onClick={() => setVistaNotif(false)}>✕</button>
            </div>
            <p className="notif-drawer-hint">
              Haz clic en una notificación para expandirla, luego "Marcar como leída" para que desaparezca.
            </p>
            <NotificacionesPanel
              notifs={notifs}
              loading={loadingNotifs}
              marcarLeida={marcarLeida}
              marcarTodasLeidas={marcarTodasLeidas}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ icon, title, desc, onAccess }) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <button className="card-btn" onClick={onAccess}>Acceder →</button>
    </div>
  );
}