# Demo Strategy - Monitoreo de Higiene del Sueño

Backend FastAPI (router -> service -> repository) con el patrón Strategy en RN03 + frontend simple.

## Ejecutar
    pip install -r requirements.txt
    python -m uvicorn app.main:app --reload

- Frontend: http://127.0.0.1:8000/
- Swagger:  http://127.0.0.1:8000/docs

## Dónde está el patrón
- app/strategies.py : interfaz CriterioDiaCritico + CriterioMetaPersonal + CriterioUmbralPorDefecto
- app/service.py    : MetricaService (contexto) usa elegir_criterio() y delega en criterio.es_critico()
- GET /api/usuarios/{id}/metricas?estrategia=auto|meta|defecto cambia la estrategia en tiempo de ejecución
