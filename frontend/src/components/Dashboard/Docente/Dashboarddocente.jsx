import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../../../hooks/useNotificaciones";
import { NotificacionesPanel, NotifBell } from "../../Shared/NotificacionesPanel";
import "../../Shared/NotificacionesPanel.css";
import "./DashboardDocente.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
function getSession() {
  try { return JSON.parse(localStorage.getItem("eaen_session") || "null"); }
  catch { return null; }
}
function Spinner() { return <div className="doc-spinner"><div className="spin-ring"/></div>; }

/* ── Sub-vistas ─────────────────────────────────────────── */
function VistaAsistencia({ materia, participantes, showToast }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const [asist, setAsist] = useState({});
  const [saving,setSaving]= useState(false);
  useEffect(() => setAsist(Object.fromEntries(participantes.map(p=>[p.id,"P"]))), [participantes]);

  const toggle = id => {
    const o = ["P","T","A","J"];
    setAsist(prev => ({ ...prev, [id]: o[(o.indexOf(prev[id]||"P")+1)%o.length] }));
  };
  const guardar = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/asistencia`,{ method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ curso_id:materia.curso_id, materia_id:materia.id, fecha,
          registros: participantes.map(p=>({ usuario_id:p.id, estado:asist[p.id]||"P" })) }) });
      const d = await r.json(); if(!r.ok) throw new Error(d.message);
      showToast("✅ Asistencia registrada");
    } catch(e){ showToast(`❌ ${e.message}`,"error"); } finally { setSaving(false); }
  };
  const B={P:"pres",A:"aus",T:"tard",J:"just"}, L={P:"Presente",A:"Ausente",T:"Tardanza",J:"Justificado"}, I={P:"✅",A:"❌",T:"⏰",J:"📋"};
  return (
    <div>
      <div className="vista-toolbar">
        <div className="form-field"><label>Fecha</label><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/></div>
        <div className="asist-legend">
          {Object.entries(I).map(([k,v])=><span key={k} className={`legend-dot badge-${B[k]}`}>{v} {L[k]}</span>)}
          <span style={{color:"#aaa",fontSize:12,fontStyle:"italic"}}>— clic para cambiar</span>
        </div>
      </div>
      {!participantes.length ? <p className="empty-msg">No hay participantes.</p> : (
        <div className="doc-table-wrap"><table className="doc-table">
          <thead><tr><th>#</th><th>Participante</th><th>CI</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>{participantes.map((p,i)=>{ const e=asist[p.id]||"P"; return (
            <tr key={p.id}>
              <td className="muted">{i+1}</td>
              <td className="bold">{p.ap_paterno} {p.ap_materno}, {p.nombre}</td>
              <td className="muted">{p.ci}</td>
              <td><span className={`badge badge-${B[e]}`}>{L[e]}</span></td>
              <td><button className={`asist-toggle asist-${e}`} onClick={()=>toggle(p.id)}>{I[e]}</button></td>
            </tr>); })}
          </tbody>
        </table></div>
      )}
      <div className="vista-footer">
        <button className="btn-primary" onClick={guardar} disabled={saving}>{saving?"Guardando...":"💾 Guardar asistencia"}</button>
        <button className="btn-ghost" onClick={()=>setAsist(Object.fromEntries(participantes.map(p=>[p.id,"P"])))}>Todos presentes</button>
      </div>
    </div>
  );
}

function VistaCalificaciones({ materia, participantes, showToast }) {
  const [evals,setEvals]=useState([]); const [notas,setNotas]=useState({}); const [saving,setSaving]=useState(false);
  useEffect(()=>{
    if(!materia?.id) return;
    fetch(`${API}/api/eval-config/materia/${materia.id}`).then(r=>r.json()).then(d=>{if(Array.isArray(d))setEvals(d);}).catch(()=>{});
    fetch(`${API}/api/calificaciones/materia/${materia.id}`).then(r=>r.json()).then(d=>{
      if(d.libro){ const m={}; d.libro.forEach(p=>{m[p.usuario_id]=p.notas||{};}); setNotas(m); }}).catch(()=>{});
  },[materia?.id]);
  useEffect(()=>{
    if(participantes.length&&evals.length) setNotas(prev=>{ const n={...prev}; participantes.forEach(p=>{if(!n[p.id])n[p.id]=Object.fromEntries(evals.map(ev=>[ev.nombre,0]));}); return n; });
  },[participantes,evals]);
  const prom = uid => { if(!evals.length) return 0; const n=notas[uid]||{}; let sp=0,sn=0; evals.forEach(ev=>{sn+=(n[ev.nombre]??0)*Number(ev.peso);sp+=Number(ev.peso);}); return sp>0?sn/sp:0; };
  const guardar = async()=>{ setSaving(true); try{
    const r=await fetch(`${API}/api/calificaciones`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({curso_id:materia.curso_id,materia_id:materia.id,calificaciones:participantes.map(p=>({usuario_id:p.id,notas:notas[p.id]||{}}))})});
    const d=await r.json(); if(!r.ok)throw new Error(d.message); showToast("✅ Calificaciones guardadas");
  }catch(e){showToast(`❌ ${e.message}`,"error");}finally{setSaving(false);} };
  const min=evals.length?Number(evals[0].nota_min_apro):70;
  return (<div>
    {!evals.length ? <p className="empty-msg">No hay evaluaciones configuradas.</p> : (
      <div className="doc-table-wrap" style={{overflowX:"auto"}}><table className="doc-table">
        <thead><tr><th>Participante</th><th>CI</th>{evals.map(ev=><th key={ev.nombre}>{ev.nombre}<br/><span style={{fontSize:10,color:"#aaa"}}>{ev.peso}%</span></th>)}<th>Promedio</th><th>Estado</th></tr></thead>
        <tbody>{participantes.map(p=>{ const pr=prom(p.id); const ap=pr>=min; return (
          <tr key={p.id}><td className="bold">{p.ap_paterno} {p.ap_materno}, {p.nombre}</td><td className="muted">{p.ci}</td>
          {evals.map(ev=><td key={ev.nombre}><input className={`nota-input ${(notas[p.id]?.[ev.nombre]??0)>=min?"nota-ap":"nota-rp"}`} type="number" min="0" max="100"
            value={notas[p.id]?.[ev.nombre]??0} onChange={e=>setNotas(prev=>({...prev,[p.id]:{...prev[p.id],[ev.nombre]:Math.min(100,Math.max(0,Number(e.target.value)||0))}}))} /></td>)}
          <td><strong style={{color:ap?"#2e7d32":"#c62828"}}>{pr.toFixed(1)}</strong></td>
          <td><span className={`badge ${ap?"badge-pres":"badge-aus"}`}>{ap?"Aprobado":"Reprobado"}</span></td></tr>); })}
        </tbody>
      </table></div>
    )}
    <div className="vista-footer"><button className="btn-primary" onClick={guardar} disabled={saving}>{saving?"Guardando...":"💾 Guardar calificaciones"}</button></div>
  </div>);
}

function VistaTareas({ materia, participantes, showToast }) {
  const [tareas,setTareas]=useState([]); const [form,setForm]=useState({titulo:"",descripcion:"",fecha_limite:""}); const [vista,setVista]=useState("lista"); const [saving,setSaving]=useState(false);
  const session=getSession();
  useEffect(()=>{ if(!materia?.id)return; fetch(`${API}/api/tareas/materia/${materia.id}`).then(r=>r.json()).then(d=>Array.isArray(d)&&setTareas(d)).catch(()=>{}); },[materia?.id]);
  const crear=async()=>{ if(!form.titulo.trim())return showToast("❌ El título es requerido","error"); setSaving(true);
    try{ const r=await fetch(`${API}/api/tareas`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({curso_id:materia.curso_id,materia_id:materia.id,...form,creado_por:session?.id})});
      const d=await r.json(); if(!r.ok)throw new Error(d.message); showToast(`✅ Tarea creada — ${d.entregas_generadas} entregas`);
      setForm({titulo:"",descripcion:"",fecha_limite:""}); setVista("lista");
      const lr=await fetch(`${API}/api/tareas/materia/${materia.id}`); const ld=await lr.json(); if(Array.isArray(ld))setTareas(ld);
    }catch(e){showToast(`❌ ${e.message}`,"error");}finally{setSaving(false);} };
  return (<div>
    <div className="vista-tabs">
      <button className={vista==="lista"?"vtab active":"vtab"} onClick={()=>setVista("lista")}>📋 Tareas ({tareas.length})</button>
      <button className={vista==="nueva"?"vtab active":"vtab"} onClick={()=>setVista("nueva")}>➕ Nueva tarea</button>
    </div>
    {vista==="lista"&&(!tareas.length?<p className="empty-msg">No hay tareas.</p>:
      <div className="doc-table-wrap"><table className="doc-table">
        <thead><tr><th>Tarea</th><th>Límite</th><th>Progreso</th></tr></thead>
        <tbody>{tareas.map(t=>{ const pct=t.total_entregas>0?Math.round(t.entregadas/t.total_entregas*100):0; return(
          <tr key={t.id}><td className="bold">{t.titulo}</td><td className="muted">{t.fecha_limite||"—"}</td>
          <td><div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,background:"#eee",borderRadius:6,height:7,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:"#2e7d32",borderRadius:6}}/></div>
            <span style={{fontSize:12,color:"#666",minWidth:36}}>{pct}%</span></div></td></tr>); })}
        </tbody>
      </table></div>
    )}
    {vista==="nueva"&&(<div className="doc-form">
      <div className="form-row">
        <div className="form-field"><label>Título *</label><input value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))}/></div>
        <div className="form-field"><label>Fecha límite</label><input type="date" value={form.fecha_limite} onChange={e=>setForm(p=>({...p,fecha_limite:e.target.value}))}/></div>
      </div>
      <div className="form-field"><label>Descripción</label><textarea rows={3} value={form.descripcion} onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))}/></div>
      <div className="vista-footer"><button className="btn-primary" onClick={crear} disabled={saving}>{saving?"Creando...":"📤 Crear tarea"}</button></div>
    </div>)}
  </div>);
}

/* ── Principal ──────────────────────────────────────────── */
export default function DashboardDocente() {
  const navigate = useNavigate();
  const session  = getSession();

  const [materias,      setMaterias]      = useState([]);
  const [materiaId,     setMateriaId]     = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [vista,         setVista]         = useState("asistencia");
  const [toast,         setToast]         = useState(null);

  const { notifs, noLeidas, loading: loadingNotifs, marcarLeida, marcarTodasLeidas } = useNotificaciones(30);
  const showToast = useCallback((msg, type="ok") => setToast({msg,type}), []);

  useEffect(()=>{
    if(!session){navigate("/");return;}
    fetch(`${API}/api/cursos`).then(r=>r.json()).then(async cursos=>{
      if(!Array.isArray(cursos))return;
      const todas=[];
      for(const c of cursos){
        const mr=await fetch(`${API}/api/cursos/${c.id}/materias`); const md=await mr.json();
        if(Array.isArray(md)) md.filter(m=>m.docente_id===session.id).forEach(m=>todas.push({...m,curso_nombre:c.nombre}));
      }
      setMaterias(todas); if(todas.length)setMateriaId(todas[0].id);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(!materiaId)return;
    const m=materias.find(x=>x.id===materiaId); if(!m)return;
    fetch(`${API}/api/cursos/${m.curso_id}`).then(r=>r.json())
      .then(d=>setParticipantes(Array.isArray(d.participantes)?d.participantes:[]))
      .catch(()=>setParticipantes([]));
  },[materiaId]);

  useEffect(()=>{ if(!toast)return; const t=setTimeout(()=>setToast(null),3200); return()=>clearTimeout(t); },[toast]);

  const materia = materias.find(m=>m.id===materiaId);
  const nombre  = session?`${session.ap_paterno||""} ${session.nombre||""}`.trim():"Docente";

  const VISTAS = [
    {id:"asistencia",    icon:"📋", label:"Asistencia"},
    {id:"calificaciones",icon:"📊", label:"Calificaciones"},
    {id:"tareas",        icon:"📤", label:"Tareas"},
    {id:"notificaciones",icon:"🔔", label:"Notificaciones"},
  ];

  return (
    <div className="doc-page">
      <aside className="doc-sidebar">
        <div className="sidebar-brand">
          <img src="/eaen.png" alt="EAEN" className="sidebar-logo"/>
          <div><div className="sidebar-title">EAEN Avaroa</div><div className="sidebar-role">👨‍🏫 Docente</div></div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{nombre[0]||"D"}</div>
          <div><div className="user-name">{nombre}</div><div className="user-ci">CI: {session?.ci}</div></div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">MÓDULOS</div>
          {VISTAS.map(v=>(
            <button key={v.id} className={`nav-btn${vista===v.id?" active":""}`} onClick={()=>setVista(v.id)}>
              <span>{v.icon}</span>{v.label}
              {v.id==="notificaciones"&&noLeidas>0&&<span className="np-sidebar-badge">{noLeidas}</span>}
            </button>
          ))}
        </nav>
        <div style={{flex:1}}/>
        <button className="nav-btn logout" onClick={()=>{localStorage.removeItem("eaen_session");navigate("/");}}>🚪 Cerrar sesión</button>
      </aside>

      <main className="doc-main">
        <header className="doc-header">
          <div>
            <h1>Panel del Docente</h1>
            <p>Gestione asistencia, calificaciones y tareas de sus materias.</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <NotifBell noLeidas={noLeidas} onClick={()=>setVista("notificaciones")}/>
            <div className="header-date">{new Date().toLocaleDateString("es-BO",{weekday:"long",day:"numeric",month:"long"})}</div>
          </div>
        </header>

        {loading ? <Spinner/> : (<>
          <div className="doc-stats">
            <div className={`doc-stat-card color-blue`}><div className="stat-icon">📚</div><div className="stat-body"><div className="stat-value">{materias.length}</div><div className="stat-label">Materias asignadas</div></div></div>
            <div className={`doc-stat-card color-orange`}><div className="stat-icon">👥</div><div className="stat-body"><div className="stat-value">{participantes.length}</div><div className="stat-label">Participantes</div></div></div>
            <div className={`doc-stat-card color-${noLeidas>0?"red":"green"}`} style={{cursor:"pointer"}} onClick={()=>setVista("notificaciones")}>
              <div className="stat-icon">🔔</div><div className="stat-body"><div className="stat-value">{noLeidas}</div><div className="stat-label">Notificaciones</div></div>
            </div>
          </div>

          {/* ── PANEL NOTIFICACIONES ── */}
          {vista==="notificaciones" && (
            <div className="doc-panel">
              <div className="panel-header" style={{flexDirection:"column",alignItems:"flex-start",gap:4}}>
                <h2 style={{fontSize:16,fontWeight:700,color:"#003366"}}>🔔 Notificaciones institucionales</h2>
                <p style={{fontSize:13,color:"#8898aa"}}>Haz clic en una notificación para expandirla, luego en "Marcar como leída" para que desaparezca.</p>
              </div>
              <div className="panel-body">
                <NotificacionesPanel notifs={notifs} loading={loadingNotifs} marcarLeida={marcarLeida} marcarTodasLeidas={marcarTodasLeidas}/>
              </div>
            </div>
          )}

          {/* ── OTROS MÓDULOS ── */}
          {vista!=="notificaciones" && (!materias.length
            ? <div className="doc-empty"><span>📭</span><p>No tiene materias asignadas. Contacte al Jefe de Estudios.</p></div>
            : <div className="doc-panel">
                <div className="panel-header">
                  <div className="materia-selector">
                    <label>Materia activa</label>
                    <select value={materiaId||""} onChange={e=>setMateriaId(Number(e.target.value))}>
                      {materias.map(m=><option key={m.id} value={m.id}>{m.nombre} — {m.curso_nombre}</option>)}
                    </select>
                  </div>
                  <div className="panel-tabs">
                    {VISTAS.filter(v=>v.id!=="notificaciones").map(v=>(
                      <button key={v.id} className={`ptab${vista===v.id?" active":""}`} onClick={()=>setVista(v.id)}>{v.icon} {v.label}</button>
                    ))}
                  </div>
                </div>
                <div className="panel-body">
                  {materia&&vista==="asistencia"     &&<VistaAsistencia     materia={materia} participantes={participantes} showToast={showToast}/>}
                  {materia&&vista==="calificaciones" &&<VistaCalificaciones materia={materia} participantes={participantes} showToast={showToast}/>}
                  {materia&&vista==="tareas"         &&<VistaTareas         materia={materia} participantes={participantes} showToast={showToast}/>}
                </div>
              </div>
          )}
        </>)}
      </main>

      {toast&&<div className={`doc-toast ${toast.type==="error"?"toast-error":""}`}>{toast.msg}</div>}
    </div>
  );
}