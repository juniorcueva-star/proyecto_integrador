const API = "/api";

window.addEventListener("load", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const message = document.getElementById("message");

    function mostrarMensaje(texto, color) {
        if (message) {
            message.textContent = texto;
            message.style.color = color;
        }
    }

    async function leerError(response, fallback) {
        try {
            const text = await response.text();
            if (!text) return fallback;

            try {
                const json = JSON.parse(text);
                return json.message || json.error || text;
            } catch (_) {
                return text;
            }
        } catch (_) {
            return fallback;
        }
    }

    if (loginForm) {
        loginForm.onsubmit = async function (e) {
            e.preventDefault();

            mostrarMensaje("Ingresando...", "#1f4d3a");

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                const response = await fetch(`${API}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                if (!response.ok) {
                    const errorText = await leerError(response, "No se pudo iniciar sesion");
                    mostrarMensaje("Error al iniciar sesion: " + errorText, "#b42318");
                    return;
                }

                const data = await response.json();

                localStorage.setItem("token", data.token);
                localStorage.setItem("rol", data.rol);
                localStorage.setItem("nombre", data.nombre);
                localStorage.setItem("usuarioId", data.usuarioId);

                if (data.rol === "ROLE_ADMIN") {
                    window.location.href = "/admin.html";
                } else {
                    window.location.href = "/user.html";
                }

            } catch (error) {
                mostrarMensaje("Error de conexion con el servidor", "#b42318");
                console.error(error);
            }
        };
    }

    if (registerForm) {
        registerForm.onsubmit = async function (e) {
            e.preventDefault();

            mostrarMensaje("Registrando...", "#1f4d3a");

            const nombre = document.getElementById("nombre").value;
            const email = document.getElementById("email").value;
            const telefono = document.getElementById("telefono").value;
            const password = document.getElementById("password").value;

            if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(nombre.trim())) {
                mostrarMensaje("El nombre solo puede contener letras y espacios", "#b42318");
                return;
            }

            if (nombre.trim().length < 3 || nombre.trim().length > 60) {
                mostrarMensaje("El nombre debe tener entre 3 y 60 caracteres", "#b42318");
                return;
            }

            if (!email.includes("@")) {
                mostrarMensaje("El correo debe contener @", "#b42318");
                return;
            }

            if (!/^9\d{8}$/.test(telefono.trim())) {
                mostrarMensaje("El celular debe empezar con 9 y tener 9 digitos", "#b42318");
                return;
            }

            if (password.length < 6) {
                mostrarMensaje("La contrasena debe tener minimo 6 caracteres", "#b42318");
                return;
            }

            try {
                const response = await fetch(`${API}/auth/registro`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        nombre: nombre,
                        email: email,
                        telefono: telefono,
                        password: password
                    })
                });

                if (!response.ok) {
                    const errorText = await leerError(response, "No se pudo registrar la cuenta");
                    mostrarMensaje("Error al registrarse: " + errorText, "#b42318");
                    return;
                }

                const data = await response.json();

                localStorage.setItem("token", data.token);
                localStorage.setItem("rol", data.rol);
                localStorage.setItem("nombre", data.nombre);
                localStorage.setItem("usuarioId", data.usuarioId);

                window.location.href = "/user.html";

            } catch (error) {
                mostrarMensaje("Error de conexion con el servidor", "#b42318");
                console.error(error);
            }
        };
    }
});
