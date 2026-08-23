/**
 * ASISTENTE EXPERTO LADM-COL - CLIENTE WEB
 */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const chatForm = document.getElementById('chat-form');
    const preguntaInput = document.getElementById('pregunta-input');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages-container');
    const messagesList = document.getElementById('messages-list');
    const welcomeCard = document.getElementById('welcome-card');
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearChatTopBtn = document.getElementById('clear-chat-top-btn');
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Configuración de Marked.js
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: false,
            mangle: false,
            highlight: function (code, lang) {
                if (typeof hljs !== 'undefined') {
                    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                    return hljs.highlight(code, { language }).value;
                }
                return code;
            }
        });
    }

    // Auto-ajuste de altura del textarea
    preguntaInput.addEventListener('input', () => {
        preguntaInput.style.height = 'auto';
        preguntaInput.style.height = Math.min(preguntaInput.scrollHeight, 160) + 'px';
    });

    // Enviar con Enter (Shift+Enter para salto de línea)
    preguntaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });

    // Envío del Formulario
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pregunta = preguntaInput.value.trim();
        if (!pregunta) return;

        // Ocultar card de bienvenida si es la primera pregunta
        if (welcomeCard) {
            welcomeCard.style.display = 'none';
        }

        // Agregar mensaje del usuario a la interfaz
        agregarMensajeUsuario(pregunta);

        // Limpiar y resetear input
        preguntaInput.value = '';
        preguntaInput.style.height = 'auto';
        preguntaInput.disabled = true;
        sendBtn.disabled = true;

        // Agregar mensaje de carga del asistente
        const typingId = agregarIndicadorCarga();
        hacerScrollAlFinal();

        try {
            const respuesta = await fetch('/preguntar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pregunta: pregunta })
            });

            const data = await respuesta.json();

            // Eliminar indicador de carga
            eliminarIndicadorCarga(typingId);

            if (respuesta.ok && data.respuesta) {
                agregarMensajeAsistente(data.respuesta, data.fuentes || []);
            } else {
                agregarMensajeError(data.error || 'Ocurrió un error al procesar la respuesta.');
            }

        } catch (error) {
            eliminarIndicadorCarga(typingId);
            agregarMensajeError('No fue posible comunicarse con el servidor. Revisa tu conexión.');
            console.error('Error en fetch:', error);
        } finally {
            preguntaInput.disabled = false;
            sendBtn.disabled = false;
            preguntaInput.focus();
            hacerScrollAlFinal();
        }
    });

    // Agregar mensaje del Usuario
    function agregarMensajeUsuario(texto) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message-wrapper user';
        msgDiv.innerHTML = `
            <div class="avatar user-avatar">
                <i data-lucide="user"></i>
            </div>
            <div class="message-bubble">
                <div class="message-content">${escaparHTML(texto)}</div>
            </div>
        `;
        messagesList.appendChild(msgDiv);
        lucide.createIcons({ root: msgDiv });
    }

    // Agregar mensaje del Asistente (Bot)
    function agregarMensajeAsistente(textoMarkdown, fuentes = []) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message-wrapper bot';

        // Parsear Markdown
        let contenidoHTML = textoMarkdown;
        if (typeof marked !== 'undefined') {
            contenidoHTML = marked.parse(textoMarkdown);
        }

        // Construir badges de fuentes
        let fuentesHTML = '';
        if (fuentes && fuentes.length > 0) {
            const chips = fuentes.map(f => `
                <span class="source-chip" title="${escaparHTML(f)}">
                    <i data-lucide="file-text"></i>
                    ${escaparHTML(f)}
                </span>
            `).join('');

            fuentesHTML = `
                <div class="sources-card">
                    <span class="sources-label"><i data-lucide="book-open"></i> Fuentes:</span>
                    ${chips}
                </div>
            `;
        }

        msgDiv.innerHTML = `
            <div class="avatar bot-avatar">
                <i data-lucide="bot"></i>
            </div>
            <div class="message-bubble">
                <div class="message-content">${contenidoHTML}</div>
                ${fuentesHTML}
                <div class="message-actions">
                    <button class="msg-action-btn copy-btn" title="Copiar respuesta">
                        <i data-lucide="copy"></i>
                        <span>Copiar</span>
                    </button>
                </div>
            </div>
        `;

        // Evento botón de copiar
        const copyBtn = msgDiv.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(textoMarkdown).then(() => {
                    mostrarToast('Respuesta copiada al portapapeles');
                });
            });
        }

        messagesList.appendChild(msgDiv);
        lucide.createIcons({ root: msgDiv });

        // Resaltar sintaxis si aplica
        if (typeof hljs !== 'undefined') {
            msgDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }

    // Mensaje de Error
    function agregarMensajeError(mensaje) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message-wrapper bot';
        msgDiv.innerHTML = `
            <div class="avatar bot-avatar" style="background: #ef4444;">
                <i data-lucide="alert-triangle"></i>
            </div>
            <div class="message-bubble" style="border-color: rgba(239, 68, 68, 0.4);">
                <div class="message-content" style="color: #fca5a5;">
                    <strong>⚠️ Error:</strong> ${escaparHTML(mensaje)}
                </div>
            </div>
        `;
        messagesList.appendChild(msgDiv);
        lucide.createIcons({ root: msgDiv });
    }

    // Indicador de carga
    function agregarIndicadorCarga() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.id = id;
        msgDiv.className = 'message-wrapper bot';
        msgDiv.innerHTML = `
            <div class="avatar bot-avatar">
                <i data-lucide="bot"></i>
            </div>
            <div class="message-bubble">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">Consultando base técnica LADM-COL...</span>
                </div>
            </div>
        `;
        messagesList.appendChild(msgDiv);
        lucide.createIcons({ root: msgDiv });
        return id;
    }

    function eliminarIndicadorCarga(id) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.remove();
        }
    }

    // Scroll suave hacia abajo
    function hacerScrollAlFinal() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Escapar caracteres peligrosos
    function escaparHTML(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Toast de notificación
    function mostrarToast(mensaje) {
        toastMessage.textContent = mensaje;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2800);
    }

    // Atajos de Preguntas Rápidas (Chips de la barra lateral y bienvenida)
    document.querySelectorAll('.prompt-chip, .starter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pregunta = btn.getAttribute('data-question');
            if (pregunta) {
                preguntaInput.value = pregunta;
                chatForm.dispatchEvent(new Event('submit'));
                // Cerrar sidebar en móviles tras pulsar
                if (window.innerWidth <= 900) {
                    sidebar.classList.remove('open');
                }
            }
        });
    });

    // Botones de Nueva Consulta / Limpiar
    function reiniciarChat() {
        messagesList.innerHTML = '';
        if (welcomeCard) {
            welcomeCard.style.display = 'block';
        }
        preguntaInput.value = '';
        preguntaInput.style.height = 'auto';
        preguntaInput.focus();
        if (window.innerWidth <= 900) {
            sidebar.classList.remove('open');
        }
    }

    newChatBtn.addEventListener('click', reiniciarChat);
    clearChatTopBtn.addEventListener('click', reiniciarChat);

    // Toggle de Barra Lateral para móviles
    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
});
