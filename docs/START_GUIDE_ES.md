# SPDX-License-Identifier: AGPL-3.0-or-later
<!-- This document is part of MLX DeepSeek-OCR and is licensed under AGPL-3.0. See LICENSE in project root. -->

# 🚀 Guía de Inicio MLX DeepSeek-OCR

## Pasos para iniciar rápidamente

### Método 1: Inicio directo (si ya tiene las dependencias instaladas)

```bash
# 1. Ingrese al directorio del proyecto
cd <your-project-directory>

# 2. Inicie la aplicación
python3 app.py
```

### Método 2: Usar entorno virtual (recomendado)

```bash
# 1. Ingrese al directorio del proyecto
cd <your-project-directory>

# 2. Crear entorno virtual (si aún no lo tiene)
python3 -m venv venv

# 3. Activar el entorno virtual
source venv/bin/activate

# 4. Instalar dependencias
pip install -r requirements.txt

# 5. Iniciar la aplicación
python3 app.py
```

## 📋 Pasos detallados

### Paso 1: Verificar versión de Python

```bash
python3 --version
# Se requiere Python 3.11 o superior
```

### Paso 2: Verificar si las dependencias están instaladas

```bash
cd <your-project-directory>
pip3 list | grep -E "Flask|mlx|Pillow|opencv"
```

Si no están instaladas, ejecute:
```bash
pip3 install -r requirements.txt
```

### Paso 3: Iniciar la aplicación

```bash
python3 app.py
```

Debería ver:
```
Starting MLX DeepSeek-OCR Web Application...
Note: Model will be loaded on first OCR request
💡 使用 POST /api/unload-model 可以手动释放模型内存
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
 * Running on http://127.0.0.1:5000
```

### Paso 4: Abrir navegador

Visite: **http://localhost:5000**

## 🔧 Preguntas frecuentes

### P1: El puerto 5000 está ocupado

**Solución:**
```bash
# Verificar qué ocupa el puerto
lsof -i :5000

# O modificar el puerto (edite la última línea de app.py)
app.run(host='0.0.0.0', port=5001, debug=True)
```

### P2: Faltan paquetes de dependencias

**Solución:**
```bash
pip3 install Flask==3.0.0 mlx-vlm==0.3.5 mlx>=0.20.0 Pillow>=10.3.0 Werkzeug==3.0.1 opencv-python>=4.10.0
```

### P3: La versión de Python no es correcta

**Solución:**
```bash
# Verificar versión
python3 --version

# Si la versión es demasiado antigua, necesita actualizar Python
# En macOS puede usar Homebrew
brew install python@3.11
```

### P4: Problemas de permisos

**Solución:**
```bash
# Asegurar permisos de ejecución
chmod +x app.py

# O ejecutar directamente con python3
python3 app.py
```

### P5: Error "ValueError: [metal_kernel] Only supports the GPU"

**Solución:**
Esto ocurre porque algunas operaciones de MLX requieren soporte de GPU. Hemos actualizado el código para detectar automáticamente y usar la GPU.
Si aún tiene problemas, asegúrese de que su entorno de terminal permita acceso a la GPU.

### P6: Error al cargar archivos grandes (HTTP 413)

**Solución:**
Hemos aumentado el límite de carga a **512MB** para soportar videos e imágenes de alta resolución.
Si encuentra este problema, asegúrese de haber reiniciado la aplicación para aplicar la nueva configuración.

## 🛑 Detener la aplicación

En la terminal donde se ejecuta la aplicación, presione: **`Ctrl + C`**

La aplicación limpiará automáticamente los recursos y se cerrará.

## 📊 Verificación después del inicio

### 1. Verificar si el servicio se está ejecutando

```bash
curl http://localhost:5000/api/status
```

Debería retornar:
```json
{
  "model_loaded": false,
  "ready": false
}
```

### 2. Verificar página frontal

Visite en el navegador: http://localhost:5000

Debería ver la interfaz de carga.

## 💡 Consejos

1. **Primer uso**: La primera vez que cargue una imagen, el modelo se descargará automáticamente (~800MB), esto puede tardar de 5 a 15 minutos
2. **Ubicación del modelo**: El modelo se descargará en `~/.cache/huggingface/hub/`
3. **Uso de memoria**: Después de cargar el modelo, consume aproximadamente 2-3GB de memoria
4. **Velocidad de procesamiento**: Después de cargar el modelo por primera vez, los procesimientos posteriores serán muy rápidos

## 🎯 Prueba rápida

Después de iniciar, puede probar la API:

```bash
# Verificar estado
curl http://localhost:5000/api/status

# Cargar modelo manualmente
curl -X POST http://localhost:5000/api/load-model

# Liberar modelo manualmente
curl -X POST http://localhost:5000/api/unload-model
```

## 📝 Script de inicio (opcional)

Crear `start.sh`:

```bash
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate 2>/dev/null || true
python3 app.py
```

Uso:
```bash
chmod +x start.sh
./start.sh
```
