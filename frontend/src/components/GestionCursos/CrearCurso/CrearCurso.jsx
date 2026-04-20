import { useEffect, useMemo, useState } from "react";
import "../subview.css";
import "./CrearCurso.css";

const API_BASE = import.meta.env.VITE_API_URL;

// ===== UI Helpers =====
function fullName(u) {
  return `${u.ap_paterno ?? ""} ${u.ap_materno ?? ""} ${u.nombre ?? ""}`
    .replace(/\s+/g, " ")
    .trim();
}

function userLabel(u) {
  const ci = u.ci ? `${u.ci}${u.ex ? "-" + u.ex : ""}` : "S/CI";
  return `${fullName(u)} — ${ci}`;
}

export default function CrearCurso({ onBack }) {
  // ==== Data desde API ====
  const [cursantes, setCursantes] = useState([]);
  const [jefes, setJefes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
  const [selectedIds, setSelectedIds] = useState([]);
  const [pickLeft, setPickLeft] = useState([]);
  const [pickRight, setPickRight] = useState([]);

  const [saving, setSaving] = useState(false);

  // ✅ Modal Estado (éxito/error)
  const [statusModal, setStatusModal] = useState({
    open: false,
    type: "success", // success | error
    title: "",
    message: "",
  });

  const openStatus = ({ type, title, message }) =>
    setStatusModal({ open: true, type, title, message });

  const closeStatus = () => setStatusModal((p) => ({ ...p, open: false }));

  // ESC para cerrar modal
  useEffect(() => {
    if (!statusModal.open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeStatus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [statusModal.open]);

  // ===== Cargar datos desde API =====
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setLoadError("");

        const [rC, rJ] = await Promise.all([
          fetch(`${API_BASE}/usuarios/cursantes-activos`),
          fetch(`${API_BASE}/usuarios/jefes-curso`),
        ]);

        const cursData = await rC.json().catch(() => []);
        const jefeData = await rJ.json().catch(() => []);

        if (!rC.ok) throw new Error(cursData?.message || "Error cargando cursantes");
        if (!rJ.ok) throw new Error(jefeData?.message || "Error cargando jefes");

        if (!alive) return;

        const normC = (Array.isArray(cursData) ? cursData : []).map((u) => ({
          id: Number(u.id),
          tipo_usuario: u.tipo_usuario ?? "Cursante",
          estado: u.estado ?? "ACTIVO",
          ci: u.ci ?? "",
          ex: u.ex ?? "",
          ap_paterno: u.ap_paterno ?? "",
          ap_materno: u.ap_materno ?? "",
          nombre: u.nombre ?? "",
          correo: u.correo ?? u.email ?? "",
        }));

        const normJ = (Array.isArray(jefeData) ? jefeData : []).map((u) => ({
          id: Number(u.id),
          tipo_usuario: u.tipo_usuario ?? "",
          estado: u.estado ?? "ACTIVO",
          ci: u.ci ?? "",
          ex: u.ex ?? "",
          ap_paterno: u.ap_paterno ?? "",
          ap_materno: u.ap_materno ?? "",
          nombre: u.nombre ?? "",
          correo: u.correo ?? u.email ?? "",
        }));

        setCursantes(normC);
        setJefes(normJ);

        if (normJ.length) setJefeCursoId(String(normJ[0].id));
      } catch (err) {
        if (!alive) return;
        setLoadError(err?.message || "No se pudo cargar datos del servidor.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  // ===== Filtro cursantes (búsqueda) =====
  const cursantesFiltrados = useMemo(() => {
    const query = q.trim().toLowerCase();

    return cursantes
      .filter((u) => {
        if (!query) return true;
        const blob = `${fullName(u)} ${u.ci}-${u.ex} ${u.correo}`.toLowerCase();
        return blob.includes(query);
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [cursantes, q]);

  // Izquierda: disponibles
  const available = useMemo(() => {
    const selected = new Set(selectedIds.map(String));
    return cursantesFiltrados.filter((u) => !selected.has(String(u.id)));
  }, [cursantesFiltrados, selectedIds]);

  // Derecha: seleccionados
  const selectedUsers = useMemo(() => {
    const map = new Map(cursantes.map((u) => [String(u.id), u]));
    return selectedIds.map(String).map((id) => map.get(id)).filter(Boolean);
  }, [cursantes, selectedIds]);

  const canSubmit = useMemo(() => {
    if (saving) return false;
    if (!nombreCurso.trim()) return false;
    if (!jefeCursoId) return false;
    if (!fechaInicio) return false;
    if (!fechaFin) return false;
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) return false;
    if (selectedIds.length === 0) return false;
    return true;
  }, [saving, nombreCurso, jefeCursoId, fechaInicio, fechaFin, selectedIds]);

  // ===== mover selección =====
  const addSelected = () => {
    if (!pickLeft.length) return;
    const addSet = new Set(selectedIds.map(String));
    pickLeft.forEach((id) => addSet.add(String(id)));
    setSelectedIds(Array.from(addSet).map(Number));
    setPickLeft([]);
  };

  const removeSelected = () => {
    if (!pickRight.length) return;
    const removeSet = new Set(pickRight.map(String));
    setSelectedIds((prev) =>
      prev.map(String).filter((id) => !removeSet.has(id)).map(Number)
    );
    setPickRight([]);
  };

  const addAll = () => {
    const all = available.map((u) => String(u.id));
    if (!all.length) return;
    const s = new Set(selectedIds.map(String));
    all.forEach((id) => s.add(id));
    setSelectedIds(Array.from(s).map(Number));
    setPickLeft([]);
  };

  const removeAll = () => {
    setSelectedIds([]);
    setPickRight([]);
  };

  // ===== Guardar en backend (con modal) =====
  const handleSave = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      openStatus({
        type: "error",
        title: "Faltan datos",
        message: "Complete los campos requeridos y seleccione al menos 1 cursante.",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nombre: nombreCurso.trim(),
        descripcion: descripcion.trim() || null,
        jefe_curso_id: Number(jefeCursoId),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        modalidad,
        horas_academicas: horas ? Number(horas) : null,
        participantes_ids: selectedIds.map(Number),
      };

      const resp = await fetch(`${API_BASE}/cursos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        openStatus({
          type: "error",
          title: "No se pudo crear el curso",
          message: data?.message || "Ocurrió un error al registrar el curso.",
        });
        return;
      }

      openStatus({
        type: "success",
        title: "Registro exitoso",
        message: `Curso creado correctamente. ID: ${data.id}. Participantes: ${data.participantes}.`,
      });

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
    } catch (err) {
      openStatus({
        type: "error",
        title: "Sin conexión",
        message: "No se pudo conectar al servidor. Verifica que el backend esté corriendo.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="eaen-subview">
      <div className="eaen-subview-head">
        <div>
          <h2>Crear Curso</h2>
          <p>Defina los datos del curso y asigne cursantes activos</p>
        </div>
        <button className="eaen-secondary-btn" onClick={onBack}>
          ← Volver
        </button>
      </div>

      {loading && <div className="eaen-note">Cargando usuarios desde el servidor...</div>}

      {loadError && (
        <div className="eaen-alert">
          <b>Error:</b> {loadError}
          <div style={{ marginTop: 8 }}>
            Verifica: <code>import.meta.env.VITE_API_URL/health</code>
          </div>
        </div>
      )}

      <div className="eaen-crear-grid">
        {/* Form */}
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
                  disabled={loading || !!loadError}
                >
                  {jefes.length === 0 ? (
                    <option value="">No hay usuarios disponibles (no-cursantes activos)</option>
                  ) : (
                    jefes.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {fullName(u)} — {u.tipo_usuario} ({u.ci}{u.ex ? "-" + u.ex : ""})
                      </option>
                    ))
                  )}
                </select>
                <small className="eaen-help">* Solo usuarios ACTIVO que no sean Cursante.</small>
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
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
              </div>

              <div className="eaen-form-group">
                <label>Fecha Fin *</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
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
                <input value="ACTIVO" readOnly />
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
              <button className="eaen-primary-btn" type="submit" disabled={!canSubmit || loading || !!loadError}>
                {saving ? "Creando..." : "Crear Curso"}
              </button>

              <div className="eaen-crear-meta">
                <span>
                  Participantes seleccionados: <b>{selectedIds.length}</b>
                </span>
              </div>
            </div>

            <p className="eaen-hint">
              * Guardado en MySQL vía API: <code>POST /api/cursos</code>
            </p>
          </form>
        </div>

        {/* Selector participantes */}
        <div className="eaen-crear-card">
          <h3 className="eaen-crear-title">Participantes (Cursantes ACTIVO)</h3>

          <div className="eaen-pick-toolbar">
            <div className="eaen-form-group" style={{ marginBottom: 0 }}>
              <label>Buscar cursante</label>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, CI, correo..." disabled={loading || !!loadError} />
            </div>

            <div className="eaen-pick-count">
              Disponibles: <b>{available.length}</b>
            </div>
          </div>

          <div className="eaen-pick-grid">
            <div className="eaen-pick-col">
              <div className="eaen-pick-label">Disponibles</div>
              <select
                className="eaen-pick-list"
                multiple
                value={pickLeft}
                onChange={(e) => setPickLeft(Array.from(e.target.selectedOptions).map((o) => o.value))}
                disabled={loading || !!loadError}
              >
                {available.length === 0 ? (
                  <option value="" disabled>No hay cursantes disponibles</option>
                ) : (
                  available.map((u) => (
                    <option key={u.id} value={String(u.id)}>{userLabel(u)}</option>
                  ))
                )}
              </select>
            </div>

            <div className="eaen-pick-actions">
              <button type="button" className="eaen-pick-btn" onClick={addSelected} disabled={!pickLeft.length}>Añadir →</button>
              <button type="button" className="eaen-pick-btn" onClick={addAll} disabled={!available.length}>Añadir todo ⇉</button>
              <div className="eaen-pick-divider" />
              <button type="button" className="eaen-pick-btn" onClick={removeSelected} disabled={!pickRight.length}>← Quitar</button>
              <button type="button" className="eaen-pick-btn" onClick={removeAll} disabled={!selectedIds.length}>⇇ Quitar todo</button>
            </div>

            <div className="eaen-pick-col">
              <div className="eaen-pick-label">Seleccionados</div>
              <select
                className="eaen-pick-list"
                multiple
                value={pickRight}
                onChange={(e) => setPickRight(Array.from(e.target.selectedOptions).map((o) => o.value))}
                disabled={loading || !!loadError}
              >
                {selectedUsers.length === 0 ? (
                  <option value="" disabled>Seleccione al menos un cursante</option>
                ) : (
                  selectedUsers.map((u) => (
                    <option key={u.id} value={String(u.id)}>{userLabel(u)}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="eaen-note" style={{ marginTop: 12 }}>
            <b>Nota:</b> Solo se muestran cursantes con <code>estado = ACTIVO</code> y <code>tipo_usuario = Cursante</code>.
          </div>
        </div>
      </div>

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

function StatusModal({ type = "success", title, message, onClose }) {
  const isSuccess = type === "success";

  return (
    <div className="eaen-modal-overlay" onMouseDown={onClose}>
      <div className="eaen-modal-container" onMouseDown={(e) => e.stopPropagation()}>
        <div className={`eaen-modal-icon ${isSuccess ? "success" : "error"}`}>
          {isSuccess ? "✓" : "✕"}
        </div>
        <h3 className="eaen-modal-title">{title}</h3>
        <p className="eaen-modal-message">{message}</p>
        <button className="eaen-modal-btn" type="button" onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  );
}


