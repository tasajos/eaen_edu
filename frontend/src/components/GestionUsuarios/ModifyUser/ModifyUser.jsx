import { useEffect, useMemo, useState } from "react";
import "./ModifyUser.css";

const API_BASE = import.meta.env.VITE_API_URL;

// ✅ Mismas opciones que Addusers.jsx
const GRADO_OPTIONS = [
  ["", "Seleccione..."],
  ["My", "My"],
  ["Tte.Cnl", "Tte.Cnl"],
  ["Cnl", "Cnl"],
  ["CN", "CN"],
  ["CF", "CF"],
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
];

const FILIAL_OPTIONS = [
  ["", "Seleccione..."],
  ["Cochabamba", "Cochabamba"],
  ["La Paz", "La Paz"],
  ["Santa Cruz", "Santa Cruz"],
  ["Beni", "Beni"],
];

const FUERZA_OPTIONS = [
  ["", "Seleccione..."],
  ["Ejército", "Ejército"],
  ["Armada", "Armada"],
  ["Fuerza Aérea", "Fuerza Aérea"],
  ["Civil", "Civil"],
  ["Policia", "Policia"],
];

const EXT_OPTIONS = [
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
];

const TURNO_OPTIONS = [
  ["", "Seleccione..."],
  ["Mañana", "Mañana"],
  ["Tarde", "Tarde"],
  ["Noche", "Noche"],
];

const USER_TYPES = [
  "Cursante",
  "Administrador",
  "Tecnico",
  "Jefe de Carrera",
  "Jefe de Unidad o Director",
  "Personal de Apoyo",
  "Docente",
];

// ✅ Roles del sistema (incluye ADMIN_FINANZAS)
const ROL_OPTIONS = [
  ["", "— Sin rol especial —"],
  ["ADMIN",          "🔧 ADMIN"],
  ["JEFE_ESTUDIOS",  "🎓 JEFE_ESTUDIOS"],
  ["DOCENTE",        "👨‍🏫 DOCENTE"],
  ["JEFE_CURSO",     "📚 JEFE_CURSO"],
  ["CURSANTE",       "🎒 CURSANTE"],
  ["ADMIN_FINANZAS", "💰 ADMIN_FINANZAS"],
];

const blankUser = {
  id: "",
  tipo_usuario: "",
  grado: "",
  ap_paterno: "",
  ap_materno: "",
  nombre: "",
  apellido: "",
  ci: "",
  ex: "",
  filial: "",
  fuerza: "",
  turno: "",
  telefono: "",
  fecha_inscripcion: "",
  lugar_trabajo: "",
  correo: "",
  email: "",
  rol: "",
  estado: "",
  fecha_nacimiento: "",
};

export default function ModifyUser({ onBack }) {
  const [ci, setCi] = useState("");
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editUser, setEditUser] = useState(blankUser);
  const [saving, setSaving] = useState(false);

  // ✅ Modal de estado (✓ / ✕)
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success", // success | error
    title: "",
    message: "",
  });

  const openStatus = ({ type, title, message }) =>
    setStatusModal({ open: true, type, title, message });

  const closeStatus = () => setStatusModal((p) => ({ ...p, open: false }));

  const canSearch = useMemo(
    () => ci.trim().length >= 4 && !searching,
    [ci, searching]
  );

  const isEditValid = useMemo(() => {
    if (!openModal) return false;
    const required = [
      "tipo_usuario",
      "grado",
      "ap_paterno",
      "ap_materno",
      "nombre",
      "ex",
      "filial",
      "fuerza",
      "turno",
      "telefono",
      "fecha_inscripcion",
      "lugar_trabajo",
      "correo",
      "fecha_nacimiento",
    ];
    return required.every((k) => String(editUser[k] ?? "").trim().length > 0);
  }, [editUser, openModal]);

  // ✅ ESC para cerrar modal edición + bloqueo scroll
  useEffect(() => {
    if (!openModal) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeEditModal();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [openModal]);

  // ✅ ESC para cerrar modal de estado
  useEffect(() => {
    if (!statusModal.open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeStatus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [statusModal.open]);

  const closeEditModal = () => {
    setOpenModal(false);
    setSaving(false);
  };

  // Mapa: rol -> tipo_usuario equivalente
  const ROL_TO_TIPO = {
    "ADMIN":           "Administrador",
    "JEFE_ESTUDIOS":   "Jefe de Unidad o Director",
    "DOCENTE":         "Docente",
    "JEFE_CURSO":      "Jefe de Carrera",
    "CURSANTE":        "Cursante",
    "ADMIN_FINANZAS":  "Administrador",
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    if (name === "rol") {
      // Sincronizar tipo_usuario automáticamente según el rol
      const tipoAuto = ROL_TO_TIPO[value] || "";
      setEditUser((prev) => ({ ...prev, rol: value, tipo_usuario: tipoAuto }));
    } else {
      setEditUser((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ BUSCAR REAL: coincidencia exacta con CI
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!canSearch) return;

    const ciExacto = ci.trim();
    setSearching(true);
    setNotFound(false);

    try {
      const resp = await fetch(
        `${API_BASE}/usuarios/ci/${encodeURIComponent(ciExacto)}`
      );
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        if (resp.status === 404) {
          setNotFound(true);
          return;
        }
        openStatus({
          type: "error",
          title: "Error al buscar",
          message: data?.message || "No se pudo buscar el usuario.",
        });
        return;
      }

      setEditUser({
        ...blankUser,
        id: data.id ?? "",
        tipo_usuario: data.tipo_usuario ?? "",
        rol: data.rol ?? "",
        estado: data.estado ?? "",
        grado: data.grado ?? "",
        ap_paterno: data.ap_paterno ?? "",
        ap_materno: data.ap_materno ?? "",
        nombre: data.nombre ?? "",
        apellido: data.apellido ?? "",
        ci: data.ci ?? ciExacto,
        ex: data.ex ?? "",
        filial: data.filial ?? "",
        fuerza: data.fuerza ?? "",
        turno: data.turno ?? "",
        telefono: data.telefono ?? "",
        fecha_inscripcion: (data.fecha_inscripcion ?? "").slice(0, 10),
        lugar_trabajo: data.lugar_trabajo ?? "",
        correo: data.correo ?? "",
        email: data.email ?? "",
        fecha_nacimiento: (data.fecha_nacimiento ?? "").slice(0, 10),
      });

      setOpenModal(true);
    } catch (err) {
      openStatus({
        type: "error",
        title: "Sin conexión",
        message: "No se pudo conectar al servidor. Verifica el backend.",
      });
    } finally {
      setSearching(false);
    }
  };

  // ✅ GUARDAR REAL: PUT por CI exacto (no toca password)
  const handleSave = async (e) => {
    e.preventDefault();

    if (!isEditValid) {
      openStatus({
        type: "error",
        title: "Faltan datos",
        message: "Complete todos los campos requeridos para guardar cambios.",
      });
      return;
    }

    setSaving(true);

    try {
      const ciExacto = String(editUser.ci || "").trim();

      const payload = {
        tipo_usuario: editUser.tipo_usuario,
        grado: editUser.grado,
        ap_paterno: editUser.ap_paterno,
        ap_materno: editUser.ap_materno,
        nombre: editUser.nombre,
        ex: editUser.ex,
        filial: editUser.filial,
        fuerza: editUser.fuerza,
        turno: editUser.turno,
        telefono: editUser.telefono,
        fecha_inscripcion: editUser.fecha_inscripcion,
        lugar_trabajo: editUser.lugar_trabajo,
        correo: editUser.correo,
        fecha_nacimiento: editUser.fecha_nacimiento,
        // opcionales si quieres editar (si no, puedes quitarlos)
        email: editUser.email || null,
        rol: editUser.rol || null,
        estado: editUser.estado || null,
      };

      const resp = await fetch(
        `${API_BASE}/usuarios/ci/${encodeURIComponent(ciExacto)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        openStatus({
          type: "error",
          title: "No se pudo guardar",
          message: data?.message || "Ocurrió un error al actualizar el usuario.",
        });
        return;
      }

      openStatus({
        type: "success",
        title: "Cambios guardados",
        message: `Se actualizaron los datos del CI: ${ciExacto}.`,
      });

      closeEditModal();
    } catch (err) {
      openStatus({
        type: "error",
        title: "Sin conexión",
        message: "No se pudo conectar al servidor. Verifica el backend.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="eaen-modify-wrap">
      <div className="eaen-modify-head">
        <div>
          <h2 className="eaen-modify-title">Modificar Usuario</h2>
          <p className="eaen-modify-subtitle">
            Busque por Carnet de Identidad (CI) con coincidencia exacta.
          </p>
        </div>

        <div className="eaen-modify-actions">
          <button className="eaen-secondary-btn" type="button" onClick={onBack}>
            ← Volver
          </button>
        </div>
      </div>

      <div className="eaen-modify-card">
        <h3 className="eaen-modify-card-title">Buscar Usuario por CI</h3>

        <form className="eaen-search-row" onSubmit={handleSearch}>
          <input
            className="eaen-search-input"
            value={ci}
            onChange={(e) => setCi(e.target.value)}
            placeholder="Ingrese CI (ej. 1234567)"
            inputMode="numeric"
          />

          <button
            className="eaen-primary-btn"
            type="submit"
            disabled={!canSearch}
          >
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {notFound && (
          <div className="eaen-alert">
            No se encontró un usuario con el CI <b>{ci.trim()}</b>.
          </div>
        )}
      </div>

      {/* ✅ Modal de edición */}
      {openModal && (
        <div className="eaen-modal-overlay" onMouseDown={closeEditModal}>
          <div
            className="eaen-modal-container"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="eaen-modal-close"
              onClick={closeEditModal}
              type="button"
              aria-label="Cerrar"
            >
              ×
            </button>

            <h2 className="eaen-modal-title">
              Editar Usuario (CI: {editUser.ci})
            </h2>

            <form onSubmit={handleSave} className="eaen-form">
              <div className="eaen-form-grid">
                {/* ✅ Rol del Sistema — controla acceso al dashboard */}
                <div className="eaen-form-group">
                  <label htmlFor="rol" style={{ color: "#003366", fontWeight: 700 }}>
                    🔐 Rol del Sistema:
                  </label>
                  <select
                    id="rol"
                    name="rol"
                    value={editUser.rol || ""}
                    onChange={onEditChange}
                    style={{
                      border: editUser.rol === "ADMIN_FINANZAS"
                        ? "2px solid #ff6600"
                        : "2px solid #003366",
                      background: editUser.rol === "ADMIN_FINANZAS"
                        ? "#fff8f0"
                        : "#f0f4ff",
                      fontWeight: 700,
                    }}
                  >
                    {ROL_OPTIONS.map(([val, text]) => (
                      <option key={val} value={val}>{text}</option>
                    ))}
                  </select>
                  <span style={{
                    fontSize: 10.5, color: "#8898aa", marginTop: 3, display: "block",
                    fontStyle: "italic"
                  }}>
                    ⚠️ Determina a qué panel accede al iniciar sesión.
                    Distinto del Tipo de Usuario.
                  </span>
                  {editUser.rol === "ADMIN_FINANZAS" && (
                    <span style={{ fontSize: 11, color: "#e65100", marginTop: 2, display: "block", fontWeight: 700 }}>
                      💰 Accederá al panel de Gestión de Finanzas
                    </span>
                  )}
                  {editUser.rol === "JEFE_ESTUDIOS" && (
                    <span style={{ fontSize: 11, color: "#1565c0", marginTop: 2, display: "block", fontWeight: 700 }}>
                      🎓 Accederá al panel de Jefe de Estudios
                    </span>
                  )}
                  {editUser.rol === "DOCENTE" && (
                    <span style={{ fontSize: 11, color: "#2e7d32", marginTop: 2, display: "block", fontWeight: 700 }}>
                      👨‍🏫 Accederá al panel del Docente
                    </span>
                  )}
                  {editUser.rol === "JEFE_CURSO" && (
                    <span style={{ fontSize: 11, color: "#6a1b9a", marginTop: 2, display: "block", fontWeight: 700 }}>
                      📚 Accederá al panel de Jefe de Curso
                    </span>
                  )}
                  {editUser.rol === "CURSANTE" && (
                    <span style={{ fontSize: 11, color: "#c62828", marginTop: 2, display: "block", fontWeight: 700 }}>
                      🎒 Accederá al dashboard del Cursante
                    </span>
                  )}
                </div>

                {/* ✅ Igual que Addusers */}
                <FieldSelect
                  label="Grado o Profesión"
                  name="grado"
                  value={editUser.grado}
                  onChange={onEditChange}
                  options={GRADO_OPTIONS}
                />

                <FieldInput
                  label="Apellido Paterno"
                  name="ap_paterno"
                  value={editUser.ap_paterno}
                  onChange={onEditChange}
                />
                <FieldInput
                  label="Apellido Materno"
                  name="ap_materno"
                  value={editUser.ap_materno}
                  onChange={onEditChange}
                />
                <FieldInput
                  label="Nombre"
                  name="nombre"
                  value={editUser.nombre}
                  onChange={onEditChange}
                />

                {/* CI readonly */}
                <div className="eaen-form-group">
                  <label htmlFor="ci_ro">CI:</label>
                  <input id="ci_ro" value={editUser.ci} readOnly />
                </div>

                <FieldSelect
                  label="EX (Extensión)"
                  name="ex"
                  value={editUser.ex}
                  onChange={onEditChange}
                  options={EXT_OPTIONS}
                />

                {/* ✅ Igual que Addusers */}
                <FieldSelect
                  label="Filial"
                  name="filial"
                  value={editUser.filial}
                  onChange={onEditChange}
                  options={FILIAL_OPTIONS}
                />

                {/* ✅ Igual que Addusers */}
                <FieldSelect
                  label="Fuerza"
                  name="fuerza"
                  value={editUser.fuerza}
                  onChange={onEditChange}
                  options={FUERZA_OPTIONS}
                />

                <FieldSelect
                  label="Turno"
                  name="turno"
                  value={editUser.turno}
                  onChange={onEditChange}
                  options={TURNO_OPTIONS}
                />

                <FieldInput
                  label="Teléfono"
                  name="telefono"
                  value={editUser.telefono}
                  onChange={onEditChange}
                  type="tel"
                />
                <FieldInput
                  label="Fecha de Inscripción"
                  name="fecha_inscripcion"
                  value={editUser.fecha_inscripcion}
                  onChange={onEditChange}
                  type="date"
                />
                <FieldInput
                  label="Lugar de Trabajo"
                  name="lugar_trabajo"
                  value={editUser.lugar_trabajo}
                  onChange={onEditChange}
                />
                <FieldInput
                  label="Correo Electrónico"
                  name="correo"
                  value={editUser.correo}
                  onChange={onEditChange}
                  type="email"
                />
                <FieldInput
                  label="Fecha de Nacimiento"
                  name="fecha_nacimiento"
                  value={editUser.fecha_nacimiento}
                  onChange={onEditChange}
                  type="date"
                />
              </div>

              <div className="eaen-modal-actions">
                <button
                  className="eaen-primary-btn"
                  type="submit"
                  disabled={!isEditValid || saving}
                >
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>

                <button
                  className="eaen-secondary-btn"
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Modal de estado (✓ / ✕) */}
      {statusModal.open && (
        <StatusModal
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={closeStatus}
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

