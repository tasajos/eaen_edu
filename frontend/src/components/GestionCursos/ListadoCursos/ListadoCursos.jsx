import { useEffect, useMemo, useState } from "react";
import "../subview.css";
import "./ListadoCursos.css";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000/api";

function fullNameFromParts(ap, am, nom) {
  return `${ap ?? ""} ${am ?? ""} ${nom ?? ""}`.replace(/\s+/g, " ").trim();
}

async function apiJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Error en la solicitud");
  return data;
}

// Encargado desde el LISTADO (viene aplanado en /api/cursos)
function encargadoLabelFromListRow(c) {
  if (!c?.encargado_id) return "—";
  const name = fullNameFromParts(c.encargado_ap_paterno, c.encargado_ap_materno, c.encargado_nombre);
  const ci = c.encargado_ci ? `${c.encargado_ci}${c.encargado_ex ? "-" + c.encargado_ex : ""}` : "";
  return `${name}${ci ? ` — ${ci}` : ""}`;
}

// Jefe desde el LISTADO (viene aplanado en /api/cursos)
function jefeLabelFromListRow(c) {
  if (!c?.jefe_curso_id) return "—";
  const name = fullNameFromParts(c.jefe_ap_paterno, c.jefe_ap_materno, c.jefe_nombre);
  const ci = c.jefe_ci ? `${c.jefe_ci}${c.jefe_ex ? "-" + c.jefe_ex : ""}` : "";
  return `${name}${ci ? ` — ${ci}` : ""}`;
}

export default function ListadoCursos({ onBack }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("nombre"); // nombre | fecha
  const [sortDir, setSortDir] = useState("asc"); // asc | desc

  const [selectedId, setSelectedId] = useState("");
  const [selectedDetail, setSelectedDetail] = useState(null); // detalle /api/cursos/:id
  const [selectedResp, setSelectedResp] = useState(null); // /responsabilidades

  // modal success/error
  const [modal, setModal] = useState({ open: false, type: "success", title: "", message: "" });
  const openModal = (type, title, message) => setModal({ open: true, type, title, message });
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  // ✅ modal participantes
  const [participantsModal, setParticipantsModal] = useState(false);

  // 1) cargar LISTADO desde backend
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiJson(`${API_BASE}/cursos`);
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        openModal("error", "No se pudo cargar cursos", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) cargar DETALLE + RESPONSABILIDADES cuando se selecciona un curso
  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      setSelectedResp(null);
      return;
    }

    (async () => {
      try {
        setLoading(true);

        // detalle (incluye participantes)
        const detalle = await apiJson(`${API_BASE}/cursos/${selectedId}`);
        setSelectedDetail(detalle || null);

        // responsabilidades (incluye jefe_curso + responsabilidades)
        const resp = await apiJson(`${API_BASE}/cursos/${selectedId}/responsabilidades`);
        setSelectedResp(resp || null);
      } catch (e) {
        openModal("error", "No se pudo cargar detalle", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedId]);

  // filas para la tabla (desde /api/cursos)
  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const dir = sortDir === "asc" ? 1 : -1;

    const base = (courses || []).map((c) => {
      const fechaLabel = `${c?.fecha_inicio || "—"} → ${c?.fecha_fin || "—"}`;
      return {
        id: String(c.id),
        nombre: c.nombre || "—",
        fecha_inicio: c.fecha_inicio || "",
        fecha_fin: c.fecha_fin || "",
        fechaLabel,
        jefe: jefeLabelFromListRow(c),
        encargado: encargadoLabelFromListRow(c),
        participantes: Number(c.participantes_total ?? 0),
        raw: c,
      };
    });

    const filtered = base.filter((r) => {
      if (!query) return true;
      const blob = `${r.nombre} ${r.jefe} ${r.encargado} ${r.fechaLabel}`.toLowerCase();
      return blob.includes(query);
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "fecha") {
        return (a.fecha_inicio || "").localeCompare(b.fecha_inicio || "") * dir;
      }
      return (a.nombre || "").localeCompare(b.nombre || "") * dir;
    });

    return sorted;
  }, [courses, q, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  // helpers del detalle seleccionado
  const selectedListRow = useMemo(() => {
    return courses.find((c) => String(c.id) === String(selectedId)) || null;
  }, [courses, selectedId]);

  const participantesList = useMemo(() => {
    return Array.isArray(selectedDetail?.participantes) ? selectedDetail.participantes : [];
  }, [selectedDetail]);

  const participantesCount = useMemo(() => participantesList.length, [participantesList]);

  const respCount = useMemo(() => {
    const arr = Array.isArray(selectedResp?.responsabilidades) ? selectedResp.responsabilidades : [];
    return arr.length + (selectedResp?.jefe_curso?.id ? 1 : 0);
  }, [selectedResp]);

  const openParticipantsModal = () => {
    if (!participantesList.length) {
      openModal("error", "Sin participantes", "Este curso no tiene participantes registrados.");
      return;
    }
    setParticipantsModal(true);
  };
  const closeParticipantsModal = () => setParticipantsModal(false);

  return (
    <section className="eaen-subview">
      <div className="eaen-subview-head">
        <div>
          <h2>Listado de Cursos</h2>
          <p>Tabla institucional con conteo de participantes y responsables (desde backend).</p>
        </div>
        <button className="eaen-secondary-btn" onClick={onBack}>
          ← Volver
        </button>
      </div>

      {loading && (
        <div className="eaen-subview-card">
          <p>Cargando...</p>
        </div>
      )}

      {!loading && !courses.length ? (
        <div className="eaen-subview-card">
          <p>No hay cursos registrados todavía. Cree uno desde <b>Crear Curso</b>.</p>
        </div>
      ) : !loading ? (
        <div className="eaen-lc-card">
          <div className="eaen-lc-toolbar">
            <div className="eaen-lc-group">
              <label>Buscar</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre, jefe, encargado, fecha..."
              />
            </div>

            <div className="eaen-lc-stats">
              <span className="eaen-lc-badge">
                Cursos: <b>{rows.length}</b>
              </span>
            </div>
          </div>

          <div className="eaen-lc-tablewrap">
            <table className="eaen-lc-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort("nombre")} className="sortable">
                    Nombre del curso{" "}
                    {sortKey === "nombre" ? (
                      <span className="sort-ind">{sortDir === "asc" ? "▲" : "▼"}</span>
                    ) : null}
                  </th>
                  <th onClick={() => toggleSort("fecha")} className="sortable">
                    Fecha{" "}
                    {sortKey === "fecha" ? (
                      <span className="sort-ind">{sortDir === "asc" ? "▲" : "▼"}</span>
                    ) : null}
                  </th>
                  <th>Jefe de curso</th>
                  <th>Encargado de curso</th>
                  <th style={{ width: 140, textAlign: "center" }}>Participantes</th>
                  <th style={{ width: 120 }}>Acción</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={selectedId === r.id ? "active" : ""}>
                    <td>
                      <div className="eaen-lc-title">{r.nombre}</div>
                    </td>
                    <td>{r.fechaLabel}</td>
                    <td>{r.jefe}</td>
                    <td>{r.encargado}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="eaen-lc-pill">{r.participantes}</span>
                    </td>
                    <td>
                      <button
                        className="eaen-lc-btn"
                        onClick={() => setSelectedId((cur) => (cur === r.id ? "" : r.id))}
                      >
                        {selectedId === r.id ? "Ocultar" : "Ver"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detalle inline */}
          {selectedId && (selectedDetail || selectedListRow) ? (
            <div className="eaen-lc-detail">
              <div className="eaen-lc-detail-head">
                <h3>Detalle del curso</h3>
                <button className="eaen-lc-btn ghost" onClick={() => setSelectedId("")}>
                  Cerrar
                </button>
              </div>

              <div className="eaen-lc-detail-grid">
                <div className="eaen-lc-kv">
                  <span>Nombre</span>
                  <b>{selectedDetail?.nombre || selectedListRow?.nombre || "—"}</b>
                </div>

                <div className="eaen-lc-kv">
                  <span>Fechas</span>
                  <b>
                    {(selectedDetail?.fecha_inicio || selectedListRow?.fecha_inicio || "—")} →{" "}
                    {(selectedDetail?.fecha_fin || selectedListRow?.fecha_fin || "—")}
                  </b>
                </div>

                <div className="eaen-lc-kv">
                  <span>Jefe de curso</span>
                  <b>{selectedListRow ? jefeLabelFromListRow(selectedListRow) : "—"}</b>
                </div>

                <div className="eaen-lc-kv">
                  <span>Encargado de curso</span>
                  <b>{selectedListRow ? encargadoLabelFromListRow(selectedListRow) : "—"}</b>
                </div>

                {/* ✅ Participantes clickeable */}
                <div
                  className="eaen-lc-kv eaen-lc-kv-click"
                  role="button"
                  tabIndex={0}
                  onClick={openParticipantsModal}
                  onKeyDown={(e) => e.key === "Enter" && openParticipantsModal()}
                  title="Ver lista de participantes"
                >
                  <span>Participantes</span>
                  <b style={{ textDecoration: "underline" }}>{participantesCount}</b>
                </div>

                <div className="eaen-lc-kv">
                  <span>Responsabilidades</span>
                  <b>{respCount}</b>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ✅ MODAL PARTICIPANTES (mejorado) */}
{participantsModal && (
  <div className="eaen-modal-backdrop" onClick={closeParticipantsModal} role="presentation">
    <div
      className="eaen-modal eaen-pm-modal"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Participantes del curso"
    >
      <div className="eaen-pm-head">
        <div>
          <h3 className="eaen-pm-title">Participantes del curso</h3>
          <div className="eaen-pm-sub">
            Total: <b>{participantesList.length}</b>
          </div>
        </div>

        <button className="eaen-secondary-btn eaen-pm-close" type="button" onClick={closeParticipantsModal}>
          Cerrar
        </button>
      </div>

      <div className="eaen-pm-body">
        {participantesList.length === 0 ? (
          <div className="eaen-pm-empty">Este curso no tiene participantes registrados.</div>
        ) : (
          <div className="eaen-pm-tablewrap">
            <table className="eaen-pm-table">
              <thead>
                <tr>
                  <th>Nombre completo</th>
                  <th style={{ width: 140 }}>CI</th>
                  <th>Correo</th>
                  <th style={{ width: 120 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {participantesList
                  .slice()
                  .sort((a, b) => {
                    const na = `${a.ap_paterno ?? ""} ${a.ap_materno ?? ""} ${a.nombre ?? ""}`.trim();
                    const nb = `${b.ap_paterno ?? ""} ${b.ap_materno ?? ""} ${b.nombre ?? ""}`.trim();
                    return na.localeCompare(nb);
                  })
                  .map((p) => (
                    <tr key={p.id}>
                      <td className="eaen-pm-name">
                        {`${p.ap_paterno ?? ""} ${p.ap_materno ?? ""} ${p.nombre ?? ""}`
                          .replace(/\s+/g, " ")
                          .trim() || "—"}
                      </td>
                      <td className="eaen-pm-ci">
                        {p.ci ? `${p.ci}${p.ex ? "-" + p.ex : ""}` : "—"}
                      </td>
                      <td className="eaen-pm-email">{p.correo || p.email || "—"}</td>
                      <td>
                        <span className={`eaen-pm-status ${String(p.estado || "").toUpperCase() === "ACTIVO" ? "ok" : "off"}`}>
                          {p.estado || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="eaen-pm-foot">
        <button className="eaen-primary-btn" type="button" onClick={closeParticipantsModal}>
          Entendido
        </button>
      </div>
    </div>
  </div>
)}
    </section>
  );
}
