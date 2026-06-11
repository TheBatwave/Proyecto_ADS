// cambiar a login
function irLogin(){
    document.getElementById("inicio").style.display = "none";
    document.getElementById("login").style.display = "block";
}

// mostrar contraseña
function activarPassword(){

    const eye = document.getElementById("mostrarPassword");
    const pass = document.getElementById("password");

    if(!eye || !pass) return;

    eye.addEventListener("click", () => {

        pass.type =
            pass.type === "password"
            ? "text"
            : "password";

    });

}

// login admin
function loginAdmin(){

    let correo =
        document.getElementById("correo").value;

    let pass =
        document.getElementById("password").value;

    if(
        correo === "admin.central@subastanet.com"
        &&
        pass === "SubastaAdmin2026"
    ){

        window.location.href = "admin.html";

    }else{

        alert("Correo o contraseña incorrectos");

    }

}

// activar cuando carga página
window.onload = activarPassword;