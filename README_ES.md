# MLX DeepSeek-OCR

<div align="center">

**🎯 Un clic en Mac | 📹 OCR todo en uno: Video/PDF/Imagen | 🖥️ Interfaz gráfica completa**

**🚀 Solución OCR completa optimizada para Apple Silicon**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![MLX](https://img.shields.io/badge/MLX-0.20.0+-orange.svg)](https://github.com/ml-explore/mlx)
[![DeepSeek-OCR](https://img.shields.io/badge/Model-DeepSeek--OCR-purple.svg)](https://huggingface.co/mlx-community/DeepSeek-OCR-8bit)
[![One-Click Deploy](https://img.shields.io/badge/Despliegue-Un%20clic-success.svg)](https://github.com/matica0902/MLX-Video-OCR-DeepSeek-Apple-Silicon#-inicio-r%C3%A1pido)

### ✨ Características principales

🍎 **Despliegue de un clic en Mac** • 📹 **OCR de video** • 📄 **Procesamiento por lotes de PDF** • 🖼️ **Reconocimiento inteligente de imágenes**  
🎨 **Preprocesamiento de fotos** • 🖥️ **GUI moderna** • 🔒 **Ejecución completamente local** • ⚡ **Aceleración GPU Metal**

*Cero configuración • Protección de privacidad • Listo para usar*

[Inicio rápido](#-inicio-rápido) • [Características](#-características) • [Arquitectura](#-arquitectura-del-sistema) • [Documentación](#-documentación)

</div>

---

## ✨ Características

### 🎯 **OCR triple funcional**

#### **📹 OCR de Video (Función exclusiva)**
- **Extracción inteligente de fotogramas**: Extrae automáticamente fotogramas clave del video
- **Formatos soportados**: MP4, AVI, MOV, MKV, WebM
- **Procesamiento por lotes**: Procesa todos los fotogramas a la vez
- **Integración perfecta**: Los fotogramas se envían directamente al flujo de OCR

#### **📄 OCR de PDF (Procesamiento por lotes)**
- **Dos modos**: Procesamiento por lotes / Selección de página única
- **Previsualización en tiempo real**: Navegación por miniaturas, selección de página
- **Control inteligente**: Pausar, reanudar, detener
- **Soporte para archivos grandes**: Procesamiento automático por lotes

#### **🖼️ OCR de Imagen (Reconocimiento inteligente)**
- **Múltiples escenarios**: Documentos, tablas, escritura a mano, texto de calle, fotos
- **Función de preprocesamiento**: Eliminar fondo, mejorar, eliminar sombras, rotar
- **Formato de salida**: Markdown, LaTeX, texto plano

---

### 🎯 **Capacidades OCR principales**

#### **Reconocimiento inteligente multiescena**
- **📄 Procesamiento de documentos**: Artículos académicos, documentos comerciales, contenido general, tablas, escritura a mano, diseño complejo
- **🌆 Reconocimiento de escena**: Texto de calle, texto en fotos, etiquetas de productos, códigos de verificación
- **🎚️ Control de precisión de 5 niveles**: Tiny → Small → Medium → Large → Gundam
  - Ajuste dinámico de tamaño de imagen (512px - 1280px)
  - Asignación inteligente de tokens (256 - 8192 tokens)

#### **Salida de formato profesional**
- ✅ **Conversión a Markdown** (preserva estructura)
- ✅ **Extracción de fórmulas LaTeX**
- ✅ **Tablas formateadas en Markdown**
- ✅ **Procesamiento optimizado para chino tradicional**

### 📑 **Procesamiento por lotes de PDF**

#### **Dos modos de procesamiento**
- **Modo por lotes**: Procesa automáticamente el PDF completo (1/3/5/10/personalizado página)
- **Modo de página única**: Selecciona con precisión páginas específicas para procesar

#### **Características inteligentes**
- 🖼️ **Previsualización de miniaturas en tiempo real** (ampliable, seleccionable)
- ⏸️ **Control de lotes**: Pausar/Reanudar/Detener
- 📊 **Seguimiento de progreso**: Muestra estado de procesamiento en tiempo real
- 💾 **Gestión de resultados**: Descarga por página, exportación por lotes

### 🎨 **Preprocesamiento de fotos**

#### **4 modos preestablecidos**
1. **Optimización de escaneo**: Rotación automática + mejora + eliminación de sombras + binarización
2. **Optimización de foto**: Rotación automática + mejora + eliminación de sombras
3. **Mejora de borrosidad**: Mejora de contraste + nitidez
4. **Eliminación de fondo**: Eliminación inteligente de fondo

#### **Capacidad de procesamiento por lotes**
- 📤 **Carga múltiple**: Arrastra o selecciona múltiples imágenes
- 🔄 **Preprocesamiento por lotes**: Procesa todas las imágenes con un clic
- 📥 **Descarga por lotes**: Empaquetado en ZIP
- 🔗 **Integración perfecta**: Envía directamente al procesamiento OCR

### 🎬 **Extracción de fotogramas de video**

#### **Extracción inteligente de fotogramas**
- 🎞️ **Formatos soportados**: MP4, AVI, MOV, MKV, WebM
- ⚡ **Extracción rápida**: Muestreo automático de fotogramas clave uniformes
- 🖼️ **Gestión de previsualización**: Mostrar en cuadrícula, descarga por lotes
- 🔄 **Integración de OCR**: Los fotogramas pueden procesarse directamente con OCR

---

## 🏗️ Arquitectura del sistema

### **Stack tecnológico**

```
┌─────────────────────────────────────────────────────────┐
│                  Capa de interfaz (UI)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tailwind CSS + JavaScript Vanilla (3033 líneas) │  │
│  │  • Diseño responsivo • Carga arrastra-suelta     │  │
│  │  • Previsualización en tiempo real • Control     │  │
│  │  • Seguimiento de progreso • Gestión de datos    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────┐
│                Capa posterior (Flask API)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Flask 3.0 + Python 3.11+ (1770 líneas)          │  │
│  │  • 18 puntos finales REST API                    │  │
│  │  • Procesamiento OCR multiproceso                │  │
│  │  • Gestión de estado de tareas                   │  │
│  │  • Procesamiento de flujo de archivos            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│          Capa de inferencia IA (MLX Framework)          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  MLX 0.20+ • mlx-vlm 0.3.5                       │  │
│  │  • Aceleración GPU Metal                         │  │
│  │  • Modelo DeepSeek-OCR-8bit                      │  │
│  │  • Descarga automática y caché de modelos        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│          Capa de procesamiento de imagen                │
│          (OpenCV + PIL)                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  OpenCV 4.10+ • Pillow 10.3+ • PyMuPDF           │  │
│  │  • Renderizado de PDF • Decodificación de video  │  │
│  │  • Mejora de imagen • Rotación automática        │  │
│  │  • Eliminación de sombras • Eliminación de fondo │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **Arquitectura de API**

#### **Puntos finales principales**
```
GET  /                          # Página principal
GET  /api/status               # Estado del sistema
GET  /api/health               # Verificación de salud

POST /api/ocr                  # OCR de imagen única
POST /api/pdf/init             # Inicialización de PDF
POST /api/pdf/extract-pages    # Extracción de páginas PDF
POST /api/pdf/process-batch    # Procesamiento por lotes de PDF
POST /api/pdf/preview-page     # Previsualización de página PDF
POST /api/pdf/cancel           # Cancelar procesamiento

POST /api/preprocess/upload    # Carga de foto
POST /api/preprocess/process   # Preprocesamiento de foto
POST /api/preprocess/download  # Descargar resultado procesado
POST /api/preprocess/to-ocr    # Enviar a OCR

POST /api/video/upload         # Carga de video
POST /api/video/extract        # Extracción de fotogramas
POST /api/video/download       # Descargar fotogramas
POST /api/video/process-batch  # OCR por lotes

GET  /api/files/<path>         # Servicio de archivos
```

### **Flujo de datos**

```
Carga del usuario
    ↓
┌──────────────┐
│ Validación   │ → Verificar formato (PNG/JPG/PDF/MP4...)
│ de archivo   │ → Límite de tamaño (máximo 512MB)
└──────────────┘
    ↓
┌──────────────┐
│ Preprocesa-  │ → Mejora de imagen, eliminación de sombras
│ miento       │ → Rotación, extracción de fotogramas de video
│ (opcional)   │
└──────────────┘
    ↓
┌──────────────┐
│ Creación de  │ → Generación de UUID
│ tarea        │ → Inicialización de estado
│              │ → pendiente → procesando → completado
└──────────────┘
    ↓
┌──────────────┐
│ Inferencia   │ → Procesamiento multiproceso
│ MLX          │ → Aceleración Metal GPU
└──────────────┘
    ↓
┌──────────────┐
│ Procesamiento│ → Formateo Markdown
│ de resultado │ → Limpieza automática de archivos temporales
└──────────────┘
    ↓
Retornar resultado (JSON)
```

---

## 🎨 Características de diseño de interfaz

### **Interfaz moderna**

#### **🎯 Tres pestañas funcionales principales**
```
┌─────────────────────────────────────────────────┐
│ 📄 OCR  │  🎨 Preprocesamiento  │  🎬 Video   │
└─────────────────────────────────────────────────┘
```

#### **🎨 Puntos destacados del diseño**

1. **Tema degradado púrpura**
   - Color principal: `#8b5cf6` → `#a78bfa`
   - Efecto de sombra: `rgba(139, 92, 246, 0.4)`
   - Lenguaje visual coherente

2. **Zona de carga arrastra-suelta**
   - Diseño de borde punteado
   - Efecto de animación Hover
   - Resaltado al arrastrar

3. **Panel de configuración inteligente**
   - Mostrar/ocultar dinámicamente
   - Control de precisión con deslizador
   - Previsualización de configuración en tiempo real

4. **Seguimiento de progreso**
   - Animación de carga rotatoria
   - Barra de progreso con porcentaje
   - Sugerencia de estado de texto

5. **Visualización de resultados**
   - Renderización de Markdown
   - Copia con un clic
   - Descarga por lotes

### **Diseño responsivo**

```css
/* Escritorio (1024px+) */
- Diseño de tres columnas
- Previsualización de miniaturas laterales
- Panel de funciones completo

/* Tableta (768px - 1024px) */
- Diseño de dos columnas
- Miniaturas plegables
- Panel de control simplificado

/* Móvil (< 768px) */
- Diseño de una columna
- Previsualización a pantalla completa
- Barra de operaciones inferior
```

### **Experiencia interactiva**

- ✨ **Transiciones suaves**: Todas las transiciones de estado 0.3s animadas
- 🎯 **Retroalimentación visual**: Estados Hover, Active, Selected
- ⚡ **Respuesta inmediata**: Actualización sin refrescar página
- 🔔 **Mensajes amigables**: Error, éxito, advertencia

---

## 🚀 Inicio rápido

### **Requisitos del sistema**

| Elemento | Requisito |
|----------|-----------|
| **Sistema operativo** | macOS 13.0+ |
| **Hardware** | Apple Silicon (M1/M2/M3/M4) |
| **Python** | 3.11+ |
| **Memoria** | 16GB+ (recomendado) |
| **Espacio de disco** | 5GB+ (incluye modelo) |

### **🍎 Despliegue de un clic en Mac**

**¡Solo 3 comandos, implementación completa en 60 segundos!**

```bash
# 1. Seleccionar directorio de instalación
cd ~/Downloads          # o cd ~ o cd ~/Documents

# 2. Clonar proyecto
git clone https://github.com/matica0902/MLX-Video-OCR-DeepSeek-Apple-Silicon.git
cd MLX-Video-OCR-DeepSeek-Apple-Silicon

# 3. Inicio de un clic (completa automáticamente toda la configuración)
./start.sh
```

**🎉 ¡Así de simple!** El script se encarga de todo automáticamente.

> **Nota**: El script de inicio requiere `uv` instalado. Si no está instalado, el script le indicará cómo instalarlo:
> ```bash
> curl -LsSf https://astral.sh/uv/install.sh | sh
> # o usar Homebrew
> brew install uv
> ```

**start.sh hará automáticamente:**
- ✅ Verificar versión de Python
- ✅ Verificar si uv está instalado (y sugerir instalación si no)
- ✅ Crear entorno virtual (usando uv)
- ✅ Instalar todas las dependencias (usando uv)
- ✅ Buscar puerto disponible (5000-5010)
- ✅ Limpiar procesos zombies
- ✅ Iniciar la aplicación

### **Primer uso**

1. **Acceder a la aplicación**: http://localhost:5000
2. **Primer OCR**: Descarga automática del modelo (~800MB, 5-15 minutos)
3. **Ubicación del modelo**: `~/hf_cache/hub/models--mlx-community--DeepSeek-OCR-8bit/`
4. **Uso posterior**: Modelo en caché, listo para usar inmediatamente

### **Instalación manual**

```bash
# 1. Ingresar al directorio del proyecto
cd ~/MLX-Video-OCR-DeepSeek-Apple-Silicon

# 2. Instalar uv (si aún no está instalado)
curl -LsSf https://astral.sh/uv/install.sh | sh
# o usar Homebrew: brew install uv

# 3. Crear entorno virtual
uv venv
source .venv/bin/activate

# 4. Instalar dependencias
uv pip install -r requirements.txt

# 5. Iniciar aplicación
python3 app.py
```

---

## 📚 Documentación

Para instrucciones detalladas, consulte el directorio `docs/`:

### **Guías rápidas**
- [Inicio rápido](docs/GUIA_INICIO_RAPIDO.md) - Forma más simple de comenzar
- [Guía de inicio detallada](docs/START_GUIDE_ES.md) - Incluye solución de problemas

### **Documentación completa**
- [Guía de ejecución local](docs/GUIA_EJECUCION_LOCAL.md) - Explicación de características y uso avanzado

---

## 🔒 Privacidad y seguridad

### **Ejecución completamente local**
- ✅ Todo el procesamiento se realiza localmente
- ✅ No se requiere carga de datos a la nube
- ✅ No se requiere conexión a internet (después de descargar el modelo)
- ✅ Limpieza automática de archivos temporales

### **Procesamiento de datos**
- Archivos cargados: Almacenados en directorio temporal del sistema
- Resultados procesados: Solo guardados en sesión del navegador
- Limpieza automática: Elimina archivos temporales después del procesamiento

---

## ⚡ Optimización de rendimiento

### **Aceleración GPU Metal**
```python
# Detecta automáticamente y utiliza GPU Metal
if mx.metal.is_available():
    # Usar aceleración GPU (predeterminado)
    print("🔧 GPU Metal habilitado")
else:
    # Retroceso a CPU
    mx.set_default_device(mx.cpu)
```

### **Procesamiento multiproceso**
- Lotes de PDF: Procesamiento en paralelo de múltiples páginas
- Preprocesamiento de fotos: Procesamiento por lotes de múltiples imágenes
- Fotogramas de video: Extracción asincrónica de fotogramas

### **Gestión de memoria**
- Carga diferida: Carga del modelo solo en primera solicitud
- Liberación manual: `POST /api/unload-model`
- Limpieza automática: Libera recursos después del procesamiento

---

## 🛠️ Información de desarrollo

### **Estructura del proyecto**

```
MLX-VIDEO-OCR/
├── mlx_video_ocr/       # Paquete principal
│   ├── __init__.py     # Inicialización
│   ├── app.py          # App Flask (74 líneas)
│   ├── config.py       # Configuración
│   ├── preprocessing.py # Preprocesamiento
│   ├── shared_state.py # Estado compartido
│   ├── routes/         # Rutas API
│   │   ├── __init__.py
│   │   ├── ocr.py      # Endpoints OCR (116 líneas)
│   │   ├── pdf.py      # Endpoints PDF (589 líneas)
│   │   ├── preprocessing.py # Endpoints preprocesamiento (243 líneas)
│   │   └── video.py    # Endpoints video (180 líneas)
│   ├── engines/        # Motores MLX
│   └── utils/          # Utilidades
├── static/
│   └── app.js         # Lógica frontal (3207 líneas)
├── templates/
│   └── index.html     # Página principal (859 líneas)
├── run.py             # Punto de entrada
├── start.sh           # Script de inicio
├── pyproject.toml     # Configuración del proyecto
└── requirements.txt  # Dependencias Python
```

### **Dependencias principales**

```python
Flask==3.0.0              # Marco Web
mlx-vlm>=0.4.0           # Modelo de lenguaje visual MLX
mlx>=0.20.0              # Marco MLX de Apple
Pillow>=10.3.0           # Procesamiento de imagen
opencv-python>=4.10.0    # Visión por computadora
PyMuPDF                  # Procesamiento de PDF
Werkzeug==3.0.1          # Herramientas WSGI
```

### **Estadísticas de código**

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `mlx_video_ocr/app.py` | 74 | Configuración de Flask |
| `mlx_video_ocr/routes/*.py` | 1,136 | Rutas API |
| `static/app.js` | 3,207 | Lógica frontal, interacción UI |
| `templates/index.html` | 859 | Estructura HTML, estilos |
| **Total** | **5,276** | Implementación de función completa |

---

## 📖 Ejemplos de uso

### **1. OCR básico**
```bash
# Cargar imagen → Seleccionar modo → Hacer clic en "Iniciar OCR"
# El resultado se muestra automáticamente, copiar o descargar
```

### **2. Procesamiento por lotes de PDF**
```bash
# Cargar PDF → Seleccionar modo por lotes → Establecer páginas por lote
# Procesamiento automático → Ver progreso → Descargar resultados
```

### **3. Preprocesamiento de fotos**
```bash
# Cambiar a pestaña "Preprocesamiento de fotos"
# Cargar foto → Seleccionar modo preestablecido → Procesar
# Descargar resultado o enviar directamente a OCR
```

### **4. Fotogramas de video**
```bash
# Cambiar a pestaña "Fotogramas de video"
# Cargar video → Establecer número de fotogramas → Extraer
# Previsualizar fotogramas → Descargar u OCR por lotes
```

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor siga estos pasos:

1. Fork este proyecto
2. Crear rama de característica (`git checkout -b feature/AmazingFeature`)
3. Confirmar cambios (`git commit -m 'Add some AmazingFeature'`)
4. Enviar a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto utiliza la licencia **GNU Affero General Public License v3.0 (AGPL-3.0)**.

- 📖 [Términos completos de licencia](LICENSE)
- 🔗 [Explicación oficial AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.en.html)

**SPDX-License-Identifier**: AGPL-3.0-or-later

### **Resumen**

✅ **Puede:**
- Usar, modificar y distribuir libremente este software
- Usarlo para propósitos comerciales

⚠️ **Debe:**
- Conservar aviso de licencia original y declaraciones de derechos de autor
- Código abierto de sus versiones modificadas (usar la misma licencia)
- Si proporciona servicio a través de red, debe ofrecer código fuente

---

## 🙏 Agradecimientos

- **[MLX](https://github.com/ml-explore/mlx)** - Marco de aprendizaje automático de Apple
- **[DeepSeek-OCR](https://huggingface.co/deepseek-ai/DeepSeek-OCR)** - Modelo OCR potente
- **[mlx-vlm](https://github.com/Blaizzy/mlx-vlm)** - Implementación del modelo de lenguaje visual MLX
- **[Flask](https://flask.palletsprojects.com/)** - Marco Web ligero

---

## 📞 Contacto

- **GitHub**: [bbaaxx/MLX-Video-OCR-DeepSeek-Apple-Silicon](https://github.com/bbaaxx/MLX-Video-OCR-DeepSeek-Apple-Silicon)
- **Problemas**: [Reportar problema](https://github.com/bbaaxx/MLX-Video-OCR-DeepSeek-Apple-Silicon/issues)

---

## 🙏 Créditos

Este es un fork que ha divergido significativamente del repositorio original de [matica0902](https://github.com/matica0902/MLX-Video-OCR-DeepSeek-Apple-Silicon).

Agradecimientos especiales al autor original por crear este proyecto.

---

<div align="center">

**⭐ Si este proyecto le resulta útil, ¡por favor déle una estrella!**

Hecho con ❤️ para Apple Silicon

</div>
