from pypdf import PdfReader
import os

carpeta = "documentos"

for archivo in os.listdir(carpeta):

    if archivo.endswith(".pdf"):

        ruta = os.path.join(carpeta, archivo)

        lector = PdfReader(ruta)

        texto = ""

        for pagina in lector.pages:
            texto += pagina.extract_text()

        print("\nDOCUMENTO:")
        print(archivo)

        print(texto[:500])