# Generated from schemas/manufacturer/v1.schema.json; do not edit.
from typing import TypedDict


class ManufacturerName(TypedDict):
    en: str
    he: str


class Manufacturer(TypedDict):
    name: ManufacturerName
    aliases: list[str]
