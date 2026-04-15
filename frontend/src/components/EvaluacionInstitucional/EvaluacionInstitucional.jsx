import { useState, useEffect } from "react";
import "./EvaluacionInstitucional.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const OPCIONES = [
  { valor: 100, label: "Siempre",       color: "#2e7d32", bg: "#e8f5e9" },
  { valor: 75,  label: "Casi siempre",  color: "#1565c0", bg: "#e3f2fd" },
  { valor: 50,  label: "A veces",       color: "#e65100", bg: "#fff3e0" },
  { valor: 25,  label: "Casi nunca",    color: "#c62828", bg: "#ffebee" },
  { valor: 0,   label: "Nunca",         color: "#6d4c41", bg: "#efebe9" },
];

/* ── Formulario de una evaluación específica ─────────────── */
function FormEvaluacion({ periodo, evaluado, indicadores, onEnviada, onCancelar }){
  const [valores, setValores] = useState(
    Object.fromEntries(indicadores.map(i => [i.id, 100]))
  );
  const [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const session = (() => {
    try{ return JSON.parse(localStorage.getItem("eaen_session")||"null"); }catch{ return null; }
  })();

  const promedio = Math.round(Object.values(valores).reduce((a,v)=>a+v,0)/indicadores.length);
  const colorProm = promedio>=80?"#2e7d32":promedio>=60?"#e65100":"#c62828";

  const enviar = async () => {
    setEnviando(true); setError("");
    try {
      const r = await fetch(`${API}/eval-inst/responder`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          periodo_id: periodo.id,
          evaluador_id: session?.id,
          evaluado_id: evaluado?.id || null,
          valoraciones: indicadores.map(i=>({indicador_id:i.id, valor:valores[i.id]})),
          observaciones: obs
        })
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.message);
      onEnviada();
    } catch(e){ setError(e.message); setEnviando(false); }
  };

  return (
    <div className="ev-form-page">
      {/* Cabecera del formulario */}
      <div className="ev-form-header">
        <button className="ev-back-btn" onClick={onCancelar}>← Volver</button>
        <div className="ev-form-info">
          <div className="ev-form-tipo">{periodo.tipo==="CURSANTE_A_CURSANTE"?"👥 Evaluación entre cursantes":"⭐ Evaluación al docente"}</div>
          <h2 className="ev-form-titulo">{periodo.titulo || periodo.plantilla_titulo}</h2>
          {evaluado && (
            <div className="ev-evaluado-chip">
              <span className="ev-eval-avatar">{evaluado.ap_paterno?.[0]||"?"}</span>
              Evaluando a: <strong>{evaluado.ap_paterno} {evaluado.ap_materno}, {evaluado.nombre}</strong>
              {evaluado.grado && <span className="ev-eval-grado">{evaluado.grado}</span>}
            </div>
          )}
        </div>
        <div className="ev-prom-badge" style={{borderColor:colorProm,color:colorProm}}>
          <div className="ev-prom-num">{promedio}</div>
          <div className="ev-prom-lbl">Promedio</div>
        </div>
      </div>

      {/* Leyenda de opciones */}
      <div className="ev-leyenda">
        {OPCIONES.map(o=>(
          <div key={o.valor} className="ev-ley-item" style={{background:o.bg,color:o.color}}>
            <span className="ev-ley-val">{o.valor}</span>
            <span className="ev-ley-lbl">{o.label}</span>
          </div>
        ))}
      </div>

      {/* Indicadores */}
      <div className="ev-indicadores">
        {indicadores.map((ind,i)=>{
          const val = valores[ind.id];
          const opc = OPCIONES.find(o=>o.valor===val) || OPCIONES[0];
          return (
            <div key={ind.id} className="ev-ind-row">
              <div className="ev-ind-nro">{i+1}</div>
              <div className="ev-ind-texto">{ind.texto}</div>
              <div className="ev-ind-opciones">
                {OPCIONES.map(o=>(
                  <button key={o.valor}
                    className={`ev-opc-btn ${val===o.valor?"selected":""}`}
                    style={val===o.valor?{background:o.bg,borderColor:o.color,color:o.color}:{}}
                    onClick={()=>setValores(p=>({...p,[ind.id]:o.valor}))}>
                    <span className="ev-opc-val">{o.valor}</span>
                    <span className="ev-opc-lbl">{o.label}</span>
                  </button>
                ))}
              </div>
              {/* Barra visual */}
              <div className="ev-ind-bar-wrap">
                <div className="ev-ind-bar" style={{width:`${val}%`,background:opc.color}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Observaciones */}
      <div className="ev-obs-section">
        <label className="ev-obs-label">💬 Observaciones (opcional)</label>
        <textarea rows={3} className="ev-obs-input"
          placeholder="Agregue cualquier comentario adicional..."
          value={obs} onChange={e=>setObs(e.target.value)}/>
      </div>

      {error && <div className="ev-error">⚠️ {error}</div>}

      <div className="ev-footer">
        <div className="ev-footer-prom">
          Promedio: <strong style={{color:colorProm}}>{promedio}/100</strong>
        </div>
        <button className="ev-btn-enviar" onClick={enviar} disabled={enviando}>
          {enviando?"Enviando...":"✅ Enviar evaluación"}
        </button>
        <button className="ev-btn-cancel" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL — para insertar en DashboardCursante
   Uso: <EvaluacionInstitucional usuarioId={session.id}/>
══════════════════════════════════════════════════════════ */
export default function EvaluacionInstitucional({ usuarioId }){
  const [pendientes,   setPendientes]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [indicadores,  setIndicadores]  = useState([]);
  const [evaluando,    setEvaluando]    = useState(null);  // {periodo, evaluado}
  const [completadas,  setCompletadas]  = useState([]);    // ids de respuestas completadas esta sesión

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/eval-inst/pendientes/${usuarioId}`);
      const d = await r.json();
      if(Array.isArray(d)) setPendientes(d);
    } catch{}
    finally { setLoading(false); }
  };

  useEffect(()=>{ if(usuarioId) cargar(); },[usuarioId]);

  const iniciarEval = async (periodo, evaluado=null) => {
    // Cargar indicadores de la plantilla
    const r = await fetch(`${API}/eval-inst/plantillas/${periodo.plantilla_id}/indicadores`);
    const d = await r.json();
    setIndicadores(Array.isArray(d)?d:[]);
    setEvaluando({periodo, evaluado});
  };

  const onEnviada = () => {
    setCompletadas(p=>[...p, `${evaluando.periodo.id}-${evaluando.evaluado?.id||"null"}`]);
    setEvaluando(null);
    cargar();
  };

  if(evaluando){
    return <FormEvaluacion
      periodo={evaluando.periodo}
      evaluado={evaluando.evaluado}
      indicadores={indicadores}
      onEnviada={onEnviada}
      onCancelar={()=>setEvaluando(null)}
    />;
  }

  if(loading) return (
    <div className="ev-loading">
      <div className="ev-ring"/>
      <p>Cargando evaluaciones...</p>
    </div>
  );

  if(!pendientes.length) return (
    <div className="ev-sin-pendientes">
      <div className="ev-sp-icon">🎉</div>
      <h3>¡Todo al día!</h3>
      <p>No tiene evaluaciones institucionales pendientes.</p>
    </div>
  );

  return (
    <div className="ev-lista">
      <div className="ev-lista-header">
        <h3>📋 Evaluaciones institucionales pendientes</h3>
        <span className="ev-badge-count">{pendientes.reduce((a,p)=>
          a+(p.tipo==="CURSANTE_A_CURSANTE"?p.pendientes.length:1),0)} pendientes</span>
      </div>

      {pendientes.map(periodo => (
        <div key={periodo.id} className="ev-periodo-card">
          <div className="ev-periodo-header">
            <div className={`ev-periodo-tipo ${periodo.tipo==="CURSANTE_A_CURSANTE"?"tipo-par":"tipo-doc"}`}>
              {periodo.tipo==="CURSANTE_A_CURSANTE"?"👥 Evaluación entre cursantes":"⭐ Evaluación al docente"}
            </div>
            <div className="ev-periodo-info">
              <div className="ev-periodo-titulo">{periodo.titulo || periodo.plantilla_titulo}</div>
              <div className="ev-periodo-meta">
                {periodo.curso_nombre}
                {periodo.materia_nombre && <> · {periodo.materia_nombre}</>}
                {periodo.fecha_fin && <> · Límite: {new Date(periodo.fecha_fin).toLocaleDateString("es-BO")}</>}
              </div>
            </div>
          </div>

          {/* CURSANTE A CURSANTE — lista de pares */}
          {periodo.tipo==="CURSANTE_A_CURSANTE" && (
            <div className="ev-pares-lista">
              {periodo.pendientes.map(par => {
                const clave = `${periodo.id}-${par.id}`;
                const hecho = completadas.includes(clave);
                return (
                  <div key={par.id} className={`ev-par-row ${hecho?"hecho":""}`}>
                    <div className="ev-par-avatar">{par.ap_paterno?.[0]||"?"}</div>
                    <div className="ev-par-info">
                      <div className="ev-par-nombre">{par.ap_paterno} {par.ap_materno}, {par.nombre}</div>
                      <div className="ev-par-ci">CI: {par.ci}{par.grado&&` · ${par.grado}`}</div>
                    </div>
                    {hecho ? (
                      <span className="ev-hecho-badge">✅ Enviado</span>
                    ) : (
                      <button className="ev-btn-evaluar" onClick={()=>iniciarEval(periodo,par)}>
                        Evaluar →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* CURSANTE A DOCENTE */}
          {periodo.tipo==="CURSANTE_A_DOCENTE" && (
            <div className="ev-docente-cta">
              <div className="ev-docente-icon">👨‍🏫</div>
              <div>
                <div className="ev-docente-titulo">Evaluación del docente</div>
                <div className="ev-docente-materia">{periodo.materia_nombre || "Materia asignada"}</div>
              </div>
              <button className="ev-btn-evaluar ev-btn-lg" onClick={()=>iniciarEval(periodo,null)}>
                Iniciar evaluación →
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
