import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai
import chromadb
import traceback

# Cargar variables de entorno desde .env si existe
load_dotenv()

app = Flask(__name__)

# Configuración de API Key de Gemini
API_KEY = os.getenv("GEMINI_API_KEY")


# Modelo Gemini (utiliza gemini-3.6-flash / gemini-2.0-flash / gemini-1.5-flash con fallback)
MODELO_NOMBRE = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

modelo = genai.GenerativeModel(MODELO_NOMBRE)

# Conectar base vectorial LADM-COL
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RUTA_BASE_LADM = os.path.join(BASE_DIR, "base_ladm")

cliente = chromadb.PersistentClient(path=RUTA_BASE_LADM)
try:
    coleccion = cliente.get_collection(name="documentos_ladm_col")
except Exception:
    coleccion = cliente.get_or_create_collection(name="documentos_ladm_col")


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/health")
def health():
    return jsonify({"status": "ok", "app": "Asistente LADM-COL"})


@app.route("/preguntar", methods=["POST"])
def preguntar():
    try:
        datos = request.get_json(force=True)
        if not datos or "pregunta" not in datos:
            return jsonify({"error": "No se recibió ninguna pregunta."}), 400

        pregunta = str(datos["pregunta"]).strip()
        if not pregunta:
            return jsonify({"error": "La pregunta no puede estar vacía."}), 400

        # Buscar información relevante en ChromaDB conservando la lógica RAG
        resultados = coleccion.query(
            query_texts=[pregunta],
            n_results=3  # Recupera los fragmentos más relevantes de la base documental
        )

        documentos_recuperados = []
        fuentes = []

        if resultados and "documents" in resultados and len(resultados["documents"]) > 0:
            documentos_recuperados = resultados["documents"][0]
            if "metadatas" in resultados and len(resultados["metadatas"]) > 0:
                for meta in resultados["metadatas"][0]:
                    if meta and "fuente" in meta and meta["fuente"] not in fuentes:
                        fuentes.append(meta["fuente"])

        # Unir los fragmentos encontrados
        contexto = "\n\n---\n\n".join(documentos_recuperados) if documentos_recuperados else "No se encontró contexto documental específico."

        # Prompt estructurado para Gemini con soporte de Markdown técnico
        prompt = f"""
Eres un asistente experto de alto nivel en el modelo LADM-COL (Land Administration Domain Model - Perfil Colombia).

Tu función es responder con precisión técnica sobre los componentes del modelo LADM-COL:
- Conceptos generales, principios y marco normativo (CONPES 3958, resoluciones IGAC/SNR).
- Clases, atributos, tipos de datos, dominios y cardinalidades.
- Paquetes núcleo y extendidos (Catastro-Registro, RIC, SINIC, Ordenamiento Territorial, Comunidades Étnicas).
- Estructura UML, relaciones, asociaciones e intercambios INTERLIS.
- Diccionarios de datos y Código Predial Nacional (CPN).
- Aplicación del modelo en el Catastro Multipropósito.

Reglas de respuesta:
1. Responde únicamente sobre temas relacionados con LADM-COL y administración del territorio.
2. Si la consulta NO está relacionada con LADM-COL ni catastro, responde amablemente indicando:
   "Soy un asistente especializado exclusivamente en el modelo LADM-COL y Catastro Multipropósito de Colombia. Por favor formula una consulta técnica sobre estos temas."
3. Basa tus respuestas en el contexto documental proporcionado. No inventes información.
4. Utiliza formato Markdown profesional:
   - Usa **negritas** para resaltar nombres de clases, atributos y términos clave.
   - Utiliza tablas Markdown cuando describas atributos, dominios o estructuras de datos para facilitar la lectura.
   - Emplea listas con viñetas o numeradas para pasos o enumeraciones.
   - Para conceptos, proporciona primero una definición sintética y luego el detalle técnico/estructural.

Contexto documental oficial LADM-COL:
{contexto}

Pregunta del usuario:
{pregunta}
"""
        
        # Generar respuesta con Gemini
        respuesta = modelo.generate_content(
            prompt
        )

        texto_respuesta = respuesta.text if respuesta.text else "No fue posible generar una respuesta."

        return jsonify({
        "respuesta": texto_respuesta,
        "fuentes": fuentes
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "Ocurrió un error al procesar tu consulta.",
            "detalle": str(e)
        }), 500


if __name__ == "__main__":
    puerto = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=puerto, debug=False)