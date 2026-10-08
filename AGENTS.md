# Contexto del proyecto
Demo académica del patrón Strategy (Python/FastAPI) para un sistema de monitoreo de higiene del sueño.
El valor del proyecto es el backend con el patrón Strategy. El frontend solo lo muestra.

# Reglas
- SOLO se puede modificar `app/static/` (index.html y archivos nuevos dentro de esa carpeta).
- NO modificar `app/strategies.py`, `app/service.py`, `app/router.py`, `app/repository.py` ni `app/models.py`.
- No cambiar los endpoints ni el formato del JSON. El front debe seguir funcionando con la API actual.
- Sin frameworks ni build tools (nada de React, npm, Tailwind por CDN, etc.). HTML, CSS y JS puro.
- Sin dependencias externas ni CDN: la demo debe funcionar sin internet.
- Idioma de la interfaz: español.

# Qué debe seguir mostrando el front (es lo que se sustenta)
- Selector de usuario (Ana con meta 8 h, Luis sin meta).
- Selector de estrategia: auto / meta / defecto.
- Recuadro que muestra la clase de estrategia aplicada por el backend (`estrategia.clase`) y su umbral.
- Gráfica semanal con la línea del umbral y los días críticos en rojo.
- Navegación entre semanas, edición de meta y formulario de registro.

# Contrato de la API
GET /api/usuarios
GET /api/usuarios/{id}/metricas?semana=YYYY-MM-DD&estrategia=auto|meta|defecto
  -> { usuario, meta_sueno, semana_inicio, semana_fin,
       estrategia: {clave, nombre, clase, umbral},
       promedio, dias: [{fecha, horas, calificacion, critico}], dias_criticos }
PUT  /api/usuarios/{id}/meta        body: { meta_sueno: number | null }
POST /api/usuarios/{id}/registros   body: { fecha, hora_acostarse, hora_despertar, calificacion }

# Cómo probar
python -m uvicorn app.main:app --reload  ->  http://127.0.0.1:8000/