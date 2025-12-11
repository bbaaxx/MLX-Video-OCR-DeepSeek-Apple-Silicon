# SPDX-License-Identifier: AGPL-3.0-or-later
<!-- This document is part of MLX DeepSeek-OCR and is licensed under AGPL-3.0. See LICENSE in project root. -->

# 🚀 Guía de Inicio Rápido

## Método 1: Usar el script de inicio (Lo más fácil)

```bash
cd <your-project-directory>
./start.sh
```

## Método 2: Inicio manual

```bash
cd <your-project-directory>

# 1. Activar el entorno virtual
source venv/bin/activate

# 2. Iniciar la aplicación
python3 app.py
```

## Indicadores de inicio exitoso

Verá el siguiente resultado cuando el inicio sea exitoso:
```
Starting MLX DeepSeek-OCR Web Application...
Note: Model will be loaded on first OCR request
💡 使用 POST /api/unload-model 可以手动释放模型内存
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
 * Running on http://127.0.0.1:5000
```

## Acceder a la aplicación

Después de iniciar, abra en su navegador:
- **http://localhost:5000** (si el puerto 5000 está disponible)
- **http://localhost:5001** (si el puerto 5000 está ocupado, el script utilizará automáticamente el 5001)

## Detener el servicio

En la terminal donde se ejecuta el servicio, presione: **`Ctrl + C`**

## Preguntas frecuentes

### P: ¿Qué hago si el puerto está ocupado?
R: El script detectará automáticamente e utilizará un puerto alternativo (5001), y mostrará la dirección correcta para acceder.

### P: ¿Por qué es lento la primera vez?
R: La primera vez que cargue una imagen, el modelo se descargará automáticamente (~800MB), esto puede tardar de 5 a 15 minutos.

### P: ¿Cómo verifico si el servicio está ejecutándose?
```bash
curl http://localhost:5000/api/status
```
