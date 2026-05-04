import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../../../hooks/useNotificaciones";
import { NotificacionesPanel, NotifBell } from "../../Shared/NotificacionesPanel";
import "../../Shared/NotificacionesPanel.css";
import "./DashboardCursante.css";
import EvaluacionInstitucional from "../../EvaluacionInstitucional/EvaluacionInstitucional";
import "../../EvaluacionInstitucional/EvaluacionInstitucional.css";
import VistaCalendario from "../../Shared/VistaCalendario";
import "../../Shared/VistaCalendario.css";
import VistaPagos from "../../Shared/VistaPagos";
import "../../Shared/VistaPagos.css";
import ModalBloqueoFinanciero from "../../Shared/ModalBloqueoFinanciero";
import VistaDisciplinaCursante from "../../Disciplina/Vistadisciplinacursante";
import "../../Disciplina/Modulodisciplina.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
function getSession() {
  try { return JSON.parse(localStorage.getItem("eaen_session") || "null"); }
  catch { return null; }
}

// Formatea fecha ISO o date string a DD/MM/YYYY
function fmtFecha(f) {
  if (!f) return "—";
  const d = new Date(f);
  if (isNaN(d)) return f;
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Spinner() { return <div className="cur-spinner"><div className="spin-ring"/></div>; }

function esTareaEval(nombre) {
  const value = String(nombre || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /^(tarea|trabajo|practica)$/.test(value);
}

async function calcularMiPromedioTareas(materiaId, usuarioId) {
  try {
    const tareas = await fetch(`${API}/tareas/materia/${materiaId}`).then(r => r.json());
    if (!Array.isArray(tareas) || !tareas.length) return null;
    const notas = [];
    for (const tarea of tareas) {
      try {
        const r = await fetch(`${API}/tareas/${tarea.id}/mi-entrega/${usuarioId}`);
        if (!r.ok) continue;
        const entrega = await r.json();
        if (entrega.nota !== null && entrega.nota !== undefined) notas.push(Number(entrega.nota));
      } catch {}
    }
    if (!notas.length) return null;
    return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10;
  } catch {
    return null;
  }
}

function mezclarNotaTarea(notasBase, evaluaciones, promedioTareas) {
  const notas = { ...(notasBase || {}) };
  if (promedioTareas === null || promedioTareas === undefined) return notas;
  evaluaciones.forEach(ev => {
    if (esTareaEval(ev.nombre)) notas[ev.nombre] = promedioTareas;
  });
  return notas;
}

function calcularPromedioEvaluaciones(notas, evaluaciones, fallback = 0) {
  if (!Array.isArray(evaluaciones) || !evaluaciones.length) return Number(fallback || 0);
  const suma = evaluaciones.reduce((acc, ev) => {
    const nota = Object.prototype.hasOwnProperty.call(notas || {}, ev.nombre) ? Number(notas[ev.nombre] || 0) : 0;
    return acc + nota * Number(ev.peso || 0);
  }, 0);
  return Math.round((suma / 100) * 100) / 100;
}

function aporteFacilitador(final) {
  if (!final || final.prom_facilitador === null || final.prom_facilitador === undefined) return null;
  return Number(final.ponderaje_facilitador ?? (Number(final.prom_facilitador) * 0.025));
}

function resumenComponentes(final) {
  if (!final) return null;
  const catedratico = Number(final.prom_catedratico || 0);
  const facilitador = aporteFacilitador(final);
  const cursantes = final.prom_cursantes !== null && final.prom_cursantes !== undefined
    ? Number(final.prom_cursantes) * 0.05
    : null;
  const disciplinaBase = final.nota_disciplina !== null && final.nota_disciplina !== undefined
    ? Number(final.nota_disciplina)
    : 100;
  const disciplina = disciplinaBase * 0.025;
  const acumulado = catedratico + (facilitador ?? 0) + (cursantes ?? 0) + disciplina;
  return {
    catedratico,
    facilitador,
    facilitadorPromedio: final.prom_facilitador !== null && final.prom_facilitador !== undefined
      ? Number(final.prom_facilitador) / 10
      : null,
    cursantes,
    disciplina,
    acumulado: Number(acumulado.toFixed(2)),
  };
}

function NotaAcademicaResumen({ notas, onVerDetalle }) {
  if (!notas) return null;
  const final = notas.notaFinal;
  const componentes = resumenComponentes(final);
  const promedio = componentes ? componentes.acumulado : Number(notas.promedio || 0);
  const aprobado = notas.estado === "aprobado";
  return (
    <div className="nota-resumen nota-resumen-acceso">
      <div className={`promedio-grande ${aprobado ? "ap" : "rp"}`}>
        {promedio.toFixed(1)}
      </div>
      <div className="nota-resumen-info">
        <div className="promedio-label">{final ? "Acumulado hasta el momento" : "Promedio registrado"}</div>
        <span className={`estado-badge ${aprobado ? "badge-ap" : "badge-rp"}`}>
          {aprobado ? "✅ Aprobado" : "❌ Reprobado"}
        </span>
        {final && (
          <div className="nota-resumen-detalle">
            Catedr�tico: {componentes.catedratico.toFixed(1)}
            {componentes.facilitador !== null && ` � Facilitador: ${componentes.facilitador.toFixed(2)}`}
            {componentes.cursantes !== null && ` � Cursantes: ${componentes.cursantes.toFixed(2)}`}
            {` � Disciplina: ${componentes.disciplina.toFixed(2)}`}
          </div>
        )}
      </div>
      {onVerDetalle && (
        <button className="btn-ver-notas" type="button" onClick={onVerDetalle}>
          Ver mis notas
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VISTA TAREAS — CURSANTE
══════════════════════════════════════════════════════════ */
function VistaTareasCursante({ materia, session, showToast }) {
  const [tareas,   setTareas]   = useState([]);
  const [entregas, setEntregas] = useState({});
  const [archivos, setArchivos] = useState({});
  const [enviando, setEnviando] = useState({});
  const [abierta,  setAbierta]  = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!materia?.id || !session?.id) return;
    setCargando(true);
    fetch(`${API}/tareas/materia/${materia.id}`)
      .then(r => r.json())
      .then(async d => {
        if (!Array.isArray(d)) return;
        setTareas(d);
        const map = {};
        for (const t of d) {
          try {
            const er = await fetch(`${API}/tareas/${t.id}/mi-entrega/${session.id}`);
            if (er.ok) { const ed = await er.json(); map[t.id] = ed; }
          } catch {}
        }
        setEntregas(map);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [materia?.id, session?.id]);

  const onArchivoChange = (tareaId, file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "doc" && ext !== "docx") {
      showToast("❌ Solo se permiten archivos Word (.doc / .docx)", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("❌ El archivo supera el límite de 5 MB", "error");
      return;
    }
    setArchivos(p => ({ ...p, [tareaId]: file }));
  };

  const entregar = async (tareaId) => {
    const archivo = archivos[tareaId];
    if (!archivo) return showToast("❌ Selecciona un archivo Word antes de enviar", "error");
    setEnviando(p => ({ ...p, [tareaId]: true }));
    try {
      const form = new FormData();
      form.append("archivo", archivo);
      form.append("usuario_id", session.id);
      const r = await fetch(`${API}/tareas/${tareaId}/entregar`, { method: "POST", body: form });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      showToast("✅ Tarea entregada exitosamente");
      const er = await fetch(`${API}/tareas/${tareaId}/mi-entrega/${session.id}`);
      if (er.ok) { const ed = await er.json(); setEntregas(p => ({ ...p, [tareaId]: ed })); }
      setArchivos(p => ({ ...p, [tareaId]: null }));
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    finally { setEnviando(p => ({ ...p, [tareaId]: false })); }
  };

  const hoy = new Date().toISOString().slice(0, 10);

  if (cargando) return <Spinner/>;
  if (!tareas.length) return <p className="empty-msg">No hay tareas asignadas en esta materia.</p>;

  return (
    <div className="tareas-cursante">
      {tareas.map(t => {
        const ent     = entregas[t.id];
        const enviada = ent?.estado === "ENTREGADO";
        const calif   = ent?.nota !== null && ent?.nota !== undefined;
        const limiteStr = t.fecha_limite ? t.fecha_limite.slice(0, 10) : null;
        const vencida   = limiteStr && limiteStr < hoy && !enviada;
        const isAbierta = abierta === t.id;
        const archivoSelec = archivos[t.id];

        return (
          <div key={t.id} className={`tarea-card-cur ${enviada ? "tc-enviada" : vencida ? "tc-vencida" : "tc-pendiente"}`}>
            {/* ── Header ── */}
            <div className="tca-header" onClick={() => setAbierta(isAbierta ? null : t.id)}>
              <div className="tca-left">
                <span className="tca-icon">{enviada ? "✅" : vencida ? "⚠️" : "📝"}</span>
                <div>
                  <div className="tca-titulo">{t.titulo}</div>
                  <div className="tca-meta">
                    {limiteStr && (
                      <span className={`tca-fecha ${vencida ? "tc-fecha-vencida" : ""}`}>
                        📅 Límite: {fmtFecha(limiteStr)}
                      </span>
                    )}
                    <span className={`badge-mini ${enviada ? (calif ? "bm-blue" : "bm-green") : vencida ? "bm-red" : "bm-orange"}`}>
                      {enviada ? (calif ? "🏅 Calificado" : "✅ Entregado") : vencida ? "⚠️ Vencida" : "⏳ Pendiente"}
                    </span>
                  </div>
                </div>
              </div>
              <span className="tca-chevron">{isAbierta ? "▲" : "▼"}</span>
            </div>

            {/* ── Cuerpo expandido ── */}
            {isAbierta && (
              <div className="tca-body">
                {t.descripcion && (
                  <div className="tca-consigna">
                    <div className="tca-consigna-label">📋 Consigna del docente</div>
                    <p>{t.descripcion}</p>
                  </div>
                )}

                {/* ── YA ENTREGADA ── */}
                {enviada ? (
                  <div className="tca-entregado">
                    <div className="tca-resp-label">📤 Archivo entregado</div>
                    <div className="tca-archivo-info">
                      <span className="tca-archivo-icon">📄</span>
                      <span className="tca-archivo-nombre">{ent.archivo_nombre || "Archivo Word"}</span>
                    </div>
                    <div className="tca-resp-fecha">Enviado el: {fmtFecha(ent.entregado_en)}</div>

                    {calif ? (
                      <div className="tca-calificacion">
                        <div className={`tca-nota ${Number(ent.nota) >= 70 ? "nota-ap" : "nota-rp"}`}>
                          <span className="nota-num">{ent.nota}</span>
                          <span className="nota-pts"> pts</span>
                        </div>
                        <div style={{flex:1}}>
                          {ent.feedback ? (
                            <div className="tca-feedback">
                              <strong>💬 Feedback del docente</strong>
                              <p>{ent.feedback}</p>
                            </div>
                          ) : <p style={{color:"#8898aa",fontSize:13}}>Sin comentario del docente.</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="tca-sin-calificar">
                        ⏳ Tu tarea fue recibida. Pendiente de calificación por el docente.
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── FORMULARIO DE ENTREGA ── */
                  <div className="tca-form">
                    <label className="tca-form-label">📎 Adjunta tu tarea en formato Word</label>
                    <div className="tca-upload-area">
                      <label className={`tca-file-label ${vencida ? "tca-file-disabled" : ""}`}>
                        <input
                          type="file"
                          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          disabled={vencida}
                          onChange={e => onArchivoChange(t.id, e.target.files[0])}
                          style={{display:"none"}}
                        />
                        {archivoSelec
                          ? <><span className="tca-file-icon">📄</span> {archivoSelec.name}</>
                          : <><span className="tca-file-icon">📂</span> Seleccionar archivo Word (máx. 5 MB)</>}
                      </label>
                      {archivoSelec && (
                        <span className="tca-file-size">
                          {(archivoSelec.size / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>
                    <p className="tca-file-hint">Solo archivos .doc / .docx — máximo 5 MB</p>
                    {vencida ? (
                      <p className="tca-vencida-msg">⚠️ El plazo de entrega venció el {fmtFecha(limiteStr)}. No se pueden aceptar más entregas.</p>
                    ) : (
                      <button
                        className="btn-entregar"
                        onClick={() => entregar(t.id)}
                        disabled={enviando[t.id] || !archivoSelec}
                      >
                        {enviando[t.id] ? "Enviando..." : "📤 Enviar tarea"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function DashboardCursante() {
  const navigate = useNavigate();
  const session  = getSession();

  const [cursos,    setCursos]    = useState([]);
  const [cursoId,   setCursoId]   = useState(null);
  const [materias,  setMaterias]  = useState([]);
  const [materiaId, setMateriaId] = useState(null);
  const [notas,     setNotas]     = useState(null);
  const [asist,     setAsist]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [vista,     setVista]     = useState("tareas");
  const [toast,           setToast]           = useState(null);
  const [bloqueoFin,      setBloqueoFin]      = useState(null);   // null | {deudas, totalDeuda}
  const [checkingFin,     setCheckingFin]     = useState(true);   // true mientras verifica finanzas

  const { notifs, noLeidas, loading: loadingNotifs, marcarLeida, marcarTodasLeidas } = useNotificaciones(30);

  const showToast = (msg, type = "ok") => setToast({ msg, type });
  const nombre = session
    ? `${session.ap_paterno || ""} ${session.ap_materno || ""}, ${session.nombre || ""}`.trim()
    : "Cursante";

  useEffect(() => {
    if (!session) { navigate("/"); return; }
    // Verificar bloqueo financiero PRIMERO antes de cargar el resto
    fetch(`${API}/finanzas/estado/${session.id}`)
      .then(r=>r.json())
      .then(d=>{ if(d.bloqueado) setBloqueoFin({deudas:d.deudas,totalDeuda:d.total_deuda}); })
      .catch(()=>{})
      .finally(()=>setCheckingFin(false));
    fetch(`${API}/cursos`)
      .then(r => r.json())
      .then(async all => {
        if (!Array.isArray(all)) return;
        const mios = [];
        for (const c of all) {
          const dr = await fetch(`${API}/cursos/${c.id}`);
          const dd = await dr.json();
          if (Array.isArray(dd.participantes) && dd.participantes.find(p => p.id === session.id))
            mios.push(c);
        }
        setCursos(mios);
        if (mios.length) setCursoId(mios[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!cursoId) return;
    fetch(`${API}/cursos/${cursoId}/materias`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) { setMaterias(d); setMateriaId(d.length ? d[0].id : null); }
      })
      .catch(() => {});
  }, [cursoId]);

  useEffect(() => {
    if (!materiaId || !session) return;
    setNotas(null);
    Promise.all([
      fetch(`${API}/calificaciones/materia/${materiaId}`).then(r => r.json()).catch(() => null),
      fetch(`${API}/nota-final/materia/${materiaId}`).then(r => r.json()).catch(() => null),
      calcularMiPromedioTareas(materiaId, session.id),
    ])
      .then(([calif, finalData, promedioTareas]) => {
        const libro = Array.isArray(calif?.libro) ? calif.libro : [];
        const finales = Array.isArray(finalData?.resultado) ? finalData.resultado : [];
        const evaluaciones = Array.isArray(calif?.evaluaciones) ? calif.evaluaciones : [];
        const e = libro.find(p => Number(p.usuario_id) === Number(session.id));
        const final = finales.find(p => Number(p.usuario_id) === Number(session.id));
        const notasMezcladas = mezclarNotaTarea(e?.notas || {}, evaluaciones, promedioTareas);
        const promedioEvaluaciones = calcularPromedioEvaluaciones(notasMezcladas, evaluaciones, e?.promedio || 0);
        const aporteFac = aporteFacilitador(final);
        const notaFinalAjustada = final
          ? {
              ...final,
              prom_catedratico: promedioEvaluaciones,
              ponderaje_facilitador: aporteFac,
              nota_final: Number((
                promedioEvaluaciones +
                (aporteFac ?? 0) +
                (final.prom_cursantes ?? 0) * 0.05 +
                Number(final.nota_disciplina ?? 100) * 0.025
              ).toFixed(2)),
            }
          : null;
        if (notaFinalAjustada) {
          notaFinalAjustada.estado = notaFinalAjustada.nota_final >= Number(finalData?.nota_min_apro || 70)
            ? "aprobado"
            : "reprobado";
        }
        const tieneNotas = Object.keys(notasMezcladas).length > 0;
        const tienePromedioFinal = final && Number(final.prom_catedratico || 0) > 0;

        if (!tieneNotas && !tienePromedioFinal) {
          setNotas(null);
          return;
        }

        setNotas({
          ...(e || { usuario_id: session.id, notas: {}, bloqueado: false }),
          notas: notasMezcladas,
          evaluaciones,
          promedio: notaFinalAjustada ? Number(notaFinalAjustada.nota_final) : promedioEvaluaciones,
          estado: notaFinalAjustada?.estado || e?.estado || (promedioEvaluaciones >= Number(finalData?.nota_min_apro || 70) ? "aprobado" : "reprobado"),
          notaFinal: notaFinalAjustada || null,
          pesos: finalData?.pesos || null,
          notaMinApro: finalData?.nota_min_apro || 70,
        });
      }).catch(() => setNotas(null));
    fetch(`${API}/asistencia/materia/${materiaId}?usuario_id=${session.id}`)
      .then(r => r.json())
      .then(d => setAsist(Array.isArray(d) ? d : []))
      .catch(() => setAsist([]));
  }, [materiaId, session?.id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const materia  = materias.find(m => m.id === materiaId);
  const pctAsist = asist.length
    ? Math.round(asist.filter(a => a.estado === "P" || a.estado === "J").length / asist.length * 100)
    : null;

  const BA = { P:"pres", A:"aus", T:"tard", J:"just" };
  const LA = { P:"Presente", A:"Ausente", T:"Tardanza", J:"Justificado" };

  const VISTAS = [
    { id:"evaluaciones",  icon:"📋", label:"Evaluaciones" },
    { id:"tareas",        icon:"📤", label:"Tareas" },
    { id:"notas",         icon:"📊", label:"Mis notas" },
    { id:"asistencia",    icon:"📋", label:"Asistencia" },
    { id:"calendario",    icon:"📅", label:"Calendario" },
    { id:"disciplina",    icon:"⚖️", label:"Disciplina" },
    { id:"pagos",         icon:"💰", label:"Pagos" },
    { id:"notificaciones",icon:"🔔", label:"Notificaciones" },
  ];

  return (
    <div className="cur-page">
      {/* Sidebar */}
      <aside className="cur-sidebar">
        <div className="sidebar-brand">
          <div style={{
            width:48, height:48, flexShrink:0,
            backgroundImage:"url('/eaen.png')",
            backgroundSize:"contain",
            backgroundRepeat:"no-repeat",
            backgroundPosition:"center",
            backgroundColor:"#ffffff",
            borderRadius:10,
            padding:4,
            boxShadow:"0 2px 8px rgba(0,0,0,0.35)"
          }}/>
          <div><div className="sidebar-title">EAEN Avaroa</div><div className="sidebar-role">📚 Cursante</div></div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{nombre[0] || "C"}</div>
          <div>
            <div className="user-name" style={{fontSize:11.5}}>{nombre}</div>
            <div className="user-ci">CI: {session?.ci}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">MÓDULOS</div>
          {VISTAS.map(v => (
            <button key={v.id} className={`nav-btn${vista === v.id ? " active" : ""}`} onClick={() => setVista(v.id)}>
              <span>{v.icon}</span>{v.label}
              {v.id === "notificaciones" && noLeidas > 0 && <span className="np-sidebar-badge">{noLeidas}</span>}
            </button>
          ))}
        </nav>
        <div style={{flex:1}}/>
        <button className="nav-btn logout" onClick={() => { localStorage.removeItem("eaen_session"); navigate("/", { replace: true }); }}>
          🚪 Cerrar sesión
        </button>
      </aside>

      {/* Main */}
      <main className="cur-main">
        <header className="cur-header">
          <div>
            <h1>Mi Panel Académico</h1>
            <p>Consulte sus tareas, calificaciones y asistencia por materia.</p>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:14}}>
            <NotifBell noLeidas={noLeidas} onClick={() => setVista("notificaciones")}/>
            <div className="header-date">
              {new Date().toLocaleDateString("es-BO", { weekday:"long", day:"numeric", month:"long" })}
            </div>
          </div>
        </header>

        {(loading || checkingFin) ? <Spinner/> : (<>
          <div className="cur-stats">
            <div className="cur-stat blue"><span>🎓</span><div><div className="st-val">{cursos.length}</div><div className="st-lbl">Cursos</div></div></div>
            <div className="cur-stat orange"><span>📚</span><div><div className="st-val">{materias.length}</div><div className="st-lbl">Materias</div></div></div>
            <div className="cur-stat green"><span>✅</span><div><div className="st-val">{pctAsist !== null ? `${pctAsist}%` : "—"}</div><div className="st-lbl">Asistencia</div></div></div>
            <div className={`cur-stat ${noLeidas > 0 ? "red" : "green"}`} style={{cursor:"pointer"}} onClick={() => setVista("notificaciones")}>
              <span>🔔</span><div><div className="st-val">{noLeidas}</div><div className="st-lbl">Notificaciones</div></div>
            </div>
          </div>

          {/* Notificaciones */}
          {vista === "notificaciones" && (
            <div className="cur-panel">
              <div className="panel-selectors" style={{flexDirection:"column", alignItems:"flex-start", gap:4}}>
                <h2 style={{fontSize:16, fontWeight:700, color:"#1b4332"}}>🔔 Notificaciones institucionales</h2>
                <p style={{fontSize:13, color:"#8898aa"}}>Expande y haz clic en "Marcar como leída" para quitarla.</p>
              </div>
              <div className="panel-body">
                <NotificacionesPanel notifs={notifs} loading={loadingNotifs} marcarLeida={marcarLeida} marcarTodasLeidas={marcarTodasLeidas}/>
              </div>
            </div>
          )}

          {/* Módulos académicos */}
          {vista !== "notificaciones" && (
            !cursos.length
              ? <div className="cur-empty"><span>📭</span><p>No está inscrito en ningún curso activo.</p></div>
              : <div className="cur-panel">
                  <div className="panel-selectors">
                    <div className="selector-group">
                      <label>Curso</label>
                      <select value={cursoId || ""} onChange={e => setCursoId(Number(e.target.value))}>
                        {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                    <span style={{color:"#ccc", alignSelf:"flex-end", paddingBottom:8, fontSize:20}}>›</span>
                    <div className="selector-group">
                      <label>Materia</label>
                      {materias.length
                        ? <select value={materiaId || ""} onChange={e => setMateriaId(Number(e.target.value))}>
                            {materias.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.nombre}{m.docente_nombre ? ` — ${m.docente_nombre}` : ""}
                              </option>
                            ))}
                          </select>
                        : <div className="no-materias">Sin materias registradas</div>}
                    </div>
                  </div>

                  <div className="panel-tabs">
                    {VISTAS.filter(v => v.id !== "notificaciones").map(v => (
                      <button key={v.id} className={`ptab${vista === v.id ? " active" : ""}`} onClick={() => setVista(v.id)}>
                        {v.icon} {v.label}
                      </button>
                    ))}
                  </div>

                  <div className="panel-body">
                    {/* EVALUACIONES */}
                    {vista === "evaluaciones" && (
                      <>
                        <NotaAcademicaResumen notas={notas} onVerDetalle={() => setVista("notas")} />
                        <EvaluacionInstitucional usuarioId={session?.id}/>
                      </>
                    )}

                    {/* CALENDARIO */}
                    {vista === "calendario" && (
                      <VistaCalendario
                        cursos={cursos}
                        titulo="Mi Calendario de Clases"
                        modoDocente={false}
                      />
                    )}

                    {/* DISCIPLINA */}
                    {vista === "disciplina" && (
                      <VistaDisciplinaCursante session={session} cursoId={cursoId}/>
                    )}

                    {/* PAGOS */}
                    {vista === "pagos" && (
                      <VistaPagos session={session}/>
                    )}

                    {/* TAREAS */}
                    {vista === "tareas" && (
                      <VistaTareasCursante materia={materia} session={session} showToast={showToast}/>
                    )}

                    {/* NOTAS */}
                    {vista === "notas" && (
                      !notas
                        ? <p className="empty-msg">Aún no hay calificaciones registradas para esta materia.</p>
                        : <div>
                            <NotaAcademicaResumen notas={notas} />
                            {notas.notaFinal && (() => {
                              const comp = resumenComponentes(notas.notaFinal);
                              return (
                                <>
                                  <div className={`facilitador-detalle-card ${comp.facilitador === null ? "pendiente" : "listo"}`}>
                                    <div>
                                      <span>Facilitador</span>
                                      <strong>{comp.facilitador === null ? "Pendiente" : `${comp.facilitador.toFixed(2)} / 2.5`}</strong>
                                    </div>
                                    <div>
                                      <span>Promedio registrado</span>
                                      <strong>{comp.facilitadorPromedio === null ? "Pendiente" : `${comp.facilitadorPromedio.toFixed(1)} / 10`}</strong>
                                    </div>
                                    <div>
                                      <span>Estado</span>
                                      <strong>{comp.facilitador === null ? "Sin calificar" : "Calificado"}</strong>
                                    </div>
                                  </div>

                                  <div className="nota-componentes nota-componentes-detalle">
                                    <div className="nota-component-card">
                                      <span>Catedratico (/90)</span>
                                      <strong>{comp.catedratico.toFixed(1)}</strong>
                                    </div>
                                    <div className="nota-component-card">
                                      <span>Facilitador (/2.5)</span>
                                      <strong>{comp.facilitador !== null ? comp.facilitador.toFixed(2) : "Pendiente"}</strong>
                                    </div>
                                    <div className="nota-component-card">
                                      <span>Cursantes (/5)</span>
                                      <strong>{comp.cursantes !== null ? comp.cursantes.toFixed(2) : "Pendiente"}</strong>
                                    </div>
                                    <div className="nota-component-card">
                                      <span>Disciplina (/2.5)</span>
                                      <strong>{comp.disciplina.toFixed(2)}</strong>
                                    </div>
                                    <div className="nota-component-card nota-component-total">
                                      <span>Acumulado actual (/100)</span>
                                      <strong>{comp.acumulado.toFixed(1)}</strong>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                            {/*
                              <div className={`promedio-grande ${Number(notas.promedio) >= 70 ? "ap" : "rp"}`}>
                                {Number(notas.promedio).toFixed(1)}
                              </div>
                              <div>
                                <div className="promedio-label">Promedio final</div>
                                <span className={`estado-badge ${notas.estado === "aprobado" ? "badge-ap" : "badge-rp"}`}>
                                  {notas.estado === "aprobado" ? "✅ Aprobado" : "❌ Reprobado"}
                                </span>
                              </div>
                            */}
                            <div className="notas-grid">
                              {(notas.evaluaciones || []).map(ev => {
                                const n  = Object.prototype.hasOwnProperty.call(notas.notas || {}, ev.nombre)
                                  ? notas.notas[ev.nombre]
                                  : 0;
                                const ap = n !== null && n >= Number(ev.nota_min_apro);
                                return (
                                  <div key={ev.nombre} className={`nota-card ${n === null ? "sin-nota" : ap ? "nota-ap" : "nota-rp"}`}>
                                    <div className="nota-eval-name">{ev.nombre}</div>
                                    <div className="nota-valor">{n !== null ? n : "—"}</div>
                                    <div className="nota-peso">{ev.peso}% del total</div>
                                    {n !== null && <div className="nota-estado">{ap ? "✓ Aprobado" : "✗ Reprobado"}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                    )}

                    {/* ASISTENCIA */}
                    {vista === "asistencia" && (<>
                      {pctAsist !== null && (
                        <div className="asist-resumen">
                          <div className="asist-pct-bar-wrap">
                            <div className="asist-pct-bar" style={{width:`${pctAsist}%`, background: pctAsist >= 75 ? "#2e7d32" : pctAsist >= 60 ? "#e65100" : "#c62828"}}/>
                          </div>
                          <span className={`asist-pct-label ${pctAsist >= 75 ? "ok" : "warn"}`}>{pctAsist}% asistencia efectiva</span>
                          {pctAsist < 75 && <span className="asist-warn">⚠️ Por debajo del mínimo requerido (75%)</span>}
                        </div>
                      )}
                      {!asist.length
                        ? <p className="empty-msg">No hay registros de asistencia aún.</p>
                        : <div className="cur-table-wrap">
                            <table className="cur-table">
                              <thead><tr><th>Fecha</th><th>Estado</th><th>Observación</th></tr></thead>
                              <tbody>
                                {[...asist].sort((a,b) => b.fecha.localeCompare(a.fecha)).map(a => (
                                  <tr key={a.id}>
                                    <td className="bold">{fmtFecha(a.fecha)}</td>
                                    <td><span className={`badge badge-${BA[a.estado]}`}>{LA[a.estado]}</span></td>
                                    <td className="muted">{a.observacion || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>}
                    </>)}
                  </div>
                </div>
          )}
        </>)}
      </main>

      {/* Toast */}
      {/* Modal bloqueo financiero */}
      {bloqueoFin && (
        <ModalBloqueoFinanciero deudas={bloqueoFin.deudas} totalDeuda={bloqueoFin.totalDeuda}/>
      )}

      {toast && (
        <div className={`cur-toast ${toast.type === "error" ? "toast-error" : ""}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
