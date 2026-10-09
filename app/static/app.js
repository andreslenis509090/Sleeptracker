/**
 * Sleep Strategy Demo - Lógica del Frontend (JavaScript Puro)
 * Demostración académica del patrón Strategy (RN03)
 */

const $ = id => document.getElementById(id);
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_LARGOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

let usuarios = [];
let fechaRef = new Date();

// Utilidades de fecha y formato
const iso = d => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

const lunesDe = d => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

const fmtRango = (dIni, dFin) => {
  const f1 = `${dIni.getDate()} ${MESES[dIni.getMonth()]}`;
  const f2 = `${dFin.getDate()} ${MESES[dFin.getMonth()]} ${dFin.getFullYear()}`;
  return `${f1} — ${f2}`;
};

const estrategiaActual = () => {
  const r = document.querySelector('input[name="estr"]:checked');
  return r ? r.value : "auto";
};

const mostrar = (id, texto, tipo) => {
  const el = $(id);
  if (!el) return;
  el.textContent = texto || "";
  el.className = "msg" + (texto ? " " + tipo : "");
};

// Cliente HTTP para la API
async function api(url, opts) {
  const r = await fetch(url, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const error = new Error(data.detail || `Error HTTP ${r.status}`);
    error.status = r.status;
    error.detail = data.detail;
    throw error;
  }
  return data;
}

// Carga inicial de usuarios
async function cargarUsuarios() {
  try {
    usuarios = await api("/api/usuarios");
    const sel = $("usuario");
    const actual = sel.value;
    sel.innerHTML = usuarios.map(u => {
      const metaTxt = u.meta_sueno != null ? ` (Meta: ${u.meta_sueno}h)` : " (Sin meta)";
      return `<option value="${u.id}">${u.nombre}${metaTxt}</option>`;
    }).join("");
    if (actual && usuarios.some(u => u.id == actual)) {
      sel.value = actual;
    }
    sincronizarMeta();
  } catch (err) {
    mostrar("msgMeta", "Error al cargar usuarios: " + (err.detail || err.message), "err");
  }
}

function sincronizarMeta() {
  const selUid = $("usuario").value;
  const u = usuarios.find(x => x.id == selUid);
  $("meta").value = u && u.meta_sueno != null ? u.meta_sueno : "";
}

// Constructor reutilizable de gráficas semanales
function construirGraficaHTML({ m, compact = false, divergentDates = [] }) {
  if (!m || !m.dias || m.dias.length === 0) {
    return `
      <div class="empty">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
          </svg>
        </div>
        <p>No hay registros de sueño en esta semana.</p>
      </div>`;
  }

  const lunes = new Date(m.semana_inicio + "T00:00:00");
  const porFecha = Object.fromEntries(m.dias.map(d => [d.fecha, d]));
  const umbral = m.estrategia.umbral;
  const max = Math.max(10, umbral + 1.5, ...m.dias.map(d => d.horas + 1));

  let colsHtml = "";
  let etiquetasHtml = "";

  for (let i = 0; i < 7; i++) {
    const f = new Date(lunes);
    f.setDate(f.getDate() + i);
    const fechaIso = iso(f);
    const d = porFecha[fechaIso];
    const isDiff = divergentDates.includes(fechaIso);

    etiquetasHtml += `
      <div>
        <span class="day-name">${DIAS[i]}</span>
        <span class="day-num">${f.getDate()}</span>
      </div>`;

    if (!d) {
      colsHtml += `<div class="col" tabindex="-1"><div class="bar" style="height:0"></div></div>`;
      continue;
    }

    const isCrit = Boolean(d.critico);
    const heightPct = Math.min(100, Math.max(3, (d.horas / max) * 100)).toFixed(1);
    const stars = "★".repeat(d.calificacion) + "☆".repeat(5 - d.calificacion);
    const estadoTxt = isCrit ? "⚠️ Crítico" : "✓ Normal";
    const estadoClass = isCrit ? "tooltip-crit" : "tooltip-norm";
    const condicionTxt = isCrit
      ? `${d.horas.toFixed(2)} h < ${umbral.toFixed(1)} h`
      : `${d.horas.toFixed(2)} h ≥ ${umbral.toFixed(1)} h`;

    const ariaLabel = `${DIAS_LARGOS[i]} ${f.getDate()} de ${MESES[f.getMonth()]}: ${d.horas.toFixed(2)} horas dormidas, calificación ${d.calificacion} de 5, estado ${isCrit ? "crítico" : "normal"}${isDiff ? ", diverge entre estrategias" : ""}.`;

    const diffBadge = isDiff ? `<span class="diff-pill" aria-hidden="true">⚡ Cambia</span>` : "";
    const critBadge = isCrit ? `<span class="crit-badge" aria-hidden="true" title="Día crítico">!</span>` : "";

    colsHtml += `
      <div class="col" tabindex="0" role="img" aria-label="${ariaLabel}">
        ${diffBadge}
        <div class="val">${d.horas.toFixed(1)}</div>
        <div class="bar ${isCrit ? "crit" : ""} ${isDiff ? "divergent-highlight" : ""}" style="height:${heightPct}%">
          ${critBadge}
        </div>
        <div class="tooltip" role="tooltip">
          <div class="tooltip-title">${DIAS_LARGOS[i]}, ${f.getDate()} de ${MESES[f.getMonth()]}</div>
          <div class="tooltip-row"><span>Duración:</span> <strong>${d.horas.toFixed(2)} h</strong></div>
          <div class="tooltip-row"><span>Calidad:</span> <span>${stars} (${d.calificacion}/5)</span></div>
          <div class="tooltip-row"><span>Estado:</span> <span class="${estadoClass}">${estadoTxt}</span></div>
          <div class="tooltip-row" style="font-size:10px; color:var(--text-dim)"><span>Criterio:</span> <span>${condicionTxt}</span></div>
          ${isDiff ? `<div class="tooltip-diff">⚡ Este día cambia de estado entre estrategias</div>` : ""}
        </div>
      </div>`;
  }

  // Ticks para el eje Y
  const ticksVals = [0, 2, 4, 6, 8, 10].filter(t => t <= max);
  const ticksHtml = ticksVals.map(t => {
    const bottomPct = ((t / max) * 100).toFixed(1);
    return `<div class="axis" style="bottom:calc(${bottomPct}% - 7px)">${t}</div>`;
  }).join("");

  const thrBottom = ((umbral / max) * 100).toFixed(1);

  return `
    <div class="chart-container ${compact ? "chart-compact" : ""}">
      <div class="chart">
        ${ticksHtml}
        <div class="thr" style="bottom:${thrBottom}%">
          <span>umbral ${umbral.toFixed(1)} h</span>
        </div>
        ${colsHtml}
      </div>
      <div class="days">${etiquetasHtml}</div>
    </div>`;
}

const fmtHoras = h => {
  if (h == null) return "0.0";
  return Number.isInteger(h) ? `${h.toFixed(1)}` : `${parseFloat(h.toFixed(2))}`;
};

// Reconstrucción didáctica de la traza del backend
function generarTrazaBackend(m, estrClave) {
  const lineas = [];
  const uNombre = m.usuario;
  const clase = m.estrategia.clase;
  const umbral = fmtHoras(m.estrategia.umbral);

  lineas.push(`elegir_criterio(usuario="${uNombre}", estrategia="${estrClave}") -> <span class="class-name">${clase}</span> (umbral ${umbral} h)`);

  if (!m.dias || m.dias.length === 0) {
    lineas.push(`<span class="comment">// Sin registros en esta semana para evaluar con es_critico()</span>`);
  } else {
    for (const d of m.dias) {
      const hStr = `${fmtHoras(d.horas)} h`;
      const boolSpan = d.critico
        ? `<span class="bool-true">True</span> `
        : `<span class="bool-false">False</span>`;
      const op = d.critico ? "<" : ">=";
      const comp = `(${fmtHoras(d.horas)} ${op} ${umbral})`;
      const fCorta = d.fecha.slice(5); // MM-DD
      lineas.push(`es_critico(${hStr}) -> ${boolSpan} ${comp}   <span class="comment">// ${fCorta}</span>`);
    }
  }

  return lineas.join("\n");
}

// Carga de métricas principales
async function cargarMetricas() {
  mostrar("msgMet", "");
  const uid = $("usuario").value;
  if (!uid) return;

  const estr = estrategiaActual();
  $("chartWrap").innerHTML = `
    <div class="loading-box">
      <div class="spinner"></div>
      <p>Cargando métricas semanales...</p>
    </div>`;

  try {
    const m = await api(`/api/usuarios/${uid}/metricas?semana=${iso(fechaRef)}&estrategia=${estr}`);
    pintarMetricas(m, estr);
  } catch (err) {
    const errorMsg = err.detail || err.message;
    const es409 = err.status === 409 || String(errorMsg).includes("meta");
    const u = usuarios.find(x => x.id == uid);
    const uNombre = u ? u.nombre : "Usuario";

    $("chartWrap").innerHTML = `
      <div class="notice-no-goal" style="margin: 20px 0;">
        <div class="notice-no-goal-title">${es409 ? "Estrategia no aplicable para este usuario" : "Error al consultar métricas"}</div>
        <p class="notice-no-goal-text">
          ${errorMsg}.<br>
          ${es409 ? "Selecciona la estrategia 'Automática' o 'Umbral por defecto (6 h)', o asigna una meta numérica arriba." : ""}
        </p>
      </div>`;
    $("summary").innerHTML = "";
    $("info").innerHTML = `
      Estrategia solicitada: <code>${estr === "meta" ? "CriterioMetaPersonal" : estr}</code> &middot; 
      <strong style="color:var(--error-text)">No aplicable (${errorMsg})</strong>`;
    $("backendTrace").innerHTML = `elegir_criterio(usuario="${uNombre}", estrategia="${estr}") -> <span class="bool-true">Error (${err.status || 409})</span>\n<span class="comment">// ReglaDeNegocio: "${errorMsg}"</span>`;
    mostrar("msgMet", errorMsg, "err");
  }
}

function pintarMetricas(m, estr) {
  const lunes = new Date(m.semana_inicio + "T00:00:00");
  const fin = new Date(m.semana_fin + "T00:00:00");
  $("semanaLbl").textContent = fmtRango(lunes, fin);

  const metaTxt = m.meta_sueno != null ? `${m.meta_sueno.toFixed(1)} h` : "no definida";
  $("info").innerHTML = `
    Estrategia aplicada: <code>${m.estrategia.clase}</code> &middot; 
    umbral evaluado: <strong>${m.estrategia.umbral.toFixed(1)} h</strong> &middot; 
    meta del usuario: <strong>${metaTxt}</strong>`;

  $("chartWrap").innerHTML = construirGraficaHTML({ m });

  if (m.dias && m.dias.length) {
    const promTxt = m.promedio != null ? `${m.promedio.toFixed(1)} h` : "—";
    const numCrit = m.dias_criticos ? m.dias_criticos.length : 0;

    $("summary").innerHTML = `
      <div class="stat">Promedio semanal: <strong>&nbsp;${promTxt}</strong></div>
      <div class="stat">Días críticos: <strong>&nbsp;${numCrit}</strong></div>
      <div class="stat">
        <span class="legend-item"><span class="legend-sample normal"></span> Normal</span>
        &nbsp;&nbsp;
        <span class="legend-item"><span class="legend-sample crit"></span> Crítico (patrón rayado ⚠️)</span>
      </div>`;
  } else {
    $("summary").innerHTML = "";
  }

  // Panel "¿Qué hizo el backend?"
  $("backendTrace").innerHTML = generarTrazaBackend(m, estr);

  habilitarTooltipsTouch($("chartWrap"));
}

// Carga de comparación lado a lado (meta vs defecto en paralelo)
async function cargarComparacion() {
  const uid = $("usuario").value;
  if (!uid) return;

  $("compareWrap").innerHTML = `
    <div class="loading-box">
      <div class="spinner"></div>
      <p>Cargando comparación en paralelo de ambas estrategias...</p>
    </div>`;

  const semanaParam = iso(fechaRef);
  const pMeta = api(`/api/usuarios/${uid}/metricas?semana=${semanaParam}&estrategia=meta`);
  const pDefecto = api(`/api/usuarios/${uid}/metricas?semana=${semanaParam}&estrategia=defecto`);

  const [resMeta, resDefecto] = await Promise.allSettled([pMeta, pDefecto]);

  pintarComparacion(resMeta, resDefecto);
}

function pintarComparacion(resMeta, resDefecto) {
  let colMetaHtml = "";
  let colDefectoHtml = "";
  let divergencias = [];

  const metaOk = resMeta.status === "fulfilled";
  const defOk = resDefecto.status === "fulfilled";

  // Identificar días que divergen de estado crítico entre ambas estrategias
  if (metaOk && defOk) {
    const diasMeta = resMeta.value.dias || [];
    const diasDef = resDefecto.value.dias || [];
    const mapDef = Object.fromEntries(diasDef.map(d => [d.fecha, d]));

    for (const dm of diasMeta) {
      const dd = mapDef[dm.fecha];
      if (dd && dm.critico !== dd.critico) {
        divergencias.push(dm.fecha);
      }
    }
  }

  // Columna 1: Estrategia Meta Personal
  if (metaOk) {
    const m = resMeta.value;
    const numCrit = m.dias_criticos ? m.dias_criticos.length : 0;
    colMetaHtml = `
      <div class="compare-col">
        <div class="compare-col-header">
          <div class="compare-col-title">
            <span>Estrategia: Meta personal</span>
          </div>
          <div class="compare-meta-pills">
            <span class="pill pill-class">${m.estrategia.clase}</span>
            <span class="pill pill-thresh">Umbral: ${m.estrategia.umbral.toFixed(1)} h</span>
            <span class="pill pill-crit">${numCrit} crítico${numCrit === 1 ? "" : "s"}</span>
          </div>
        </div>
        ${construirGraficaHTML({ m, compact: true, divergentDates: divergencias })}
      </div>`;
  } else {
    // Si la API responde 409 (usuario sin meta definida), mensaje amigable
    const es409 = resMeta.reason && (resMeta.reason.status === 409 || String(resMeta.reason.message).includes("meta"));
    const detalleError = es409
      ? "Este usuario no tiene meta definida"
      : (resMeta.reason ? resMeta.reason.detail || resMeta.reason.message : "Error al consultar estrategia");

    colMetaHtml = `
      <div class="compare-col">
        <div class="compare-col-header">
          <div class="compare-col-title">
            <span>Estrategia: Meta personal</span>
          </div>
          <div class="compare-meta-pills">
            <span class="pill pill-class">CriterioMetaPersonal</span>
            <span class="pill pill-thresh">Sin umbral</span>
          </div>
        </div>
        <div class="notice-no-goal">
          <div class="notice-no-goal-title">Este usuario no tiene meta definida</div>
          <p class="notice-no-goal-text">
            ${detalleError}.<br>
            Asigna una meta numérica arriba para que <code>CriterioMetaPersonal</code> pueda ser evaluada en esta semana.
          </p>
        </div>
      </div>`;
  }

  // Columna 2: Estrategia Umbral por Defecto
  if (defOk) {
    const d = resDefecto.value;
    const numCrit = d.dias_criticos ? d.dias_criticos.length : 0;
    colDefectoHtml = `
      <div class="compare-col">
        <div class="compare-col-header">
          <div class="compare-col-title">
            <span>Estrategia: Umbral por defecto</span>
          </div>
          <div class="compare-meta-pills">
            <span class="pill pill-class">${d.estrategia.clase}</span>
            <span class="pill pill-thresh">Umbral: ${d.estrategia.umbral.toFixed(1)} h</span>
            <span class="pill pill-crit">${numCrit} crítico${numCrit === 1 ? "" : "s"}</span>
          </div>
        </div>
        ${construirGraficaHTML({ m: d, compact: true, divergentDates: divergencias })}
      </div>`;
  } else {
    colDefectoHtml = `
      <div class="compare-col">
        <div class="notice-no-goal">
          <div class="notice-no-goal-title">Error al consultar umbral por defecto</div>
          <p class="notice-no-goal-text">${resDefecto.reason ? resDefecto.reason.detail || resDefecto.reason.message : "Error"}</p>
        </div>
      </div>`;
  }

  // Banner explicativo de divergencia
  let bannerHtml = "";
  if (metaOk && defOk) {
    if (divergencias.length > 0) {
      const fechasLegibles = divergencias.map(f => {
        const dt = new Date(f + "T00:00:00");
        return `${DIAS[((dt.getDay() + 6) % 7)]} ${dt.getDate()}`;
      }).join(", ");

      bannerHtml = `
        <div class="compare-divergence-banner">
          <span>⚡</span>
          <div>
            <strong>¡Patrón Strategy en acción!</strong>
            En <strong>${divergencias.length} día(s)</strong> (${fechasLegibles}) el estado crítico difiere entre una estrategia y la otra debido al cambio del umbral de decisión.
          </div>
        </div>`;
    } else {
      const numCrit = resMeta.value.dias_criticos ? resMeta.value.dias_criticos.length : 0;
      bannerHtml = `
        <div class="compare-divergence-banner no-diff">
          <span>✓</span>
          <div>Ambas estrategias arrojaron los mismos días críticos (${numCrit}) para los registros de esta semana.</div>
        </div>`;
    }
  } else {
    bannerHtml = `
      <div class="compare-divergence-banner">
        <span>ℹ️</span>
        <div>Para comparar los resultados lado a lado, asigna una meta de sueño al usuario seleccionado.</div>
      </div>`;
  }

  $("compareWrap").innerHTML = bannerHtml + `<div class="compare-container">${colMetaHtml}${colDefectoHtml}</div>`;
  habilitarTooltipsTouch($("compareWrap"));
}

// Soporte touch y clic para tooltips en dispositivos móviles
function habilitarTooltipsTouch(container) {
  if (!container) return;
  const cols = container.querySelectorAll(".col");
  cols.forEach(col => {
    col.addEventListener("click", e => {
      const yaActivo = col.classList.contains("active-tooltip");
      document.querySelectorAll(".col.active-tooltip").forEach(c => c.classList.remove("active-tooltip"));
      if (!yaActivo) {
        col.classList.add("active-tooltip");
      }
      e.stopPropagation();
    });
  });
}

document.addEventListener("click", () => {
  document.querySelectorAll(".col.active-tooltip").forEach(c => c.classList.remove("active-tooltip"));
});

// Eventos de usuario y acciones
$("usuario").onchange = () => {
  sincronizarMeta();
  cargarMetricas();
  cargarComparacion();
};

document.querySelectorAll('input[name="estr"]').forEach(r => {
  r.onchange = () => {
    cargarMetricas();
    // La comparación siempre ejecuta meta vs defecto en paralelo, no necesita recargarse por radio
  };
});

$("prev").onclick = () => {
  fechaRef.setDate(fechaRef.getDate() - 7);
  cargarMetricas();
  cargarComparacion();
};

$("next").onclick = () => {
  fechaRef.setDate(fechaRef.getDate() + 7);
  cargarMetricas();
  cargarComparacion();
};

$("guardarMeta").onclick = async () => {
  const v = $("meta").value.trim();
  const metaNum = v === "" ? null : parseFloat(v);
  const uid = $("usuario").value;

  try {
    await api(`/api/usuarios/${uid}/meta`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meta_sueno: metaNum })
    });
    mostrar(
      "msgMeta",
      metaNum === null
        ? "Meta eliminada. Con 'Automática' se usará CriterioUmbralPorDefecto (6 h)."
        : `Meta guardada (${metaNum} h). Con 'Automática' se usará CriterioMetaPersonal.`,
      "ok"
    );
    await cargarUsuarios();
    cargarMetricas();
    cargarComparacion();
  } catch (e) {
    mostrar("msgMeta", e.detail || e.message, "err");
  }
};

$("guardarReg").onclick = async () => {
  const uid = $("usuario").value;
  const fechaVal = $("fFecha").value;
  const acostarVal = $("fAcostar").value;
  const despertarVal = $("fDespertar").value;
  const calVal = parseInt($("fCal").value, 10);

  if (!fechaVal || !acostarVal || !despertarVal || isNaN(calVal)) {
    mostrar("msgReg", "Por favor completa todos los campos del registro.", "err");
    return;
  }

  try {
    await api(`/api/usuarios/${uid}/registros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: fechaVal,
        hora_acostarse: acostarVal,
        hora_despertar: despertarVal,
        calificacion: calVal
      })
    });
    mostrar("msgReg", "Registro de sueño guardado exitosamente.", "ok");
    fechaRef = new Date(fechaVal + "T00:00:00");
    cargarMetricas();
    cargarComparacion();
  } catch (e) {
    mostrar("msgReg", e.detail || e.message, "err");
  }
};

// Inicialización de la aplicación
(async () => {
  const hoy = new Date();
  hoy.setDate(hoy.getDate() - 1);
  $("fFecha").value = iso(hoy);
  $("fFecha").max = iso(new Date()); // No permitir fechas futuras (RN02)

  await cargarUsuarios();
  cargarMetricas();
  cargarComparacion();
})();
