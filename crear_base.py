import os
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
from sentence_transformers import SentenceTransformer


carpeta = "documentos"

# Modelo para convertir texto en vectores
modelo = SentenceTransformer("all-MiniLM-L6-v2")


documentos = []

# Leer todos los PDF
for archivo in os.listdir(carpeta):

    if archivo.endswith(".pdf"):

        ruta = os.path.join(carpeta, archivo)

        lector = PdfReader(ruta)

        texto = ""

        for pagina in lector.pages:
            contenido = pagina.extract_text()

            if contenido:
                texto += contenido

        documentos.append({
            "nombre": archivo,
            "texto": texto
        })


print("PDF cargados:", len(documentos))


# Dividir textos grandes en partes pequeñas
separador = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)


fragmentos = []

for doc in documentos:

    partes = separador.split_text(doc["texto"])

    for parte in partes:
        fragmentos.append({
            "texto": parte,
            "fuente": doc["nombre"]
        })


print("Fragmentos creados:", len(fragmentos))


# Crear base vectorial
cliente = chromadb.PersistentClient(
    path="base_ladm"
)

coleccion = cliente.get_or_create_collection(
    name="documentos_ladm_col"
)


for i, fragmento in enumerate(fragmentos):

    vector = modelo.encode(fragmento["texto"]).tolist()

    coleccion.add(
        ids=[str(i)],
        embeddings=[vector],
        documents=[fragmento["texto"]],
        metadatas=[{
            "fuente": fragmento["fuente"]
        }]
    )


print("Base LADM-COL creada correctamente")