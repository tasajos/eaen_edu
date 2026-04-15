import { useState, useEffect, useCallback } from "react";
import "./Modulodisciplina.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ══════════════════════════════════════════════════════════
   ConfigDisciplina — Para Jefe de Unidad (Jefe de Estudios)
   Permite configurar el % de disciplina por materia
══════════════════════════════════════════════════════════ */
export default function ConfigDisciplina({ cursoId, cursoDetalle, session }) {
  const [materias, setMaterias] = useState([]);
  const [config,   setConfig]   = useState({}); // materia_id → porcentaje
  const [saving,   setSaving]   = useState({});
  const [toast,    setToast]    = useState(null);
  const [loading,  setLoading]  = useState(true);

  const showToast = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const cargar = useCallback(async () => {
    if(!cursoId) return;
    setLoading(true);
    try {
      const [mats, cfgs] = await Promise.all([
        fetch(`${API}/cursos/${cursoId}/materias`).then(r=>r.json()),
        fetch(`${API}/disciplina/config/${cursoId}`).then(r=>r.json()),
      ]);
      if(Array.isArray(mats)) setMaterias(mats);
      if(Array.isArray(cfgs)){
        const map = {};
        cfgs.forEach(c => { map[c.materia_id] = String(c.porcentaje); });
        setConfig(map);
      }
    } catch{}
    setLoading(false);
  },[cursoId]);

  useEffect(()=>{ cargar(); },[cargar]);

  const guardar = async (materiaId) => {
    setSaving(p=>({...p,[materiaId]:true}));
    try {
      const r = await fetch(`${API}/disciplina/config`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          curso_id:   cursoId,
          materia_id: materiaId,
          porcentaje: Number(config[materiaId]||0),
          creado_por: session?.id,
        })
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.message);
      showToast("✅ Porcentaje guardado");
    } catch(e){ showToast(`❌ ${e.message}`,"error"); }
    setSaving(p=>({...p,[materiaId]:false}));
  };

  return (
    <div className="disc-wrap">
      <div className="disc-topbar">
        <div>
          <h2 className="disc-title">⚙️ Configuración de Disciplina</h2>
          <p className="disc-subtitle">
            Define qué porcentaje de la nota final de cada materia corresponde al comportamiento disciplinario del cursante.
          </p>
        </div>
      </div>

      {/* Explicación */}
      <div style={{
        background:"#fff8e1", border:"1.5px solid #ffe082",
        borderRadius:12, padding:"14px 18px",
        display:"flex", gap:12, alignItems:"flex-start"
      }}>
        <span style={{fontSize:22, flexShrink:0}}>ℹ️</span>
        <div style={{fontSize:13, color:"#5a6a80", lineHeight:1.6}}>
          <strong style={{color:"#1a2535"}}>Cómo funciona el ajuste por disciplina:</strong><br/>
          Si configuras un <strong>10%</strong> para una materia, el saldo de disciplina del cursante
          (méritos menos deméritos, escala 0-10 pts) ajusta la nota final en ese porcentaje.
          Un cursante con <strong>+5 pts netos</strong> recibirá un bono de hasta <strong>+5 puntos</strong> en la nota final.
          Un cursante con <strong>-3 pts netos</strong> recibirá un descuento proporcional.
        </div>
      </div>

      {loading ? (
        <div className="disc-spinner"><div className="disc-ring"/></div>
      ) : !materias.length ? (
        <div className="disc-empty"><span>📚</span><p>No hay materias configuradas en este curso.</p></div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {materias.map(m => {
            const pct = config[m.id] ?? "0";
            const pctNum = Number(pct);
            return (
              <div key={m.id} style={{
                background:"#fff", borderRadius:14, padding:"16px 20px",
                border:"1.5px solid #eef2f7",
                boxShadow:"0 2px 10px rgba(0,51,102,.06)",
                display:"flex", alignItems:"center", gap:16, flexWrap:"wrap"
              }}>
                {/* Info materia */}
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontSize:15,fontWeight:700,color:"#1a2535"}}>{m.nombre}</div>
                  {m.docente_nombre && (
                    <div style={{fontSize:12,color:"#6b7a90",marginTop:3}}>
                      👨‍🏫 {m.docente_ap_paterno} {m.docente_ap_materno}, {m.docente_nombre}
                    </div>
                  )}
                </div>

                {/* Slider + input */}
                <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
                  <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"center"}}>
                    <label style={{fontSize:11,color:"#6b7a90",textTransform:"uppercase",letterSpacing:".5px",fontWeight:700}}>
                      % Disciplina
                    </label>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <input
                        type="range" min="0" max="30" step="1"
                        value={pct}
                        onChange={e=>setConfig(p=>({...p,[m.id]:e.target.value}))}
                        style={{width:120, accentColor:"#003366"}}
                      />
                      <div style={{
                        width:52, height:36, background: pctNum>0?"#003366":"#f0f4f8",
                        color: pctNum>0?"#fff":"#8898aa",
                        borderRadius:9, display:"flex", alignItems:"center",
                        justifyContent:"center", fontWeight:900,
                        fontSize:16, fontFamily:"'IBM Plex Mono',monospace",
                        border:`2px solid ${pctNum>0?"#003366":"#e8ecf2"}`
                      }}>
                        {pct}%
                      </div>
                    </div>
                  </div>

                  {/* Indicador visual */}
                  <div style={{
                    padding:"6px 12px", borderRadius:9,
                    background: pctNum===0?"#f5f5f5":pctNum<=10?"#e8f5e9":pctNum<=20?"#fff8e1":"#fff3e0",
                    border:`1.5px solid ${pctNum===0?"#e8ecf2":pctNum<=10?"#a5d6a7":pctNum<=20?"#ffe082":"#ffcc80"}`,
                    fontSize:12, fontWeight:700, textAlign:"center", minWidth:80,
                    color: pctNum===0?"#9e9e9e":pctNum<=10?"#2e7d32":pctNum<=20?"#f57f17":"#e65100"
                  }}>
                    {pctNum===0 ? "Sin efecto"
                     : pctNum<=5  ? "Leve"
                     : pctNum<=15 ? "Moderado"
                     : "Significativo"}
                  </div>

                  <button
                    className="disc-btn-primary"
                    style={{padding:"8px 18px",fontSize:13}}
                    onClick={()=>guardar(m.id)}
                    disabled={saving[m.id]}
                  >
                    {saving[m.id]?"Guardando...":"💾 Guardar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className={`disc-toast ${toast.type==="error"?"disc-toast-error":""}`}>{toast.msg}</div>
      )}
    </div>
  );
}
