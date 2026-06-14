// ============================================================
// storageService.js — Capa de persistencia de datos (LocalStorage)
// Versión con Control de Tiempo para Demo
// ============================================================

const KEYS = {
    ESTADOS:      "estadosProductos",
    BANEADOS:     "productosBaneados",
    INICIALIZADO: "subastaNet_inicializado",
    OFFSET_TIEMPO:"subastaNet_offsetTiempo",   // ms adelantados globalmente
    FECHAS:       "subastaNet_fechasEditadas"  // { id: { fechaInicio, fechaFin } }
};

// --- Funciones Internas de Lectura/Escritura ---
function leerDeStorage(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || {};
    } catch (error) {
        console.error(`Error al leer la clave ${key}:`, error);
        return {};
    }
}

function guardarEnStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error al guardar la clave ${key}:`, error);
    }
}

// --- Métodos Públicos ---
const StorageService = {

    // Inicializa la "Base de Datos" la primera vez
    inicializarBaseDeDatos(listaProductos) {
        if (localStorage.getItem(KEYS.INICIALIZADO)) return;

        const estadosIniciales = {};
        const contadoresPorCategoria = {};

        listaProductos.forEach(producto => {
            const cat = producto.categoria;
            if (!contadoresPorCategoria[cat]) contadoresPorCategoria[cat] = 0;
            if (contadoresPorCategoria[cat] < 3) {
                estadosIniciales[producto.id] = "aprobado";
                contadoresPorCategoria[cat]++;
            } else {
                estadosIniciales[producto.id] = "pendiente";
            }
        });

        guardarEnStorage(KEYS.ESTADOS,  estadosIniciales);
        guardarEnStorage(KEYS.BANEADOS, {});
        guardarEnStorage(KEYS.FECHAS,   {});
        localStorage.setItem(KEYS.OFFSET_TIEMPO, "0");
        localStorage.setItem(KEYS.INICIALIZADO, "true");
        console.log("🌱 Base de datos inicializada (3 aprobados por categoría).");
    },

    // ============================================================
    // CONTROL DE TIEMPO SIMULADO
    // ============================================================

    // Obtener la fecha/hora actual SIMULADA (real + offset)
    ahora() {
        const offset = parseInt(localStorage.getItem(KEYS.OFFSET_TIEMPO) || "0");
        return new Date(Date.now() + offset);
    },

    // Obtener el offset actual en ms
    obtenerOffset() {
        return parseInt(localStorage.getItem(KEYS.OFFSET_TIEMPO) || "0");
    },

    // Adelantar el tiempo global (en ms)
    adelantarTiempo(ms) {
        const actual = this.obtenerOffset();
        localStorage.setItem(KEYS.OFFSET_TIEMPO, String(actual + ms));
    },

    // Resetear el tiempo al real
    resetearTiempo() {
        localStorage.setItem(KEYS.OFFSET_TIEMPO, "0");
    },

    // ---- Fechas editadas por producto ----
    obtenerFechasEditadas() {
        return leerDeStorage(KEYS.FECHAS);
    },

    // Guardar fechas personalizadas para un producto
    editarFechasProducto(id, fechaInicio, fechaFin) {
        const fechas = this.obtenerFechasEditadas();
        fechas[id] = { fechaInicio, fechaFin };
        guardarEnStorage(KEYS.FECHAS, fechas);
    },

    // Eliminar fechas personalizadas (restaurar las originales)
    restaurarFechasProducto(id) {
        const fechas = this.obtenerFechasEditadas();
        delete fechas[id];
        guardarEnStorage(KEYS.FECHAS, fechas);
    },

    // Obtener fecha de inicio efectiva de un producto
    fechaInicioEfectiva(p) {
        const editadas = this.obtenerFechasEditadas();
        return editadas[p.id]?.fechaInicio || p.fechaInicio || null;
    },

    // Obtener fecha de fin efectiva de un producto
    fechaFinEfectiva(p) {
        const editadas = this.obtenerFechasEditadas();
        return editadas[p.id]?.fechaFin || p.fechaFin || null;
    },

    // ============================================================
    // ESTADOS
    // ============================================================
    obtenerEstados() {
        return leerDeStorage(KEYS.ESTADOS);
    },

    actualizarEstadoProducto(id, nuevoEstado) {
        const estados = this.obtenerEstados();
        estados[id] = nuevoEstado;
        guardarEnStorage(KEYS.ESTADOS, estados);
    },

    // ============================================================
    // BANEADOS
    // ============================================================
    obtenerBaneados() {
        return leerDeStorage(KEYS.BANEADOS);
    },

    estaProductoBaneado(id) {
        return !!this.obtenerBaneados()[id];
    },

    conmutarBaneoProducto(id) {
        const baneados = this.obtenerBaneados();
        if (baneados[id]) { delete baneados[id]; } else { baneados[id] = true; }
        guardarEnStorage(KEYS.BANEADOS, baneados);
    }
};

window.StorageService = StorageService;