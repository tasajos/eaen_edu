import "./AsignacionResponsabilidad.css";

export default function AsignacionResponsabilidad({ onBack }) {
  return (
    <section className="eaen-subview">
      <div className="eaen-subview-head">
        <div>
          <h2>Asignación de Responsabilidad</h2>
          <p>Asignación de roles responsables por curso (docente, jefe, apoyo, etc.).</p>
        </div>
        <button className="eaen-secondary-btn" onClick={onBack}>← Volver</button>
      </div>

      <div className="eaen-subview-card">
        <p>
          Aquí haremos: selector de curso + selector de usuario + tipo de responsabilidad + guardar (backend luego).
        </p>
      </div>
    </section>
  );
}
