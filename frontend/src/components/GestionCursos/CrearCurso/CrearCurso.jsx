import "./CrearCurso.css";

export default function CrearCurso({ onBack }) {
  return (
    <section className="eaen-subview">
      <div className="eaen-subview-head">
        <div>
          <h2>Crear Curso</h2>
          <p>Vista lista para conectar a formulario y backend (próximo paso).</p>
        </div>
        <button className="eaen-secondary-btn" onClick={onBack}>← Volver</button>
      </div>

      <div className="eaen-subview-card">
        <p>
          Aquí construiremos el formulario de creación de curso (nombre, descripción, modalidad, carga horaria,
          fechas, instructor(es), aula virtual, etc.).
        </p>
      </div>
    </section>
  );
}
