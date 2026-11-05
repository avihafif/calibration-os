# Generated from schemas/finding/v1.schema.json; do not edit.
from typing import Literal, NotRequired, TypedDict


class FindingPointer(TypedDict):
    value: str


class FindingMessageParamsItem(TypedDict):
    name: str
    value: str


class FindingMessage(TypedDict):
    key: str
    params: NotRequired[list[FindingMessageParamsItem]]


class FindingFixParamsItem(TypedDict):
    name: str
    value: str


class FindingFix(TypedDict):
    id: str
    params: NotRequired[list[FindingFixParamsItem]]


class Finding(TypedDict):
    code: str
    severity: Literal["error", "warning", "info"]
    pointer: FindingPointer
    message: FindingMessage
    stage: str
    fix: NotRequired[FindingFix]
