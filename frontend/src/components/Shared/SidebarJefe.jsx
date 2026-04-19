import { useLocation, useNavigate } from "react-router-dom";
import "./SidebarJefe.css";

const NAV_ITEMS = [
  { path: "/gestion-usuarios",       icon: "👥", label: "Gestión de Usuarios" },
  { path: "/gestion-cursos",         icon: "📚", label: "Gestión de Cursos" },
  { path: "/gestion-notificaciones", icon: "🔔", label: "Gestión de Notificaciones" },
  { path: "/gestion-educativa",      icon: "🎓", label: "Gestión Educativa" },
  { path: "/gestion-evaluaciones",   icon: "📋", label: "Evaluaciones Inst." },
  { path: "/gestion-finanzas",       icon: "💰", label: "Finanzas" },
];

export default function SidebarJefe({ open, onMisNotificaciones, noLeidas }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isActive  = (path) => location.pathname === path;

  return (
    <nav className={`sjefe-sidebar${open ? " open" : ""}`}>
      <h2>Panel Jefe de Estudios</h2>
      <ul>
        {NAV_ITEMS.map(({ path, icon, label }) => (
          <li key={path}>
            <button
              className={`sjefe-navlink${isActive(path) ? " active" : ""}`}
              onClick={() => navigate(path)}
            >
              <span className="sjefe-icon">{icon}</span>{label}
            </button>
          </li>
        ))}
        {onMisNotificaciones && (
          <li>
            <button
              className="sjefe-navlink"
              onClick={onMisNotificaciones}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span className="sjefe-icon">🔔</span>
              Mis Notificaciones
              {noLeidas > 0 && (
                <span className="sjefe-badge">{noLeidas}</span>
              )}
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
