"""Capa router: endpoints HTTP (solo traduce HTTP <-> service)."""
from __future__ import annotations

from datetime import date, time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.repository import SleepRepository
from app.service import MetricaService, NoEncontrado, ReglaDeNegocio

router = APIRouter(prefix="/api")
_repo = SleepRepository()


def get_service() -> MetricaService:
    return MetricaService(_repo)


class RegistroIn(BaseModel):
    fecha: date
    hora_acostarse: time
    hora_despertar: time
    calificacion: int = Field(ge=1, le=5)


class MetaIn(BaseModel):
    meta_sueno: Optional[float] = Field(default=None, gt=0, le=24)


def _http(e: Exception) -> HTTPException:
    if isinstance(e, NoEncontrado):
        return HTTPException(404, str(e))
    return HTTPException(409, str(e))


@router.get("/usuarios")
def listar_usuarios(svc: MetricaService = Depends(get_service)):
    return [{"id": u.id, "nombre": u.nombre, "meta_sueno": u.meta_sueno} for u in svc.repo.listar_usuarios()]


@router.put("/usuarios/{usuario_id}/meta")
def actualizar_meta(usuario_id: int, body: MetaIn, svc: MetricaService = Depends(get_service)):
    try:
        u = svc.actualizar_meta(usuario_id, body.meta_sueno)
    except (NoEncontrado, ReglaDeNegocio) as e:
        raise _http(e)
    return {"id": u.id, "nombre": u.nombre, "meta_sueno": u.meta_sueno}


@router.post("/usuarios/{usuario_id}/registros", status_code=201)
def crear_registro(usuario_id: int, body: RegistroIn, svc: MetricaService = Depends(get_service)):
    try:
        r = svc.crear_registro(usuario_id, body.fecha, body.hora_acostarse, body.hora_despertar, body.calificacion)
    except (NoEncontrado, ReglaDeNegocio) as e:
        raise _http(e)
    return {"fecha": r.fecha, "horas": r.calcular_duracion(), "calificacion": r.calificacion}


@router.get("/usuarios/{usuario_id}/metricas")
def metricas(usuario_id: int,
             semana: Optional[date] = Query(default=None, description="Cualquier fecha de la semana"),
             estrategia: str = Query(default="auto", pattern="^(auto|meta|defecto)$"),
             svc: MetricaService = Depends(get_service)):
    try:
        return svc.metricas_semanales(usuario_id, semana or date.today(), estrategia)
    except (NoEncontrado, ReglaDeNegocio) as e:
        raise _http(e)
