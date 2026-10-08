"""Capa service: lógica de negocio. Aquí se USA el patrón Strategy (contexto)."""
from __future__ import annotations

from datetime import date, time, timedelta
from typing import Dict, List

from app.models import RegistroSueno, Usuario
from app.repository import SleepRepository
from app.strategies import CriterioDiaCritico, elegir_criterio


class NoEncontrado(Exception):
    pass


class ReglaDeNegocio(Exception):
    pass


class MetricaService:
    def __init__(self, repo: SleepRepository) -> None:
        self.repo = repo

    def _usuario(self, usuario_id: int) -> Usuario:
        u = self.repo.obtener_usuario(usuario_id)
        if u is None:
            raise NoEncontrado("Usuario no encontrado")
        return u

    # ----------------------------------------------------------- métricas (Strategy)
    def metricas_semanales(self, usuario_id: int, semana_inicio: date, estrategia: str = "auto") -> Dict:
        usuario = self._usuario(usuario_id)
        semana_inicio = semana_inicio - timedelta(days=semana_inicio.weekday())  # al lunes
        semana_fin = semana_inicio + timedelta(days=6)

        try:
            criterio: CriterioDiaCritico = elegir_criterio(usuario, estrategia)   # <- estrategia
            umbral = criterio.umbral(usuario)
        except ValueError as e:
            raise ReglaDeNegocio(str(e))

        registros = self.repo.listar_registros(usuario_id, semana_inicio, semana_fin)
        dias: List[Dict] = []
        for r in registros:
            horas = r.calcular_duracion()
            dias.append({
                "fecha": r.fecha.isoformat(),
                "horas": horas,
                "calificacion": r.calificacion,
                "critico": criterio.es_critico(horas, usuario),                  # <- delega
            })
        promedio = round(sum(d["horas"] for d in dias) / len(dias), 1) if dias else None
        return {
            "usuario": usuario.nombre,
            "meta_sueno": usuario.meta_sueno,
            "semana_inicio": semana_inicio.isoformat(),
            "semana_fin": semana_fin.isoformat(),
            "estrategia": {"clave": criterio.clave, "nombre": criterio.nombre,
                           "clase": type(criterio).__name__, "umbral": umbral},
            "promedio": promedio,
            "dias": dias,
            "dias_criticos": [d["fecha"] for d in dias if d["critico"]],
        }

    # ----------------------------------------------------------- registros
    def crear_registro(self, usuario_id: int, fecha: date, acostarse: time,
                       despertar: time, calificacion: int) -> RegistroSueno:
        self._usuario(usuario_id)
        if fecha > date.today():
            raise ReglaDeNegocio("No se puede registrar sueño en una fecha futura (RN02)")
        if self.repo.existe_registro(usuario_id, fecha):
            raise ReglaDeNegocio("Ya existe un registro para esa fecha (RN01)")
        return self.repo.guardar_registro(RegistroSueno(usuario_id, fecha, acostarse, despertar, calificacion))

    def actualizar_meta(self, usuario_id: int, meta) -> Usuario:
        self._usuario(usuario_id)
        return self.repo.actualizar_meta(usuario_id, meta)
