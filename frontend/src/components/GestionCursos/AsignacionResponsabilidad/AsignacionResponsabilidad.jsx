import { useEffect, useMemo, useState } from "react";
import "../subview.css";
import "./AsignacionResponsabilidad.css";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000/api";

const ROLES = [
  "Encargado de Curso",
  "Personal de Apoyo",
  "Jefe de Curso",
  "Facilitador",
  "Docente",
];

// UI -> Backend
const ROLE_MAP = {
  "Encargado de Curso": "ENCARGADO_CURSO",
  "Personal de Apoyo": "PERSONAL_APOYO",
  "Jefe de Curso": "JEFE_CURSO",
  "Facilitador": "FACILITADOR",
  "Docente": "DOCENTE",
};

// Backend -> UI
const ROLE_LABEL = {
  ENCARGADO_CURSO: "Encargado de Curso",
  PERSONAL_APOYO: "Personal de Apoyo",
  JEFE_CURSO: "Jefe de Curso",
  FACILITADOR: "Facilitador",
  DOCENTE: "Docente",
};

function fullName(u) {
  return `${u.ap_paterno ?? ""} ${u.ap_materno ?? ""} ${u.nombre ?? ""}`
    .replace(/\s+/g, " ")
    .trim();
}

function userLabel(u) {
  const ci = u.ci ? `${u.ci}${u.ex ? "-" + u.ex : ""}` : "S/CI";
  return `${fullName(u)} — ${u.tipo_usuario || "—"} — ${ci}`;
}

async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || "Error en la solicitud";
    throw new Error(msg);
  }
  return data;
}

export default function AsignacionResponsabilidad({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [courseCursantes, setCourseCursantes] = useState([]);

  const [courseId, setCourseId] = useState("");
  const [role, setRole] = useState(ROLES[2]); // Jefe de Curso
  const [q, setQ] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [saving, setSaving] = useState(false);

  // estado responsabilidades del curso seleccionado (desde backend)
  const [respData, setRespData] = useState({
    curso_id: null,
    jefe_curso: null, // {rol:"JEFE_CURSO", ...}
    responsabilidades: [], // rows
  });

  // modal
  const [modal, setModal] = useState({
    open: false,
    type: "success", // success | error
    title: "",
    message: "",
  });

  const openModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const isEncargado = role === "Encargado de Curso";

  // cargar cursos + staff (no cursante activo)
  useEffect(() => {
    (async () => {
      try {
        const cursos = await apiJson(`${API_BASE}/cursos`);
        setCourses(Array.isArray(cursos) ? cursos : []);
        if (Array.isArray(cursos) && cursos.length) setCourseId(String(cursos[0].id));

        const staff = await apiJson(`${API_BASE}/usuarios/jefes-curso`);
        setStaffUsers(Array.isArray(staff) ? staff : []);
      } catch (e) {
        openModal("error", "Error de conexión", e.message);
      }
    })();
  }, []);

  // cargar responsabilidades + cursantes del curso cuando cambie courseId
  useEffect(() => {
    if (!courseId) return;

    (async () => {
      try {
        setSaving(true);

        // 1) responsabilidades
        const data = await apiJson(`${API_BASE}/cursos/${courseId}/responsabilidades`);
        setRespData({
          curso_id: data?.curso_id ?? null,
          jefe_curso: data?.jefe_curso ?? null,
          responsabilidades: Array.isArray(data?.responsabilidades) ? data.responsabilidades : [],
        });

        // 2) participantes/cursantes del curso
        const cursoDetalle = await apiJson(`${API_BASE}/cursos/${courseId}`);
        setCourseCursantes(
          Array.isArray(cursoDetalle?.participantes) ? cursoDetalle.participantes : []
        );
      } catch (e) {
        openModal("error", "No se pudo cargar información", e.message);
      } finally {
        setSaving(false);
      }
    })();
  }, [courseId]);

  // reset selection al cambiar rol o curso (evita ids inválidos)
  useEffect(() => {
    setQ("");
    setSelectedUserId("");
  }, [role, courseId]);

  // curso seleccionado (desde lista cursos)
  const selectedCourse = useMemo(() => {
    return courses.find((c) => String(c.id) === String(courseId)) || null;
  }, [courses, courseId]);

  // lista filtrada dinámica:
  // - Encargado: cursantes ACTIVO inscritos en el curso
  // - Otros: no cursantes ACTIVO (staffUsers)
  const usersFiltered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = isEncargado ? courseCursantes : staffUsers;

    return (base || [])
      .filter((u) => String(u.estado).toUpperCase() === "ACTIVO")
      .filter((u) => {
        if (isEncargado) return String(u.tipo_usuario || "").trim() === "Cursante";
        return String(u.tipo_usuario || "").trim() !== "Cursante";
      })
      .filter((u) => {
        if (!query) return true;
        const blob = `${fullName(u)} ${u.tipo_usuario} ${u.ci}-${u.ex} ${u.correo} ${u.email}`.toLowerCase();
        return blob.includes(query);
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [isEncargado, courseCursantes, staffUsers, q]);

  // set default user (según lista dinámica)
  useEffect(() => {
    if (!selectedUserId && usersFiltered.length) {
      setSelectedUserId(String(usersFiltered[0].id));
    }
  }, [usersFiltered, selectedUserId]);

  // filas planas para tabla (incluye jefe + responsabilidades)
  const flatRows = useMemo(() => {
    const rows = [];

    // jefe (columna cursos.jefe_curso_id)
    if (respData?.jefe_curso?.id) {
      const j = respData.jefe_curso;
      rows.push({
        role_code: "JEFE_CURSO",
        role_label: ROLE_LABEL["JEFE_CURSO"],
        usuario_id: j.id,
        nombre: fullName(j),
        tipo_usuario: j.tipo_usuario,
        ci: j.ci,
        ex: j.ex,
        correo: j.correo || j.email,
        is_jefe: true,
      });
    }

    // otras responsabilidades (tabla curso_responsabilidades)
    for (const r of respData?.responsabilidades || []) {
      const code = String(r.rol || "").toUpperCase();
      rows.push({
        role_code: code,
        role_label: ROLE_LABEL[code] || code,
        usuario_id: r.usuario_id,
        nombre: fullName(r),
        tipo_usuario: r.tipo_usuario,
        ci: r.ci,
        ex: r.ex,
        correo: r.correo || r.email,
        is_jefe: false,
      });
    }

    return rows.sort(
      (a, b) =>
        a.role_label.localeCompare(b.role_label) ||
        (a.nombre || "").localeCompare(b.nombre || "")
    );
  }, [respData]);

  const handleAssign = async () => {
    if (!courseId) return;
    if (!selectedUserId) return openModal("error", "Validación", "Seleccione un usuario.");
    if (!role) return openModal("error", "Validación", "Seleccione un rol.");

    const roleCode = ROLE_MAP[role];
    if (!roleCode) return openModal("error", "Validación", "Rol inválido.");

    const uid = Number(selectedUserId);
    if (!uid) return openModal("error", "Validación", "Usuario inválido.");

    try {
      setSaving(true);

      // JEFE / ENCARGADO -> single
      // MULTI -> enviamos usuarios_ids [uid]
      const body =
        roleCode === "JEFE_CURSO" || roleCode === "ENCARGADO_CURSO"
          ? { rol: roleCode, usuario_id: uid }
          : { rol: roleCode, usuarios_ids: [uid] };

      const resp = await apiJson(`${API_BASE}/cursos/${courseId}/responsabilidades`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      // recargar responsabilidades
      const data = await apiJson(`${API_BASE}/cursos/${courseId}/responsabilidades`);
      setRespData({
        curso_id: data?.curso_id ?? null,
        jefe_curso: data?.jefe_curso ?? null,
        responsabilidades: Array.isArray(data?.responsabilidades) ? data.responsabilidades : [],
      });

      // refrescar cursos si cambió jefe
      if (roleCode === "JEFE_CURSO") {
        const cursos = await apiJson(`${API_BASE}/cursos`);
        setCourses(Array.isArray(cursos) ? cursos : []);
      }

      openModal("success", "Asignación exitosa", resp?.message || "Responsabilidad asignada.");
    } catch (e) {
      openModal("error", "No se pudo asignar", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (roleCode, userId) => {
    if (!courseId) return;

    try {
      setSaving(true);

      // JEFE -> se remueve solo con rol
      const body =
        roleCode === "JEFE_CURSO"
          ? { rol: "JEFE_CURSO" }
          : { rol: roleCode, usuarios_ids: [Number(userId)] };

      const resp = await apiJson(`${API_BASE}/cursos/${courseId}/responsabilidades`, {
        method: "DELETE",
        body: JSON.stringify(body),
      });

      // recargar responsabilidades
      const data = await apiJson(`${API_BASE}/cursos/${courseId}/responsabilidades`);
      setRespData({
        curso_id: data?.curso_id ?? null,
        jefe_curso: data?.jefe_curso ?? null,
        responsabilidades: Array.isArray(data?.responsabilidades) ? data.responsabilidades : [],
      });

      // refrescar cursos si removió jefe
      if (roleCode === "JEFE_CURSO") {
        const cursos = await apiJson(`${API_BASE}/cursos`);
        setCourses(Array.isArray(cursos) ? cursos : []);
      }

      openModal("success", "Cambio aplicado", resp?.message || "Responsabilidad eliminada.");
    } catch (e) {
      openModal("error", "No se pudo quitar", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="eaen-subview">
      <div className="eaen-subview-head">
        <div>
          <h2>Asignación de Responsabilidad</h2>
          <p>
            Seleccione el curso y asigne roles{" "}
            {isEncargado ? "a cursantes inscritos" : "a personal no cursante"} (backend MySQL).
          </p>
        </div>
        <button className="eaen-secondary-btn" onClick={onBack}>
          ← Volver
        </button>
      </div>

      {!courses.length ? (
        <div className="eaen-subview-card">
          <p>
            No existen cursos todavía. Primero cree un curso en <b>Crear Curso</b>.
          </p>
        </div>
      ) : (
        <div className="eaen-ar-grid">
          {/* Panel curso + asignación */}
          <div className="eaen-ar-card">
            <h3 className="eaen-ar-title">Curso y Asignación</h3>

            <div className="eaen-ar-row">
              <div className="eaen-ar-group">
                <label>Curso</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="eaen-ar-badges">
                {saving ? (
                  <span className="eaen-ar-badge">Procesando...</span>
                ) : (
                  <span className="eaen-ar-badge ok">Listo</span>
                )}
              </div>
            </div>

            <div className="eaen-ar-courseinfo">
              <div>
                <b>Jefe de Curso (del curso):</b>{" "}
                {selectedCourse
                  ? `${selectedCourse.jefe_ap_paterno || ""} ${selectedCourse.jefe_ap_materno || ""} ${
                      selectedCourse.jefe_nombre || ""
                    }`
                      .replace(/\s+/g, " ")
                      .trim() || "—"
                  : "—"}
              </div>
              <div>
                <b>Fechas:</b> {selectedCourse?.fecha_inicio || "—"} →{" "}
                {selectedCourse?.fecha_fin || "—"}
              </div>
              <div className="eaen-ar-note">
                Se guarda en MySQL: <code>cursos</code> y <code>curso_responsabilidades</code>.
              </div>
            </div>

            <div className="eaen-ar-assignbox">
              <div className="eaen-ar-group">
                <label>Rol a asignar</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="eaen-ar-group">
                <label>{isEncargado ? "Buscar cursante del curso" : "Buscar personal (no cursante)"}</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Nombre, CI, tipo_usuario, correo..."
                />
              </div>

              <div className="eaen-ar-group">
                <label>Seleccionar usuario</label>
                <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                  {usersFiltered.length === 0 ? (
                    <option value="">
                      {isEncargado
                        ? "No hay cursantes activos inscritos en este curso"
                        : "No hay personal disponible (no cursante activo)"}
                    </option>
                  ) : (
                    usersFiltered.map((u) => (
                      <option key={u.id} value={u.id}>
                        {userLabel(u)}
                      </option>
                    ))
                  )}
                </select>

                <small className="eaen-ar-help">
                  {isEncargado ? (
                    <>
                      Solo cursantes <code>ACTIVO</code> inscritos en el curso.
                    </>
                  ) : (
                    <>
                      Solo usuarios con <code>estado = ACTIVO</code> y <code>tipo_usuario != Cursante</code>.
                    </>
                  )}
                </small>
              </div>

              <button
                type="button"
                className="eaen-primary-btn"
                onClick={handleAssign}
                disabled={!courseId || !selectedUserId || saving || usersFiltered.length === 0}
              >
                Asignar responsabilidad
              </button>
            </div>
          </div>

          {/* Tabla asignaciones */}
          <div className="eaen-ar-card">
            <h3 className="eaen-ar-title">Responsables asignados</h3>

            {flatRows.length === 0 ? (
              <div className="eaen-ar-empty">Aún no hay responsables asignados a este curso.</div>
            ) : (
              <div className="eaen-ar-tablewrap">
                <table className="eaen-ar-table">
                  <thead>
                    <tr>
                      <th>Rol</th>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>CI</th>
                      <th>Correo</th>
                      <th style={{ width: 120 }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatRows.map((row) => (
                      <tr key={`${row.role_code}-${row.usuario_id}`}>
                        <td>
                          <span className="eaen-ar-pill">{row.role_label}</span>
                        </td>
                        <td>{row.nombre || "—"}</td>
                        <td>{row.tipo_usuario || "—"}</td>
                        <td>
                          {row.ci}
                          {row.ex ? `-${row.ex}` : ""}
                        </td>
                        <td className="eaen-ar-email">{row.correo || "—"}</td>
                        <td>
                          <button
                            type="button"
                            className="eaen-ar-danger"
                            onClick={() => handleRemove(row.role_code, row.usuario_id)}
                            disabled={saving}
                          >
                            Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="eaen-ar-foot">
              <b>Roles:</b> Encargado de Curso, Personal de Apoyo, Jefe de Curso, Facilitador, Docente.
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO / ERROR */}
      {modal.open && (
        <div className="eaen-modal-backdrop" onClick={closeModal} role="presentation">
          <div
            className="eaen-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={`eaen-modal-icon ${modal.type}`}>
              {modal.type === "success" ? "✓" : "✕"}
            </div>

            <div className="eaen-modal-body">
              <h3 className="eaen-modal-title">{modal.title}</h3>
              <p className="eaen-modal-text">{modal.message}</p>

              <div className="eaen-modal-actions">
                <button className="eaen-primary-btn" type="button" onClick={closeModal}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
