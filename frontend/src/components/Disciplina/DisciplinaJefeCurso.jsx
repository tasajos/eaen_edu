import { useState, useEffect, useCallback } from "react";
import "./DisciplinaJefeCurso.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const hoy = () => new Date().toISOString().split("T")[0];

function fmtFecha(f) {
  if (!f) return "—";
  const d = new Date(f);
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Modal Éxito ────────────────────────────────────────────────────────────
function ModalExito({ tipo, participante, puntos, descripcion, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const esMerito = tipo === "MERITO";

  return (
    <div className="disc-overlay disc-overlay-exito" onClick={onClose}>
      <div className={`disc-modal-exito ${esMerito ? "merito" : "demerito"}`}>
        <div className="disc-exito-icono">{esMerito ? "🏅" : "⚠️"}</div>
        <div className="disc-exito-titulo">
          {esMerito ? "¡Mérito registrado!" : "¡Demérito registrado!"}
        </div>
        <div className="disc-exito-participante">{participante}</div>
        <div className="disc-exito-detalle">
          <span className={`disc-exito-pts ${esMerito ? "merito" : "demerito"}`}>
            {esMerito ? "+" : "-"}{Number(puntos).toFixed(1)} pts
          </span>
          <span className="disc-exito-desc">{descripcion}</span>
        </div>
        <div className="disc-exito-bar">
          <div className={`disc-exito-progress ${esMerito ? "merito" : "demerito"}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Modal Registrar Mérito/Demérito ───────────────────────────────────────
function ModalRegistro({ cursoId, participantes, catalogo, registradoPor, preselect, tipoInicial, onClose, onGuardado }) {
  const [tipo, setTipo]             = useState(tipoInicial || "MERITO");
  const [usuarioId, setUsuarioId]   = useState(preselect ? preselect.usuario_id : "");
  const [catalogoId, setCatalogoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puntos, setPuntos]         = useState(1);
  const [fecha, setFecha]           = useState(hoy());
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState("");

  const catalogoFiltrado = catalogo.filter(c => c.tipo === tipo);

  const seleccionarCatalogo = (item) => {
    setCatalogoId(Number(item.id));
    setDescripcion(item.nombre);
    setPuntos(Number(item.puntos));
  };

  const guardar = async () => {
    if (!usuarioId) return setError("Selecciona un participante.");
    if (!descripcion.trim()) return setError("Ingresa una descripción.");
    if (!puntos || puntos <= 0) return setError("Los puntos deben ser mayores a 0.");
    setError("");
    setGuardando(true);
    try {
      const r = await fetch(`${API}/api/disciplina/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_id:       Number(cursoId),
          usuario_id:     Number(usuarioId),
          catalogo_id:    catalogoId ? Number(catalogoId) : null,
          tipo,
          descripcion:    descripcion.trim(),
          puntos:         Number(puntos),
          fecha,
          registrado_por: Number(registradoPor),
          observacion:    observacion.trim() || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Error al guardar");

      const p = participantes.find(x => x.usuario_id === Number(usuarioId));
      const nombreP = p
        ? `${p.grado ? p.grado + " " : ""}${p.ap_paterno} ${p.ap_materno}, ${p.nombre}`
        : "Participante";

      onGuardado({ tipo, puntos: Number(puntos), descripcion: descripcion.trim(), participante: nombreP });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="disc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="disc-modal">
        <div className="disc-modal-header">
          <h3>➕ Registrar Mérito / Demérito</h3>
          <button className="disc-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="disc-tipo-selector">
          <button
            className={`disc-tipo-btn merito ${tipo === "MERITO" ? "active" : ""}`}
            onClick={() => { setTipo("MERITO"); setCatalogoId(""); setDescripcion(""); setPuntos(1); }}
          >🏅 MÉRITO</button>
          <button
            className={`disc-tipo-btn demerito ${tipo === "DEMERITO" ? "active" : ""}`}
            onClick={() => { setTipo("DEMERITO"); setCatalogoId(""); setDescripcion(""); setPuntos(1); }}
          >⚠️ DEMÉRITO</button>
        </div>

        <div className="disc-modal-body">
          <div className="disc-field">
            <label>Participante *</label>
            <select value={usuarioId} onChange={e => setUsuarioId(Number(e.target.value))}>
              <option value="">— Seleccionar —</option>
              {participantes.map(p => (
                <option key={p.usuario_id} value={p.usuario_id}>
                  {p.grado ? `${p.grado} ` : ""}{p.ap_paterno} {p.ap_materno}, {p.nombre} — CI {p.ci}
                </option>
              ))}
            </select>
          </div>

          {catalogoFiltrado.length > 0 && (
            <div className="disc-field">
              <label>Catálogo predefinido <span className="disc-opcional">(opcional)</span></label>
              <div className="disc-catalogo-grid">
                {catalogoFiltrado.map(item => (
                  <button
                    key={item.id}
                    className={`disc-catalogo-item ${catalogoId === Number(item.id) ? "selected" : ""} ${tipo === "MERITO" ? "merito" : "demerito"}`}
                    onClick={() => seleccionarCatalogo(item)}
                  >
                    <span className="disc-cat-codigo">{item.codigo}</span>
                    <span className="disc-cat-nombre">{item.nombre}</span>
                    <span className="disc-cat-pts">{tipo === "MERITO" ? "+" : "-"}{item.puntos} pts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="disc-field">
            <label>Descripción del hecho *</label>
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Describe el motivo del registro..."
              maxLength={500}
            />
          </div>

          <div className="disc-row2">
            <div className="disc-field">
              <label>Puntos *</label>
              <input type="number" min="0.5" max="10" step="0.5" value={puntos}
                onChange={e => setPuntos(Number(e.target.value))} />
            </div>
            <div className="disc-field">
              <label>Fecha *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
          </div>

          <div className="disc-field">
            <label>Observación <span className="disc-opcional">(opcional)</span></label>
            <textarea value={observacion} onChange={e => setObservacion(e.target.value)}
              rows={2} placeholder="Notas adicionales..." maxLength={500} />
          </div>

          {error && <div className="disc-error-msg">⚠️ {error}</div>}
        </div>

        <div className="disc-modal-footer">
          <button className="disc-btn-cancel" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button
            className={`disc-btn-guardar ${tipo === "MERITO" ? "merito" : "demerito"}`}
            onClick={guardar}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : tipo === "MERITO" ? "✅ Registrar Mérito" : "⚠️ Registrar Demérito"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Historial ────────────────────────────────────────────────────────
function ModalHistorial({ cursoId, participante, onClose, onEliminado }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading]     = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/disciplina/historial/${cursoId}/${participante.usuario_id}`);
      const data = await r.json();
      if (Array.isArray(data)) setHistorial(data);
    } catch {}
    setLoading(false);
  }, [cursoId, participante.usuario_id]);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    await fetch(`${API}/api/disciplina/registro/${id}`, { method: "DELETE" });
    onEliminado();
    cargar();
  };

  const meritos  = historial.filter(h => h.tipo === "MERITO");
  const demeritos = historial.filter(h => h.tipo === "DEMERITO");
  const sumMer   = meritos.reduce((s, h) => s + Number(h.puntos), 0);
  const sumDem   = demeritos.reduce((s, h) => s + Number(h.puntos), 0);

  return (
    <div className="disc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="disc-modal disc-modal-lg">
        <div className="disc-modal-header">
          <div>
            <h3>📋 Historial de Disciplina</h3>
            <p className="disc-modal-sub">
              {participante.grado ? `${participante.grado} ` : ""}
              {participante.ap_paterno} {participante.ap_materno}, {participante.nombre}
            </p>
          </div>
          <button className="disc-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="disc-modal-body">
          <div className="disc-hist-resumen">
            <div className="disc-hist-stat merito">
              <span className="disc-hist-stat-num">+{sumMer.toFixed(1)}</span>
              <span className="disc-hist-stat-lbl">pts méritos ({meritos.length})</span>
            </div>
            <div className="disc-hist-stat saldo" style={{ color: (sumMer - sumDem) >= 0 ? "#2e7d32" : "#c62828" }}>
              <span className="disc-hist-stat-num">{(sumMer - sumDem) >= 0 ? "+" : ""}{(sumMer - sumDem).toFixed(1)}</span>
              <span className="disc-hist-stat-lbl">saldo neto</span>
            </div>
            <div className="disc-hist-stat demerito">
              <span className="disc-hist-stat-num">-{sumDem.toFixed(1)}</span>
              <span className="disc-hist-stat-lbl">pts deméritos ({demeritos.length})</span>
            </div>
          </div>

          {loading ? (
            <div className="disc-spinner"><div className="disc-ring" /></div>
          ) : historial.length === 0 ? (
            <div className="disc-empty"><span>📭</span><p>Sin registros de disciplina</p></div>
          ) : (
            <div className="disc-hist-list">
              {historial.map(h => (
                <div key={h.id} className={`disc-hist-item ${h.tipo === "MERITO" ? "merito" : "demerito"}`}>
                  <div className="disc-hist-badge">
                    {h.tipo === "MERITO" ? "🏅" : "⚠️"}
                    <span>{h.tipo === "MERITO" ? `+${h.puntos}` : `-${h.puntos}`} pts</span>
                  </div>
                  <div className="disc-hist-content">
                    <div className="disc-hist-desc">{h.descripcion}</div>
                    <div className="disc-hist-meta">
                      {h.codigo && <span className="disc-hist-codigo">{h.codigo}</span>}
                      <span>📅 {fmtFecha(h.fecha)}</span>
                      <span>👤 {h.registrado_por_nombre}</span>
                    </div>
                    {h.observacion && <div className="disc-hist-obs">💬 {h.observacion}</div>}
                  </div>
                  <button className="disc-hist-del" onClick={() => eliminar(h.id)} title="Eliminar">🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="disc-modal-footer">
          <button className="disc-btn-cancel" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────
export default function DisciplinaJefeCurso({ session, cursoId }) {
  const [resumen, setResumen]             = useState([]);
  const [catalogo, setCatalogo]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [busqueda, setBusqueda]           = useState("");
  const [filtroTipo, setFiltroTipo]       = useState("TODOS");
  const [modalRegistro, setModalRegistro] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(null);
  const [exito, setExito]                 = useState(null);

  const cargar = useCallback(async () => {
    if (!cursoId) return;
    setLoading(true);
    try {
      const [rRes, rCat] = await Promise.all([
        fetch(`${API}/api/disciplina/resumen/${cursoId}`).then(r => r.json()),
        fetch(`${API}/api/disciplina/catalogo`).then(r => r.json()),
      ]);
      if (Array.isArray(rRes)) setResumen(rRes);
      if (Array.isArray(rCat)) setCatalogo(rCat);
    } catch {}
    setLoading(false);
  }, [cursoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const totalMeritos   = resumen.reduce((s, p) => s + Number(p.meritos), 0);
  const totalDemeritos = resumen.reduce((s, p) => s + Number(p.demeritos), 0);
  const conMeritos     = resumen.filter(p => p.cant_meritos > 0).length;
  const conDemeritos   = resumen.filter(p => p.cant_demeritos > 0).length;

  const resumenFiltrado = resumen.filter(p => {
    const nom = `${p.ap_paterno} ${p.ap_materno} ${p.nombre} ${p.ci}`.toLowerCase();
    if (busqueda && !nom.includes(busqueda.toLowerCase())) return false;
    if (filtroTipo === "MERITOS"   && p.cant_meritos === 0)   return false;
    if (filtroTipo === "DEMERITOS" && p.cant_demeritos === 0) return false;
    if (filtroTipo === "LIMPIO"    && (p.cant_meritos > 0 || p.cant_demeritos > 0)) return false;
    return true;
  });

  const handleGuardado = (info) => {
    cargar();
    setExito(info);
  };

  if (!cursoId) {
    return (
      <div className="disc-wrap">
        <div className="disc-empty"><span>⚖️</span><p>Selecciona un curso activo.</p></div>
      </div>
    );
  }

  return (
    <div className="disc-wrap">
      <div className="disc-topbar">
        <div>
          <h2 className="disc-title">⚖️ Módulo de Disciplina</h2>
          <p className="disc-subtitle">Registro de méritos y deméritos por cursante — Curso {cursoId}</p>
        </div>
        <button className="disc-btn-primary" onClick={() => setModalRegistro(true)}>
          ➕ Registrar Mérito / Demérito
        </button>
      </div>

      <div className="disc-stats-row">
        <div className="disc-stat-card merito">
          <span className="disc-stat-num">+{totalMeritos.toFixed(1)}</span>
          <span className="disc-stat-lbl">pts méritos totales</span>
          <span className="disc-stat-sub">{conMeritos} cursante{conMeritos !== 1 ? "s" : ""}</span>
        </div>
        <div className="disc-stat-card neutral">
          <span className="disc-stat-num">{resumen.length}</span>
          <span className="disc-stat-lbl">cursantes</span>
          <span className="disc-stat-sub">en este curso</span>
        </div>
        <div className="disc-stat-card demerito">
          <span className="disc-stat-num">-{totalDemeritos.toFixed(1)}</span>
          <span className="disc-stat-lbl">pts deméritos totales</span>
          <span className="disc-stat-sub">{conDemeritos} cursante{conDemeritos !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="disc-filtros">
        <input
          className="disc-search"
          type="text"
          placeholder="🔍 Buscar cursante..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <div className="disc-filtro-btns">
          {["TODOS", "MERITOS", "DEMERITOS", "LIMPIO"].map(f => (
            <button
              key={f}
              className={`disc-filtro-btn ${filtroTipo === f ? "active" : ""}`}
              onClick={() => setFiltroTipo(f)}
            >
              {f === "TODOS" ? "Todos" : f === "MERITOS" ? "🏅 Con méritos" : f === "DEMERITOS" ? "⚠️ Con deméritos" : "✅ Sin registros"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="disc-spinner"><div className="disc-ring" /></div>
      ) : resumenFiltrado.length === 0 ? (
        <div className="disc-empty">
          <span>📭</span>
          <p>{busqueda || filtroTipo !== "TODOS" ? "Sin resultados para el filtro." : "No hay cursantes en este curso."}</p>
        </div>
      ) : (
        <div className="disc-table-wrap">
          <table className="disc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cursante</th>
                <th>CI</th>
                <th className="disc-th-center merito-col">🏅 Méritos</th>
                <th className="disc-th-center demerito-col">⚠️ Deméritos</th>
                <th className="disc-th-center">Saldo</th>
                <th className="disc-th-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resumenFiltrado.map((p, idx) => {
                const saldo = Number(p.saldo);
                return (
                  <tr key={p.usuario_id} className={idx % 2 === 0 ? "disc-tr-par" : "disc-tr-impar"}>
                    <td className="disc-td-num">{idx + 1}</td>
                    <td>
                      <div className="disc-td-nombre">
                        {p.grado && <span className="disc-grado">{p.grado}</span>}
                        <span>{p.ap_paterno} {p.ap_materno}, {p.nombre}</span>
                      </div>
                    </td>
                    <td className="disc-td-ci">{p.ci}</td>
                    <td className="disc-td-center">
                      {Number(p.cant_meritos) > 0
                        ? <span className="disc-badge merito">+{Number(p.meritos).toFixed(1)} <small>({p.cant_meritos})</small></span>
                        : <span className="disc-badge none">—</span>}
                    </td>
                    <td className="disc-td-center">
                      {Number(p.cant_demeritos) > 0
                        ? <span className="disc-badge demerito">-{Number(p.demeritos).toFixed(1)} <small>({p.cant_demeritos})</small></span>
                        : <span className="disc-badge none">—</span>}
                    </td>
                    <td className="disc-td-center">
                      <span className={`disc-saldo ${saldo > 0 ? "positivo" : saldo < 0 ? "negativo" : "neutro"}`}>
                        {saldo > 0 ? "+" : ""}{saldo.toFixed(1)}
                      </span>
                    </td>
                    <td className="disc-td-center">
                      <div className="disc-acciones">
                        <button className="disc-action-btn merito" title="Registrar mérito"
                          onClick={() => setModalRegistro({ preselect: p, tipo: "MERITO" })}>🏅</button>
                        <button className="disc-action-btn demerito" title="Registrar demérito"
                          onClick={() => setModalRegistro({ preselect: p, tipo: "DEMERITO" })}>⚠️</button>
                        <button className="disc-action-btn historial" title="Ver historial"
                          onClick={() => setModalHistorial(p)}>📋</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalRegistro && (
        <ModalRegistro
          cursoId={cursoId}
          participantes={resumen}
          catalogo={catalogo}
          registradoPor={session?.id}
          preselect={modalRegistro?.preselect || null}
          tipoInicial={modalRegistro?.tipo || "MERITO"}
          onClose={() => setModalRegistro(false)}
          onGuardado={handleGuardado}
        />
      )}

      {modalHistorial && (
        <ModalHistorial
          cursoId={cursoId}
          participante={modalHistorial}
          onClose={() => setModalHistorial(null)}
          onEliminado={cargar}
        />
      )}

      {exito && (
        <ModalExito
          tipo={exito.tipo}
          participante={exito.participante}
          puntos={exito.puntos}
          descripcion={exito.descripcion}
          onClose={() => setExito(null)}
        />
      )}
    </div>
  );
}