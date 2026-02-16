import { useEffect, useMemo, useState } from "react";
import "./Addusers.css";

const initialForm = {
  grado: "",
  ap_paterno: "",
  ap_materno: "",
  nombre: "",
  ci: "",
  ex: "",
  filial: "",
  fuerza: "",
  turno: "",
  telefono: "",
  fecha_inscripcion: "",
  lugar_trabajo: "",
  correo: "",
  fecha_nacimiento: "",
};

export default function Addusers({ onBack }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Modal state (SIEMPRE dentro del componente)
  const [modal, setModal] = useState({
    open: false,
    type: "success", // "success" | "error"
    title: "",
    message: "",
  });

  const openModal = ({ type, title, message }) => {
    setModal({ open: true, type, title, message });
  };

  const closeModal = () => setModal((p) => ({ ...p, open: false }));

  // ✅ Cerrar modal con tecla ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && modal.open) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal.open]);

  const isValid = useMemo(() => {
    return Object.values(form).every((v) => String(v).trim().length > 0);
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      openModal({
        type: "error",
        title: "Faltan datos",
        message: "Por favor, complete todos los campos requeridos.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const resp = await fetch("http://localhost:5000/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        openModal({
          type: "error",
          title: "No se pudo registrar",
          message: data?.message || "Ocurrió un error al guardar el usuario.",
        });
        return;
      }

      openModal({
        type: "success",
        title: "Registro exitoso",
        message: `Usuario creado correctamente. ID: ${data.id}`,
      });

      setForm(initialForm);
      // onBack?.(); // si quieres volver luego de cerrar modal
    } catch (err) {
      openModal({
        type: "error",
        title: "Sin conexión",
        message:
          "No se pudo conectar al servidor. Verifica que el backend esté corriendo.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="eaen-addusers-wrap">
      <div className="eaen-addusers-head">
        <div>
          <h2 className="eaen-addusers-title">Añadir Nuevo Usuario</h2>
          <p className="eaen-addusers-subtitle">
            Registro institucional de usuarios.
          </p>
        </div>

        <div className="eaen-addusers-actions">
          <button className="eaen-secondary-btn" type="button" onClick={onBack}>
            ← Volver
          </button>
        </div>
      </div>

      <div className="eaen-addusers-card">
        <form className="eaen-form" onSubmit={handleSubmit}>
          <div className="eaen-form-grid">
            <FieldSelect
              label="Grado o Profesión"
              name="grado"
              value={form.grado}
              onChange={handleChange}
              options={[
                ["", "Seleccione..."],
                ["My", "My"],
                ["Tte.Cnl", "Tte.Cnl"],
                ["Cnl", "Cnl"],
                ["Lic. Administracion Empresas", "Lic. Administracion Empresas"],
                ["Ing. Civil", "Ing. Civil"],
                ["Ing. Sistemas", "Ing. Sistemas"],
                ["Ing. Agronomo", "Ing. Agronomo"],
                ["Lic. Derecho", "Lic. Derecho"],
                ["Medico", "Medico"],
                ["Profesion Libre", "Profesion Libre"],
                ["Docente", "Docente"],
                ["Sub.1ro", "Sub.1ro"],
                ["Sub.My", "Sub.My"],
                ["Sub.Master", "Sub.Master"],
              ]}
            />

            <FieldInput
              label="Apellido Paterno"
              name="ap_paterno"
              value={form.ap_paterno}
              onChange={handleChange}
            />
            <FieldInput
              label="Apellido Materno"
              name="ap_materno"
              value={form.ap_materno}
              onChange={handleChange}
            />
            <FieldInput
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
            />
            <FieldInput
              label="CI"
              name="ci"
              value={form.ci}
              onChange={handleChange}
              placeholder="Ej: 1234567"
            />

            <FieldSelect
              label="EX (Extensión)"
              name="ex"
              value={form.ex}
              onChange={handleChange}
              options={[
                ["", "Seleccione..."],
                ["LP", "LP (La Paz)"],
                ["CB", "CB (Cochabamba)"],
                ["SC", "SC (Santa Cruz)"],
                ["OR", "OR (Oruro)"],
                ["PT", "PT (Potosí)"],
                ["TJ", "TJ (Tarija)"],
                ["CH", "CH (Chuquisaca)"],
                ["BN", "BN (Beni)"],
                ["PD", "PD (Pando)"],
                ["QR", "QR"],
              ]}
            />

            <FieldSelect
              label="Filial"
              name="filial"
              value={form.filial}
              onChange={handleChange}
              options={[
                ["", "Seleccione..."],
                ["Cochabamba", "Cochabamba"],
                ["La Paz", "La Paz"],
                ["Santa Cruz", "Santa Cruz"],
                ["Beni", "Beni"],
              ]}
            />

            <FieldSelect
              label="Fuerza"
              name="fuerza"
              value={form.fuerza}
              onChange={handleChange}
              options={[
                ["", "Seleccione..."],
                ["Ejército", "Ejército"],
                ["Armada", "Armada"],
                ["Fuerza Aérea", "Fuerza Aérea"],
                ["Civil", "Civil"],
                ["Policia", "Policia"],
              ]}
            />

            <FieldSelect
              label="Turno"
              name="turno"
              value={form.turno}
              onChange={handleChange}
              options={[
                ["", "Seleccione..."],
                ["Mañana", "Mañana"],
                ["Tarde", "Tarde"],
                ["Noche", "Noche"],
              ]}
            />

            <FieldInput
              label="Teléfono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              type="tel"
            />
            <FieldInput
              label="Fecha de Inscripción"
              name="fecha_inscripcion"
              value={form.fecha_inscripcion}
              onChange={handleChange}
              type="date"
            />
            <FieldInput
              label="Lugar de Trabajo"
              name="lugar_trabajo"
              value={form.lugar_trabajo}
              onChange={handleChange}
            />
            <FieldInput
              label="Correo Electrónico"
              name="correo"
              value={form.correo}
              onChange={handleChange}
              type="email"
            />
            <FieldInput
              label="Fecha de Nacimiento"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              type="date"
            />
          </div>

          <div className="eaen-form-footer">
            <button
              className="eaen-submit-btn"
              type="submit"
              disabled={!isValid || submitting}
            >
              {submitting ? "Guardando..." : "Guardar Usuario"}
            </button>

            <button
              className="eaen-secondary-btn"
              type="button"
              onClick={() => setForm(initialForm)}
              disabled={submitting}
            >
              Limpiar
            </button>
          </div>

          <p className="eaen-hint">
            * Este formulario está conectado al backend Node + MySQL.
          </p>
        </form>
      </div>

      {modal.open && (
        <StatusModal
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onClose={closeModal}
        />
      )}
    </section>
  );
}

function FieldInput({ label, name, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="eaen-form-group">
      <label htmlFor={name}>{label}:</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
      />
    </div>
  );
}

function FieldSelect({ label, name, value, onChange, options }) {
  return (
    <div className="eaen-form-group">
      <label htmlFor={name}>{label}:</label>
      <select id={name} name={name} value={value} onChange={onChange} required>
        {options.map(([val, text]) => (
          <option key={`${name}-${val}-${text}`} value={val}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusModal({ type = "success", title, message, onClose }) {
  const isSuccess = type === "success";

  return (
    <div className="eaen-modal-overlay">
      <div className="eaen-modal-container">
        <div className={`eaen-modal-icon ${isSuccess ? "success" : "error"}`}>
          {isSuccess ? "✓" : "✕"}
        </div>

        <h3 className="eaen-modal-title">{title}</h3>
        <p className="eaen-modal-message">{message}</p>

        <button className="eaen-modal-btn" onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
