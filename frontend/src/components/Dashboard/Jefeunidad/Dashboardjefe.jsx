import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardJefe.css";

export default function DashboardJefe() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="eaen-dash">
      {/* Sidebar */}
      <nav className={`sidebar ${open ? "open" : ""}`}>
        <h2>Panel Jefe de Estudios</h2>
        <ul>
          <li><button className="navlink" onClick={() => navigate("/gestion-usuarios")}>👥 Gestión de Usuarios</button></li>
          <li><button className="navlink" onClick={() => navigate("/gestion-cursos")}>📚 Gestión de Cursos</button></li>
          <li><button className="navlink" onClick={() => navigate("/gestion-notificaciones")}>🔔 Gestión de Notificaciones</button></li>
          <li><button className="navlink" onClick={() => alert("Próximamente")}>🎓 Gestión Educativa</button></li>
        </ul>
      </nav>

      {/* Toggle mobile */}
      <button className="sidebar-toggle" onClick={() => setOpen((v) => !v)}>☰</button>

      {/* Main */}
      <div className="main-content">
        <header className="header">
          <img src="/eaen.png" alt="Logo EAEN" className="header-logo" />
          <h1>Dashboard Jefe de Estudios - EAEN Avaroa</h1>

          <div className="profile">
            <div className="avatar" aria-hidden="true">JE</div>
            <span>Jefe de Estudios</span>
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem("eaen_session");
                navigate("/");
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="dashboard-grid">
          <Card
            icon="👥"
            title="Gestión de Usuarios"
            desc="Administre usuarios: oficiales, personal civil y estudiantes de postgrado."
            onAccess={() => navigate("/gestion-usuarios")}
          />
          <Card
            icon="📚"
            title="Gestión de Cursos"
            desc="Cree y edite cursos para formación superior militar y civil."
            onAccess={() => navigate("/gestion-cursos")}
          />
          <Card
            icon="🔔"
            title="Gestión de Notificaciones"
            desc="Envíe alertas y actualizaciones a usuarios."
            onAccess={() => navigate("/gestion-notificaciones")}
          />
          <Card
            icon="🎓"
            title="Gestión Educativa"
            desc="Supervise evaluaciones, calificaciones y progreso académico."
            onAccess={() => alert("Próximamente")}
          />
        </section>

        <footer className="footer">
          <p>&copy; 2026 Escuela de Altos Estudios Nacionales. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}

function Card({ icon, title, desc, onAccess }) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      <button className="card-btn" onClick={onAccess}>
        Acceder →
      </button>
    </div>
  );
}