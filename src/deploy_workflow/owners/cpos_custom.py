"""A custom run's handoff rules, estimate and cap (owner, 2026-11-26).

The analyst chooses whole modules or phases within them. The launcher applies the registry's
rules and says why it added each module (`complete`), prices the run from the per-module figures of
`contracts.MODULE_ESTIMATE_USD` and sets the cap the run launches at (`estimate`):

    cap = min(USD 50, ceiling(sum of the modules' figures + one call's hold))

This module imports nothing from `cpos_launch` (which imports it): what it needs from there (the
modules that own a block of the custom composition, the hold) is passed in by the caller."""

from __future__ import annotations

from collections.abc import Collection, Sequence
from dataclasses import dataclass
from decimal import ROUND_CEILING, ROUND_HALF_UP, Decimal

from deploy_vii.contracts import MODULE_ESTIMATE_USD, PATHWAY_CAP_USD
from deploy_vii.registry import dependencies, modules, plan
from deploy_workflow.credit_os_chips import MODULE_NAMES
from deploy_workflow.owners.cpos_launch_methods import PHASES, complete_phases

SOURCE_REASON = "Every run needs the source register and the financial base."
CP8_REASON = "Compares this run with the earlier run named in this summary."
# CP-0 and CP-1 open every run (the source register and the financial base).
ALWAYS = ("CP-0", "CP-1")
# CP-MODEL makes no model call: a request naming it is accepted and changes nothing, and the
# launcher plans it in every custom run.
PUBLISHES_FORECAST = "CP-MODEL"
# Entries a custom request may not name, each with the words that say why.
NOT_CHOOSABLE = {
    "CP-8": "is planned automatically when an earlier run of this issuer is listed; it cannot be "
    "chosen",
    "CP-L10": "belongs to the credit screening and cannot be chosen here",
    "CP-MEMO": "is replaced by the deliverables and cannot be chosen",
    "CP-OS": "is not a module and cannot be chosen",
}
# What a refusal calls an entry that has no module name (reader text carries no module id).
REFUSED_SUBJECT = {"CP-MEMO": "The memo", "CP-OS": "The run's orchestrator"}
CENT = Decimal("0.01")
# The handoffs CP-5 and CP-8 read in the measured runs, which their figures are for.
CP5_MEASURED_HANDOFFS = 10
CP8_MEASURED_HANDOFFS = 12


class CustomRefused(ValueError):
    """A custom selection the launcher cannot complete; the message says what to change."""


@dataclass(frozen=True)
class Completion:
    """A custom selection completed: its modules in planned order (CP-8 and CP-MODEL are not in
    it), the reason for each module the rules added, and the modules that own no block of the
    custom composition (they have no report section of their own)."""

    modules: tuple[str, ...]
    reasons: dict[str, str]
    modules_page_only: frozenset[str]
    phases: dict[str, tuple[str, ...]]
    phase_reasons: dict[str, str]


@dataclass(frozen=True)
class EstimateRow:
    module: str
    name: str
    figure: Decimal
    measured: bool
    high: bool  # The figure is the high-effort one: the module is sent at high effort.
    added: str | None  # Why the launcher added the module; None for a chosen one.
    modules_page_only: bool
    phases: tuple[tuple[str, str | None], ...] = ()


@dataclass(frozen=True)
class Estimate:
    rows: tuple[EstimateRow, ...]
    total: Decimal  # The sum of the rounded figures.
    hold: Decimal  # What one call of the largest module counts against the cap while in flight.
    cap: int  # Whole USD: min(ceiling(total + hold), the custom ceiling).


def _name(entry: str) -> str:
    return PHASES[entry].name if entry in PHASES else MODULE_NAMES.get(entry, entry)


def _refusal(entry: str) -> CustomRefused | None:
    """Why ``entry`` cannot be chosen, or None when it can."""
    if entry in NOT_CHOOSABLE:
        return CustomRefused(f"{REFUSED_SUBJECT.get(entry, _name(entry))} {NOT_CHOOSABLE[entry]}.")
    for module in modules():
        if entry == module.module_id:
            return None
        if entry in module.aliases and module.module_id in NOT_CHOOSABLE:
            return CustomRefused(
                f"{_name(module.module_id)} {NOT_CHOOSABLE[module.module_id]}, so neither can "
                "its phases."
            )
        if entry in module.aliases:
            return CustomRefused(
                f"{_name(entry)} is a phase of {_name(module.module_id)}, not a whole module; "
                f"choose {_name(module.module_id)}."
            )
    return CustomRefused(f"{entry} is not a module this run can use.")


def _names(modules_: Sequence[str]) -> str:
    names = [_name(m) for m in modules_]
    return names[0] if len(names) == 1 else f"{', '.join(names[:-1])} and {names[-1]}"


def complete(chosen: Sequence[str], *, owned: Collection[str]) -> Completion:
    """``chosen`` completed by the registry's rules, in planned order, with the reason for each
    module added. ``owned`` is the set of modules that own a block of the custom composition.

    CP-0 and CP-1 are always added; any other module is added only as a required producer of
    a module in the run. A selectable phase may be named with its parent. CP-MODEL is ignored.
    Unsupported choices raise `CustomRefused`."""
    aliases = {p for p in chosen if p in PHASES and PHASES[p].parent in chosen}
    for entry in chosen:
        if entry in aliases:
            continue
        if entry != PUBLISHES_FORECAST and (refused := _refusal(entry)):
            raise refused
    picked = tuple(dict.fromkeys(m for m in chosen if m != PUBLISHES_FORECAST and m not in aliases))
    planned = tuple(m for m in plan((*ALWAYS, *picked)) if m != PUBLISHES_FORECAST)
    required = {m.module_id: set(m.required) for m in modules()}
    reasons: dict[str, str] = {}
    for module in planned:
        if module in picked:
            continue
        if module in ALWAYS:
            reasons[module] = SOURCE_REASON
            continue
        needed_by = [m for m in planned if module in required[m]]
        reasons[module] = f"Needed by {_names(needed_by)}."
    phases, added = complete_phases(aliases, planned)
    return Completion(
        planned, reasons, frozenset(m for m in planned if m not in owned), phases, added
    )


def _round(amount: Decimal) -> Decimal:
    return amount.quantize(CENT, rounding=ROUND_HALF_UP)


def estimate(
    completion: Completion, *, compared: bool, high: Collection[str], hold: Decimal
) -> Estimate:
    """What the completed selection is expected to cost and the cap it launches at.

    ``compared`` is whether the launcher plans CP-8 (an earlier run is listed); ``high`` names the
    modules sent at high effort (a module takes the high figure, else the medium one). CP-5 is
    scaled by the handoffs it reads and CP-8 likewise, from the registry's fan-in; each figure is
    rounded to the cent (half up) before the sum. ``hold`` is the launcher's own figure."""
    planned = (*completion.modules, *(("CP-8",) if compared else ()))
    fan_in = dependencies(planned)
    rows = []
    for module in planned:
        figures = MODULE_ESTIMATE_USD[module]
        is_high = module in high
        figure = figures.high if is_high else figures.medium
        if module == "CP-5":
            figure = figure * len(fan_in[module]) / CP5_MEASURED_HANDOFFS
        elif module == "CP-8":
            figure = figure * len(fan_in[module]) / CP8_MEASURED_HANDOFFS
        rows.append(
            EstimateRow(
                module,
                _name(module),
                _round(figure),
                figures.measured,
                is_high,
                CP8_REASON if module == "CP-8" else completion.reasons.get(module),
                module in completion.modules_page_only,
                tuple(
                    (PHASES[phase].name, completion.phase_reasons.get(phase))
                    for phase in completion.phases.get(module, ())
                ),
            )
        )
    total = sum((row.figure for row in rows), Decimal(0))
    cap = min(int(PATHWAY_CAP_USD["custom"]), int((total + hold).to_integral_value(ROUND_CEILING)))
    return Estimate(tuple(rows), total, _round(hold), cap)
