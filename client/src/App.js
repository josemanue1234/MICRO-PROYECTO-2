import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const WS_URL = "ws://192.168.1.73:8080"; // Cambia TU_IP_LOCAL por la IP de tu servidor

function App() {
  const ws = useRef(null);

  const [pantalla, setPantalla] = useState("login");
  const [nombre, setNombre] = useState("");
  const [jugadores, setJugadores] = useState([]);
  const [miTurno, setMiTurno] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [historial, setHistorial] = useState([]);
  const [numero, setNumero] = useState("");

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      switch (msg.tipo) {
        case "jugadores":
          setJugadores(msg.datos);
          break;
        case "juego_iniciado":
          setPantalla("juego");
          setHistorial([]);
          setMensaje("");
          setMiTurno(false);
          break;
        case "tu_turno":
          setMiTurno(true);
          setMensaje("¡Es tu turno! Ingresa un número.");
          break;
        case "resultado":
          setMensaje("Tu número es " + msg.datos);
          break;
        case "info":
          setHistorial((h) => [...h, msg.datos]);
          setMensaje("Esperando al otro jugador...");
          setMiTurno(false);
          break;
        case "ganador":
          setPantalla("ganador");
          setMensaje("🎉 ¡Felicidades " + msg.datos + ", has ganado! 🎉");
          setMiTurno(false);
          break;
        case "error":
          alert(msg.datos);
          setPantalla("login");
          break;
        default:
          break;
      }
    };

    ws.current.onclose = () => {
      setMensaje("Conexión perdida con el servidor.");
      setMiTurno(false);
      setPantalla("login");
      setJugadores([]);
      setHistorial([]);
    };

    return () => ws.current.close();
  }, []);

  function enviar(tipo, datos) {
    if (ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ tipo, datos }));
    }
  }

  function login() {
    if (!nombre.trim()) return alert("Escribe tu nombre");
    enviar("login", { nombre });
    setPantalla("esperando");
  }

  function adivinar() {
    if (!numero.trim()) return;
    enviar("adivinar", { numero });
    setNumero("");
    setMiTurno(false);
  }

  function volverAJugar() {
    enviar("reiniciar", {});
    setPantalla("esperando");
    setMensaje("Esperando otro jugador...");
    setHistorial([]);
    setMiTurno(false);
    setNumero("");
  }

  if (pantalla === "login") {
    return (
      <div className="container">
        <h1>🔐 Login</h1>
        <input
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={12}
        />
        <button onClick={login}>Entrar</button>
      </div>
    );
  }

  if (pantalla === "esperando") {
    return (
      <div className="container">
        <h2>Esperando otro jugador...</h2>
        <ul>
          {jugadores.map((j, i) => (
            <li key={i}>{j}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (pantalla === "juego") {
    return (
      <div className="container">
        <h2>🎮 Adivina el Número (1 - 100)</h2>
        {miTurno ? (
          <>
            <input
              type="number"
              placeholder="Ingresa número"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              min={1}
              max={100}
            />
            <button onClick={adivinar}>Enviar</button>
          </>
        ) : (
          <p>{mensaje || "Esperando al otro jugador..."}</p>
        )}
        {historial.length > 0 && (
          <div className="historial">
            <h4>📜 Historial:</h4>
            {historial.map((h, i) => (
              <p key={i}>{h}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (pantalla === "ganador") {
    return (
      <div className="container">
        <h1>{mensaje}</h1>
      </div>
    );
  }

  return null;
}

export default App;
