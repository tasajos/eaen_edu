import { useEffect, useState } from "react";

export default function App() {
  const [data, setData] = useState(null);
  const api = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${api}/api/health`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setData({ error: e.message }));
  }, [api]);

  return (
    <div style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>EAEN - Sistema Educativo</h1>
      <p>Conexión Frontend ↔ Backend</p>
      <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
