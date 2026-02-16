import { useEffect, useMemo, useState } from "react";
import "./ModifyUser.css";

const USER_TYPES = [
  "Cursante",
  "Administrador",
  "Tecnico",
  "Jefe de Carrera",
  "Jefe de Unidad o Director",
  "Personal de Apoyo",
  "Docente",
];

const GRADOS = [
  "Oficial Militar Superior",
  "Personal Civil",
  "Estudiante Postgrado",
  "Profesor",
];

const EXT = [
  { v: "LP", t: "LP (La Paz)" },
  { v: "CB", t: "CB (Cochabamba)" },
  { v: "SC", t: "SC (Santa Cruz)" },
  { v: "OR", t: "OR (Oruro)" },
  { v: "PT", t: "PT (Potosí)" },
  { v: "TJ", t: "TJ (Tarija)" },
  { v: "CH", t: "CH (Chuquisaca)" },
  { v: "BN", t: "BN (Beni)" },
  { v: "PD", t: "PD (Pando)" },
];

const FILIALES = ["Sede Central", "Filial Norte", "Filial Sur"];
const FUERZAS = ["Ejército", "Armada", "Fuerza Aérea", "Civil"];
const TURNOS = ["Mañana", "Tarde", "Noche"];

// ✅ Simulación: “base local” (luego esto será API)
const DUMMY_USERS = [
  {
    ci: "1234567",
    tipo: "Administrador",
    grado: "Oficial Militar Superior",
    ap_paterno: "Pérez",
    ap_materno: "Gómez",
    nombre: "Juan",
    ex: "LP",
    filial: "Sede Central",
    fuerza: "Ejército",
    turno: "Mañana",
    telefono: "70123456",
    fecha_inscripcion: "2025-02-01",
    lugar_trabajo: "EAEN - Sede Central",
    correo: "juan.perez@eaen.bo",
    fecha_nacimiento: "1980-05-20",
  },
  {
    ci: "9876543",
    tipo: "Docente",
    grado: "Profesor",
    ap_paterno: "Rojas",
    ap_materno: "Flores",
    nombre: "María",
    ex: "CB",
    filial: "Filial Norte",
    fuerza: "Civil",
    turno: "Tarde",
    telefono: "76543210",
    fecha_inscripcion: "2024-08-10",
    lugar_trabajo: "UMSS",
    correo: "maria.rojas@eaen.bo",
    fecha_nacimiento: "1978-11-02",
  },
];

const blankUser = {
  tipo: "",
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

export default function ModifyUser({ onBack }) {
  const [ci, setCi] = useState("");
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [editUser, setEditUser] = useState(blankUser);
  const [saving, setSaving] = useState(false);

  const canSearch = useMemo(() => ci.trim().length >= 4 && !searching, [ci, searching]);

  const isEditValid = useMemo(() => {
    if (!openModal) return false;
    return Object.values(editUser).every((v) => String(v).trim().length > 0);
  }, [editUser, openModal]);

  // ESC para cerrar modal + bloqueo scroll
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (!canSearch) return;

    setSearching(true);
    setNotFound(false);

    setTimeout(() => {
      const found = DUMMY_USERS.find((u) => u.ci === ci.trim());
      setSearching(false);

      if (!found) {
        setNotFound(true);
        return;
      }

      setEditUser(found);
      setOpenModal(true);
    }, 450);
  };

  const closeEditModal = () => {
    setOpenModal(false);
    setSaving(false);
  };

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!isEditValid) {
      alert("Por favor, complete todos los campos requeridos.");
      return;
    }

    setSaving(true);

    // ✅ simulación de guardado
    setTimeout(() => {
      setSaving(false);
      alert("Cambios guardados exitosamente! (Simulación)");
      closeEditModal();
      // Opcional: limpiar búsqueda o mantener
      // setCi("");
    }, 500);
  };

  return (
    <section className="eaen-modify-wrap">
      <div className="eaen-modify-head">
        <div>
          <h2 className="eaen-modify-title">Modificar Usuario</h2>
          <p className="eaen-modify-subtitle">
            Busque por Carnet de Identidad (CI). Al encontrar, se abrirá un formulario de edición.
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

          <button className="eaen-primary-btn" type="submit" disabled={!canSearch}>
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {notFound && (
          <div className="eaen-alert">
            No se encontró un usuario con el CI <b>{ci.trim()}</b>. (Simulación)
          </div>
        )}

        <div className="eaen-note">
          <b>Tip:</b> Prueba con CI: <code>1234567</code> o <code>9876543</code>
        </div>
      </div>

      {/* ✅ Modal de edición */}
      {openModal && (
        <div className="eaen-modal" onMouseDown={closeEditModal}>
          <div className="eaen-modal-content" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="eaen-close-modal" onClick={closeEditModal} aria-label="Cerrar">
              ×
            </button>

            <h2 className="eaen-modal-title">Editar Usuario (CI: {editUser.ci})</h2>

            <form onSubmit={handleSave} className="eaen-form">
              <div className="eaen-form-grid">
                <FieldSelect
                  label="Tipo de Usuario"
                  name="tipo"
                  value={editUser.tipo}
                  onChange={onEditChange}
                  options={[["", "Seleccione..."], ...USER_TYPES.map((x) => [x, x])]}
                />

                <FieldSelect
                  label="Grado o Profesión"
                  name="grado"
                  value={editUser.grado}
                  onChange={onEditChange}
                  options={[["", "Seleccione..."], ...GRADOS.map((x) => [x, x])]}
                />

                <FieldInput label="Apellido Paterno" name="ap_paterno" value={editUser.ap_paterno} onChange={onEditChange} />
                <FieldInput label="Apellido Materno" name="ap_materno" value={editUser.ap_materno} onChange={onEditChange} />
                <FieldInput label="Nombre" name="nombre" value={editUser.nombre} onChange={onEditChange} />

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
                  options={[["", "Seleccione..."], ...EXT.map((x) => [x.v, x.t])]}
                />

                <FieldSelect
                  label="Filial"
                  name="filial"
                  value={editUser.filial}
                  onChange={onEditChange}
                  options={[["", "Seleccione..."], ...FILIALES.map((x) => [x, x])]}
                />

                <FieldSelect
                  label="Fuerza"
                  name="fuerza"
                  value={editUser.fuerza}
                  onChange={onEditChange}
                  options={[["", "Seleccione..."], ...FUERZAS.map((x) => [x, x])]}
                />

                <FieldSelect
                  label="Turno"
                  name="turno"
                  value={editUser.turno}
                  onChange={onEditChange}
                  options={[["", "Seleccione..."], ...TURNOS.map((x) => [x, x])]}
                />

                <FieldInput label="Teléfono" name="telefono" value={editUser.telefono} onChange={onEditChange} type="tel" />
                <FieldInput label="Fecha de Inscripción" name="fecha_inscripcion" value={editUser.fecha_inscripcion} onChange={onEditChange} type="date" />
                <FieldInput label="Lugar de Trabajo" name="lugar_trabajo" value={editUser.lugar_trabajo} onChange={onEditChange} />
                <FieldInput label="Correo Electrónico" name="correo" value={editUser.correo} onChange={onEditChange} type="email" />
                <FieldInput label="Fecha de Nacimiento" name="fecha_nacimiento" value={editUser.fecha_nacimiento} onChange={onEditChange} type="date" />
              </div>

              <div className="eaen-modal-actions">
                <button className="eaen-primary-btn" type="submit" disabled={!isEditValid || saving}>
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>

                <button className="eaen-secondary-btn" type="button" onClick={closeEditModal} disabled={saving}>
                  Cancelar
                </button>
              </div>

              <p className="eaen-hint">
                * Esto es simulación. Luego conectamos a Node + MySQL para traer/guardar por CI.
              </p>
            </form>
          </div>
        </div>
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
