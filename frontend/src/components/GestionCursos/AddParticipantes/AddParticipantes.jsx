import "./AddParticipantes.css";

export default function AddParticipantes({ onBack }) {
  return (
    <section className="eaen-subview">
      <div className="eaen-subview-head">
        <div>
          <h2>Añadir Participantes</h2>
          <p>Agregar cursantes/docentes por curso (simulación por ahora).</p>
        </div>
        <button className="eaen-secondary-btn" onClick={onBack}>← Volver</button>
      </div>

      <div className="eaen-subview-card">
        <p>
          Aquí implementaremos: selector de curso, buscador de usuarios por CI, y asignación como participante.
        </p>
      </div>
    </section>
  );
}
