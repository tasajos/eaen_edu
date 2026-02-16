import { useEffect, useMemo, useState } from "react";
import "../subview.css";
import "./CrearCurso.css";

// ===== Helpers LocalStorage =====
const LS_USERS = "eaen_users";     // (opcional) donde guardaremos usuarios cuando conectemos AddUsers real
const LS_COURSES = "eaen_courses"; // cursos guardados (simulación)

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

// ===== Datos Dummy (fallback) =====
const DUMMY_USERS = [
  // cursantes activos
  {
    id: "u1",
    tipo_usuario: "Cursante",
    estado: "Activo",
    ci: "1234567",
    ex: "LP",
    ap_paterno: "Pérez",
    ap_materno: "Gómez",
    nombre: "Juan",
    correo: "juan.perez@eaen.bo",
  },
  {
    id: "u2",
    tipo_usuario: "Cursante",
    estado: "Activo",
    ci: "5551112",
    ex: "SC",
    ap_paterno: "Quispe",
    ap_materno: "Mamani",
    nombre: "Luis",
    correo: "luis.quispe@correo.com",
  },
  {
    id: "u3",
    tipo_usuario: "Cursante",
    estado: "Inactivo",
    ci: "9990001",
    ex: "CB",
    ap_paterno: "Ramos",
    ap_materno: "Lima",
    nombre: "Andrés",
    correo: "andres.ramos@correo.com",
  },

  // no cursantes activos (para jefe de curso)
  {
    id: "u4",
    tipo_usuario: "Docente",
    estado: "Activo",
    ci: "9876543",
    ex: "CB",
    ap_paterno: "Rojas",
    ap_materno: "Flores",
    nombre: "María",
    correo: "maria.rojas@eaen.bo",
  },
  {
    id: "u5",
    tipo_usuario: "Administrador",
    estado: "Activo",
    ci: "8004002",
    ex: "LP",
    ap_paterno: "Salazar",
    ap_materno: "Aguirre",
    nombre: "Carlos",
    correo: "admin@eaen.bo",
  },
];

// ===== UI Helpers =====
function fullName(u) {
  return `${u.ap_paterno ?? ""} ${u.ap_materno ?? ""} ${u.nombre ?? ""}`.replace(/\s+/g, " ").trim();
}

function userLabel(u) {
  const ci = u.ci ? `${u.ci}${u.ex ? "-" + u.ex : ""}` : "S/CI";
  return `${fullName(u)} — ${ci}`;
}

function uid(u) {
  // id estable
  return u.id || `${u.ci || "na"}-${u.ex || "na"}-${(u.correo || "").toLowerCase()}`;
}

// ===== Componente =====
export default function CrearCurso({ onBack }) {
  // Cargar usuarios
  const [users, setUsers] = useState([]);

  // Form curso
  const [nombreCurso, setNombreCurso] = useState("");
  const [codigoCurso, setCodigoCurso] = useState("");
  const [modalidad, setModalidad] = useState("Presencial");
  const [horas, setHoras] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [jefeCursoId, setJefeCursoId] = useState("");

  // Selector participantes
  const [q, setQ] = useState("");
  const [selectedIds, setSelectedIds] = useState([]); // ids de cursantes seleccionados
  const [pickLeft, setPickLeft] = useState([]);  // selección multi en lista izquierda
  const [pickRight, setPickRight] = useState([]); // selección multi en lista derecha

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(LS_USERS);
    const loaded = raw ? safeParse(raw, []) : [];
    // Si no hay usuarios en LS, usamos dummy
    const base = loaded.length ? loaded : DUMMY_USERS;

    // Normalizamos campos esperados (por si tu Addusers usa otros nombres)
    const normalized = base.map((u) => ({
      id: u.id || uid(u),
      tipo_usuario: u.tipo_usuario || u.tipo || u.rol || "Cursante",
      estado: u.estado || "Activo",
      ci: u.ci || "",
      ex: u.ex || "",
      ap_paterno: u.ap_paterno || u.apPaterno || "",
      ap_materno: u.ap_materno || u.apMaterno || "",
      nombre: u.nombre || "",
      correo: u.correo || u.email || "",
    }));

    setUsers(normalized);

    // Por defecto selecciona jefe de curso si existe algún no-cursante activo
    const jefes = normalized.filter((u) => u.estado === "Activo" && u.tipo_usuario !== "Cursante");
    if (jefes.length) setJefeCursoId(jefes[0].id);
  }, []);

  // Cursantes activos para elegir
  const cursantesActivos = useMemo(() => {
    const query = q.trim().toLowerCase();

    return users
      .filter((u) => u.estado === "Activo" && u.tipo_usuario === "Cursante")
      .filter((u) => {
        if (!query) return true;
        const blob = `${fullName(u)} ${u.ci}-${u.ex} ${u.correo}`.toLowerCase();
        return blob.includes(query);
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [users, q]);

  // Jefes (no cursantes activos)
  const jefesCurso = useMemo(() => {
    return users
      .filter((u) => u.estado === "Activo" && u.tipo_usuario !== "Cursante")
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [users]);

  // Izquierda: disponibles (cursantes activos NO seleccionados)
  const available = useMemo(() => {
    const selected = new Set(selectedIds);
    return cursantesActivos.filter((u) => !selected.has(u.id));
  }, [cursantesActivos, selectedIds]);

  // Derecha: seleccionados
  const selectedUsers = useMemo(() => {
    const map = new Map(users.map((u) => [u.id, u]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean);
  }, [users, selectedIds]);

  const canSubmit = useMemo(() => {
    if (saving) return false;
    if (!nombreCurso.trim()) return false;
    if (!jefeCursoId) return false;
    if (!fechaInicio) return false;
    if (!fechaFin) return false;

    // validación de fecha
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) return false;

    // mínimo 1 participante
    if (selectedIds.length === 0) return false;

    return true;
  }, [saving, nombreCurso, jefeCursoId, fechaInicio, fechaFin, selectedIds]);

  const addSelected = () => {
    if (!pickLeft.length) return;
    const addSet = new Set(selectedIds);
    pickLeft.forEach((id) => addSet.add(id));
    setSelectedIds(Array.from(addSet));
    setPickLeft([]);
  };

  const removeSelected = () => {
    if (!pickRight.length) return;
    const removeSet = new Set(pickRight);
    setSelectedIds((prev) => prev.filter((id) => !removeSet.has(id)));
    setPickRight([]);
  };

  const addAll = () => {
    const all = available.map((u) => u.id);
    if (!all.length) return;
    const s = new Set(selectedIds);
    all.forEach((id) => s.add(id));
    setSelectedIds(Array.from(s));
    setPickLeft([]);
  };

  const removeAll = () => {
    setSelectedIds([]);
    setPickRight([]);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!canSubmit) {
      alert("Complete los campos requeridos y seleccione al menos 1 cursante.");
      return;
    }

    setSaving(true);

    const jefe = users.find((u) => u.id === jefeCursoId);

    const course = {
      id: `c-${Date.now()}`,
      codigo: codigoCurso.trim() || null,
      nombre: nombreCurso.trim(),
      modalidad,
      horas: Number(horas || 0),
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      descripcion: descripcion.trim(),
      jefe_curso: jefe
        ? { id: jefe.id, nombre: fullName(jefe), tipo_usuario: jefe.tipo_usuario, ci: jefe.ci, ex: jefe.ex }
        : null,
      participantes: selectedUsers.map((u) => ({
        id: u.id,
        nombre: fullName(u),
        ci: u.ci,
        ex: u.ex,
        correo: u.correo,
      })),
      creado_en: new Date().toISOString(),
      estado: "Activo",
    };

    setTimeout(() => {
      const prev = safeParse(localStorage.getItem(LS_COURSES), []);
      localStorage.setItem(LS_COURSES, JSON.stringify([course, ...prev]));

      setSaving(false);
      alert("Curso creado exitosamente (simulación).");

      // reset
      setNombreCurso("");
      setCodigoCurso("");
      setModalidad("Presencial");
      setHoras("");
      setFechaInicio("");
      setFechaFin("");
      setDescripcion("");
      setSelectedIds([]);
      setPickLeft([]);
      setPickRight([]);
    }, 450);
  };

  return (
    <section className="eaen-subview">
      <div className="eaen-subview-head">
        <div>
          <h2>Crear Curso</h2>
          <p>
            Defina los datos del curso y asigne cursantes activos. (Frontend, sin BD aún)
          </p>
        </div>
        <button className="eaen-secondary-btn" onClick={onBack}>
          ← Volver
        </button>
      </div>

      <div className="eaen-crear-grid">
        {/* Izquierda: formulario */}
        <div className="eaen-crear-card">
          <h3 className="eaen-crear-title">Datos del Curso</h3>

          <form onSubmit={handleSave} className="eaen-crear-form">
            <div className="eaen-crear-row2">
              <div className="eaen-form-group">
                <label>Nombre del Curso *</label>
                <input
                  value={nombreCurso}
                  onChange={(e) => setNombreCurso(e.target.value)}
                  placeholder="Ej. Diplomado en Gestión del Riesgo"
                  required
                />
              </div>

              <div className="eaen-form-group">
                <label>Código (opcional)</label>
                <input
                  value={codigoCurso}
                  onChange={(e) => setCodigoCurso(e.target.value)}
                  placeholder="Ej. EAEN-GR-2026-01"
                />
              </div>
            </div>

            <div className="eaen-crear-row2">
              <div className="eaen-form-group">
                <label>Jefe de Curso *</label>
                <select
                  value={jefeCursoId}
                  onChange={(e) => setJefeCursoId(e.target.value)}
                  required
                >
                  {jefesCurso.length === 0 ? (
                    <option value="">No hay usuarios disponibles (no-cursantes activos)</option>
                  ) : (
                    jefesCurso.map((u) => (
                      <option key={u.id} value={u.id}>
                        {fullName(u)} — {u.tipo_usuario} ({u.ci}{u.ex ? "-" + u.ex : ""})
                      </option>
                    ))
                  )}
                </select>
                <small className="eaen-help">
                  * Solo usuarios activos que no sean Cursante.
                </small>
              </div>

              <div className="eaen-form-group">
                <label>Modalidad</label>
                <select value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
                  <option>Presencial</option>
                  <option>Semipresencial</option>
                  <option>Virtual</option>
                </select>
              </div>
            </div>

            <div className="eaen-crear-row2">
              <div className="eaen-form-group">
                <label>Fecha Inicio *</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                />
              </div>

              <div className="eaen-form-group">
                <label>Fecha Fin *</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                />
                {fechaInicio && fechaFin && fechaFin < fechaInicio && (
                  <small className="eaen-error">La fecha fin no puede ser menor a la fecha inicio.</small>
                )}
              </div>
            </div>

            <div className="eaen-crear-row2">
              <div className="eaen-form-group">
                <label>Horas Académicas (opcional)</label>
                <input
                  type="number"
                  min="0"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value)}
                  placeholder="Ej. 120"
                />
              </div>

              <div className="eaen-form-group">
                <label>Estado</label>
                <input value="Activo" readOnly />
              </div>
            </div>

            <div className="eaen-form-group">
              <label>Descripción / Observaciones</label>
              <textarea
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción del objetivo, alcance, requisitos, etc."
              />
            </div>

            <div className="eaen-crear-actions">
              <button className="eaen-primary-btn" type="submit" disabled={!canSubmit}>
                {saving ? "Creando..." : "Crear Curso"}
              </button>

              <div className="eaen-crear-meta">
                <span>
                  Participantes seleccionados: <b>{selectedIds.length}</b>
                </span>
              </div>
            </div>

            <p className="eaen-hint">
              * Guardado en <code>localStorage</code> como <code>eaen_courses</code> (simulación).
            </p>
          </form>
        </div>

        {/* Derecha: selector participantes */}
        <div className="eaen-crear-card">
          <h3 className="eaen-crear-title">Participantes (Cursantes activos)</h3>

          <div className="eaen-pick-toolbar">
            <div className="eaen-form-group" style={{ marginBottom: 0 }}>
              <label>Buscar cursante</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre, CI, correo..."
              />
            </div>

            <div className="eaen-pick-count">
              Disponibles: <b>{available.length}</b>
            </div>
          </div>

          <div className="eaen-pick-grid">
            {/* Lista disponible */}
            <div className="eaen-pick-col">
              <div className="eaen-pick-label">Disponibles</div>
              <select
                className="eaen-pick-list"
                multiple
                value={pickLeft}
                onChange={(e) =>
                  setPickLeft(Array.from(e.target.selectedOptions).map((o) => o.value))
                }
              >
                {available.length === 0 ? (
                  <option value="" disabled>
                    No hay cursantes disponibles
                  </option>
                ) : (
                  available.map((u) => (
                    <option key={u.id} value={u.id}>
                      {userLabel(u)}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Botones */}
            <div className="eaen-pick-actions">
              <button type="button" className="eaen-pick-btn" onClick={addSelected} disabled={!pickLeft.length}>
                Añadir →
              </button>
              <button type="button" className="eaen-pick-btn" onClick={addAll} disabled={!available.length}>
                Añadir todo ⇉
              </button>
              <div className="eaen-pick-divider" />
              <button type="button" className="eaen-pick-btn" onClick={removeSelected} disabled={!pickRight.length}>
                ← Quitar
              </button>
              <button type="button" className="eaen-pick-btn" onClick={removeAll} disabled={!selectedIds.length}>
                ⇇ Quitar todo
              </button>
            </div>

            {/* Lista seleccionada */}
            <div className="eaen-pick-col">
              <div className="eaen-pick-label">Seleccionados</div>
              <select
                className="eaen-pick-list"
                multiple
                value={pickRight}
                onChange={(e) =>
                  setPickRight(Array.from(e.target.selectedOptions).map((o) => o.value))
                }
              >
                {selectedUsers.length === 0 ? (
                  <option value="" disabled>
                    Seleccione al menos un cursante
                  </option>
                ) : (
                  selectedUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {userLabel(u)}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="eaen-note" style={{ marginTop: 12 }}>
            <b>Nota:</b> Solo se muestran cursantes con <code>estado = Activo</code> y{" "}
            <code>tipo_usuario = Cursante</code>.
          </div>
        </div>
      </div>
    </section>
  );
}
