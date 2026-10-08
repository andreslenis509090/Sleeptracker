"""PATRÓN STRATEGY - criterio para decidir si un día es crítico (RN03)."""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.models import Usuario

UMBRAL_POR_DEFECTO = 6.0  # horas (RN03)


class CriterioDiaCritico(ABC):
    """Interfaz Strategy."""

    clave: str = ""
    nombre: str = ""

    @abstractmethod
    def umbral(self, usuario: Usuario) -> float:
        """Horas mínimas por debajo de las cuales el día es crítico."""

    def es_critico(self, horas_dormidas: float, usuario: Usuario) -> bool:
        return horas_dormidas < self.umbral(usuario)


class CriterioMetaPersonal(CriterioDiaCritico):
    clave = "meta"
    nombre = "Meta personal"

    def umbral(self, usuario: Usuario) -> float:
        if usuario.meta_sueno is None:
            raise ValueError("El usuario no tiene una meta de sueño definida")
        return usuario.meta_sueno


class CriterioUmbralPorDefecto(CriterioDiaCritico):
    clave = "defecto"
    nombre = "Umbral por defecto (6 h)"

    def umbral(self, usuario: Usuario) -> float:
        return UMBRAL_POR_DEFECTO


_CRITERIOS = {c.clave: c for c in (CriterioMetaPersonal, CriterioUmbralPorDefecto)}


def elegir_criterio(usuario: Usuario, clave: str = "auto") -> CriterioDiaCritico:
    """'auto' aplica RN03; 'meta' o 'defecto' fuerzan una estrategia."""
    if clave == "auto":
        return CriterioMetaPersonal() if usuario.meta_sueno is not None else CriterioUmbralPorDefecto()
    if clave not in _CRITERIOS:
        raise ValueError(f"Estrategia desconocida: {clave}")
    return _CRITERIOS[clave]()
