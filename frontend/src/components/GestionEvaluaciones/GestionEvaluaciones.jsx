import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./GestionEvaluaciones.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
function getSession(){ try{ return JSON.parse(localStorage.getItem("eaen_session")||"null"); }catch{ return null; } }
function fmtFecha(f){ if(!f) return "—"; return new Date(f).toLocaleDateString("es-BO",{day:"2-digit",month:"2-digit",year:"numeric"}); }
function Spinner(){ return <div className="gev-spinner"><div className="gev-ring"/></div>; }

/* ── MODAL Habilitar evaluación ─────────────────────────── */
function ModalHabilitar({ plantillas, cursos, materias, onClose, onCreated }){
  const session = getSession();
  const [form, setForm] = useState({ plantilla_id:"", curso_id:"", materia_id:"", titulo:"", fecha_fin:"" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const plantilla = plantillas.find(p => p.id === Number(form.plantilla_id));
  const necesitaMateria = plantilla?.tipo === "CURSANTE_A_DOCENTE";
  const materiasDelCurso = materias.filter(m => m.curso_id === Number(form.curso_id));

  const crear = async () => {
    if(!form.plantilla_id || !form.curso_id) return setError("Seleccione plantilla y curso.");
    if(necesitaMateria && !form.materia_id) return setError("Seleccione la materia a evaluar.");
    setSaving(true); setError("");
    try {
      const r = await fetch(`${API}/eval-inst/periodos`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({...form, plantilla_id:Number(form.plantilla_id),
          curso_id:Number(form.curso_id), materia_id:form.materia_id?Number(form.materia_id):null,
          creado_por:session?.id})
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.message);
      onCreated();
    } catch(e){ setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="gev-overlay" onClick={onClose}>
      <div className="gev-modal" onClick={e=>e.stopPropagation()}>
        <div className="gev-modal-header">
          <div className="gev-modal-title">⚡ Habilitar nueva evaluación</div>
          <button className="gev-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="gev-modal-body">
          <div className="gev-form-group">
            <label>Tipo de evaluación *</label>
            <div className="gev-tipo-grid">
              {plantillas.map(p => (
                <div key={p.id}
                  className={`gev-tipo-card ${form.plantilla_id==p.id?"selected":""}`}
                  onClick={()=>setForm(f=>({...f,plantilla_id:p.id,materia_id:""}))}>
                  <div className="gev-tipo-icon">{p.tipo==="CURSANTE_A_CURSANTE"?"👥":"⭐"}</div>
                  <div className="gev-tipo-label">{p.titulo}</div>
                  <div className="gev-tipo-desc">{p.total_indicadores} indicadores</div>
                </div>
              ))}
            </div>
          </div>

          <div className="gev-form-row">
            <div className="gev-form-group">
              <label>Curso *</label>
              <select value={form.curso_id} onChange={e=>setForm(f=>({...f,curso_id:e.target.value,materia_id:""}))}>
                <option value="">— Seleccionar —</option>
                {cursos.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            {necesitaMateria && (
              <div className="gev-form-group">
                <label>Materia a evaluar *</label>
                <select value={form.materia_id} onChange={e=>setForm(f=>({...f,materia_id:e.target.value}))}>
                  <option value="">— Seleccionar —</option>
                  {materiasDelCurso.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="gev-form-row">
            <div className="gev-form-group">
              <label>Título personalizado (opcional)</label>
              <input placeholder="Ej: Evaluación 1er Trimestre 2026" value={form.titulo}
                onChange={e=>setForm(f=>({...f,titulo:e.target.value}))}/>
            </div>
            <div className="gev-form-group">
              <label>Fecha límite (opcional)</label>
              <input type="date" value={form.fecha_fin} onChange={e=>setForm(f=>({...f,fecha_fin:e.target.value}))}/>
            </div>
          </div>

          {error && <div className="gev-error">⚠️ {error}</div>}
        </div>
        <div className="gev-modal-footer">
          <button className="gev-btn-primary" onClick={crear} disabled={saving}>
            {saving?"Habilitando...":"⚡ Habilitar evaluación"}
          </button>
          <button className="gev-btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ── MODAL Resultados ────────────────────────────────────── */
function ModalResultados({ periodoId, tipo, onClose }){
  const [data,     setData]     = useState(null);
  const [dataCur,  setDataCur]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [expandido, setExpandido] = useState(null);

  useEffect(()=>{
    const urls = [fetch(`${API}/eval-inst/periodos/${periodoId}/resultados`).then(r=>r.json())];
    if(tipo==="CURSANTE_A_CURSANTE")
      urls.push(fetch(`${API}/eval-inst/periodos/${periodoId}/resultados-cursantes`).then(r=>r.json()));
    Promise.all(urls)
      .then(([d, dc])=>{ setData(d); if(dc) setDataCur(dc); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[periodoId]);

  const pct = v => Math.round(Number(v)||0);
  const colorPct = v => v>=80?"#2e7d32":v>=60?"#e65100":"#c62828";

  // ── Tab state for cursante-a-cursante
  const [tab, setTab] = useState(tipo==="CURSANTE_A_CURSANTE"?"cursantes":"global");

  return (
    <div className="gev-overlay" onClick={onClose}>
      <div className="gev-modal gev-modal-wide" onClick={e=>e.stopPropagation()}>
        <div className="gev-modal-header">
          <div className="gev-modal-title">📊 Resultados de evaluación</div>
          <button className="gev-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="gev-modal-body">
          {loading ? <Spinner/> : !data ? <p style={{color:"#888",textAlign:"center",padding:30}}>No hay datos.</p> : (<>

            {/* Info general */}
            <div className="gev-res-header">
              <div className="gev-res-titulo">{data.periodo?.titulo || data.periodo?.plantilla_titulo}</div>
              <div className="gev-res-pills">
                <span className="gev-pill green">{data.participacion?.completaron}/{data.participacion?.total} completaron</span>
                <span className="gev-pill blue">
                  {data.participacion?.total>0 ? Math.round(data.participacion.completaron/data.participacion.total*100) : 0}% participación
                </span>
              </div>
            </div>

            {/* Tabs solo para cursante-a-cursante */}
            {tipo==="CURSANTE_A_CURSANTE" && (
              <div className="gev-res-tabs">
                <button className={`gev-res-tab ${tab==="cursantes"?"active":""}`} onClick={()=>setTab("cursantes")}>
                  👥 Por cursante
                </button>
                <button className={`gev-res-tab ${tab==="global"?"active":""}`} onClick={()=>setTab("global")}>
                  📊 Resumen global
                </button>
              </div>
            )}

            {/* ── VISTA: por cursante ── */}
            {tab==="cursantes" && dataCur && (
              <div className="gev-cur-lista">
                {dataCur.resultados.map((cur, idx) => {
                  const p = cur.promedio_general;
                  const col = p!=null ? colorPct(p) : "#9e9e9e";
                  const isOpen = expandido===cur.id;
                  return (
                    <div key={cur.id} className={`gev-cur-row ${isOpen?"open":""}`}>
                      <div className="gev-cur-row-header" onClick={()=>setExpandido(isOpen?null:cur.id)}>
                        <div className="gev-cur-rank">{idx+1}</div>
                        <div className="gev-cur-avatar" style={{background:col}}>{cur.ap_paterno?.[0]||"?"}</div>
                        <div className="gev-cur-info">
                          <div className="gev-cur-nombre">{cur.ap_paterno} {cur.ap_materno}, {cur.nombre}</div>
                          <div className="gev-cur-meta">{cur.grado && <span>{cur.grado}</span>} · CI: {cur.ci} · {cur.evaluadores} evaluaciones recibidas</div>
                        </div>
                        <div className="gev-cur-nota-wrap">
                          {p!=null ? (<>
                            <div className="gev-cur-nota" style={{color:col}}>{p}</div>
                            <div className="gev-cur-nota-lbl">/100</div>
                          </>) : <div className="gev-cur-sin-nota">Sin datos</div>}
                        </div>
                        <div className="gev-cur-bar-mini">
                          <div style={{width:`${p||0}%`,height:"100%",background:col,borderRadius:3}}/>
                        </div>
                        <div className="gev-cur-chevron">{isOpen?"▲":"▼"}</div>
                      </div>

                      {/* Detalle por indicador */}
                      {isOpen && cur.indicadores.length>0 && (
                        <div className="gev-cur-detalle">
                          {cur.indicadores.map((ind,j)=>{
                            const ip = pct(ind.promedio);
                            return (
                              <div key={j} className="gev-ind-mini-row">
                                <span className="gev-ind-mini-num">{j+1}</span>
                                <span className="gev-ind-mini-txt">{ind.texto}</span>
                                <div className="gev-ind-mini-bar-bg">
                                  <div className="gev-ind-mini-bar" style={{width:`${ip}%`,background:colorPct(ip)}}/>
                                </div>
                                <span className="gev-ind-mini-val" style={{color:colorPct(ip)}}>{ip}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {isOpen && cur.indicadores.length===0 && (
                        <div className="gev-cur-sin-resp">Este cursante aún no ha recibido evaluaciones.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── VISTA: global ── */}
            {tab==="global" && (
              !data.stats?.length ? (
                <p className="gev-empty" style={{padding:30}}>Aún no hay respuestas registradas.</p>
              ) : (
                <div className="gev-res-tabla">
                  {data.stats.map((s,i)=>{
                    const p = pct(s.promedio);
                    return (
                      <div key={s.indicador_id} className="gev-res-row">
                        <div className="gev-res-nro">{i+1}</div>
                        <div className="gev-res-texto">{s.texto}</div>
                        <div className="gev-res-bar-wrap"><div className="gev-res-bar" style={{width:`${p}%`,background:colorPct(p)}}/></div>
                        <div className="gev-res-val" style={{color:colorPct(p)}}>{p}</div>
                        <div className="gev-res-resp">{s.total_respuestas} resp.</div>
                      </div>
                    );
                  })}
                  <div className="gev-res-promedio-global">
                    Promedio general: <strong style={{color:colorPct(Math.round(data.stats.reduce((a,s)=>a+Number(s.promedio),0)/data.stats.length))}}>
                      {Math.round(data.stats.reduce((a,s)=>a+Number(s.promedio),0)/data.stats.length)}
                    </strong> / 100
                  </div>
                </div>
              )
            )}
          </>)}
        </div>
        <div className="gev-modal-footer">
          <button className="gev-btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function GestionEvaluaciones(){
  const navigate   = useNavigate();
  const session    = getSession();
  const [periodos,    setPeriodos]    = useState([]);
  const [plantillas,  setPlantillas]  = useState([]);
  const [cursos,      setCursos]      = useState([]);
  const [materias,    setMaterias]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [resId,       setResId]       = useState(null);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const cargar = useCallback(async ()=>{
    setLoading(true);
    try {
      const [per,pla,cur] = await Promise.all([
        fetch(`${API}/eval-inst/periodos`).then(r=>r.json()),
        fetch(`${API}/eval-inst/plantillas`).then(r=>r.json()),
        fetch(`${API}/cursos`).then(r=>r.json()),
      ]);
      if(Array.isArray(per)) setPeriodos(per);
      if(Array.isArray(pla)) setPlantillas(pla);
      if(Array.isArray(cur)){
        setCursos(cur);
        // cargar materias de todos los cursos
        const mats = [];
        for(const c of cur){
          const m = await fetch(`${API}/cursos/${c.id}/materias`).then(r=>r.json());
          if(Array.isArray(m)) m.forEach(x=>mats.push({...x,curso_id:c.id}));
        }
        setMaterias(mats);
      }
    } catch{}
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ if(!session){navigate("/");return;} cargar(); },[]);

  const toggleHabilitar = async (id) => {
    try {
      const r = await fetch(`${API}/eval-inst/periodos/${id}/toggle`,{method:"PATCH"});
      const d = await r.json(); if(!r.ok) throw new Error(d.message);
      showToast("✅ Estado actualizado");
      cargar();
    } catch(e){ showToast(`❌ ${e.message}`,"error"); }
  };

  const TIPO_LABEL = { CURSANTE_A_CURSANTE:"👥 Entre cursantes", CURSANTE_A_DOCENTE:"⭐ Cursante → Docente" };
  const TIPO_COLOR = { CURSANTE_A_CURSANTE:"#1565c0", CURSANTE_A_DOCENTE:"#6a1b9a" };

  return (
    <div className="gev-page">
      {/* Header */}
      <header className="gev-header">
        <button className="gev-back" onClick={()=>navigate("/dashboard-jefe")}>← Volver</button>
        <div className="gev-header-center">
          <h1>📋 Gestión de Evaluaciones Institucionales</h1>
          <p>Habilite, supervise y analice las evaluaciones entre cursantes y docentes.</p>
        </div>
        <button className="gev-btn-primary gev-btn-new" onClick={()=>setShowModal(true)}>
          ⚡ Habilitar nueva evaluación
        </button>
      </header>

      <main className="gev-main">
        {/* Stats */}
        <div className="gev-stats">
          <div className="gev-stat s-blue">
            <div className="gev-stat-icon">📋</div>
            <div><div className="gev-stat-val">{periodos.length}</div><div className="gev-stat-lbl">Total evaluaciones</div></div>
          </div>
          <div className="gev-stat s-green">
            <div className="gev-stat-icon">✅</div>
            <div><div className="gev-stat-val">{periodos.filter(p=>p.habilitado).length}</div><div className="gev-stat-lbl">Activas</div></div>
          </div>
          <div className="gev-stat s-orange">
            <div className="gev-stat-icon">👥</div>
            <div><div className="gev-stat-val">{periodos.filter(p=>p.tipo==="CURSANTE_A_CURSANTE").length}</div><div className="gev-stat-lbl">Entre cursantes</div></div>
          </div>
          <div className="gev-stat s-purple">
            <div className="gev-stat-icon">⭐</div>
            <div><div className="gev-stat-val">{periodos.filter(p=>p.tipo==="CURSANTE_A_DOCENTE").length}</div><div className="gev-stat-lbl">A docentes</div></div>
          </div>
        </div>

        {/* Tabla de periodos */}
        <div className="gev-card">
          <div className="gev-card-header">
            <h2>Evaluaciones registradas</h2>
            <span className="gev-count">{periodos.length}</span>
          </div>
          {loading ? <Spinner/> : !periodos.length ? (
            <div className="gev-empty">
              <div className="gev-empty-icon">📋</div>
              <p>No hay evaluaciones creadas aún.</p>
              <button className="gev-btn-primary" onClick={()=>setShowModal(true)}>⚡ Crear la primera</button>
            </div>
          ) : (
            <div className="gev-tabla-wrap">
              <table className="gev-tabla">
                <thead>
                  <tr>
                    <th>Tipo</th><th>Evaluación</th><th>Curso</th><th>Materia</th>
                    <th style={{textAlign:"center"}}>Participación</th>
                    <th style={{textAlign:"center"}}>Fecha límite</th>
                    <th style={{textAlign:"center"}}>Estado</th>
                    <th style={{textAlign:"center"}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {periodos.map(p=>{
                    const pct = p.total_asignadas>0 ? Math.round(p.completadas/p.total_asignadas*100) : 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="gev-tipo-badge" style={{background:TIPO_COLOR[p.tipo]+"20",color:TIPO_COLOR[p.tipo]}}>
                            {TIPO_LABEL[p.tipo]}
                          </span>
                        </td>
                        <td>
                          <div className="gev-eval-titulo">{p.titulo || p.plantilla_titulo}</div>
                          <div className="gev-eval-fecha" style={{fontSize:11,color:"#999",marginTop:2}}>
                            Creada: {fmtFecha(p.creado_en)}
                          </div>
                        </td>
                        <td className="gev-muted">{p.curso_nombre}</td>
                        <td className="gev-muted">{p.materia_nombre||"—"}</td>
                        <td style={{textAlign:"center"}}>
                          <div className="gev-pct-wrap">
                            <div className="gev-pct-bar-bg">
                              <div className="gev-pct-bar-fill" style={{
                                width:`${pct}%`,
                                background:pct>=80?"#2e7d32":pct>=50?"#e65100":"#1565c0"
                              }}/>
                            </div>
                            <span className="gev-pct-txt">{p.completadas}/{p.total_asignadas||"?"}</span>
                          </div>
                        </td>
                        <td style={{textAlign:"center",color:p.fecha_fin&&p.fecha_fin.slice(0,10)<new Date().toISOString().slice(0,10)?"#c62828":"#2e7d32",fontWeight:600,fontSize:12.5}}>
                          {fmtFecha(p.fecha_fin)}
                        </td>
                        <td style={{textAlign:"center"}}>
                          <button
                            className={`gev-toggle ${p.habilitado?"active":"inactive"}`}
                            onClick={()=>toggleHabilitar(p.id)}
                          >
                            {p.habilitado ? "🟢 Activa" : "⭘ Inactiva"}
                          </button>
                        </td>
                        <td style={{textAlign:"center"}}>
                          <button className="gev-btn-sm gev-btn-ver" onClick={()=>setResId(p.id)}>
                            📊 Resultados
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <ModalHabilitar plantillas={plantillas} cursos={cursos} materias={materias}
          onClose={()=>setShowModal(false)}
          onCreated={()=>{ setShowModal(false); showToast("✅ Evaluación habilitada"); cargar(); }}/>
      )}
      {resId && <ModalResultados periodoId={resId} tipo={periodos.find(p=>p.id===resId)?.tipo||""} onClose={()=>setResId(null)}/>}
      {toast && <div className={`gev-toast ${toast.type==="error"?"gev-toast-error":""}`}>{toast.msg}</div>}
    </div>
  );
}
