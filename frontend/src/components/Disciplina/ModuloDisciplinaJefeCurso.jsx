import { useState, useEffect, useCallback } from "react";
import "./ModuloDisciplinaJefeCurso.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function fmtFecha(f) {
  if (!f) return "—";
  const d = new Date(f);
  return isNaN(d) ? f : d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
}

// ══════════════════════════════════════════════════
// MODAL — REGISTRAR MÉRITO / DEMÉRITO
// ══════════════════════════════════════════════════
function ModalRegistrar({ participantes, catalogo, cursoId, registradoPor, onClose, onGuardado }) {
  const [tipo,        setTipo]        = useState("MERITO");
  const [usuarioId,   setUsuarioId]   = useState("");
  const [catalogoId,  setCatalogoId]  = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puntos,      setPuntos]      = useState(1);
  const [fecha,       setFecha]       = useState(new Date().toISOString().slice(0, 10));
  const [observacion, setObservacion] = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const catFiltrado = catalogo.filter(c => c.tipo === tipo);

  // Al elegir del catálogo, auto-llenar descripción y puntos
  const elegirCatalogo = (id) => {
    setCatalogoId(id);
    if (!id) return;
    const item = catalogo.find(c => String(c.id) === String(id));
    if (item) {
      setDescripcion(item.nombre);
      setPuntos(item.puntos);
    }
  };

  const guardar = async () => {
    if (!usuarioId)        return setError("Selecciona un cursante.");
    if (!descripcion.trim()) return setError("La descripción es obligatoria.");
    if (!puntos || puntos <= 0) return setError("Los puntos deben ser mayor a 0.");
    setError(""); setSaving(true);
    try {
      const res = await fetch(`${API}/api/disciplina/registros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_id: cursoId,
          usuario_id: Number(usuarioId),
          catalogo_id: catalogoId ? Number(catalogoId) : null,
          tipo,
          descripcion: descripcion.trim(),
          puntos: Number(puntos),
          fecha,
          registrado_por: registradoPor,
          observacion: observacion.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar");
      onGuardado();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="djc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="djc-modal">
        <div className="djc-modal-header">
          <h3>➕ Registrar Acción Disciplinaria</h3>
          <button className="djc-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Selector MÉRITO / DEMÉRITO */}
        <div className="djc-tipo-toggle">
          <button
            className={`djc-tipo-btn merit ${tipo === "MERITO" ? "active" : ""}`}
            onClick={() => { setTipo("MERITO"); setCatalogoId(""); }}>
            ⭐ Mérito
          </button>
          <button
            className={`djc-tipo-btn demerit ${tipo === "DEMERITO" ? "active" : ""}`}
            onClick={() => { setTipo("DEMERITO"); setCatalogoId(""); }}>
            ⚠️ Demérito
          </button>
        </div>

        <div className="djc-modal-body">
          {/* Cursante */}
          <div className="djc-field">
            <label>Cursante *</label>
            <select value={usuarioId} onChange={e => setUsuarioId(e.target.value)}>
              <option value="">— Seleccionar cursante —</option>
              {participantes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.ap_paterno} {p.ap_materno}, {p.nombre} — CI: {p.ci}
                </option>
              ))}
            </select>
          </div>

          {/* Catálogo */}
          {catFiltrado.length > 0 && (
            <div className="djc-field">
              <label>Usar del catálogo <span style={{ fontWeight: 400, color: "#888" }}>(opcional)</span></label>
              <select value={catalogoId} onChange={e => elegirCatalogo(e.target.value)}>
                <option value="">— Descripción personalizada —</option>
                {catFiltrado.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.codigo}] {c.nombre} — {c.puntos} pts
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Descripción */}
          <div className="djc-field">
            <label>Descripción *</label>
            <input
              type="text"
              placeholder="Ej: Participación destacada en ejercicio..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
          </div>

          {/* Puntos y Fecha en fila */}
          <div className="djc-field-row">
            <div className="djc-field">
              <label>Puntos *</label>
              <input
                type="number" min="0.5" max="50" step="0.5"
                value={puntos}
                onChange={e => setPuntos(e.target.value)}
              />
            </div>
            <div className="djc-field">
              <label>Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
              />
            </div>
          </div>

          {/* Observación */}
          <div className="djc-field">
            <label>Observación <span style={{ fontWeight: 400, color: "#888" }}>(opcional)</span></label>
            <textarea
              rows={2}
              placeholder="Contexto adicional..."
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
            />
          </div>

          {error && <div className="djc-error">{error}</div>}
        </div>

        <div className="djc-modal-footer">
          <button className="djc-btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button
            className={`djc-btn-primary ${tipo === "MERITO" ? "merit" : "demerit"}`}
            onClick={guardar}
            disabled={saving}>
            {saving ? "Guardando..." : tipo === "MERITO" ? "⭐ Registrar Mérito" : "⚠️ Registrar Demérito"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MODAL — HISTORIAL DEL CURSANTE
// ══════════════════════════════════════════════════
function ModalHistorial({ cursante, cursoId, onClose, onEliminado }) {
  const [registros, setRegistros] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filtro,    setFiltro]    = useState("TODOS");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/disciplina/registros?curso_id=${cursoId}&usuario_id=${cursante.id}`
      );
      const data = await res.json();
      setRegistros(Array.isArray(data) ? data : []);
    } catch { setRegistros([]); }
    finally { setLoading(false); }
  }, [cursoId, cursante.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este registro?")) return;
    try {
      await fetch(`${API}/api/disciplina/registros/${id}`, { method: "DELETE" });
      onEliminado();
      cargar();
    } catch {}
  };

  const filtrados = filtro === "TODOS" ? registros : registros.filter(r => r.tipo === filtro);
  const totMeritos   = registros.filter(r => r.tipo === "MERITO").reduce((s, r) => s + Number(r.puntos), 0);
  const totDemeritos = registros.filter(r => r.tipo === "DEMERITO").reduce((s, r) => s + Number(r.puntos), 0);
  const saldo        = totMeritos - totDemeritos;

  return (
    <div className="djc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="djc-modal djc-modal-wide">
        <div className="djc-modal-header">
          <div>
            <h3>📋 Historial — {cursante.ap_paterno} {cursante.ap_materno}, {cursante.nombre}</h3>
            <p style={{ margin: 0, fontSize: 12, color: "#888" }}>CI: {cursante.ci}</p>
          </div>
          <button className="djc-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Mini resumen */}
        <div className="djc-hist-resumen">
          <div className="djc-hist-chip merit">⭐ {totMeritos.toFixed(1)} pts méritos</div>
          <div className="djc-hist-chip demerit">⚠️ {totDemeritos.toFixed(1)} pts deméritos</div>
          <div className={`djc-hist-chip saldo ${saldo >= 0 ? "pos" : "neg"}`}>
            {saldo >= 0 ? "✅" : "❌"} Saldo: {saldo >= 0 ? "+" : ""}{saldo.toFixed(1)} pts
          </div>
        </div>

        {/* Filtro */}
        <div className="djc-hist-tabs">
          {["TODOS", "MERITO", "DEMERITO"].map(t => (
            <button
              key={t}
              className={`djc-hist-tab ${filtro === t ? "active" : ""}`}
              onClick={() => setFiltro(t)}>
              {t === "TODOS" ? "Todos" : t === "MERITO" ? "⭐ Méritos" : "⚠️ Deméritos"}
              <span className="djc-hist-count">
                {t === "TODOS" ? registros.length
                  : registros.filter(r => r.tipo === t).length}
              </span>
            </button>
          ))}
        </div>

        <div className="djc-hist-list">
          {loading ? (
            <div className="djc-loading">Cargando registros...</div>
          ) : filtrados.length === 0 ? (
            <div className="djc-empty-hist">Sin registros{filtro !== "TODOS" ? ` de ${filtro}` : ""}.</div>
          ) : (
            filtrados.map(r => (
              <div key={r.id} className={`djc-hist-row ${r.tipo === "MERITO" ? "merit" : "demerit"}`}>
                <div className="djc-hist-icon">{r.tipo === "MERITO" ? "⭐" : "⚠️"}</div>
                <div className="djc-hist-info">
                  <div className="djc-hist-desc">{r.descripcion}</div>
                  <div className="djc-hist-meta">
                    {r.catalogo_nombre && <span>📂 {r.catalogo_nombre}</span>}
                    <span>📆 {fmtFecha(r.fecha)}</span>
                    {r.observacion && <span>💬 {r.observacion}</span>}
                  </div>
                </div>
                <div className="djc-hist-pts">
                  <span className={`djc-pts-badge ${r.tipo === "MERITO" ? "merit" : "demerit"}`}>
                    {Number(r.puntos).toFixed(1)} pts
                  </span>
                  <button className="djc-btn-del" onClick={() => eliminar(r.id)}>🗑</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="djc-modal-footer">
          <button className="djc-btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════
export default function ModuloDisciplinaJefeCurso({ cursoId, cursoDetalle, session }) {
  const [resumen,        setResumen]        = useState([]);
  const [catalogo,       setCatalogo]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modalRegistro,  setModalRegistro]  = useState(false);
  const [modalHistorial, setModalHistorial] = useState(null);
  const [toast,          setToast]          = useState(null);
  const [busqueda,       setBusqueda]       = useState("");
  const [filtroTipo,     setFiltroTipo]     = useState("TODOS");

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const participantes = cursoDetalle?.participantes || [];

  const cargar = useCallback(async () => {
    if (!cursoId) return;
    setLoading(true);
    try {
      const [resR, catR] = await Promise.all([
        fetch(`${API}/api/disciplina/resumen/${cursoId}`).then(r => r.json()),
        fetch(`${API}/api/disciplina/catalogo`).then(r => r.json()),
      ]);
      setResumen(Array.isArray(resR) ? resR : []);
      setCatalogo(Array.isArray(catR) ? catR : []);
    } catch {
      setResumen([]); setCatalogo([]);
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Merge resumen con datos de participantes (para nombre completo)
  const tabla = resumen.map(r => {
    const part = participantes.find(p => p.id === r.id) || {};
    return { ...r, ...part, id: r.id };
  });

  // Filtros
  const filtrados = tabla.filter(r => {
    const txt = busqueda.toLowerCase();
    const matchBusq = !txt ||
      `${r.ap_paterno} ${r.ap_materno} ${r.nombre}`.toLowerCase().includes(txt) ||
      String(r.ci).includes(txt);
    const matchTipo =
      filtroTipo === "TODOS" ? true :
      filtroTipo === "MERITO" ? r.meritos > 0 :
      filtroTipo === "DEMERITO" ? r.demeritos > 0 : true;
    return matchBusq && matchTipo;
  });

  // Totales globales
  const totalMeritos   = resumen.reduce((s, r) => s + Number(r.meritos || 0), 0);
  const totalDemeritos = resumen.reduce((s, r) => s + Number(r.demeritos || 0), 0);
  const saldoGlobal    = totalMeritos - totalDemeritos;
  const conMerito      = resumen.filter(r => r.meritos > 0).length;
  const conDemerito    = resumen.filter(r => r.demeritos > 0).length;

  if (!cursoId) {
    return (
      <div className="djc-empty-state">
        <span>⚖️</span>
        <p>Selecciona un curso activo para gestionar la disciplina.</p>
      </div>
    );
  }

  return (
    <div className="djc-wrapper">

      {/* ── Encabezado ── */}
      <div className="djc-header">
        <div className="djc-header-left">
          <h2>⚖️ Disciplina</h2>
          <p>Registro de méritos y deméritos por cursante</p>
        </div>
        <button className="djc-btn-nuevo" onClick={() => setModalRegistro(true)}>
          ➕ Registrar
        </button>
      </div>

      {/* ── Tarjetas de resumen global ── */}
      <div className="djc-stats-row">
        <div className="djc-stat-card merit">
          <div className="djc-stat-icon">⭐</div>
          <div>
            <div className="djc-stat-num">{totalMeritos.toFixed(1)}</div>
            <div className="djc-stat-label">Pts. Méritos totales</div>
          </div>
          <div className="djc-stat-sub">{conMerito} cursantes</div>
        </div>
        <div className="djc-stat-card demerit">
          <div className="djc-stat-icon">⚠️</div>
          <div>
            <div className="djc-stat-num">{totalDemeritos.toFixed(1)}</div>
            <div className="djc-stat-label">Pts. Deméritos totales</div>
          </div>
          <div className="djc-stat-sub">{conDemerito} cursantes</div>
        </div>
        <div className={`djc-stat-card saldo ${saldoGlobal >= 0 ? "pos" : "neg"}`}>
          <div className="djc-stat-icon">{saldoGlobal >= 0 ? "✅" : "❌"}</div>
          <div>
            <div className="djc-stat-num">{saldoGlobal >= 0 ? "+" : ""}{saldoGlobal.toFixed(1)}</div>
            <div className="djc-stat-label">Saldo neto del curso</div>
          </div>
          <div className="djc-stat-sub">{resumen.length} participantes</div>
        </div>
      </div>

      {/* ── Barra de búsqueda y filtro ── */}
      <div className="djc-toolbar">
        <input
          className="djc-search"
          type="text"
          placeholder="🔍 Buscar cursante por nombre o CI..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <div className="djc-filter-tabs">
          {["TODOS", "MERITO", "DEMERITO"].map(t => (
            <button
              key={t}
              className={`djc-filter-tab ${filtroTipo === t ? "active" : ""}`}
              onClick={() => setFiltroTipo(t)}>
              {t === "TODOS" ? "Todos" : t === "MERITO" ? "⭐ Con mérito" : "⚠️ Con demérito"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla de cursantes ── */}
      {loading ? (
        <div className="djc-loading-wrap">
          <div className="djc-spinner" />
          <p>Cargando registros...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="djc-empty-state">
          <span>📋</span>
          <p>{busqueda ? "Sin coincidencias para la búsqueda." : "No hay registros de disciplina aún."}</p>
        </div>
      ) : (
        <div className="djc-table-wrap">
          <table className="djc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cursante</th>
                <th>CI</th>
                <th className="djc-th-merit">⭐ Méritos</th>
                <th className="djc-th-demerit">⚠️ Deméritos</th>
                <th>Saldo</th>
                <th>Detalle</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r, i) => {
                const saldo = Number(r.meritos || 0) - Number(r.demeritos || 0);
                return (
                  <tr key={r.id} className={saldo < 0 ? "djc-tr-neg" : ""}>
                    <td className="djc-td-num">{i + 1}</td>
                    <td className="djc-td-nombre">
                      <div className="djc-avatar-nombre">
                        <div className="djc-avatar">
                          {(r.ap_paterno || "?")[0]}{(r.nombre || "?")[0]}
                        </div>
                        <span>{r.ap_paterno} {r.ap_materno}, {r.nombre}</span>
                      </div>
                    </td>
                    <td className="djc-td-ci">{r.ci}</td>
                    <td className="djc-td-merit">
                      {Number(r.meritos || 0) > 0 ? (
                        <span className="djc-badge merit">
                          ⭐ {Number(r.meritos).toFixed(1)} pts
                          {r.cant_meritos > 0 && <em>({r.cant_meritos})</em>}
                        </span>
                      ) : <span className="djc-badge none">—</span>}
                    </td>
                    <td className="djc-td-demerit">
                      {Number(r.demeritos || 0) > 0 ? (
                        <span className="djc-badge demerit">
                          ⚠️ {Number(r.demeritos).toFixed(1)} pts
                          {r.cant_demeritos > 0 && <em>({r.cant_demeritos})</em>}
                        </span>
                      ) : <span className="djc-badge none">—</span>}
                    </td>
                    <td className="djc-td-saldo">
                      <span className={`djc-saldo ${saldo > 0 ? "pos" : saldo < 0 ? "neg" : "zero"}`}>
                        {saldo > 0 ? "+" : ""}{saldo.toFixed(1)}
                      </span>
                    </td>
                    <td className="djc-td-barra">
                      {/* Barra visual proporcional */}
                      <div className="djc-mini-bar">
                        {(r.meritos > 0 || r.demeritos > 0) ? (
                          <>
                            <div
                              className="djc-bar-merit"
                              style={{ width: `${Math.min(100, (r.meritos / Math.max(r.meritos, r.demeritos)) * 100)}%` }}
                            />
                            <div
                              className="djc-bar-demerit"
                              style={{ width: `${Math.min(100, (r.demeritos / Math.max(r.meritos, r.demeritos)) * 100)}%` }}
                            />
                          </>
                        ) : (
                          <div className="djc-bar-empty" />
                        )}
                      </div>
                    </td>
                    <td className="djc-td-actions">
                      <button
                        className="djc-btn-hist"
                        onClick={() => setModalHistorial(r)}
                        title="Ver historial">
                        📋 Historial
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modales ── */}
      {modalRegistro && (
        <ModalRegistrar
          participantes={participantes}
          catalogo={catalogo}
          cursoId={cursoId}
          registradoPor={session?.id}
          onClose={() => setModalRegistro(false)}
          onGuardado={() => { cargar(); showToast("Registro guardado correctamente."); }}
        />
      )}

      {modalHistorial && (
        <ModalHistorial
          cursante={modalHistorial}
          cursoId={cursoId}
          onClose={() => setModalHistorial(null)}
          onEliminado={() => { cargar(); showToast("Registro eliminado."); }}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`djc-toast ${toast.type === "error" ? "error" : ""}`}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}