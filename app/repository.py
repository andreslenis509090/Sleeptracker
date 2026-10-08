"""Capa repository: acceso a datos (en memoria para la demo)."""
from __future__ import annotations

from datetime import date, time, timedelta
from typing import Dict, List, Optional

from app.models import RegistroSueno, Usuario


class SleepRepository:
    def __init__(self) -> None:
        self._usuarios: Dict[int, Usuario] = {}
        self._registros: List[RegistroSueno] = []
        self._seed()

    # --- usuarios
    def listar_usuarios(self) -> List[Usuario]:
        return list(self._usuarios.values())

    def obtener_usuario(self, usuario_id: int) -> Optional[Usuario]:
        return self._usuarios.get(usuario_id)

    def actualizar_meta(self, usuario_id: int, meta: Optional[float]) -> Optional[Usuario]:
        u = self._usuarios.get(usuario_id)
        if u:
            u.meta_sueno = meta
        return u

    # --- registros
    def listar_registros(self, usuario_id: int, desde: Optional[date] = None,
                         hasta: Optional[date] = None) -> List[RegistroSueno]:
        res = [r for r in self._registros if r.usuario_id == usuario_id
               and (desde is None or r.fecha >= desde) and (hasta is None or r.fecha <= hasta)]
        return sorted(res, key=lambda r: r.fecha)

    def existe_registro(self, usuario_id: int, fecha: date) -> bool:
        return any(r.usuario_id == usuario_id and r.fecha == fecha for r in self._registros)

    def guardar_registro(self, registro: RegistroSueno) -> RegistroSueno:
        self._registros.append(registro)
        return registro

    # --- datos de ejemplo (relativos a hoy para que siempre haya semanas con datos)
    def _seed(self) -> None:
        self._usuarios = {1: Usuario(1, "Ana", 8.0), 2: Usuario(2, "Luis", None)}
        patron = [
            (time(22, 30), time(6, 30), 4), (time(23, 30), time(5, 30), 2),
            (time(0, 30), time(6, 0), 2), (time(23, 0), time(6, 45), 4),
            (time(1, 0), time(6, 30), 1), (time(22, 0), time(6, 30), 5),
            (time(23, 0), time(6, 30), 3),
        ]
        hoy = date.today()
        lunes = hoy - timedelta(days=hoy.weekday())
        for uid in self._usuarios:
            for semana in (lunes - timedelta(days=7), lunes):
                for i, (a, d, c) in enumerate(patron):
                    f = semana + timedelta(days=i)
                    if f < hoy:
                        self._registros.append(RegistroSueno(uid, f, a, d, c))
