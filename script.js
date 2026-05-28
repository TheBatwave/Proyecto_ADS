// Mostrar contraseña
const mostrarPassword =
    document.getElementById("mostrarPassword");

const password =
    document.getElementById("password");

mostrarPassword.addEventListener("click", () => {

    if(password.type === "password"){
        password.type = "text";
    }else{
        password.type = "password";
    }

});

// Login administrador
function loginAdmin(){

    let correo =
        document.getElementById("correo").value;

    let pass =
        document.getElementById("password").value;

    // Credenciales admin
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