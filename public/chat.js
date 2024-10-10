document.addEventListener("DOMContentLoaded", function() {
    const socket = io.connect('http://3.144.202.245:5000'); // Asegúrate de que la URL y el puerto sean correctos

    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");
    const panelLogin = document.getElementById("panel-login");
    const panelBienvenida = document.getElementById("panel-bienvenida");
    const panelRegistro = document.getElementById("panel-registro");
    const appChat = document.getElementById("app-chat");
    const mensajeOutput = document.getElementById("output");
    const usuarioInput = document.getElementById("usuario");
    const mensajeInput = document.getElementById("mensaje");

    // Lógica de inicio de sesión
    formLogin.addEventListener("submit", function(event) {
        event.preventDefault();

        const username = document.getElementById("login-usuario").value;
        const password = document.getElementById("login-password").value;

        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
        .then(response => {
            if (response.ok) {
                // Si la respuesta es exitosa, ocultar el panel de login y mostrar el panel de bienvenida
                panelLogin.style.display = 'none';
                panelBienvenida.style.display = 'block';
                usuarioInput.value = username; // Establecer el nombre de usuario
            } else {
                return response.text().then(text => { 
                    document.getElementById("mensaje-login").innerText = text;
                });
            }
        })
        .catch(error => console.error('Error:', error));
    });

    // Lógica de registro
    formRegister.addEventListener("submit", function(event) {
        event.preventDefault();

        const username = document.getElementById("register-usuario").value;
        const password = document.getElementById("register-password").value;

        fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        })
        .then(response => {
            if (response.ok) {
                document.getElementById("mensaje-registro").innerText = "Registro exitoso. Ahora inicia sesión.";
                panelRegistro.style.display = 'none'; // Ocultar panel de registro después del registro exitoso
            } else {
                return response.text().then(text => { 
                    document.getElementById("mensaje-registro").innerText = text;
                });
            }
        })
        .catch(error => console.error('Error:', error));
    });

    // Función para ingresar al chat
    window.ingresarAlChat = function() {
        panelBienvenida.style.display = 'none'; // Ocultar panel de bienvenida
        appChat.style.display = 'block'; // Mostrar panel de chat
    };

    // Enviar mensaje
    document.getElementById("enviar").addEventListener("click", function() {
        const mensaje = mensajeInput.value;
        const usuario = usuarioInput.value;

        if (mensaje) {
            socket.emit('chat', { usuario, mensaje });
            mensajeInput.value = ''; // Limpiar el campo de entrada
        }
    });

    // Escuchar mensajes y mostrarlos
    socket.on('chat', function(data) {
        mensajeOutput.innerHTML += `<p><strong>${data.usuario}:</strong> ${data.mensaje}</p>`;
    });

    // Mostrar mensajes históricos
    socket.on('load messages', function(messages) {
        messages.forEach(function(message) {
            mensajeOutput.innerHTML += `<p><strong>${message.usuario}:</strong> ${message.mensaje}</p>`;
        });
    });
});
