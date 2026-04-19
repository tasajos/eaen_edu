import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GestionCursos.css";
import SidebarJefe from "../Shared/SidebarJefe";

import CrearCurso from "./CrearCurso/CrearCurso";
import AddParticipantes from "./AddParticipantes/AddParticipantes";
import AsignacionResponsabilidad from "./AsignacionResponsabilidad/AsignacionResponsabilidad";
import ListadoCursos from "./ListadoCursos/ListadoCursos";

export default function GestionCursos() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState("home");

  useEffect(() => {
    const session = localStorage.getItem("eaen_session");
    if (!session) navigate("/", { replace: true });
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("eaen_session");
    navigate("/", { replace: true });
  };

  return (
    <div className="eaen-cursos-page">
      <SidebarJefe open={open} />
      <button className="eaen-sidebar-toggle" onClick={() => setOpen((v) => !v)}>☰</button>

      {/* Main */}
      <div className="eaen-main">
        <header className="eaen-header">
          <img src="/eaen.png" alt="Logo EAEN" className="eaen-header-logo" />
          <h1>Gestión de Cursos - EAEN Avaroa</h1>

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

        {/* Vistas */}
        {view === "home" ? (
          <section className="cursos-grid">
            <ActionCard
              icon="🧾"
              title="Crear Curso"
              desc="Cree cursos, módulos y parámetros académicos de postgrado."
              buttonLabel="Acceder"
              onClick={() => setView("crear")}
            />

            <ActionCard
              icon="👥"
              title="Añadir Participantes"
              desc="Registre cursantes, docentes y personal asignado por curso."
              buttonLabel="Acceder"
              onClick={() => setView("participantes")}
            />

            <ActionCard
              icon="🧩"
              title="Asignación de Responsabilidad"
              desc="Asigne roles y responsables: docentes, jefaturas, técnicos y apoyo."
              buttonLabel="Acceder"
              onClick={() => setView("asignacion")}
            />

            <ActionCard
              icon="📋"
              title="Listado de Cursos"
              desc="Visualice, filtre y gestione todos los cursos registrados."
              buttonLabel="Acceder"
              onClick={() => setView("listado")}
            />
          </section>
        ) : view === "crear" ? (
          <CrearCurso onBack={() => setView("home")} />
        ) : view === "participantes" ? (
          <AddParticipantes onBack={() => setView("home")} />
        ) : view === "asignacion" ? (
          <AsignacionResponsabilidad onBack={() => setView("home")} />
        ) : (
          <ListadoCursos onBack={() => setView("home")} />
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
