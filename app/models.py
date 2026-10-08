"""Modelos de dominio (clases de apoyo del patrón)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from typing import Optional


@dataclass
class Usuario:
    id: int
    nombre: str
    meta_sueno: Optional[float] = None  # horas; None si no la definió (RF01)


@dataclass
class RegistroSueno:
    usuario_id: int
    fecha: date
    hora_acostarse: time
    hora_despertar: time
    calificacion: int  # 1-5

    def calcular_duracion(self) -> float:
        """Horas dormidas; soporta que el sueño cruce la medianoche (RF04)."""
        inicio = datetime.combine(self.fecha, self.hora_acostarse)
        fin = datetime.combine(self.fecha, self.hora_despertar)
        if fin <= inicio:
            fin += timedelta(days=1)
        return round((fin - inicio).total_seconds() / 3600, 2)
