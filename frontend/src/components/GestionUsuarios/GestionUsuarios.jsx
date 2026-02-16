import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./GestionUsuarios.css";
import Addusers from "./Addusers/Addusers";
import ModifyUser from "./ModifyUser/ModifyUser";
import ListUsers from "./ListUsers/ListUsers";


export default function GestionUsuarios() {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState("home"); // home | add

  // ✅ Verifica sesión (solo frontend)
  useEffect(() => {
    const session = localStorage.getItem("eaen_session");
    if (!session) navigate("/", { replace: true });
  }, [navigate]);

  const go = (path, label) => {
    if (!path) return alert(`Navegando a: ${label}`);
    navigate(path);
  };

  const logout = () => {
    localStorage.removeItem("eaen_session");
    navigate("/", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="eaen-users-page">
      {/* Sidebar */}
      <nav className={`eaen-sidebar ${open ? "open" : ""}`}>
        <h2>Panel Jefe de Estudios</h2>
        <ul>
          <li>
            <button
              className={`eaen-navlink ${isActive("/gestion-usuarios") ? "active" : ""}`}
              onClick={() => go("/gestion-usuarios", "Gestión de Usuarios")}
            >
              <span className="icon">👥</span>Gestión de Usuarios
            </button>
          </li>

          <li>
            <button className="eaen-navlink" onClick={() => alert("Más adelante: Gestión de Cursos")}>
              <span className="icon">📚</span>Gestión de Cursos
            </button>
          </li>

          <li>
            <button className="eaen-navlink" onClick={() => alert("Más adelante: Gestión de Notificaciones")}>
              <span className="icon">🔔</span>Gestión de Notificaciones
            </button>
          </li>

          <li>
            <button className="eaen-navlink" onClick={() => alert("Más adelante: Gestión Educativa")}>
              <span className="icon">🎓</span>Gestión Educativa
            </button>
          </li>
        </ul>
      </nav>

      {/* Toggle móvil */}
      <button className="eaen-sidebar-toggle" onClick={() => setOpen((v) => !v)}>
        ☰
      </button>

      {/* Contenido principal */}
      <div className="eaen-main">
        <header className="eaen-header">
          <img src="/eaen.png" alt="Logo EAEN" className="eaen-header-logo" />
          <h1>Gestión de Usuarios - EAEN Avaroa</h1>

          <div className="eaen-profile">
            <div className="eaen-avatar" aria-hidden="true">
              JE
            </div>
            <span>Jefe de Estudios</span>
            <button className="eaen-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {/* ✅ Vistas internas */}
        {view === "home" ? (
          <section className="users-grid">
            <ActionCard
              icon="➕"
              title="Añadir Usuarios"
              desc="Registre nuevos usuarios: oficiales militares, personal civil o estudiantes de postgrado."
              buttonLabel="Añadir"
              onClick={() => setView("add")}
            />

            <ActionCard
              icon="✏️"
              title="Modificar Usuarios"
              desc="Edite información de usuarios existentes, como roles, datos personales o permisos."
              buttonLabel="Modificar"
              onClick={() => setView("edit")}
            />

            <ActionCard
              icon="📋"
              title="Listar Usuarios"
              desc="Visualice y busque la lista completa de usuarios registrados en el sistema."
              buttonLabel="Listar"
              onClick={() => setView("list")}
            />
          </section>
                   ) : view === "add" ? (
                    <Addusers onBack={() => setView("home")} />
                    ) : view === "edit" ? (
                    <ModifyUser onBack={() => setView("home")} />
                    ) : (
                    <ListUsers onBack={() => setView("home")} />
                    )}

        <footer className="eaen-footer">
          <p>&copy; 2026 Escuela de Altos Estudios Nacionales. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, buttonLabel, onClick }) {
  return (
    <div className="eaen-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="eaen-card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>

      <button
        className="eaen-card-btn"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
