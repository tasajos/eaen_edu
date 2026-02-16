// AddParticipantes.jsx (INTEGRADO A BACKEND + MODAL ÉXITO/ERROR)
// Reemplaza tu archivo completo por este (mantiene tu mismo CSS y layout)

import { useEffect, useMemo, useState } from "react";
import "../subview.css";
import "./AddParticipantes.css";

// === API ===
const API = "http://localhost:5000/api";

function fullName(u) {
  return `${u.ap_paterno ?? ""} ${u.ap_materno ?? ""} ${u.nombre ?? ""}`
    .replace(/\s+/g, " ")
    .trim();
}

function userLabel(u) {
  const ci = u.ci ? `${u.ci}${u.ex ? "-" + u.ex : ""}` : "S/CI";
  return `${fullName(u)} — ${ci}`;
}

function asActivo(v) {
  // backend usa ACTIVO/INACTIVO, frontend a veces Activo
  const s = String(v ?? "").trim();
  if (!s) return "ACTIVO";
  if (s.toUpperCase() === "ACTIVO") return "ACTIVO";
  if (s.toUpperCase() === "INACTIVO") return "INACTIVO";
  if (s.toLowerCase() === "activo") return "ACTIVO";
  if (s.toLowerCase() === "inactivo") return "INACTIVO";
  return s.toUpperCase();
}

// Modal (mismo estilo que Addusers)
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

export default function AddParticipantes({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);

  const [courseId, setCourseId] = useState("");
  const [q, setQ] = useState("");

  const [pickLeft, setPickLeft] = useState([]); // ids a añadir (usuario_id)
  const [pickRight, setPickRight] = useState([]); // ids a quitar (usuario_id)

  const [saving, setSaving] = useState(false);

  // ✅ Modal state
  const [modal, setModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const openModal = ({ type, title, message }) => {
    setModal({ open: true, type, title, message });
  };

  const closeModal = () => setModal((p) => ({ ...p, open: false }));

  // ✅ Cerrar modal con ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && modal.open) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal.open]);

  // ===== Fetch helpers =====
  async function fetchJSON(url, options) {
    const resp = await fetch(url, options);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = data?.message || "Ocurrió un error en el servidor.";
      throw new Error(msg);
    }
    return data;
  }

  async function loadCourses() {
    // lista simple
    const rows = await fetchJSON(`${API}/cursos`);
    // normaliza campos para UI
    const normalized = (Array.isArray(rows) ? rows : []).map((c) => ({
      id: String(c.id),
      nombre: c.nombre,
      codigo: c.codigo ?? null, // tu tabla no tiene codigo, pero si no existe, no pasa nada
      estado: c.estado,
      fecha_inicio: c.fecha_inicio,
      fecha_fin: c.fecha_fin,
      jefe_curso_id: c.jefe_curso_id,
      jefe_curso: c.jefe_nombre
        ? {
            id: c.jefe_curso_id,
            nombre: `${c.jefe_ap_paterno ?? ""} ${c.jefe_ap_materno ?? ""} ${c.jefe_nombre ?? ""}`
              .replace(/\s+/g, " ")
              .trim(),
          }
        : null,
      participantes_total: Number(c.participantes_total ?? 0),
    }));
    setCourses(normalized);
    if (normalized.length && !courseId) setCourseId(String(normalized[0].id));
  }

  async function loadUsers() {
    // cursantes-activos ya filtra en backend; pero para mostrar "En el curso" necesitamos map de users por id
    // así que cargamos todos los usuarios sin password
    const rows = await fetchJSON(`${API}/usuarios`);
    const normalized = (Array.isArray(rows) ? rows : []).map((u) => ({
      id: String(u.id),
      tipo_usuario: u.tipo_usuario ?? "",
      estado: asActivo(u.estado),
      ci: u.ci ?? "",
      ex: u.ex ?? "",
      ap_paterno: u.ap_paterno ?? "",
      ap_materno: u.ap_materno ?? "",
      nombre: u.nombre ?? "",
      correo: u.correo ?? "",
      email: u.email ?? "",
    }));
    setUsers(normalized);
  }

  async function loadAll() {
    setSaving(true);
    try {
      await Promise.all([loadUsers(), loadCourses()]);
    } catch (err) {
      openModal({
        type: "error",
        title: "No se pudo cargar",
        message:
          err?.message ||
          "No se pudo conectar al servidor. Verifica que el backend esté corriendo.",
      });
    } finally {
      setSaving(false);
    }
  }

  // cargar datos (backend)
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // curso seleccionado (desde lista)
  const selectedCourse = useMemo(() => {
    return courses.find((c) => String(c.id) === String(courseId)) || null;
  }, [courses, courseId]);

  // === cargar detalle del curso (participantes reales) cuando cambia courseId ===
  const [courseDetail, setCourseDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!courseId) return;
      setSaving(true);
      try {
        const detail = await fetchJSON(`${API}/cursos/${courseId}`);
        if (cancelled) return;

        // normalizamos participantes desde backend
        const participantes = (detail.participantes || []).map((p) => ({
          id: String(p.id),
          nombre: fullName(p),
          ci: p.ci ?? "",
          ex: p.ex ?? "",
          correo: p.correo ?? "",
          email: p.email ?? "",
          tipo_usuario: p.tipo_usuario ?? "",
          estado: asActivo(p.estado),
          ap_paterno: p.ap_paterno ?? "",
          ap_materno: p.ap_materno ?? "",
        }));

        setCourseDetail({
          ...detail,
          id: String(detail.id),
          participantes,
          jefe_curso_nombre: detail.jefe_nombre
            ? `${detail.jefe_ap_paterno ?? ""} ${detail.jefe_ap_materno ?? ""} ${detail.jefe_nombre ?? ""}`
                .replace(/\s+/g, " ")
                .trim()
            : null,
        });

        // limpiar selección multiselect al cambiar de curso
        setPickLeft([]);
        setPickRight([]);
      } catch (err) {
        openModal({
          type: "error",
          title: "Error al cargar curso",
          message: err?.message || "No se pudo obtener el detalle del curso.",
        });
        setCourseDetail(null);
      } finally {
        setSaving(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // ids de participantes actuales del curso (desde detalle)
  const currentParticipantIds = useMemo(() => {
    if (!courseDetail?.participantes) return [];
    return courseDetail.participantes.map((p) => String(p.id)).filter(Boolean);
  }, [courseDetail]);

  const currentParticipants = useMemo(() => {
    // si el backend ya mandó participantes completos, usamos eso directo
    return courseDetail?.participantes || [];
  }, [courseDetail]);

  // cursantes activos (pool) - desde USERS cargados, filtrado local + búsqueda
  const cursantesActivos = useMemo(() => {
    const query = q.trim().toLowerCase();
    return users
      .filter((u) => u.estado === "ACTIVO" && u.tipo_usuario === "Cursante")
      .filter((u) => {
        if (!query) return true;
        const blob = `${fullName(u)} ${u.ci}-${u.ex} ${u.correo} ${u.email}`.toLowerCase();
        return blob.includes(query);
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [users, q]);

  // disponibles para añadir (cursantes activos que NO están en el curso)
  const available = useMemo(() => {
    const inCourse = new Set(currentParticipantIds);
    return cursantesActivos.filter((u) => !inCourse.has(String(u.id)));
  }, [cursantesActivos, currentParticipantIds]);

  // === acciones backend ===
  const addSelected = async () => {
    if (!courseId) return;
    if (!pickLeft.length) return;

    setSaving(true);
    try {
      await fetchJSON(`${API}/cursos/${courseId}/participantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantes_ids: pickLeft.map((x) => Number(x)) }),
      });

      openModal({
        type: "success",
        title: "Registro exitoso",
        message: `Participantes añadidos correctamente al curso.`,
      });

      await loadCourses(); // refresca conteos en lista
      // refresca detalle del curso
      const detail = await fetchJSON(`${API}/cursos/${courseId}`);
      const participantes = (detail.participantes || []).map((p) => ({
        id: String(p.id),
        nombre: fullName(p),
        ci: p.ci ?? "",
        ex: p.ex ?? "",
        correo: p.correo ?? "",
        email: p.email ?? "",
        tipo_usuario: p.tipo_usuario ?? "",
        estado: asActivo(p.estado),
        ap_paterno: p.ap_paterno ?? "",
        ap_materno: p.ap_materno ?? "",
      }));
      setCourseDetail({
        ...detail,
        id: String(detail.id),
        participantes,
        jefe_curso_nombre: detail.jefe_nombre
          ? `${detail.jefe_ap_paterno ?? ""} ${detail.jefe_ap_materno ?? ""} ${detail.jefe_nombre ?? ""}`
              .replace(/\s+/g, " ")
              .trim()
          : null,
      });

      setPickLeft([]);
    } catch (err) {
      openModal({
        type: "error",
        title: "No se pudo añadir",
        message: err?.message || "Ocurrió un error al añadir participantes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    if (!courseId) return;
    if (!pickRight.length) return;

    setSaving(true);
    try {
      await fetchJSON(`${API}/cursos/${courseId}/participantes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantes_ids: pickRight.map((x) => Number(x)) }),
      });

      openModal({
        type: "success",
        title: "Actualización exitosa",
        message: `Participantes retirados correctamente del curso.`,
      });

      await loadCourses();
      const detail = await fetchJSON(`${API}/cursos/${courseId}`);
      const participantes = (detail.participantes || []).map((p) => ({
        id: String(p.id),
        nombre: fullName(p),
        ci: p.ci ?? "",
        ex: p.ex ?? "",
        correo: p.correo ?? "",
        email: p.email ?? "",
        tipo_usuario: p.tipo_usuario ?? "",
        estado: asActivo(p.estado),
        ap_paterno: p.ap_paterno ?? "",
        ap_materno: p.ap_materno ?? "",
      }));
      setCourseDetail({
        ...detail,
        id: String(detail.id),
        participantes,
        jefe_curso_nombre: detail.jefe_nombre
          ? `${detail.jefe_ap_paterno ?? ""} ${detail.jefe_ap_materno ?? ""} ${detail.jefe_nombre ?? ""}`
              .replace(/\s+/g, " ")
              .trim()
          : null,
      });

      setPickRight([]);
    } catch (err) {
      openModal({
        type: "error",
        title: "No se pudo quitar",
        message: err?.message || "Ocurrió un error al quitar participantes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const addAll = async () => {
    if (!courseId) return;
    if (!available.length) return;

    setSaving(true);
    try {
      await fetchJSON(`${API}/cursos/${courseId}/participantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantes_ids: available.map((u) => Number(u.id)) }),
      });

      openModal({
        type: "success",
        title: "Registro exitoso",
        message: `Se añadieron todos los cursantes disponibles al curso.`,
      });

      await loadCourses();
      const detail = await fetchJSON(`${API}/cursos/${courseId}`);
      const participantes = (detail.participantes || []).map((p) => ({
        id: String(p.id),
        nombre: fullName(p),
        ci: p.ci ?? "",
        ex: p.ex ?? "",
        correo: p.correo ?? "",
        email: p.email ?? "",
        tipo_usuario: p.tipo_usuario ?? "",
        estado: asActivo(p.estado),
        ap_paterno: p.ap_paterno ?? "",
        ap_materno: p.ap_materno ?? "",
      }));
      setCourseDetail({
        ...detail,
        id: String(detail.id),
        participantes,
        jefe_curso_nombre: detail.jefe_nombre
          ? `${detail.jefe_ap_paterno ?? ""} ${detail.jefe_ap_materno ?? ""} ${detail.jefe_nombre ?? ""}`
              .replace(/\s+/g, " ")
              .trim()
          : null,
      });

      setPickLeft([]);
    } catch (err) {
      openModal({
        type: "error",
        title: "No se pudo añadir",
        message: err?.message || "Ocurrió un error al añadir todos.",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeAll = async () => {
    if (!courseId) return;
    if (!currentParticipantIds.length) return;

    setSaving(true);
    try {
      await fetchJSON(`${API}/cursos/${courseId}/participantes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantes_ids: currentParticipantIds.map((x) => Number(x)) }),
      });

      openModal({
        type: "success",
        title: "Actualización exitosa",
        message: `Se retiraron todos los participantes del curso.`,
      });

      await loadCourses();
      const detail = await fetchJSON(`${API}/cursos/${courseId}`);
      const participantes = (detail.participantes || []).map((p) => ({
        id: String(p.id),
        nombre: fullName(p),
        ci: p.ci ?? "",
        ex: p.ex ?? "",
        correo: p.correo ?? "",
        email: p.email ?? "",
        tipo_usuario: p.tipo_usuario ?? "",
        estado: asActivo(p.estado),
        ap_paterno: p.ap_paterno ?? "",
        ap_materno: p.ap_materno ?? "",
      }));
      setCourseDetail({
        ...detail,
        id: String(detail.id),
        participantes,
        jefe_curso_nombre: detail.jefe_nombre
          ? `${detail.jefe_ap_paterno ?? ""} ${detail.jefe_ap_materno ?? ""} ${detail.jefe_nombre ?? ""}`
              .replace(/\s+/g, " ")
              .trim()
          : null,
      });

      setPickRight([]);
    } catch (err) {
      openModal({
        type: "error",
        title: "No se pudo quitar",
        message: err?.message || "Ocurrió un error al quitar todos.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="eaen-subview">
      <div className="eaen-subview-head">
        <div>
          <h2>Añadir Participantes</h2>
          <p>
            Seleccione un curso y añada o quite cursantes activos (integrado a Node + MySQL).
          </p>
        </div>
        <button className="eaen-secondary-btn" onClick={onBack}>
          ← Volver
        </button>
      </div>

      {!courses.length ? (
        <div className="eaen-subview-card">
          <p>No existen cursos todavía. Primero cree un curso en <b>Crear Curso</b>.</p>
          <button className="eaen-primary-btn" type="button" onClick={loadAll} style={{ marginTop: 10 }}>
            Recargar
          </button>
        </div>
      ) : (
        <div className="eaen-ap-grid">
          {/* Panel curso */}
          <div className="eaen-ap-card">
            <h3 className="eaen-ap-title">Curso</h3>

            <div className="eaen-ap-row">
              <div className="eaen-ap-group">
                <label>Seleccionar curso</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.codigo ? `(${c.codigo})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="eaen-ap-meta">
                <span>
                  Participantes: <b>{currentParticipantIds.length}</b>
                </span>
                <span>
                  Estado: <b>{selectedCourse?.estado || "—"}</b>
                </span>
              </div>
            </div>

            <div className="eaen-ap-info">
              <div>
                <b>Jefe de Curso:</b>{" "}
                {courseDetail?.jefe_curso_nombre || selectedCourse?.jefe_curso?.nombre || "—"}
              </div>
              <div>
                <b>Fechas:</b> {selectedCourse?.fecha_inicio || courseDetail?.fecha_inicio || "—"} →{" "}
                {selectedCourse?.fecha_fin || courseDetail?.fecha_fin || "—"}
              </div>
              <div className="eaen-ap-note">
                Integrado a BD: <code>cursos</code> + <code>curso_participantes</code>.
              </div>
            </div>
          </div>

          {/* Selector */}
          <div className="eaen-ap-card">
            <h3 className="eaen-ap-title">Gestión de Participantes</h3>

            <div className="eaen-ap-toolbar">
              <div className="eaen-ap-group" style={{ marginBottom: 0 }}>
                <label>Buscar cursante (CI / nombre / correo)</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ej. 1234567 o Pérez"
                />
              </div>

              <div className="eaen-ap-saving">
                {saving ? (
                  <span className="eaen-ap-badge">Guardando...</span>
                ) : (
                  <span className="eaen-ap-badge ok">Listo</span>
                )}
              </div>
            </div>

            <div className="eaen-ap-pick">
              {/* Disponibles */}
              <div className="eaen-ap-col">
                <div className="eaen-ap-label">Disponibles (Cursantes activos)</div>
                <select
                  className="eaen-ap-list"
                  multiple
                  value={pickLeft}
                  onChange={(e) =>
                    setPickLeft(Array.from(e.target.selectedOptions).map((o) => o.value))
                  }
                >
                  {available.length === 0 ? (
                    <option value="" disabled>
                      No hay cursantes disponibles para añadir
                    </option>
                  ) : (
                    available.map((u) => (
                      <option key={u.id} value={u.id}>
                        {userLabel(u)}
                      </option>
                    ))
                  )}
                </select>
                <div className="eaen-ap-small">
                  Disponibles: <b>{available.length}</b>
                </div>
              </div>

              {/* Acciones */}
              <div className="eaen-ap-actions">
                <button
                  className="eaen-ap-btn"
                  type="button"
                  onClick={addSelected}
                  disabled={saving || !pickLeft.length}
                >
                  Añadir →
                </button>
                <button
                  className="eaen-ap-btn"
                  type="button"
                  onClick={addAll}
                  disabled={saving || !available.length}
                >
                  Añadir todo ⇉
                </button>

                <div className="eaen-ap-divider" />

                <button
                  className="eaen-ap-btn"
                  type="button"
                  onClick={removeSelected}
                  disabled={saving || !pickRight.length}
                >
                  ← Quitar
                </button>
                <button
                  className="eaen-ap-btn"
                  type="button"
                  onClick={removeAll}
                  disabled={saving || !currentParticipantIds.length}
                >
                  ⇇ Quitar todo
                </button>
              </div>

              {/* En el curso */}
              <div className="eaen-ap-col">
                <div className="eaen-ap-label">En el curso</div>
                <select
                  className="eaen-ap-list"
                  multiple
                  value={pickRight}
                  onChange={(e) =>
                    setPickRight(Array.from(e.target.selectedOptions).map((o) => o.value))
                  }
                >
                  {currentParticipants.length === 0 ? (
                    <option value="" disabled>
                      Aún no hay participantes
                    </option>
                  ) : (
                    currentParticipants.map((u) => (
                      <option key={u.id} value={u.id}>
                        {userLabel(u)}
                      </option>
                    ))
                  )}
                </select>
                <div className="eaen-ap-small">
                  En curso: <b>{currentParticipantIds.length}</b>
                </div>
              </div>
            </div>

            <div className="eaen-ap-footnote">
              <b>Regla:</b> solo se puede añadir participantes con{" "}
              <code>tipo_usuario = Cursante</code> y <code>estado = ACTIVO</code>.
            </div>
          </div>
        </div>
      )}

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
