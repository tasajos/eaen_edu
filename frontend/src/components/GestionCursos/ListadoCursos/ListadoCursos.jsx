import "./ListadoCursos.css";

export default function ListadoCursos({ onBack }) {
  return (
    <section className="eaen-subview">
      <div className="eaen-subview-head">
        <div>
          <h2>Listado de Cursos</h2>
          <p>Vista lista para tabla de cursos (estilo institucional).</p>
        </div>
        <button className="eaen-secondary-btn" onClick={onBack}>← Volver</button>
      </div>

      <div className="eaen-subview-card">
        <p>
          Aquí implementaremos tabla con filtros: gestión de cursos, ver detalles, editar, etc.
        </p>
      </div>
    </section>
  );
}
