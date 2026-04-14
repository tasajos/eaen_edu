import { useState, useEffect } from "react";
import "./Modulodisciplina.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function fmtFecha(f){
  if(!f) return "—";
  const d = f instanceof Date ? f : new Date(String(f).slice(0,10)+"T12:00:00");
  if(isNaN(d)) return "—";
  return d.toLocaleDateString("es-BO",{day:"2-digit",month:"2-digit",year:"numeric"});
}

const TIPO_STYLE = {
  MERITO:   { bg:"#e8f5e9", border:"#2e7d32", text:"#2e7d32", icon:"⭐", label:"Mérito"   },
  DEMERITO: { bg:"#ffebee", border:"#c62828", text:"#c62828", icon:"⚠️", label:"Demérito" },
};

/* ══════════════════════════════════════════════════════════
   VistaDisciplinaCursante — Vista personal del cursante
══════════════════════════════════════════════════════════ */
export default function VistaDisciplinaCursante({ session, cursoId }) {
  const [registros, setRegistros] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filtro,    setFiltro]    = useState("TODOS");

  useEffect(()=>{
    if(!session?.id || !cursoId) return;
    fetch(`${API}/api/disciplina/registros?curso_id=${cursoId}&usuario_id=${session.id}`)
      .then(r=>r.json())
      .then(d=>{ if(Array.isArray(d)) setRegistros(d); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[session?.id, cursoId]);

  const meritos   = registros.filter(r=>r.tipo==="MERITO");
  const demeritos = registros.filter(r=>r.tipo==="DEMERITO");
  const ptsMeritos   = meritos.reduce((s,r)=>s+Number(r.puntos),0);
  const ptsDemeritos = demeritos.reduce((s,r)=>s+Number(r.puntos),0);
  const saldo = ptsMeritos - ptsDemeritos;

  const filtrados = filtro==="TODOS" ? registros
    : registros.filter(r=>r.tipo===filtro);

  if(loading) return <div className="disc-spinner"><div className="disc-ring"/></div>;

  return (
    <div className="disc-wrap">
      {/* Resumen personal */}
      <div style={{
        background:"#fff", borderRadius:16, padding:"20px 24px",
        border:"1.5px solid #eef2f7",
        boxShadow:"0 2px 16px rgba(0,51,102,.07)"
      }}>
        <div style={{fontSize:15,fontWeight:700,color:"#003366",marginBottom:14}}>
          ⚖️ Mi estado disciplinario
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {/* Méritos */}
          <div style={{
            flex:1, minWidth:130, background:"#e8f5e9", borderRadius:12,
            padding:"14px 16px", border:"1.5px solid #a5d6a7",
            display:"flex", alignItems:"center", gap:12
          }}>
            <span style={{fontSize:28}}>⭐</span>
            <div>
              <div style={{fontSize:24,fontWeight:900,color:"#2e7d32",fontFamily:"'IBM Plex Mono',monospace"}}>{ptsMeritos.toFixed(1)}</div>
              <div style={{fontSize:11,color:"#5a6a80",marginTop:2}}>Puntos de méritos</div>
              <div style={{fontSize:11,color:"#2e7d32",fontWeight:600}}>{meritos.length} registro{meritos.length!==1?"s":""}</div>
            </div>
          </div>

          {/* Deméritos */}
          <div style={{
            flex:1, minWidth:130, background:"#ffebee", borderRadius:12,
            padding:"14px 16px", border:"1.5px solid #ef9a9a",
            display:"flex", alignItems:"center", gap:12
          }}>
            <span style={{fontSize:28}}>⚠️</span>
            <div>
              <div style={{fontSize:24,fontWeight:900,color:"#c62828",fontFamily:"'IBM Plex Mono',monospace"}}>{ptsDemeritos.toFixed(1)}</div>
              <div style={{fontSize:11,color:"#5a6a80",marginTop:2}}>Puntos de deméritos</div>
              <div style={{fontSize:11,color:"#c62828",fontWeight:600}}>{demeritos.length} registro{demeritos.length!==1?"s":""}</div>
            </div>
          </div>

          {/* Saldo neto */}
          <div style={{
            flex:1, minWidth:130,
            background: saldo>0?"#f0f4ff":saldo<0?"#fff3e0":"#f5f5f5",
            borderRadius:12, padding:"14px 16px",
            border:`1.5px solid ${saldo>0?"#c5cae9":saldo<0?"#ffcc80":"#e0e0e0"}`,
            display:"flex", alignItems:"center", gap:12
          }}>
            <span style={{fontSize:28}}>{saldo>0?"🏆":saldo<0?"📉":"⚖️"}</span>
            <div>
              <div style={{
                fontSize:24,fontWeight:900,fontFamily:"'IBM Plex Mono',monospace",
                color:saldo>0?"#003366":saldo<0?"#e65100":"#9e9e9e"
              }}>
                {saldo>0?"+":""}{saldo.toFixed(1)}
              </div>
              <div style={{fontSize:11,color:"#5a6a80",marginTop:2}}>Saldo neto</div>
              <div style={{
                fontSize:11,fontWeight:700,marginTop:1,
                color:saldo>0?"#2e7d32":saldo<0?"#c62828":"#9e9e9e"
              }}>
                {saldo>0?"👍 Favorable":saldo<0?"👎 Desfavorable":"Sin registros"}
              </div>
            </div>
          </div>
        </div>

        {/* Barra visual */}
        {(ptsMeritos > 0 || ptsDemeritos > 0) && (
          <div style={{marginTop:16}}>
            <div style={{fontSize:11.5,color:"#6b7a90",marginBottom:6,fontWeight:600}}>
              Distribución de puntos
            </div>
            <div style={{display:"flex",height:10,borderRadius:10,overflow:"hidden",background:"#f0f4f8"}}>
              {ptsMeritos>0 && (
                <div style={{
                  width:`${(ptsMeritos/(ptsMeritos+ptsDemeritos))*100}%`,
                  background:"#2e7d32", transition:"width .5s"
                }}/>
              )}
              {ptsDemeritos>0 && (
                <div style={{
                  width:`${(ptsDemeritos/(ptsMeritos+ptsDemeritos))*100}%`,
                  background:"#c62828", transition:"width .5s"
                }}/>
              )}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              <span style={{fontSize:10.5,color:"#2e7d32",fontWeight:700}}>⭐ Méritos: {ptsMeritos.toFixed(1)} pts</span>
              <span style={{fontSize:10.5,color:"#c62828",fontWeight:700}}>Deméritos: {ptsDemeritos.toFixed(1)} pts ⚠️</span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de registros */}
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:14,fontWeight:700,color:"#003366"}}>
            Mis registros ({registros.length})
          </div>
          <div style={{display:"flex",gap:6}}>
            {[["TODOS","Todos"],["MERITO","⭐ Méritos"],["DEMERITO","⚠️ Deméritos"]].map(([v,l])=>(
              <button key={v}
                className={`disc-filter-btn ${filtro===v?"active":""}`}
                onClick={()=>setFiltro(v)}>{l}
              </button>
            ))}
          </div>
        </div>

        {!filtrados.length ? (
          <div className="disc-empty">
            <span>{filtro==="MERITO"?"⭐":filtro==="DEMERITO"?"⚠️":"⚖️"}</span>
            <p>{filtro==="TODOS"
              ? "No tienes registros de disciplina aún."
              : `No tienes ${filtro==="MERITO"?"méritos":"deméritos"} registrados.`}
            </p>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtrados.map(r => {
              const st = TIPO_STYLE[r.tipo];
              return (
                <div key={r.id} className="disc-reg-row"
                  style={{borderLeft:`4px solid ${st.border}`, background:st.bg}}>
                  <div style={{flexShrink:0,fontSize:22}}>{st.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#1a2535"}}>{r.descripcion}</div>
                    <div style={{display:"flex",gap:10,marginTop:4,flexWrap:"wrap"}}>
                      {r.catalogo_nombre && (
                        <span style={{fontSize:11.5,color:"#5a6a80"}}>
                          📂 {r.catalogo_nombre}
                        </span>
                      )}
                      <span style={{fontSize:11.5,color:"#5a6a80"}}>📆 {fmtFecha(r.fecha)}</span>
                      {r.observacion && (
                        <span style={{fontSize:11.5,color:"#5a6a80"}}>💬 {r.observacion}</span>
                      )}
                    </div>
                  </div>
                  <div style={{
                    flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4
                  }}>
                    <div style={{
                      fontWeight:900, fontSize:15, color:st.text,
                      fontFamily:"'IBM Plex Mono',monospace",
                      background:"rgba(255,255,255,.8)", padding:"4px 10px",
                      borderRadius:8, border:`1.5px solid ${st.border}`
                    }}>
                      {st.icon} {Number(r.puntos).toFixed(1)} pts
                    </div>
                    <div style={{
                      fontSize:10.5, color:"rgba(0,0,0,.4)",
                      background:"rgba(255,255,255,.6)", padding:"2px 6px", borderRadius:6
                    }}>
                      {st.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}