# 🚀 Guía de Despliegue Público Gratuito (24/7)
## Asistente Experto LADM-COL

Esta guía te explica paso a paso cómo publicar tu asistente LADM-COL en la nube para obtener un **enlace web público (HTTPS)** que cualquier persona pueda usar sin necesidad de tener tu computador encendido.

---

## 🌟 Opción 1: Despliegue en Render.com (Recomendado)

Render ofrece un plan gratuito permanente ideal para aplicaciones Flask con Python.

### Paso 1: Subir tu proyecto a GitHub
1. Abre una terminal en la carpeta del proyecto `ASISTENTE` y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Asistente LADM-COL listo para produccion"
   ```
2. Crea un nuevo repositorio en [GitHub](https://github.com/new) (puede ser público o privado).
3. Conecta y sube tus cambios:
   ```bash
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

### Paso 2: Crear el servicio en Render
1. Ve a [Render.com](https://render.com) e inicia sesión (con tu cuenta de GitHub).
2. Haz clic en **"New +"** y selecciona **"Web Service"**.
3. Selecciona la opción **"Build and deploy from a Git repository"** y elige tu repositorio.
4. Completa los datos de configuración:
   - **Name:** `asistente-ladm-col` (o el nombre que prefieras).
   - **Region:** Elige la más cercana (ej. *Oregon (US West)* o *Ohio (US East)*).
   - **Branch:** `main`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120`
   - **Instance Type:** `Free`

### Paso 3: Configurar la Clave de Gemini (Variable de Entorno)
1. En la sección **"Environment Variables"** de Render, agrega:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** *(Pega tu clave de API de Google Gemini)*
2. Haz clic en **"Deploy Web Service"**.

¡Listo! En unos minutos Render compilará el proyecto y te entregará una URL pública segura como:
👉 `https://asistente-ladm-col.onrender.com`

---

## 🌟 Opción 2: Despliegue en Hugging Face Spaces

Hugging Face Spaces es gratuito, ofrece 16 GB de RAM y es excelente para proyectos con bases vectoriales y modelos de lenguaje.

### Paso 1: Crear el Space
1. Ve a [Hugging Face Spaces](https://huggingface.co/spaces) e inicia sesión.
2. Haz clic en **"Create new Space"**.
3. Configura:
   - **Space name:** `asistente-ladm-col`
   - **License:** `mit` o `apache-2.0`
   - **Space SDK:** Selecciona **Docker** -> **Blank**.
   - **Space hardware:** `CPU basic • 2 vCPU • 16 GB • Free`.
   - **Visibility:** `Public`.

### Paso 2: Subir los archivos
Puedes clonar el repositorio de Hugging Face y pegar los archivos del proyecto, o vincularlo directamente con tu repositorio de GitHub. El archivo [Dockerfile](file:///c:/Users/nikol/Documents/ASISTENTE/Dockerfile) ya está listo y configurado.

### Paso 3: Configurar Secretos
1. Ve a la pestaña **Settings** de tu Space.
2. En la sección **Variables and secrets**, crea un nuevo secreto:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** *(Pega tu clave de Google Gemini)*

Tu aplicación se iniciará automáticamente en su propia URL pública de Hugging Face.

---

## 🧪 Cómo Probar Localmente Antes de Desplegar

Para verificar que todo funcione en tu máquina local:

```bash
# Activar tu entorno virtual
.\venv\Scripts\activate

# Ejecutar el servidor
python app.py
```

Abre tu navegador en [http://localhost:5000](http://localhost:5000) para interactuar con la nueva interfaz.
