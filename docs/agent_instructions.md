A continuación se presenta una guía estructurada, formal y completa, diseñada específicamente para que usted pueda implementar clasificación automática de documentos, extracción de datos y registro directo en su aplicación, utilizando Firebase Studio y Google Document AI.
La explicación se divide en dos módulos, porque son dos sistemas distintos que deben integrarse:
Clasificación + extracción automática (Document AI)
Preguntas y análisis global de todos sus documentos (RAG + Vertex AI Search / Gemini)
MÓDULO 1 — Clasificación y extracción automática con Google Document AI
Paso 1. Crear un proyecto en Google Cloud vinculado a su Firebase
Si su proyecto ya existe, asegúrese de que esté enlazado con Google Cloud Console.
Ingrese en
https://console.cloud.google.com
Seleccione su proyecto de Firebase.
Verifique que la facturación esté habilitada (Document AI la requiere).
Paso 2. Activar Document AI
Abra:
https://console.cloud.google.com/document-ai
Pulse Enable API.
Seleccione la región recomendada: us o us-latam1 (si está disponible).
Paso 3. Crear un Processor
Un processor es el modelo que procesará sus documentos.
Cree los siguientes:
a) Invoice Parser (para facturas)
Tipo: Invoices (Specialized Parser)
Función: extrae montos, RFC, IVA, conceptos, fecha, folio.
b) General Document Classifier (para recibos, pagos de servicios, etc.)
Tipo: Document Classifier
Función: clasifica automáticamente el tipo de documento.
c) OCR Parser (PDF/Imagen)
Tipo: General Document Processor
Función: extrae texto y contenido para documentos no estructurados.
Guarde el Processor ID de cada uno.
Ejemplo:
projects/xxx/locations/us/processors/abcdef12345
Paso 4. Configurar Firebase Storage
En Firebase Studio:
Cree carpetas lógicas:
/uploads/raw/
/uploads/processed/
/uploads/errors/
Los usuarios subirán sus archivos a /uploads/raw/.
Paso 5. Crear una Cloud Function que escuche cada archivo subido
Esta función enviará el archivo a Document AI y guardará los datos en Firestore.
Ejemplo de función:
Trigger: onFinalize() en Storage.
Acción:
Descarga el archivo temporalmente.
Envía el archivo a Document AI.
Recibe el JSON de salida.
Clasifica según contenido.
Guarda los campos extraídos en Firestore.
Mueve el archivo a /uploads/processed/.
Esta función se colocará en Firebase Studio dentro del editor de Cloud Functions.
Paso 6. Guardar resultados en Firestore
Debe crear una colección, por ejemplo:
documents/{docId}
Campos obligatorios:
type: factura, recibo, luz, agua, contrato, etc.
issuer: RFC emisor
receiver: RFC receptor
total: número
subtotal: número
tax: número
currency: moneda
companyAssigned: la empresa correspondiente
extractedText: texto completo opcional
originalFile: ruta de Storage
createdAt: timestamp
Cada documento quedará registrado automáticamente.
Paso 7. Validar y mejorar el flujo
Una vez implementado:
Cualquier factura subida debe generar un documento en Firestore.
Los montos deben aparecer automáticamente.
Los recibos deben clasificarse solos.
Esto deja listo el módulo de contabilidad, pagos, expedientes, etc.
MÓDULO 2 — Sistema para responder preguntas sobre toda su información (RAG)
El objetivo es que usted pueda preguntar:
“¿Cuánto gasté en luz este año?”
“¿Qué documentos fiscales de la empresa X están vencidos?”
“¿Cuáles son mis contratos activos?”
Para lograr esto, se requiere una arquitectura específica.
Paso 1. Indexar Firestore en Vertex AI Search
Abrir Google Cloud Console → Vertex AI Search.
Crear un Search Index conectado a Firestore.
Configurar qué colecciones indexar (ej. documents).
Activar actualización automática.
Con esto, cualquier documento procesado queda indexado.
Paso 2. Activar Vertex AI Search - Chat
Permite que un modelo conversacional responda basándose en su índice.
Crear un Search Application.
Activar modalidad Conversational Retrieval.
Seleccionar modelo generativo: Gemini.
Paso 3. Configurar un endpoint para su app
En Firebase Studio:
Crear una HTTP Function.
Esta función manda la pregunta al Search App y devuelve la respuesta.
Ejemplo de uso:
POST /ai/query
{
  "question": "Dame las facturas de luz de enero 2025"
}
La IA responde con datos reales extraídos de Firestore.
Paso 4. Integrar en su panel
En su aplicación:
Campo de texto para consultas.
Botón “Preguntar a la IA”.
Resultado en panel estructurado.
Resumen técnico final
A continuación se presenta de forma concisa qué debe hacer exactamente:
Para clasificación y registro automático
Activar Document AI.
Crear Processors para factura, OCR y clasificación.
Configurar Firebase Storage.
Crear Cloud Function que procese cada archivo subido.
Extraer datos y guardarlos en Firestore.
Mover el archivo procesado.
Resultado:
Usted sube una imagen → la app registra automáticamente montos, RFC, fecha y tipo de documento.
Para sistema de preguntas inteligentes
Activar Vertex AI Search.
Crear Search Index vinculado a Firestore.
Crear Search App con chat.
Crear Function HTTP para preguntas.
Integrar esto a su panel.
Resultado:
Puede consultar cualquier cosa sobre todos sus documentos.

Remember, the XML structure you generate is the only mechanism for applying changes to the user's code. Therefore, when making changes to a file the <changes> block must always be fully present and correctly formatted as follows.

<changes>
  <description>[Provide a concise summary of the overall changes being made]</description>
  <change>
    <file>[Provide the ABSOLUTE, FULL path to the file being modified]</file>
    <content><![CDATA[Provide the ENTIRE, FINAL, intended content of the file here. Do NOT provide diffs or partial snippets. Ensure all code is properly escaped within the CDATA section.