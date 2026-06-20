// ============================================================
// admin.js — Panel administración SubastaNet
// Incluye: gestión de productos + Control de Tiempo
// ============================================================

const ORDEN_CATEGORIAS = [
  "Inmuebles", "Vehículos", "Electrónicos", "Arte Coleccionable",
  "Ropa y Accesorios", "Artículos Deportivos", "Libros", "Juguetes"
];

const ICONOS_CAT = {
  "Inmuebles": "🏠", "Vehículos": "🚗", "Electrónicos": "💻",
  "Arte Coleccionable": "🎨", "Ropa y Accesorios": "👗",
  "Artículos Deportivos": "⚽", "Libros": "📚", "Juguetes": "🧸"
};

// ============================================================
// GESTIÓN DE PRODUCTOS
// ============================================================

function estadoActual(id) {
  return StorageService.obtenerEstados()[id] || "pendiente";
}

function crearCard(p) {
  const estado  = estadoActual(p.id);
  const baneado = StorageService.estaProductoBaneado(p.id);

  // Calcular tiempo restante con hora simulada
  const ahora        = StorageService.ahora();
  const fechaFin     = StorageService.fechaFinEfectiva(p);
  const fechaInicio  = StorageService.fechaInicioEfectiva(p);
  let tiempoHTML     = "";

  if (fechaFin) {
    const fin  = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    const diff = fin - ahora;
    if (diff < 0) {
      tiempoHTML = `<p class="card-tiempo vencida">⏰ Subasta vencida</p>`;
    } else {
      tiempoHTML = `<p class="card-tiempo vigente">⏳ ${formatearTiempoRestante(diff)}</p>`;
    }
  }

  let botones = "";
  if (estado === "pendiente") {
    botones = `<button class="btn-aprobar"  onclick="aprobar(${p.id})">Aprobar</button>
               <button class="btn-rechazar" onclick="cancelarConMotivo(${p.id})">Rechazar</button>`;
  } else if (estado === "aprobado") {
    botones = `<button class="btn-rechazar" onclick="cancelarConMotivo(${p.id})">Cancelar</button>
               <button class="btn-revertir" onclick="revertir(${p.id})">↩ Pendiente</button>`;
  } else {
    botones = `<button class="btn-aprobar"  onclick="aprobar(${p.id})">Aprobar</button>
               <button class="btn-revertir" onclick="revertir(${p.id})">↩ Pendiente</button>`;
  }

  const btnBaneo = (estado === "aprobado" || estado === "pendiente")
    ? `<button class="btn-baneo" onclick="alternarBaneo(${p.id})">
         ${baneado ? "🔓 Quitar baneo" : "🚫 Banear"}
       </button>`
    : "";

  // Bloque de verificación de documento de propiedad (solo si el producto lo tiene)
  const docHTML = p.documentoPropiedad
    ? `<div class="admin-doc ${p.documentoVerificado ? "doc-ok" : "doc-pend"}">
         <span class="doc-estado">${p.documentoVerificado ? "✅ Documentación verificada" : "⏳ Documento sin verificar"}</span>
         <a class="doc-ver-link" href="${p.documentoPropiedad}" target="_blank">Ver documento</a>
         <button class="btn-verificar-doc" onclick="verificarDoc(${p.id})">
           ${p.documentoVerificado ? "Quitar verificación" : "🔎 Verificar"}
         </button>
       </div>`
    : "";

  const card = document.createElement("div");
  card.className = "admin-card" + (baneado ? " card-baneada" : "");
  card.id = "card-" + p.id;
  card.innerHTML = `
    <img src="${p.imagen}" alt="${p.titulo}"
         onerror="this.src='https://via.placeholder.com/320x160?text=Sin+imagen'">
    <div class="admin-card-body">
      <span class="badge badge-${estado}">${estado}</span>
      ${baneado ? '<span class="badge badge-baneado">🚫 baneado</span>' : ""}
      <p class="admin-card-titulo">${p.titulo}</p>
      <p class="admin-card-cat">${p.condicion}</p>
      <p class="admin-card-precio">$${p.precioInicial.toLocaleString("es-MX")} MXN</p>
      ${estado === "rechazado" && p.motivoCancelacion ? `<p class="card-motivo">📝 Motivo: ${p.motivoCancelacion}</p>` : ""}
      ${tiempoHTML}
      <div class="admin-acciones">${botones}</div>
      ${btnBaneo}
      ${docHTML}
      <button class="btn-detalle" onclick="window.open('detalle.html?id=${p.id}','_blank')">
        🔍 Ver detalle
      </button>
    </div>`;
  return card;
}

function renderizarSeccion(contenedorEl, lista) {
  contenedorEl.innerHTML = "";
  if (lista.length === 0) {
    contenedorEl.innerHTML = '<div class="empty-msg"><span>📭</span>Sin productos aquí</div>';
    return;
  }
  ORDEN_CATEGORIAS.forEach(cat => {
    const grupo = lista.filter(p => p.categoria === cat);
    if (grupo.length === 0) return;
    const seccion = document.createElement("div");
    seccion.className = "admin-seccion";
    seccion.innerHTML = `
      <div class="admin-cat-header">
        <div class="admin-cat-titulo">
          <span>${ICONOS_CAT[cat] || ""}</span>${cat}
        </div>
        <span class="admin-cat-badge">${grupo.length}</span>
      </div>
      <div class="admin-grid" id="grid-${cat.replace(/\s+/g,'_')}"></div>`;
    contenedorEl.appendChild(seccion);
    const grid = seccion.querySelector(".admin-grid");
    grupo.forEach(p => grid.appendChild(crearCard(p)));
  });
}

function renderizar() {
  const pend = productos.filter(p => estadoActual(p.id) === "pendiente");
  const apro = productos.filter(p => estadoActual(p.id) === "aprobado");
  const rech = productos.filter(p => estadoActual(p.id) === "rechazado");

  renderizarSeccion(document.getElementById("grid-pendientes"), pend);
  renderizarSeccion(document.getElementById("grid-aprobados"),  apro);
  renderizarSeccion(document.getElementById("grid-rechazados"), rech);

  document.getElementById("cnt-pendientes").textContent = pend.length;
  document.getElementById("cnt-aprobados").textContent  = apro.length;
  document.getElementById("cnt-rechazados").textContent = rech.length;
}

function aprobar(id)  { StorageService.actualizarEstadoProducto(id, "aprobado");  renderizar(); }
function rechazar(id) { StorageService.actualizarEstadoProducto(id, "rechazado"); renderizar(); }

// Cancelar / rechazar pidiendo un motivo (regla de negocio: cancelación con justificación)
function cancelarConMotivo(id) {
  const motivo = prompt("Escribe el motivo de la cancelación o rechazo (lo verá el equipo):");
  if (motivo === null) return;            // el admin canceló el cuadro de diálogo
  const texto = motivo.trim();
  if (!texto) { alert("Debes escribir un motivo para cancelar."); return; }
  StorageService.cancelarConMotivo(id, texto);
  renderizar();
}
function revertir(id) { StorageService.actualizarEstadoProducto(id, "pendiente"); renderizar(); }
function alternarBaneo(id) { StorageService.conmutarBaneoProducto(id); renderizar(); }
function verificarDoc(id) { StorageService.verificarDocumento(id); renderizar(); }

function cambiarTab(nombre) {
  const nombres = ["pendientes", "aprobados", "rechazados", "tiempo"];
  document.querySelectorAll(".tab-btn").forEach((btn, i) => {
    btn.classList.toggle("activo", nombres[i] === nombre);
  });
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.toggle("activo", panel.id === "panel-" + nombre);
  });
  if (nombre === "tiempo") renderizarPanelTiempo();
}

// ============================================================
// CONTROL DE TIEMPO
// ============================================================

function formatearFecha(date) {
  return date.toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function formatearTiempoRestante(ms) {
  if (ms <= 0) return "Vencida";
  const dias  = Math.floor(ms / (1000 * 60 * 60 * 24));
  const horas = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (dias > 0)  return `${dias}d ${horas}h restantes`;
  if (horas > 0) return `${horas}h ${mins}min restantes`;
  return `${mins} min restantes`;
}

function actualizarReloj() {
  const real     = new Date();
  const simulada = StorageService.ahora();
  const offset   = StorageService.obtenerOffset();

  const elReal = document.getElementById("relojReal");
  const elSim  = document.getElementById("relojSimulado");
  const elBadge= document.getElementById("offsetBadge");

  if (elReal)  elReal.textContent  = formatearFecha(real);
  if (elSim)   elSim.textContent   = formatearFecha(simulada);
  if (elBadge) {
    const dias  = Math.floor(Math.abs(offset) / (1000 * 60 * 60 * 24));
    const horas = Math.floor((Math.abs(offset) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins  = Math.floor((Math.abs(offset) % (1000 * 60 * 60)) / (1000 * 60));
    let texto = offset === 0 ? "Tiempo real" : `+${dias > 0 ? dias + "d " : ""}${horas > 0 ? horas + "h " : ""}${mins}min adelantado`;
    elBadge.textContent = texto;
    elBadge.className = "offset-badge" + (offset > 0 ? " offset-activo" : "");
  }
}

function adelantar(ms) {
  StorageService.adelantarTiempo(ms);
  actualizarReloj();
  renderizar(); // refrescar cards con nuevo tiempo
}

function resetearTiempo() {
  StorageService.resetearTiempo();
  actualizarReloj();
  renderizar();
}

// ---- Panel de fechas por producto ----
function renderizarPanelTiempo() {
  actualizarReloj();
  const contenedor = document.getElementById("lista-fechas-productos");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  ORDEN_CATEGORIAS.forEach(cat => {
    const grupo = productos.filter(p => p.categoria === cat);
    if (grupo.length === 0) return;

    const seccion = document.createElement("div");
    seccion.className = "fechas-seccion";
    seccion.innerHTML = `<h3 class="fechas-cat-titulo">${ICONOS_CAT[cat] || ""} ${cat}</h3>`;

    grupo.forEach(p => {
      const finEfectiva    = StorageService.fechaFinEfectiva(p)   || "";
      const inicioEfectiva = StorageService.fechaInicioEfectiva(p) || "";
      const editadas       = StorageService.obtenerFechasEditadas();
      const tieneEdicion   = !!editadas[p.id];

      const ahora  = StorageService.ahora();
      const fin    = finEfectiva ? new Date(finEfectiva) : null;
      if (fin) fin.setHours(23, 59, 59, 999);
      const diff   = fin ? fin - ahora : null;
      const vigente = diff !== null && diff > 0;

      const fila = document.createElement("div");
      fila.className = "fecha-fila";
      fila.id = `fecha-fila-${p.id}`;
      fila.innerHTML = `
        <div class="fecha-fila-info">
          <span class="fecha-fila-titulo">${p.titulo}</span>
          <span class="fecha-fila-estado ${vigente ? 'vigente' : 'vencida'}">
            ${vigente ? "⏳ " + formatearTiempoRestante(diff) : "⏰ Vencida"}
          </span>
          ${tieneEdicion ? '<span class="badge-editado">✏️ editada</span>' : ""}
        </div>
        <div class="fecha-fila-inputs">
          <label>Inicio
            <input type="date" id="inicio-${p.id}" value="${inicioEfectiva}">
          </label>
          <label>Cierre
            <input type="date" id="fin-${p.id}" value="${finEfectiva}">
          </label>
          <button class="btn-guardar-fecha" onclick="guardarFechas(${p.id})">💾 Guardar</button>
          <button class="btn-terminar-ya" onclick="terminarYa(${p.id})">⏰ Terminar ya</button>
          <button class="btn-extender" onclick="extender(${p.id})">♻️ Extender +7d</button>
          ${tieneEdicion ? `<button class="btn-restaurar-fecha" onclick="restaurarFechas(${p.id})">↩ Original</button>` : ""}
        </div>`;
      seccion.appendChild(fila);
    });

    contenedor.appendChild(seccion);
  });
}

// Rangos de duración permitidos por categoría (regla de negocio)
function rangoDuracion(categoria) {
  if (categoria === "Inmuebles") return { min: 7, max: 30 };
  if (categoria === "Vehículos") return { min: 3, max: 14 };
  return { min: 1, max: 7 }; // artículos generales: 24 h a 7 días
}

function guardarFechas(id) {
  const inicio = document.getElementById(`inicio-${id}`)?.value;
  const fin    = document.getElementById(`fin-${id}`)?.value;
  if (!inicio || !fin) { alert("Por favor ingresa la fecha de inicio y la de cierre."); return; }

  // Validación de la regla de negocio: duración dentro del rango por categoría
  const p = (window.productos || []).find(x => x.id == id);
  const dias = Math.round((new Date(fin) - new Date(inicio)) / (1000 * 60 * 60 * 24));
  if (dias <= 0) {
    alert("La fecha de cierre debe ser posterior a la de inicio.");
    return;
  }
  const r = rangoDuracion(p?.categoria);
  if (dias < r.min || dias > r.max) {
    alert(
      `La duración debe estar entre ${r.min} y ${r.max} días para la categoría "${p?.categoria}".\n` +
      `Recuerda: artículos generales 1–7 días, vehículos 3–14 días, inmuebles 7–30 días.\n` +
      `(Tu rango actual es de ${dias} días.)\n\n` +
      `Si solo quieres terminar o extender la subasta para la presentación, usa los botones "Terminar ya" o "Extender +7d".`
    );
    return;
  }

  StorageService.editarFechasProducto(id, inicio, fin);
  renderizarPanelTiempo();
  renderizar();
}

function restaurarFechas(id) {
  StorageService.restaurarFechasProducto(id);
  renderizarPanelTiempo();
  renderizar();
}

// Atajos de presentación: terminar o extender una subasta al instante
function fechaISO(offsetDias) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}
function terminarYa(id) {
  const p = (window.productos || []).find(x => x.id == id);
  const inicio = StorageService.fechaInicioEfectiva(p) || fechaISO(-1);
  StorageService.editarFechasProducto(id, inicio, fechaISO(-1)); // cierre = ayer => vencida
  renderizarPanelTiempo();
  renderizar();
}
function extender(id) {
  const p = (window.productos || []).find(x => x.id == id);
  const inicio = StorageService.fechaInicioEfectiva(p) || fechaISO(0);
  StorageService.editarFechasProducto(id, inicio, fechaISO(7)); // cierre = hoy + 7 => vigente
  renderizarPanelTiempo();
  renderizar();
}

// ---- Actualizar reloj cada segundo cuando está en la pestaña de tiempo ----
setInterval(() => {
  const panelTiempo = document.getElementById("panel-tiempo");
  if (panelTiempo && panelTiempo.classList.contains("activo")) {
    actualizarReloj();
  }
}, 1000);

// ---- Arrancar ----
// storageService.js llama a init() cuando termina de cargar la BD desde MySQL.
function init() {
  // Protección: solo el administrador puede entrar al panel
  if (!StorageService.esAdmin()) {
    window.location.href = "index.html";
    return;
  }
  renderizar();
}

// Cerrar sesión del administrador
function cerrarSesion() {
  StorageService.cerrarSesion();
}