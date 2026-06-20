// ============================================================
// storageService.js — Capa de persistencia (AHORA contra MySQL vía PHP)
// Mantiene la MISMA interfaz que antes para no romper los controladores.
// Los datos se cargan una vez con cargarTodo() y se cachean en memoria;
// cada cambio (estado, baneo, fechas, tiempo) se guarda en la BD por fetch.
// ============================================================

const API = "api/index.php";

// --- Helper para enviar cambios al servidor ---
function apiPost(action, payload) {
    return fetch(API + "?action=" + action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {})
    })
    .then(r => r.json())
    .catch(err => { console.error("Error API (" + action + "):", err); });
}

const StorageService = {

    // Caché en memoria (se llena con cargarTodo)
    _estados:  {},
    _baneados: {},
    _fechas:   {},
    _offset:   0,
    _sesion:   { logueado: false, rol: null },
    _cargado:  false,

    // ============================================================
    // CARGA INICIAL — trae todo desde MySQL
    // ============================================================
    async cargarTodo() {
        const resp = await fetch(API + "?action=snapshot");
        const data = await resp.json();
        if (data.error) throw new Error(data.error);

        window.productos = data.productos || [];
        this._estados   = data.estados   || {};
        this._baneados  = data.baneados  || {};
        this._fechas    = data.fechas    || {};
        this._offset    = data.offset    || 0;
        this._sesion    = data.sesion    || { logueado: false, rol: null };
        this._cargado   = true;
        console.log("✅ Datos cargados desde MySQL:", window.productos.length, "productos.");
    },

    // ============================================================
    // SESIÓN
    // ============================================================
    esAdmin() {
        return !!(this._sesion && this._sesion.logueado && this._sesion.rol === "administrador");
    },
    cerrarSesion() {
        return fetch(API + "?action=logout", { method: "POST" })
            .catch(() => {})
            .then(() => { window.location.href = "index.html"; });
    },

    // Ya no siembra nada: los datos viven en la base de datos.
    inicializarBaseDeDatos() { /* no-op (datos en MySQL) */ },

    // ============================================================
    // CONTROL DE TIEMPO SIMULADO
    // ============================================================
    ahora() {
        return new Date(Date.now() + this._offset);
    },
    obtenerOffset() {
        return this._offset;
    },
    adelantarTiempo(ms) {
        this._offset += ms;
        apiPost("offset", { valor: this._offset });
    },
    resetearTiempo() {
        this._offset = 0;
        apiPost("offset", { valor: 0 });
    },

    // ---- Fechas editadas por producto ----
    obtenerFechasEditadas() {
        return this._fechas;
    },
    editarFechasProducto(id, fechaInicio, fechaFin) {
        this._fechas[String(id)] = { fechaInicio, fechaFin };
        apiPost("fechas", { id, fechaInicio, fechaFin });
    },
    restaurarFechasProducto(id) {
        delete this._fechas[String(id)];
        apiPost("restaurarFechas", { id });
    },
    fechaInicioEfectiva(p) {
        return this._fechas[String(p.id)]?.fechaInicio || p.fechaInicio || null;
    },
    fechaFinEfectiva(p) {
        return this._fechas[String(p.id)]?.fechaFin || p.fechaFin || null;
    },

    // ============================================================
    // ESTADOS
    // ============================================================
    obtenerEstados() {
        return this._estados;
    },
    actualizarEstadoProducto(id, nuevoEstado) {
        this._estados[String(id)] = nuevoEstado;
        apiPost("estado", { id, estado: nuevoEstado });
    },

    // ============================================================
    // BANEADOS
    // ============================================================
    obtenerBaneados() {
        return this._baneados;
    },
    estaProductoBaneado(id) {
        return !!this._baneados[String(id)];
    },
    conmutarBaneoProducto(id) {
        const k = String(id);
        if (this._baneados[k]) { delete this._baneados[k]; }
        else { this._baneados[k] = true; }
        apiPost("baneo", { id });
    },

    // ============================================================
    // VERIFICACIÓN DE DOCUMENTO DE PROPIEDAD
    // ============================================================
    verificarDocumento(id) {
        // Cambia el estado en el producto cacheado para refrescar la vista al instante
        const p = (window.productos || []).find(x => x.id == id);
        if (p) p.documentoVerificado = !p.documentoVerificado;
        apiPost("verificarDoc", { id });
    }
};

window.StorageService = StorageService;

// ============================================================
// ARRANQUE: carga los datos y luego llama al init() de la página
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await StorageService.cargarTodo();
    } catch (e) {
        console.error("No se pudo cargar la base de datos:", e);
        document.body.insertAdjacentHTML("afterbegin",
            '<div style="background:#fee2e2;color:#991b1b;padding:14px;text-align:center;' +
            'font-family:sans-serif;font-size:14px">⚠️ No se pudo conectar con la base de datos. ' +
            'Revisa que XAMPP (Apache + MySQL) esté encendido y que importaste ' +
            '<b>subastanet_completo.sql</b> en phpMyAdmin.</div>');
        return;
    }
    if (typeof init === "function") init();
});
