// ============================================================
// script.js — Controlador de la Pantalla de Inicio y Login
// ============================================================

// Alternar visualización hacia el formulario de Login
function irLogin() {
    document.getElementById("inicio").style.display = "none";
    document.getElementById("login").style.display = "block";
}

// Regresar a la selección inicial (Visitante / Login)
function regresarInicio() {
    document.getElementById("login").style.display = "none";
    document.getElementById("inicio").style.display = "block";
}

// Control de visibilidad de la contraseña (Manejador de Eventos Seguro)
function inicializarManejadorPassword() {
    const botonOjo = document.getElementById("mostrarPassword");
    const inputPass = document.getElementById("password");

    if (!botonOjo || !inputPass) return;

    botonOjo.addEventListener("click", () => {
        inputPass.type = inputPass.type === "password" ? "text" : "password";
        // Opcional: Cambiar el icono del ojo si quieren verse más pro
        botonOjo.classList.toggle("fa-eye");
        botonOjo.classList.toggle("fa-eye-slash");
    });
}

// Autenticación del Administrador Central (contra la base de datos MySQL)
async function loginAdmin() {
    const correoInput = document.getElementById("correo");
    const passwordInput = document.getElementById("password");

    if (!correoInput || !passwordInput) return;

    const correo = correoInput.value.trim();
    const pass = passwordInput.value;

    if (!correo || !pass) {
        alert("Por favor ingresa correo y contraseña.");
        return;
    }

    try {
        const resp = await fetch("api/index.php?action=login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo: correo, password: pass })
        });
        const data = await resp.json();

        if (data.ok) {
            window.location.href = "admin.html";
        } else {
            alert("El correo electrónico o la contraseña son incorrectos. Por favor, intente de nuevo.");
        }
    } catch (e) {
        console.error("Error al iniciar sesión:", e);
        alert("No se pudo conectar con el servidor. Verifica que XAMPP (Apache + MySQL) esté encendido.");
    }
}

// Inicializar componentes cuando el DOM esté completamente listo
document.addEventListener("DOMContentLoaded", () => {
    inicializarManejadorPassword();
});