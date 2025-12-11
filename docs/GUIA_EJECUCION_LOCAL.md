# SPDX-License-Identifier: AGPL-3.0-or-later
<!-- This document is part of MLX DeepSeek-OCR and is licensed under AGPL-3.0. See LICENSE in project root. -->

# Guía de Ejecución Local de MLX DeepSeek-OCR

Esta aplicación está optimizada para Mac M2 (Apple Silicon), utilizando el marco MLX para proporcionar el mejor rendimiento.

## 📋 Requisitos del sistema

- ✅ Mac with Apple Silicon (M1/M2/M3/M4)
- ✅ macOS 13.0 o superior
- ✅ Python 3.11
- ✅ Al menos 16GB de RAM (recomendado)
- ✅ Aproximadamente 3GB de espacio libre en disco (para caché del modelo)

---

## 🚀 Inicio rápido

### Paso 1: Descargar archivos del proyecto

Descargue los siguientes archivos del entorno de desarrollo original Replit a su Mac:

```
MLX-DeepSeek-OCR/
├── app.py
├── requirements.txt
├── README.md
├── templates/
│   └── index.html
├── static/
│   └── app.js
└── uploads/        # Este directorio se creará automáticamente
```

**Cómo descargar:**
1. Haga clic en las tres líneas horizontales ☰ en la esquina superior izquierda de Replit
2. Seleccione "Download as ZIP"
3. Descomprima en su directorio local en la Mac

---

### Paso 2: Instalar dependencias de Python

Abra la terminal (Terminal), ingrese al directorio del proyecto:

```bash
# Ingresar al directorio del proyecto
cd ~/Downloads/MLX-DeepSeek-OCR

# Crear entorno virtual (recomendado)
python3.11 -m venv .venv

# Activar el entorno virtual
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
# Asegúrese de instalar opencv-python
pip install opencv-python
```

**Tiempo de instalación:** Aproximadamente 2-5 minutos

---

### Paso 3: Iniciar la aplicación

```bash
# Asegurar que el entorno virtual está activado
source .venv/bin/activate

# Ejecutar la aplicación
python app.py
```

Verá una salida similar a:

```
Starting MLX DeepSeek-OCR Web Application...
Note: Model will be loaded on first OCR request
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

---

### Paso 4: Abrir navegador

Visite en su navegador:

```
http://localhost:5000
```

---

## 📸 Primer uso

### La primera vez que cargue una imagen:

1. **Descarga automática del modelo**
   - Tamaño del modelo: aproximadamente 800MB
   - Ubicación de descarga: `~/.cache/huggingface/hub/`
   - Tiempo de descarga: depende de su velocidad de red (normalmente 5-15 minutos)

2. **Proceso de procesamiento**
   ```
   Loading MLX DeepSeek-OCR model...
   Downloading model files...
   Model loaded successfully!
   Processing image with mode: basic
   ```

3. **Ver resultados**
   - Una vez completado el reconocimiento, los resultados se mostrarán en el lado derecho
   - Puede copiar o descargar los resultados

---

## 🎯 Consejos de uso

### Selección de modo OCR

| Modo | Uso | Descripción |
|------|------|-------------|
| **OCR básico** | Extraer todo el texto | Ideal para documentos comunes, capturas de pantalla |
| **Convertir a Markdown** | Documentos estructurados | Ideal para libros, artículos, informes |
| **Extraer tablas** | Datos de tablas | Ideal para informes financieros, tablas estadísticas |
| **Reconocer fórmulas** | Fórmulas matemáticas | Ideal para documentos de matemáticas y física |

### Nuevas funcionalidades

| Función | Uso | Descripción |
|---------|------|-------------|
| **Preprocesamiento de fotos** | Optimizar calidad de imagen | Soporta eliminación de fondo, sombras y mejora de contraste |
| **Capturas de video** | Extraer fotogramas de video | Soporta capturas con intervalo fijo o detección de escenas |

### Obtener los mejores resultados

✅ **Calidad de imagen**
- Utilice imágenes claras y de alta resolución
- Asegúrese de que el texto sea legible
- Evite imágenes borrosas o inclinadas

✅ **Formatos de archivo**
- Soportados: JPG, PNG
- Tamaño máximo: 16MB

✅ **Velocidad de procesamiento**
- Documentos simples: 10-30 segundos
- Documentos complejos: 30-60 segundos
- Documentos grandes: 1-2 minutos

---

## 🔧 Preguntas frecuentes

### P1: ¿Qué hago si la descarga del modelo es muy lenta?

**R:** El modelo se descargará a `~/.cache/huggingface/hub/`

Si la descarga se interrumpe, reiniciar la aplicación continuará descargando. También puede:

```bash
# Usar un espejo acelerado (opcional)
export HF_ENDPOINT=https://hf-mirror.com
python app.py
```

---

### P2: Aparece el error "ValueError: [metal_kernel] Only supports the GPU"

**R:** Esto ocurre porque algunas operaciones de MLX requieren soporte de GPU.
Hemos actualizado el código para detectar automáticamente y usar la GPU. Si aún tiene problemas, asegúrese de que su entorno de terminal permita acceso a la GPU.

---

### P3: Aparece error de memoria insuficiente

**R:** Si su Mac tiene RAM más limitada (8GB), puede:

1. Cerrar otras aplicaciones que consumen mucha memoria
2. Reducir el parámetro `max_tokens` (en `app.py`):

```python
# Cerca de la línea 95 en app.py
output = generate(
    model, 
    processor, 
    image, 
    prompt, 
    max_tokens=500,  # Cambiar de 1000 a 500
    temperature=0.0
)
```

---

### P4: El puerto 5000 está ocupado

**R:** Modifique el número de puerto:

```python
# Última línea de app.py
app.run(host='0.0.0.0', port=5001, debug=True)  # Cambiar a 5001
```

Luego visite `http://localhost:5001`

---

### P5: Deseo una versión de línea de comandos

**R:** Cree `ocr_cli.py`:

```python
from mlx_vlm import load, generate
from PIL import Image
import sys

# Cargar modelo
print("Loading model...")
model, processor = load("mlx-community/DeepSeek-OCR-4bit")

# Leer imagen
image_path = sys.argv[1]
image = Image.open(image_path)

# OCR
result = generate(
    model, 
    processor, 
    image, 
    "<image>\nFree OCR.", 
    max_tokens=1000,
    temperature=0.0
)

print(result)
```

Uso:
```bash
python ocr_cli.py image.jpg
```

---

## 📊 Referencia de rendimiento

En MacBook Pro M2 (16GB RAM):

| Tarea | Tiempo de procesamiento |
|------|-------------------------|
| Primera carga del modelo | 10-20 segundos |
| OCR de página única | 15-30 segundos |
| Tabla compleja | 30-45 segundos |
| Fórmula matemática | 20-40 segundos |

---

## 🛑 Detener la aplicación

En la terminal presione `Ctrl + C` para detener el servidor

---

## 🔄 Reiniciar

```bash
# Activar el entorno virtual
source .venv/bin/activate

# Iniciar la aplicación
python app.py
```

---

## 📦 Actualizar dependencias

```bash
# Activar el entorno virtual
source .venv/bin/activate

# Actualizar todos los paquetes
pip install --upgrade -r requirements.txt
```

---

## 🗑️ Desinstalar

```bash
# Eliminar entorno virtual
rm -rf .venv

# Eliminar caché del modelo (opcional)
rm -rf ~/.cache/huggingface/hub/models--mlx-community--DeepSeek-OCR-4bit

# Eliminar directorio del proyecto
cd ..
rm -rf MLX-DeepSeek-OCR
```

---

## 💡 Consejos

1. **El modelo solo se descarga una vez**, posteriormente utilizará automáticamente la caché
2. **El primer reconocimiento es más lento** porque necesita descargar el modelo
3. **Los reconocimientos posteriores son muy rápidos** porque el modelo ya está en memoria
4. **Puede procesar múltiples imágenes** sin necesidad de reiniciar la aplicación

---

## 📞 ¿Necesita ayuda?

Si encuentra problemas:

1. Verifique la versión de Python: `python3 --version` (debe ser 3.11+)
2. Verifique la versión de macOS: Configuración del Sistema > General > Información
3. Revise los mensajes de error en la terminal
4. Asegúrese de que la conexión a internet sea normal (la primera descarga requiere descargar el modelo)

---

## 🎉 ¡Disfrute usando!

¡Ahora puede realizar reconocimiento OCR de manera eficiente en su Mac local!
