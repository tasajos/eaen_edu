import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./GestionEducativa.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Helpers ────────────────────────────────────────────────
function Toast({ msg, type="ok", onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,3400);return()=>clearTimeout(t); },[onClose]);
  return <div className={`edu-toast${type!=="ok"?` ${type}`:""}`}><span>{type==="ok"?"✅":type==="warn"?"⚠️":"❌"}</span>{msg}</div>;
}
function Spinner() { return <div className="edu-spinner"><div className="spin"/>Cargando...</div>; }
function Empty({ icon="📭", msg }) { return <div style={{textAlign:"center",padding:40,color:"#bbb"}}><div style={{fontSize:36,marginBottom:10}}>{icon}</div>{msg}</div>; }

// ─── Hook: cursos ────────────────────────────────────────────
function useCursos() {
  const [cursos, setCursos]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [cursoId, setCursoId]       = useState(null);
  const [participantes, setPart]    = useState([]);
  const [loadingPart, setLoadingP]  = useState(false);

  useEffect(()=>{
    (async()=>{
      try {
        const res  = await fetch(`${API}/api/cursos`);
        const data = await res.json();
        if(Array.isArray(data)&&data.length){ setCursos(data); setCursoId(data[0].id); }
      } catch{} finally{ setLoading(false); }
    })();
  },[]);

  useEffect(()=>{
    if(!cursoId) return;
    setLoadingP(true);
    (async()=>{
      try {
        const res  = await fetch(`${API}/api/cursos/${cursoId}`);
        const data = await res.json();
        setPart(Array.isArray(data.participantes)?data.participantes:[]);
      } catch{ setPart([]); } finally{ setLoadingP(false); }
    })();
  },[cursoId]);

  return { cursos, loading, cursoId, setCursoId, participantes, loadingPart };
}

// ─── Hook: materias de un curso ─────────────────────────────
function useMaterias(cursoId) {
  const [materias, setMaterias]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [materiaId, setMateriaId]   = useState(null);

  const reload = useCallback(async()=>{
    if(!cursoId){ setMaterias([]); setMateriaId(null); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/cursos/${cursoId}/materias`);
      const data = await res.json();
      const list = Array.isArray(data)?data:[];
      setMaterias(list);
      setMateriaId(prev => {
        // mantener selección si sigue existiendo, sino primer elemento
        if(prev && list.find(m=>m.id===prev)) return prev;
        return list.length?list[0].id:null;
      });
    } catch{ setMaterias([]); setMateriaId(null); } finally{ setLoading(false); }
  },[cursoId]);

  useEffect(()=>{ reload(); },[reload]);
  return { materias, loading, materiaId, setMateriaId, reload };
}

// ─── Selectores reutilizables ────────────────────────────────
function CursoSelector({ cursos, cursoId, onChange, loading }) {
  if(loading) return <Spinner/>;
  if(!cursos.length) return <div style={{padding:24,color:"#e53935",fontSize:14}}>⚠️ No hay cursos. Cree uno en Gestión de Cursos.</div>;
  return (
    <div className="edu-form-group" style={{maxWidth:320,marginBottom:0}}>
      <label className="edu-form-label">Curso</label>
      <select className="edu-form-select" value={cursoId||""} onChange={e=>onChange(Number(e.target.value))}>
        {cursos.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select>
    </div>
  );
}
function MateriaSelector({ materias, materiaId, onChange, loading }) {
  if(loading) return <Spinner/>;
  if(!materias.length) return <div style={{padding:"10px 0",color:"#e53935",fontSize:13}}>⚠️ Este curso no tiene materias. Agrégalas en "Materias".</div>;
  return (
    <div className="edu-form-group" style={{maxWidth:320,marginBottom:0}}>
      <label className="edu-form-label">Materia</label>
      <select className="edu-form-select" value={materiaId||""} onChange={e=>onChange(Number(e.target.value))}>
        {materias.map(m=><option key={m.id} value={m.id}>{m.nombre}{m.docente_nombre?` — ${m.docente_ap_paterno} ${m.docente_nombre}`:""}</option>)}
      </select>
    </div>
  );
}
function SelectorBar({ cursos, cursoId, setCursoId, loadingCursos, materias, materiaId, setMateriaId, loadingMaterias }) {
  return (
    <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-end",marginBottom:22,
                 background:"#f0f4f8",borderRadius:12,padding:"14px 18px",border:"1px solid #dde3ea"}}>
      <CursoSelector cursos={cursos} cursoId={cursoId} onChange={setCursoId} loading={loadingCursos}/>
      <div style={{color:"#bbb",alignSelf:"flex-end",paddingBottom:6,fontSize:18}}>›</div>
      <MateriaSelector materias={materias} materiaId={materiaId} onChange={setMateriaId} loading={loadingMaterias}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MÓDULO 0: GESTIÓN DE MATERIAS
// ════════════════════════════════════════════════════════════
function ModuloMaterias({ showToast }) {
  const { cursos, loading:loadingC, cursoId, setCursoId } = useCursos();
  const { materias, loading:loadingM, reload } = useMaterias(cursoId);
  const [docentes, setDocentes] = useState([]);
  const [tab, setTab]           = useState("lista");
  const [form, setForm]         = useState({nombre:"",codigo:"",descripcion:"",horas:"",docente_id:""});
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);

  useEffect(()=>{
    fetch(`${API}/api/usuarios/docentes`).then(r=>r.json()).then(d=>Array.isArray(d)&&setDocentes(d)).catch(()=>{});
  },[]);

  const resetForm = () => setForm({nombre:"",codigo:"",descripcion:"",horas:"",docente_id:""});

  const guardar = async () => {
    if(!form.nombre.trim()) return showToast("El nombre de la materia es requerido","error");
    if(!cursoId) return showToast("Seleccione un curso","error");
    setSaving(true);
    try {
      const url    = editId?`${API}/api/materias/${editId}`:`${API}/api/cursos/${cursoId}/materias`;
      const method = editId?"PUT":"POST";
      const res    = await fetch(url,{method,headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...form,horas:form.horas?Number(form.horas):null,docente_id:form.docente_id?Number(form.docente_id):null})});
      const data   = await res.json();
      if(!res.ok) throw new Error(data.message||"Error");
      showToast(editId?"Materia actualizada":"Materia creada");
      resetForm(); setEditId(null); setTab("lista"); reload();
    } catch(e){ showToast(e.message,"error"); } finally{ setSaving(false); }
  };

  const eliminar = async (id) => {
    if(!confirm("¿Eliminar esta materia? Se eliminará toda su asistencia, calificaciones y tareas.")) return;
    try {
      const res = await fetch(`${API}/api/materias/${id}`,{method:"DELETE"});
      const data= await res.json();
      if(!res.ok) throw new Error(data.message);
      showToast("Materia eliminada"); reload();
    } catch(e){ showToast(e.message,"error"); }
  };

  const editar = (m) => {
    setForm({nombre:m.nombre,codigo:m.codigo||"",descripcion:m.descripcion||"",horas:m.horas||"",docente_id:m.docente_id||""});
    setEditId(m.id); setTab("form");
  };

  return (
    <div>
      <div className="edu-tabs">
        <button className={`edu-tab${tab==="lista"?" active":""}`} onClick={()=>{setTab("lista");resetForm();setEditId(null);}}>📋 Lista de materias</button>
        <button className={`edu-tab${tab==="form"?" active":""}`}  onClick={()=>setTab("form")}>➕ {editId?"Editar materia":"Nueva materia"}</button>
      </div>

      <div style={{padding:"0 26px 26px"}}>
        <CursoSelector cursos={cursos} cursoId={cursoId} onChange={id=>{setCursoId(id);setTab("lista");}} loading={loadingC}/>
        <div style={{height:18}}/>

        {tab==="lista" && (
          loadingM?<Spinner/>:!materias.length?
          <Empty icon="📚" msg="Este curso no tiene materias. Agrega la primera."/>:
          <>
            <div className="edu-stats-row" style={{marginBottom:18}}>
              <div className="edu-stat-mini"><span className="sn">{materias.length}</span><span className="sl">Materias</span></div>
              <div className="edu-stat-mini green"><span className="sn">{materias.filter(m=>m.docente_id).length}</span><span className="sl">Con docente</span></div>
              <div className="edu-stat-mini orange"><span className="sn">{materias.filter(m=>!m.docente_id).length}</span><span className="sl">Sin docente</span></div>
            </div>
            <div className="edu-table-wrap">
              <table className="edu-table">
                <thead>
                  <tr><th>#</th><th>Nombre</th><th>Código</th><th>Horas</th><th>Docente asignado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {materias.map((m,i)=>(
                    <tr key={m.id}>
                      <td style={{color:"#888"}}>{i+1}</td>
                      <td style={{fontWeight:700}}>{m.nombre}</td>
                      <td style={{color:"#888",fontSize:12}}>{m.codigo||"—"}</td>
                      <td>{m.horas?`${m.horas}h`:"—"}</td>
                      <td>
                        {m.docente_nombre
                          ?<span style={{display:"flex",alignItems:"center",gap:6}}>
                              <span className="edu-badge badge-presente">✓</span>
                              {m.docente_ap_paterno} {m.docente_ap_materno}, {m.docente_nombre}
                            </span>
                          :<span className="edu-badge badge-ausente">Sin asignar</span>}
                      </td>
                      <td style={{display:"flex",gap:6}}>
                        <button className="btn-icon" onClick={()=>editar(m)}>✏️ Editar</button>
                        <button className="btn-icon danger" onClick={()=>eliminar(m.id)}>🗑 Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab==="form" && (
          <div className="edu-form">
            <div className="edu-form-row">
              <div className="edu-form-group">
                <label className="edu-form-label">Nombre de la materia <span>*</span></label>
                <input className="edu-form-input" placeholder="Ej: Estrategia Militar" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))}/>
              </div>
              <div className="edu-form-group">
                <label className="edu-form-label">Código</label>
                <input className="edu-form-input" placeholder="Ej: EST-101" value={form.codigo} onChange={e=>setForm(p=>({...p,codigo:e.target.value}))}/>
              </div>
            </div>
            <div className="edu-form-row">
              <div className="edu-form-group">
                <label className="edu-form-label">Horas académicas</label>
                <input className="edu-form-input" type="number" min="1" placeholder="Ej: 40" value={form.horas} onChange={e=>setForm(p=>({...p,horas:e.target.value}))}/>
              </div>
              <div className="edu-form-group">
                <label className="edu-form-label">Docente asignado</label>
                <select className="edu-form-select" value={form.docente_id} onChange={e=>setForm(p=>({...p,docente_id:e.target.value}))}>
                  <option value="">Sin asignar</option>
                  {docentes.map(d=><option key={d.id} value={d.id}>{d.ap_paterno} {d.ap_materno}, {d.nombre} — CI: {d.ci}</option>)}
                </select>
              </div>
            </div>
            <div className="edu-form-row single">
              <div className="edu-form-group">
                <label className="edu-form-label">Descripción</label>
                <textarea className="edu-form-textarea" placeholder="Descripción de la materia..." value={form.descripcion} onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))}/>
              </div>
            </div>
            <div className="btn-actions">
              <button className="btn-primary" onClick={guardar} disabled={saving}>{saving?"Guardando...":editId?"💾 Actualizar materia":"➕ Crear materia"}</button>
              <button className="btn-secondary" onClick={()=>{resetForm();setEditId(null);setTab("lista");}}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MÓDULO 1: ASISTENCIA
// ════════════════════════════════════════════════════════════
const ESTADOS_ASIST = {P:"✅",A:"❌",T:"⏰",J:"📋"};
const ESTADOS_LABEL = {P:"Presente",A:"Ausente",T:"Tardanza",J:"Justificado"};
const ESTADOS_BADGE = {P:"badge-presente",A:"badge-ausente",T:"badge-tardanza",J:"badge-justif"};

function ModuloAsistencia({ showToast }) {
  const { cursos, loading:loadingC, cursoId, setCursoId, participantes, loadingPart } = useCursos();
  const { materias, loading:loadingM, materiaId, setMateriaId } = useMaterias(cursoId);
  const [fecha, setFecha]     = useState(new Date().toISOString().slice(0,10));
  const [asist, setAsist]     = useState({});
  const [historial, setHist]  = useState([]);
  const [tab, setTab]         = useState("registro");
  const [saving, setSaving]   = useState(false);

  useEffect(()=>{
    if(participantes.length) setAsist(Object.fromEntries(participantes.map(p=>[p.id,"P"])));
  },[participantes,materiaId]);

  // Cargar historial desde BD cuando cambia materia
  useEffect(()=>{
    if(!materiaId) return;
    fetch(`${API}/api/asistencia/materia/${materiaId}/resumen`)
      .then(r=>r.json()).then(d=>Array.isArray(d)&&setHist(d)).catch(()=>{});
  },[materiaId]);

  const toggle = (id) => {
    const orden=["P","T","A","J"];
    setAsist(prev=>{const idx=orden.indexOf(prev[id]||"P");return{...prev,[id]:orden[(idx+1)%orden.length]};});
  };

  const guardar = async () => {
    if(!materiaId) return showToast("Seleccione una materia","error");
    if(!participantes.length) return showToast("No hay participantes","error");
    setSaving(true);
    try {
      const payload = {curso_id:cursoId,materia_id:materiaId,fecha,
        registros:participantes.map(p=>({usuario_id:p.id,estado:asist[p.id]||"P"}))};
      const res  = await fetch(`${API}/api/asistencia`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
      showToast("Asistencia guardada correctamente");
      // refrescar historial
      const hr = await fetch(`${API}/api/asistencia/materia/${materiaId}/resumen`);
      const hd = await hr.json(); if(Array.isArray(hd)) setHist(hd);
    } catch(e){ showToast(e.message||"Error al guardar","error"); } finally{setSaving(false);}
  };

  const materia    = materias.find(m=>m.id===materiaId);
  const presentes  = Object.values(asist).filter(v=>v==="P").length;
  const ausentes   = Object.values(asist).filter(v=>v==="A").length;
  const tardanzas  = Object.values(asist).filter(v=>v==="T").length;
  const justif     = Object.values(asist).filter(v=>v==="J").length;

  return (
    <div>
      <div className="edu-tabs">
        <button className={`edu-tab${tab==="registro"?" active":""}`} onClick={()=>setTab("registro")}>📝 Registro</button>
        <button className={`edu-tab${tab==="historial"?" active":""}`} onClick={()=>setTab("historial")}>📅 Historial ({historial.length} días)</button>
      </div>
      <div style={{padding:"0 26px 26px"}}>
        <SelectorBar cursos={cursos} cursoId={cursoId} setCursoId={setCursoId} loadingCursos={loadingC}
                     materias={materias} materiaId={materiaId} setMateriaId={setMateriaId} loadingMaterias={loadingM}/>

        {tab==="registro" && (
          <>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-end",marginBottom:18}}>
              <div className="edu-form-group">
                <label className="edu-form-label">Fecha</label>
                <input className="edu-form-input" type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/>
              </div>
              {materia?.docente_nombre&&(
                <div style={{fontSize:13,color:"#555",alignSelf:"flex-end",paddingBottom:8}}>
                  👨‍🏫 Docente: <strong>{materia.docente_ap_paterno} {materia.docente_nombre}</strong>
                </div>
              )}
            </div>

            {loadingPart?<Spinner/>:!materiaId?<Empty icon="📋" msg="Seleccione una materia"/>:!participantes.length?<Empty icon="👥" msg="Este curso no tiene participantes"/>:(
              <>
                <div className="edu-stats-row">
                  <div className="edu-stat-mini green"><span className="sn">{presentes}</span><span className="sl">Presentes</span></div>
                  <div className="edu-stat-mini red"><span className="sn">{ausentes}</span><span className="sl">Ausentes</span></div>
                  <div className="edu-stat-mini orange"><span className="sn">{tardanzas}</span><span className="sl">Tardanzas</span></div>
                  <div className="edu-stat-mini"><span className="sn">{justif}</span><span className="sl">Justificados</span></div>
                </div>
                <div style={{display:"flex",gap:14,marginBottom:14,fontSize:12,color:"#666",flexWrap:"wrap"}}>
                  {Object.entries(ESTADOS_ASIST).map(([k,v])=><span key={k}>{v} {ESTADOS_LABEL[k]}</span>)}
                  <span style={{color:"#bbb",fontStyle:"italic"}}>— Clic para cambiar</span>
                </div>
                <div className="edu-table-wrap">
                  <table className="edu-table">
                    <thead><tr><th>#</th><th>Participante</th><th>CI</th><th>Estado</th><th>Marca</th><th>Observación</th></tr></thead>
                    <tbody>
                      {participantes.map((p,i)=>{
                        const estado=asist[p.id]||"P";
                        return (
                          <tr key={p.id}>
                            <td style={{color:"#888"}}>{i+1}</td>
                            <td style={{fontWeight:700}}>{p.ap_paterno} {p.ap_materno}, {p.nombre}</td>
                            <td style={{color:"#888",fontSize:12}}>{p.ci}</td>
                            <td><span className={`edu-badge ${ESTADOS_BADGE[estado]}`}>{ESTADOS_LABEL[estado]}</span></td>
                            <td><button className={`asist-cell asist-${estado}`} onClick={()=>toggle(p.id)} title="Clic para cambiar">{ESTADOS_ASIST[estado]}</button></td>
                            <td><input className="edu-form-input" placeholder="Observación..." style={{padding:"5px 10px",fontSize:12}}/></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="btn-actions">
                  <button className="btn-primary" onClick={guardar} disabled={saving}>{saving?"Guardando...":"💾 Guardar asistencia"}</button>
                  <button className="btn-secondary" onClick={()=>setAsist(Object.fromEntries(participantes.map(p=>[p.id,"P"])))}>Marcar todos presentes</button>
                </div>
              </>
            )}
          </>
        )}

        {tab==="historial" && (
          !historial.length?<Empty icon="📅" msg="Aún no hay registros para esta materia."/>:
          <div className="edu-table-wrap">
            <table className="edu-table">
              <thead><tr><th>Fecha</th><th>Presentes</th><th>Ausentes</th><th>Tardanzas</th><th>Justificados</th><th>Total</th></tr></thead>
              <tbody>
                {historial.map((r,i)=>(
                  <tr key={i}>
                    <td><strong>{r.fecha}</strong></td>
                    <td><span className="edu-badge badge-presente">{r.P}</span></td>
                    <td><span className="edu-badge badge-ausente">{r.A}</span></td>
                    <td><span className="edu-badge badge-tardanza">{r.T}</span></td>
                    <td><span className="edu-badge badge-justif">{r.J}</span></td>
                    <td style={{color:"#888"}}>{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MÓDULO 2: CALIFICACIONES
// ════════════════════════════════════════════════════════════
function ModuloCalificaciones({ showToast }) {
  const { cursos, loading:loadingC, cursoId, setCursoId, participantes, loadingPart } = useCursos();
  const { materias, loading:loadingM, materiaId, setMateriaId } = useMaterias(cursoId);
  const [evals, setEvals]   = useState([]);
  const [notas, setNotas]   = useState({});
  const [tab, setTab]       = useState("libro");
  const [saving, setSaving] = useState(false);

  // Cargar config + notas al cambiar materia
  useEffect(()=>{
    if(!materiaId) return;
    fetch(`${API}/api/eval-config/materia/${materiaId}`)
      .then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setEvals(d); }).catch(()=>{});
    fetch(`${API}/api/calificaciones/materia/${materiaId}`)
      .then(r=>r.json()).then(data=>{
        if(data.libro&&Array.isArray(data.libro)){
          const map = {};
          data.libro.forEach(p=>{ map[p.usuario_id]=p.notas||{}; });
          setNotas(map);
        }
      }).catch(()=>{});
  },[materiaId]);

  // Inicializar notas vacías para nuevos participantes
  useEffect(()=>{
    if(participantes.length&&evals.length){
      setNotas(prev=>{
        const next={...prev};
        participantes.forEach(p=>{
          if(!next[p.id]) next[p.id]=Object.fromEntries(evals.map(ev=>[ev.nombre,0]));
        });
        return next;
      });
    }
  },[participantes,evals]);

  const setNota = (uid,ev,val) => {
    const n=Math.min(100,Math.max(0,Number(val)||0));
    setNotas(prev=>({...prev,[uid]:{...prev[uid],[ev]:n}}));
  };
  const promedio = (uid) => {
    if(!evals.length) return "—";
    const notasU=notas[uid]||{};
    let sumaPeso=0,sumaNota=0;
    for(const ev of evals){ sumaNota+=(notasU[ev.nombre]??0)*Number(ev.peso);sumaPeso+=Number(ev.peso); }
    return sumaPeso>0?(sumaNota/sumaPeso).toFixed(1):"0.0";
  };

  const guardar = async () => {
    if(!materiaId) return showToast("Seleccione una materia","error");
    setSaving(true);
    try {
      const payload = {
        curso_id:cursoId,materia_id:materiaId,
        calificaciones:participantes.map(p=>({usuario_id:p.id,notas:notas[p.id]||{}}))
      };
      const res  = await fetch(`${API}/api/calificaciones`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
      showToast("Calificaciones guardadas");
    } catch(e){ showToast(e.message||"Error","error"); } finally{setSaving(false);}
  };

  const notaMin    = evals.length?Number(evals[0].nota_min_apro):70;
  const aprobados  = participantes.filter(p=>Number(promedio(p.id))>=notaMin).length;
  const promGral   = participantes.length?(participantes.reduce((s,p)=>s+Number(promedio(p.id)||0),0)/participantes.length).toFixed(1):"—";

  return (
    <div>
      <div className="edu-tabs">
        <button className={`edu-tab${tab==="libro"?" active":""}`} onClick={()=>setTab("libro")}>📊 Libro de notas</button>
        <button className={`edu-tab${tab==="config"?" active":""}`} onClick={()=>setTab("config")}>⚙️ Evaluaciones</button>
      </div>
      <div style={{padding:"0 26px 26px"}}>
        <SelectorBar cursos={cursos} cursoId={cursoId} setCursoId={setCursoId} loadingCursos={loadingC}
                     materias={materias} materiaId={materiaId} setMateriaId={setMateriaId} loadingMaterias={loadingM}/>

        {tab==="libro" && (
          loadingPart?<Spinner/>:!materiaId?<Empty icon="📊" msg="Seleccione una materia"/>:!participantes.length?<Empty icon="👥" msg="No hay participantes"/>:(
            <>
              <div className="edu-stats-row">
                <div className="edu-stat-mini"><span className="sn">{participantes.length}</span><span className="sl">Estudiantes</span></div>
                <div className="edu-stat-mini green"><span className="sn">{aprobados}</span><span className="sl">Aprobados</span></div>
                <div className="edu-stat-mini red"><span className="sn">{participantes.length-aprobados}</span><span className="sl">Reprobados</span></div>
                <div className="edu-stat-mini orange"><span className="sn">{promGral}</span><span className="sl">Promedio gral.</span></div>
              </div>
              <div className="edu-table-wrap">
                <table className="edu-table">
                  <thead>
                    <tr><th>#</th><th>Participante</th><th>CI</th>
                      {evals.map(ev=><th key={ev.nombre}>{ev.nombre}<br/><span style={{fontSize:10,fontWeight:400,color:"#888"}}>{ev.peso}%</span></th>)}
                      <th>Promedio</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {participantes.map((p,i)=>{
                      const prom=promedio(p.id);const ap=Number(prom)>=notaMin;
                      return (
                        <tr key={p.id}>
                          <td style={{color:"#888"}}>{i+1}</td>
                          <td style={{fontWeight:700,minWidth:180}}>{p.ap_paterno} {p.ap_materno}, {p.nombre}</td>
                          <td style={{color:"#888",fontSize:12}}>{p.ci}</td>
                          {evals.map(ev=>(
                            <td key={ev.nombre}>
                              <input className={`nota-cell ${(notas[p.id]?.[ev.nombre]??0)>=notaMin?"aprobado":"reprobado"}`}
                                type="number" min="0" max="100"
                                value={notas[p.id]?.[ev.nombre]??0}
                                onChange={e=>setNota(p.id,ev.nombre,e.target.value)}/>
                            </td>
                          ))}
                          <td><span className={`promedio-cell ${ap?"ap":"rp"}`}>{prom}</span></td>
                          <td><span className={`edu-badge ${ap?"badge-aprobado":"badge-reprobado"}`}>{ap?"Aprobado":"Reprobado"}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="btn-actions">
                <button className="btn-primary" onClick={guardar} disabled={saving}>{saving?"Guardando...":"💾 Guardar calificaciones"}</button>
              </div>
            </>
          )
        )}

        {tab==="config" && (
          <EvalConfigEditor materiaId={materiaId} evals={evals} setEvals={setEvals} showToast={showToast}/>
        )}
      </div>
    </div>
  );
}

function EvalConfigEditor({ materiaId, evals, setEvals, showToast }) {
  const [editing, setEditing] = useState(evals.map(e=>({...e})));
  useEffect(()=>setEditing(evals.map(e=>({...e}))),[evals]);

  const sumaPesos = editing.reduce((s,e)=>s+Number(e.peso||0),0);
  const valid     = Math.abs(sumaPesos-100)<0.01;

  const guardar = async () => {
    if(!materiaId) return showToast("Seleccione una materia","error");
    if(!valid) return showToast(`Suma de pesos debe ser 100. Actual: ${sumaPesos}`,"error");
    try {
      const res  = await fetch(`${API}/api/eval-config/materia/${materiaId}`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({evaluaciones:editing.map((e,i)=>({...e,orden:i+1}))})});
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
      setEvals(editing); showToast("Configuración guardada");
    } catch(e){ showToast(e.message||"Error","error"); }
  };

  return (
    <div className="edu-form">
      <p style={{color:"#666",fontSize:14,marginBottom:20}}>Configure evaluaciones y pesos para esta materia. La suma de pesos debe ser <strong>100%</strong>.</p>
      {editing.map((ev,i)=>(
        <div key={i} className="edu-form-row" style={{alignItems:"flex-end"}}>
          <div className="edu-form-group">
            <label className="edu-form-label">Evaluación {i+1}</label>
            <input className="edu-form-input" value={ev.nombre} onChange={e=>setEditing(prev=>prev.map((x,j)=>j===i?{...x,nombre:e.target.value}:x))}/>
          </div>
          <div className="edu-form-group" style={{maxWidth:100}}>
            <label className="edu-form-label">Peso (%)</label>
            <input className="edu-form-input" type="number" min="0" max="100" value={ev.peso} onChange={e=>setEditing(prev=>prev.map((x,j)=>j===i?{...x,peso:Number(e.target.value)}:x))}/>
          </div>
          <div className="edu-form-group" style={{maxWidth:120}}>
            <label className="edu-form-label">Nota mín.</label>
            <input className="edu-form-input" type="number" min="0" max="100" value={ev.nota_min_apro} onChange={e=>setEditing(prev=>prev.map((x,j)=>j===i?{...x,nota_min_apro:Number(e.target.value)}:x))}/>
          </div>
          <button className="btn-icon danger" style={{marginBottom:4}} onClick={()=>setEditing(prev=>prev.filter((_,j)=>j!==i))}>✕</button>
        </div>
      ))}
      <div style={{marginBottom:14}}>
        <button className="btn-secondary" onClick={()=>setEditing(prev=>[...prev,{nombre:`Eval. ${prev.length+1}`,peso:0,orden:prev.length+1,nota_min_apro:70,nota_max:100}])}>
          ➕ Agregar evaluación
        </button>
        <span style={{marginLeft:16,fontSize:13,color:valid?"#43a047":"#e53935",fontWeight:700}}>
          Suma pesos: {sumaPesos}% {valid?"✓":"⚠️ debe ser 100%"}
        </span>
      </div>
      <div className="btn-actions">
        <button className="btn-primary" onClick={guardar} disabled={!valid}>💾 Guardar configuración</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MÓDULO 3: PLANIFICACIÓN DOCENTE
// ════════════════════════════════════════════════════════════
function ModuloPlanificacion({ showToast }) {
  const { cursos, loading:loadingC, cursoId, setCursoId } = useCursos();
  const { materias, loading:loadingM, materiaId, setMateriaId } = useMaterias(cursoId);
  const [planes, setPlanes]   = useState([]);
  const [loadingP, setLoadP]  = useState(false);
  const [tab, setTab]         = useState("lista");
  const [form, setForm]       = useState({titulo:"",objetivos:"",docente_id:""});
  const [docentes, setDocentes] = useState([]);

  useEffect(()=>{
    fetch(`${API}/api/usuarios/docentes`).then(r=>r.json()).then(d=>Array.isArray(d)&&setDocentes(d)).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(!materiaId) return;
    setLoadP(true);
    fetch(`${API}/api/planificacion/materia/${materiaId}`)
      .then(r=>r.json()).then(d=>Array.isArray(d)&&setPlanes(d)).catch(()=>setPlanes([])).finally(()=>setLoadP(false));
  },[materiaId]);

  const cambiarEstado = async (id, estado) => {
    try {
      const res = await fetch(`${API}/api/planificacion/${id}/estado`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({estado})});
      const data= await res.json();
      if(!res.ok) throw new Error(data.message);
      showToast(`Planificación ${estado.toLowerCase()}`);
      setPlanes(prev=>prev.map(p=>p.id===id?{...p,estado}:p));
    } catch(e){ showToast(e.message,"error"); }
  };

  const eliminar = async (id) => {
    try {
      const res = await fetch(`${API}/api/planificacion/${id}`,{method:"DELETE"});
      if(!res.ok) throw new Error("Error");
      showToast("Planificación eliminada"); setPlanes(prev=>prev.filter(p=>p.id!==id));
    } catch(e){ showToast(e.message,"error"); }
  };

  const subir = async () => {
    if(!form.titulo.trim()) return showToast("El título es requerido","error");
    if(!materiaId) return showToast("Seleccione una materia","error");
    try {
      const res  = await fetch(`${API}/api/planificacion`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({curso_id:cursoId,materia_id:materiaId,docente_id:form.docente_id||null,titulo:form.titulo,objetivos:form.objetivos})});
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
      showToast("Planificación subida");
      setForm({titulo:"",objetivos:"",docente_id:""}); setTab("lista");
      // refrescar
      const lr = await fetch(`${API}/api/planificacion/materia/${materiaId}`);
      const ld = await lr.json(); if(Array.isArray(ld)) setPlanes(ld);
    } catch(e){ showToast(e.message,"error"); }
  };

  const badgeEstado = e=>e==="APROBADO"?"badge-aprobado":e==="RECHAZADO"?"badge-reprobado":"badge-pendiente";

  return (
    <div>
      <div className="edu-tabs">
        <button className={`edu-tab${tab==="lista"?" active":""}`} onClick={()=>setTab("lista")}>📄 Planificaciones ({planes.length})</button>
        <button className={`edu-tab${tab==="nuevo"?" active":""}`} onClick={()=>setTab("nuevo")}>➕ Subir planificación</button>
      </div>
      <div style={{padding:"0 26px 26px"}}>
        <SelectorBar cursos={cursos} cursoId={cursoId} setCursoId={setCursoId} loadingCursos={loadingC}
                     materias={materias} materiaId={materiaId} setMateriaId={setMateriaId} loadingMaterias={loadingM}/>

        {tab==="lista" && (
          loadingP?<Spinner/>:!materiaId?<Empty icon="📝" msg="Seleccione una materia"/>:!planes.length?<Empty icon="📄" msg="No hay planificaciones para esta materia."/>:
          <div className="edu-table-wrap">
            <table className="edu-table">
              <thead><tr><th>Título</th><th>Docente</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {planes.map(p=>(
                  <tr key={p.id}>
                    <td style={{fontWeight:700}}>{p.titulo}</td>
                    <td>{p.docente_nombre?`${p.docente_ap_paterno} ${p.docente_nombre}`:"—"}</td>
                    <td style={{fontSize:12,color:"#888"}}>{p.creado_en?.slice(0,10)}</td>
                    <td><span className={`edu-badge ${badgeEstado(p.estado)}`}>{p.estado}</span></td>
                    <td style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {p.estado==="PENDIENTE"&&<><button className="btn-icon" onClick={()=>cambiarEstado(p.id,"APROBADO")}>✅ Aprobar</button><button className="btn-icon danger" onClick={()=>cambiarEstado(p.id,"RECHAZADO")}>❌ Rechazar</button></>}
                      <button className="btn-icon danger" onClick={()=>eliminar(p.id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab==="nuevo" && (
          <div className="edu-form">
            <div className="edu-form-row">
              <div className="edu-form-group">
                <label className="edu-form-label">Título <span>*</span></label>
                <input className="edu-form-input" placeholder="Título del sílabo o plan" value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))}/>
              </div>
              <div className="edu-form-group">
                <label className="edu-form-label">Docente</label>
                <select className="edu-form-select" value={form.docente_id} onChange={e=>setForm(p=>({...p,docente_id:e.target.value}))}>
                  <option value="">Sin especificar</option>
                  {docentes.map(d=><option key={d.id} value={d.id}>{d.ap_paterno} {d.ap_materno}, {d.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="edu-form-row single">
              <div className="edu-form-group">
                <label className="edu-form-label">Objetivos de aprendizaje</label>
                <textarea className="edu-form-textarea" placeholder="Objetivos..." value={form.objetivos} onChange={e=>setForm(p=>({...p,objetivos:e.target.value}))}/>
              </div>
            </div>
            <div className="edu-form-row">
              <div className="edu-form-group">
                <label className="edu-form-label">Archivo (sílabo)</label>
                <input className="edu-form-input" type="file" accept=".pdf,.doc,.docx"/>
              </div>
            </div>
            <div className="btn-actions">
              <button className="btn-primary" onClick={subir}>📤 Subir planificación</button>
              <button className="btn-secondary" onClick={()=>setForm({titulo:"",objetivos:"",docente_id:""})}>Limpiar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MÓDULO 4: TAREAS
// ════════════════════════════════════════════════════════════
function ModuloTareas({ showToast }) {
  const { cursos, loading:loadingC, cursoId, setCursoId, participantes } = useCursos();
  const { materias, loading:loadingM, materiaId, setMateriaId } = useMaterias(cursoId);
  const [tareas, setTareas]           = useState([]);
  const [tareaActiva, setTareaActiva] = useState(null);
  const [entregas, setEntregas]       = useState([]);
  const [tab, setTab]                 = useState("lista");
  const [form, setForm]               = useState({titulo:"",descripcion:"",fecha_limite:""});
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);

  useEffect(()=>{
    if(!materiaId) return;
    setLoading(true);
    fetch(`${API}/api/tareas/materia/${materiaId}`)
      .then(r=>r.json()).then(d=>Array.isArray(d)&&setTareas(d)).catch(()=>setTareas([])).finally(()=>setLoading(false));
  },[materiaId]);

  const verEntregas = async (t) => {
    setTareaActiva(t);
    const res  = await fetch(`${API}/api/tareas/${t.id}/entregas`);
    const data = await res.json();
    setEntregas(Array.isArray(data)?data:[]);
    setTab("entregas");
  };

  const guardarEntrega = async (tareaId, usuarioId, fields) => {
    try {
      const res = await fetch(`${API}/api/tareas/${tareaId}/entregas/${usuarioId}`,{
        method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(fields)});
      const data= await res.json();
      if(!res.ok) throw new Error(data.message);
      setEntregas(prev=>prev.map(e=>e.usuario_id===usuarioId?{...e,...fields}:e));
      showToast("Entrega actualizada");
    } catch(e){ showToast(e.message,"error"); }
  };

  const crearTarea = async () => {
    if(!form.titulo.trim()) return showToast("El título es requerido","error");
    if(!materiaId) return showToast("Seleccione una materia","error");
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/tareas`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({curso_id:cursoId,materia_id:materiaId,...form})});
      const data = await res.json();
      if(!res.ok) throw new Error(data.message);
      showToast(`Tarea creada — ${data.entregas_generadas} entregas generadas`);
      setForm({titulo:"",descripcion:"",fecha_limite:""}); setTab("lista");
      const lr = await fetch(`${API}/api/tareas/materia/${materiaId}`);
      const ld = await lr.json(); if(Array.isArray(ld)) setTareas(ld);
    } catch(e){ showToast(e.message,"error"); } finally{setSaving(false);}
  };

  const eliminarTarea = async (id) => {
    if(!confirm("¿Eliminar esta tarea y todas sus entregas?")) return;
    try {
      const res = await fetch(`${API}/api/tareas/${id}`,{method:"DELETE"});
      if(!res.ok) throw new Error("Error");
      showToast("Tarea eliminada"); setTareas(prev=>prev.filter(t=>t.id!==id));
    } catch(e){ showToast(e.message,"error"); }
  };

  return (
    <div>
      <div className="edu-tabs">
        <button className={`edu-tab${tab==="lista"?" active":""}`} onClick={()=>{setTab("lista");setTareaActiva(null);}}>📋 Tareas</button>
        {tareaActiva&&<button className={`edu-tab${tab==="entregas"?" active":""}`} onClick={()=>setTab("entregas")}>📥 Entregas: {tareaActiva.titulo}</button>}
        <button className={`edu-tab${tab==="nueva"?" active":""}`} onClick={()=>setTab("nueva")}>➕ Nueva tarea</button>
      </div>
      <div style={{padding:"0 26px 26px"}}>
        <SelectorBar cursos={cursos} cursoId={cursoId} setCursoId={setCursoId} loadingCursos={loadingC}
                     materias={materias} materiaId={materiaId} setMateriaId={id=>{setMateriaId(id);setTareaActiva(null);setTab("lista");}} loadingMaterias={loadingM}/>

        {tab==="lista" && (
          loading?<Spinner/>:!materiaId?<Empty icon="📋" msg="Seleccione una materia"/>:!tareas.length?<Empty icon="📤" msg="No hay tareas para esta materia."/>:
          <div className="edu-table-wrap">
            <table className="edu-table">
              <thead><tr><th>Tarea</th><th>Fecha límite</th><th>Entregas</th><th>Progreso</th><th>Acciones</th></tr></thead>
              <tbody>
                {tareas.map(t=>{
                  const pct=t.total_entregas>0?Math.round((t.entregadas/t.total_entregas)*100):0;
                  return(
                  <tr key={t.id}>
                    <td style={{fontWeight:700}}>{t.titulo}</td>
                    <td style={{color:t.fecha_limite&&new Date(t.fecha_limite)<new Date()?"#e53935":"#555"}}>{t.fecha_limite||"—"}</td>
                    <td><span className="edu-badge badge-justif">{t.entregadas} / {t.total_entregas}</span></td>
                    <td>
                      <div style={{background:"#eee",borderRadius:8,height:8,width:100,overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:"#43a047",borderRadius:8,transition:"width .3s"}}/>
                      </div>
                      <span style={{fontSize:11,color:"#888"}}>{pct}%</span>
                    </td>
                    <td style={{display:"flex",gap:6}}>
                      <button className="btn-icon" onClick={()=>verEntregas(t)}>📥 Ver entregas</button>
                      <button className="btn-icon danger" onClick={()=>eliminarTarea(t.id)}>🗑</button>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        )}

        {tab==="entregas" && tareaActiva && (
          <>
            <div style={{background:"#f5f7fa",borderRadius:10,padding:"12px 16px",marginBottom:18,fontSize:13}}>
              <strong style={{color:"#003366"}}>{tareaActiva.titulo}</strong>
              {tareaActiva.fecha_limite&&<span style={{color:"#ff6600",marginLeft:12}}>📅 Límite: {tareaActiva.fecha_limite}</span>}
            </div>
            {!entregas.length?<Empty icon="📥" msg="No hay entregas registradas"/>:(
              <div className="edu-table-wrap">
                <table className="edu-table">
                  <thead><tr><th>Participante</th><th>CI</th><th>Estado</th><th>Nota</th><th>Feedback</th><th>Guardar</th></tr></thead>
                  <tbody>
                    {entregas.map(e=>(
                      <tr key={e.usuario_id}>
                        <td style={{fontWeight:700}}>{e.ap_paterno} {e.ap_materno}, {e.nombre}</td>
                        <td style={{color:"#888",fontSize:12}}>{e.ci}</td>
                        <td>
                          <select className="edu-form-select" style={{padding:"4px 8px",fontSize:12}} value={e.estado}
                            onChange={ev=>setEntregas(prev=>prev.map(x=>x.usuario_id===e.usuario_id?{...x,estado:ev.target.value}:x))}>
                            <option value="PENDIENTE">⏳ Pendiente</option>
                            <option value="ENTREGADO">✅ Entregado</option>
                          </select>
                        </td>
                        <td>
                          <input className={`nota-cell ${Number(e.nota)>=70?"aprobado":e.nota?"reprobado":""}`}
                            type="number" min="0" max="100" value={e.nota||""} placeholder="—"
                            disabled={e.estado==="PENDIENTE"}
                            onChange={ev=>setEntregas(prev=>prev.map(x=>x.usuario_id===e.usuario_id?{...x,nota:ev.target.value}:x))}/>
                        </td>
                        <td>
                          <input className="edu-form-input" style={{padding:"5px 10px",fontSize:12}} placeholder="Comentario..."
                            value={e.feedback||""} disabled={e.estado==="PENDIENTE"}
                            onChange={ev=>setEntregas(prev=>prev.map(x=>x.usuario_id===e.usuario_id?{...x,feedback:ev.target.value}:x))}/>
                        </td>
                        <td>
                          <button className="btn-icon" disabled={e.estado==="PENDIENTE"}
                            onClick={()=>guardarEntrega(tareaActiva.id,e.usuario_id,{estado:e.estado,nota:e.nota?Number(e.nota):null,feedback:e.feedback||null})}>
                            💾
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab==="nueva" && (
          <div className="edu-form">
            <div className="edu-form-row">
              <div className="edu-form-group">
                <label className="edu-form-label">Título <span>*</span></label>
                <input className="edu-form-input" placeholder="Ej: Ensayo sobre estrategia..." value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))}/>
              </div>
              <div className="edu-form-group">
                <label className="edu-form-label">Fecha límite</label>
                <input className="edu-form-input" type="date" value={form.fecha_limite} onChange={e=>setForm(p=>({...p,fecha_limite:e.target.value}))}/>
              </div>
            </div>
            <div className="edu-form-row single">
              <div className="edu-form-group">
                <label className="edu-form-label">Descripción / instrucciones</label>
                <textarea className="edu-form-textarea" placeholder="Detalle la tarea..." value={form.descripcion} onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))}/>
              </div>
            </div>
            <div style={{fontSize:13,color:"#888",marginBottom:14}}>
              Se asignará automáticamente a los <strong>{participantes.length}</strong> participantes del curso.
            </div>
            <div className="btn-actions">
              <button className="btn-primary" onClick={crearTarea} disabled={saving}>{saving?"Creando...":"📤 Crear tarea"}</button>
              <button className="btn-secondary" onClick={()=>setForm({titulo:"",descripcion:"",fecha_limite:""})}>Limpiar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MÓDULO 5: HORARIOS (sin cambios de estructura)
// ════════════════════════════════════════════════════════════
const HORAS=["07:00","08:00","09:00","10:00","11:00","14:00","15:00","16:00","17:00"];
const DIAS =["Lunes","Martes","Miércoles","Jueves","Viernes"];
function ModuloHorarios({ showToast }) {
  const { cursos, loading:loadingC, cursoId, setCursoId } = useCursos();
  const { materias, loading:loadingM } = useMaterias(cursoId);
  const [horario, setHorario]   = useState({});
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState({materia_id:"",aula:""});
  return (
    <div style={{padding:"0 26px 26px"}}>
      <CursoSelector cursos={cursos} cursoId={cursoId} onChange={id=>{setCursoId(id);setHorario({});}} loading={loadingC}/>
      <div style={{height:16}}/>
      <div style={{display:"flex",gap:22,flexWrap:"wrap",alignItems:"flex-start"}}>
        <div style={{flex:"1 1 500px",overflowX:"auto"}}>
          <div className="horario-grid">
            <div/>
            {DIAS.map(d=><div key={d} className="dia-header">{d}</div>)}
            {HORAS.map(hora=>(
              <>
                <div key={`h-${hora}`} className="hora-label">{hora}</div>
                {DIAS.map(dia=>{
                  const key=`${hora}-${dia}`,slot=horario[key];
                  return (
                    <div key={key} className={`horario-slot${slot?" ocupado":""}${selected===key?" selected":""}`}
                      onClick={()=>{setSelected(key);setForm(slot?{...slot}:{materia_id:"",aula:""}); }}
                      style={selected===key?{outline:"2px solid #ff6600"}:{}}>
                      {slot?(<><div className="slot-materia">{materias.find(m=>m.id===slot.materia_id)?.nombre||slot.materia_id}</div><div className="slot-aula">{slot.aula}</div></>):<span style={{fontSize:18,color:"#ddd"}}>+</span>}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
        <div style={{flex:"0 0 240px",background:"#f8fafc",borderRadius:12,padding:18,border:"1px solid #eef0f3"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#003366",marginBottom:14}}>{selected?`✏️ ${selected}`:"Selecciona un slot"}</div>
          {selected&&(
            <>
              <div className="edu-form-group" style={{marginBottom:12}}>
                <label className="edu-form-label">Materia</label>
                {loadingM?<Spinner/>:
                  <select className="edu-form-select" value={form.materia_id} onChange={e=>setForm(p=>({...p,materia_id:Number(e.target.value)}))}>
                    <option value="">Seleccionar...</option>
                    {materias.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>}
              </div>
              <div className="edu-form-group" style={{marginBottom:16}}>
                <label className="edu-form-label">Aula</label>
                <select className="edu-form-select" value={form.aula} onChange={e=>setForm(p=>({...p,aula:e.target.value}))}>
                  <option value="">Seleccionar...</option>
                  {["Aula A1","Aula A2","Aula B1","Aula B2","Aula C3","Auditorio"].map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
              <button className="btn-primary" style={{width:"100%",marginBottom:8}} onClick={()=>{
                if(!form.materia_id||!form.aula) return showToast("Complete todos los campos","error");
                setHorario(p=>({...p,[selected]:{...form}}));setSelected(null);showToast("Horario asignado");
              }}>✅ Asignar</button>
              {horario[selected]&&<button className="btn-secondary" style={{width:"100%"}} onClick={()=>{setHorario(p=>{const n={...p};delete n[selected];return n;});setSelected(null);showToast("Slot liberado");}}>🗑 Liberar slot</button>}
            </>
          )}
          {!selected&&<div style={{fontSize:13,color:"#bbb",textAlign:"center",paddingTop:20}}>Haz clic en una celda</div>}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MÓDULO 6: CALENDARIO (sin cambios)
// ════════════════════════════════════════════════════════════
function ModuloCalendario({ showToast }) {
  const [eventos,setEventos]=useState([{id:1,titulo:"Aniversario EAEN",fecha:"2026-03-20",tipo:"festivo",hora:"09:00"}]);
  const [mes,setMes]=useState(new Date(2026,2,1));
  const [dia,setDia]=useState(null);
  const [form,setForm]=useState({titulo:"",fecha:"",tipo:"general",hora:""});
  const [tab,setTab]=useState("calendario");
  const diasEnMes=new Date(mes.getFullYear(),mes.getMonth()+1,0).getDate();
  const primerDia=new Date(mes.getFullYear(),mes.getMonth(),1).getDay();
  const offset=primerDia===0?6:primerDia-1;
  const fechaStr=d=>`${mes.getFullYear()}-${String(mes.getMonth()+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const evDia=d=>eventos.filter(e=>e.fecha===fechaStr(d));
  return (
    <div>
      <div className="edu-tabs">
        <button className={`edu-tab${tab==="calendario"?" active":""}`} onClick={()=>setTab("calendario")}>📅 Vista mensual</button>
        <button className={`edu-tab${tab==="nuevo"?" active":""}`} onClick={()=>setTab("nuevo")}>➕ Nuevo evento</button>
        <button className={`edu-tab${tab==="lista"?" active":""}`} onClick={()=>setTab("lista")}>📋 Lista ({eventos.length})</button>
      </div>
      <div style={{padding:"0 26px 26px"}}>
        {tab==="calendario"&&(
          <div style={{display:"flex",gap:22,flexWrap:"wrap"}}>
            <div className="edu-calendar" style={{flex:"1 1 320px"}}>
              <div className="cal-header">
                <h3 style={{textTransform:"capitalize"}}>{mes.toLocaleDateString("es-BO",{month:"long",year:"numeric"})}</h3>
                <div className="cal-nav">
                  <button onClick={()=>setMes(p=>new Date(p.getFullYear(),p.getMonth()-1,1))}>‹</button>
                  <button onClick={()=>setMes(p=>new Date(p.getFullYear(),p.getMonth()+1,1))}>›</button>
                </div>
              </div>
              <div className="cal-grid">
                {["L","M","X","J","V","S","D"].map(d=><div key={d} className="cal-day-name">{d}</div>)}
                {Array.from({length:offset}).map((_,i)=><div key={`e${i}`}/>)}
                {Array.from({length:diasEnMes},(_,i)=>i+1).map(d=>(
                  <div key={d} className={`cal-day${evDia(d).length?" has-event":""}${dia===d?" selected":""}`} onClick={()=>setDia(d===dia?null:d)}>{d}</div>
                ))}
              </div>
            </div>
            <div style={{flex:"1 1 240px"}}>
              <div style={{fontSize:14,fontWeight:800,color:"#003366",marginBottom:12}}>{dia?`Eventos — ${dia} de ${mes.toLocaleDateString("es-BO",{month:"long"})}`:"Próximos eventos"}</div>
              <div className="cal-events">
                {(dia?evDia(dia):eventos.slice(0,6)).map(ev=>(
                  <div key={ev.id} className="cal-event-item"><div className={`cal-event-dot event-${ev.tipo}`}/><div className="cal-event-title">{ev.titulo}</div><div className="cal-event-time">{ev.hora}</div></div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab==="nuevo"&&(
          <div className="edu-form">
            <div className="edu-form-row">
              <div className="edu-form-group"><label className="edu-form-label">Título <span>*</span></label><input className="edu-form-input" value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))}/></div>
              <div className="edu-form-group"><label className="edu-form-label">Tipo</label><select className="edu-form-select" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))}><option value="examen">📝 Examen</option><option value="tarea">📋 Tarea</option><option value="festivo">🎉 Festivo</option><option value="general">📌 General</option></select></div>
            </div>
            <div className="edu-form-row">
              <div className="edu-form-group"><label className="edu-form-label">Fecha <span>*</span></label><input className="edu-form-input" type="date" value={form.fecha} onChange={e=>setForm(p=>({...p,fecha:e.target.value}))}/></div>
              <div className="edu-form-group"><label className="edu-form-label">Hora</label><input className="edu-form-input" type="time" value={form.hora} onChange={e=>setForm(p=>({...p,hora:e.target.value}))}/></div>
            </div>
            <div className="btn-actions">
              <button className="btn-primary" onClick={()=>{if(!form.titulo||!form.fecha)return showToast("Título y fecha requeridos","error");setEventos(p=>[...p,{id:Date.now(),...form}]);setForm({titulo:"",fecha:"",tipo:"general",hora:""});showToast("Evento agregado");setTab("calendario");}}>➕ Agregar evento</button>
            </div>
          </div>
        )}
        {tab==="lista"&&(
          <div className="edu-table-wrap"><table className="edu-table"><thead><tr><th>Título</th><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Acciones</th></tr></thead>
          <tbody>{[...eventos].sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(ev=>(
            <tr key={ev.id}><td style={{fontWeight:700}}>{ev.titulo}</td><td>{ev.fecha}</td><td>{ev.hora||"—"}</td>
            <td><span className={`edu-badge ${ev.tipo==="examen"?"badge-reprobado":ev.tipo==="festivo"?"badge-presente":"badge-justif"}`}>{ev.tipo}</span></td>
            <td><button className="btn-icon danger" onClick={()=>{setEventos(p=>p.filter(e=>e.id!==ev.id));showToast("Evento eliminado");}}>🗑</button></td></tr>
          ))}</tbody></table></div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MÓDULOS CONFIG
// ════════════════════════════════════════════════════════════
const MODULOS = [
  {id:"materias",     icon:"📚",title:"Gestión de Materias",     desc:"Crea y administra materias del curso. Asigna docentes a cada una.",                         tags:["Por curso","Docentes","CRUD"]},
  {id:"asistencia",   icon:"📋",title:"Control de Asistencia",   desc:"Registro por materia y fecha. Presentes, ausentes, tardanzas y justificados.",              tags:["Por materia","Tiempo real","Historial"]},
  {id:"calificaciones",icon:"📊",title:"Libro de Calificaciones",desc:"Evaluaciones configurables por materia. Promedio ponderado y estado automático.",           tags:["Por materia","Ponderado","Configurable"]},
  {id:"planificacion", icon:"📝",title:"Planificación Docente",  desc:"Sílabos y objetivos por materia. Flujo de aprobación integrado.",                           tags:["Por materia","Aprobación","Docentes"]},
  {id:"horarios",     icon:"🗓",title:"Gestión de Horarios",    desc:"Grid semanal interactivo. Asigna materias reales del curso a cada bloque horario.",           tags:["Por materia","Anti-conflicto","Visual"]},
  {id:"tareas",       icon:"📤",title:"Módulo de Tareas",       desc:"Crea tareas por materia. Entregas y calificación individual por participante.",               tags:["Por materia","Entregas","Feedback"]},
  {id:"calendario",   icon:"📅",title:"Calendario Institucional",desc:"Eventos, exámenes y días festivos. Vista mensual con gestión por tipo.",                    tags:["Exámenes","Festivos","Eventos"]},
];

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function GestionEducativa() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modulo, setModulo]           = useState(null);
  const [toast, setToast]             = useState(null);
  const showToast = useCallback((msg,type="ok")=>setToast({msg,type}),[]);

  useEffect(()=>{ if(!localStorage.getItem("eaen_session")) navigate("/",{replace:true}); },[navigate]);

  const isActive      = path => location.pathname===path;
  const moduloActual  = MODULOS.find(m=>m.id===modulo);

  const renderSubmodulo = () => {
    switch(modulo){
      case "materias":      return <ModuloMaterias        showToast={showToast}/>;
      case "asistencia":    return <ModuloAsistencia      showToast={showToast}/>;
      case "calificaciones":return <ModuloCalificaciones  showToast={showToast}/>;
      case "planificacion": return <ModuloPlanificacion   showToast={showToast}/>;
      case "horarios":      return <ModuloHorarios        showToast={showToast}/>;
      case "tareas":        return <ModuloTareas          showToast={showToast}/>;
      case "calendario":    return <ModuloCalendario      showToast={showToast}/>;
      default:              return null;
    }
  };

  return (
    <div className="eaen-edu-page">
      <nav className={`eaen-sidebar${sidebarOpen?" open":""}`}>
        <h2>Panel Jefe de Estudios</h2>
        <ul>
          <li><button className={`eaen-navlink${isActive("/gestion-usuarios")?" active":""}`} onClick={()=>navigate("/gestion-usuarios")}>👥 Gestión de Usuarios</button></li>
          <li><button className={`eaen-navlink${isActive("/gestion-cursos")?" active":""}`} onClick={()=>navigate("/gestion-cursos")}>📚 Gestión de Cursos</button></li>
          <li><button className={`eaen-navlink${isActive("/gestion-notificaciones")?" active":""}`} onClick={()=>navigate("/gestion-notificaciones")}>🔔 Gestión de Notificaciones</button></li>
          <li><button className={`eaen-navlink${isActive("/gestion-educativa")?" active":""}`} onClick={()=>navigate("/gestion-educativa")}>🎓 Gestión Educativa</button></li>
        </ul>
      </nav>
      <button className="eaen-sidebar-toggle" onClick={()=>setSidebarOpen(v=>!v)}>☰</button>
      <div className="eaen-main">
        <header className="eaen-header">
          <img src="/eaen.png" alt="Logo EAEN" className="eaen-header-logo"/>
          <h1>Gestión Educativa — EAEN Avaroa</h1>
          <div className="eaen-profile">
            <div className="eaen-avatar">JE</div><span>Jefe de Estudios</span>
            <button className="eaen-logout" onClick={()=>{localStorage.removeItem("eaen_session");navigate("/");}}>Logout</button>
          </div>
        </header>

        {modulo&&(
          <div className="edu-breadcrumb">
            <button onClick={()=>setModulo(null)}>🎓 Gestión Educativa</button>
            <span>›</span>
            <span style={{color:"#003366",fontWeight:700}}>{moduloActual?.icon} {moduloActual?.title}</span>
          </div>
        )}

        {!modulo&&(
          <>
            <div style={{marginBottom:22,fontSize:14,color:"#555"}}>
              Seleccione un módulo. <strong>Empiece por "Gestión de Materias"</strong> para agregar materias al curso y asignar docentes.
            </div>
            <div className="edu-modules-grid">
              {MODULOS.map(m=>(
                <div key={m.id} className={`edu-module-card${m.id==="materias"?" highlighted":""}`} onClick={()=>setModulo(m.id)}>
                  <div className="edu-module-icon">{m.icon}</div>
                  <h3>{m.title}</h3><p>{m.desc}</p>
                  <div className="edu-module-tags">{m.tags.map(t=><span key={t} className="edu-tag">{t}</span>)}</div>
                  <button className="edu-module-btn" onClick={e=>{e.stopPropagation();setModulo(m.id);}}>Acceder →</button>
                </div>
              ))}
            </div>
          </>
        )}

        {modulo&&moduloActual&&(
          <div className="edu-submodule">
            <div className="edu-submodule-header">
              <h2>{moduloActual.icon} {moduloActual.title}</h2>
              <button className="btn-secondary" onClick={()=>setModulo(null)} style={{fontSize:13}}>← Volver</button>
            </div>
            {renderSubmodulo()}
          </div>
        )}

        <footer className="eaen-footer"><p>&copy; 2026 Escuela de Altos Estudios Nacionales.</p></footer>
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}