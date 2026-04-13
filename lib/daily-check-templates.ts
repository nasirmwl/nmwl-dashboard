import { DAILY_CHECK_SECTIONS, flatKeyForCheckbox } from "./daily-checks-schema";

export type TemplateOp = { section: string; key: string; checked: boolean };

export type DayTemplateKind = "productive" | "unproductive" | "rest";

export type DayTemplateCheckResult = {
  kind: DayTemplateKind;
  label: string;
  /** Unique flat keys compared (same count as schema checklist keys). */
  totalCompared: number;
  matches: number;
  mismatches: number;
  /** matches / totalCompared */
  fitScore: number;
  isExactMatch: boolean;
};

export type AllDayTemplatesCheckResult = Record<DayTemplateKind, DayTemplateCheckResult> & {
  /** Kind with highest fitScore (ties broken: productive > unproductive > rest). */
  closestKind: DayTemplateKind;
};

/** Strong day: most positives on, negatives (sick, junk, overspend flags) off. */
export const TEMPLATE_GOOD_DAY_OPS: TemplateOp[] = [
  { section: "discipline", key: "planned_done", checked: true },
  { section: "discipline", key: "meetings_friday_only", checked: true },
  { section: "discipline", key: "wake_dedicated_time", checked: true },
  { section: "discipline", key: "no_late_to_work", checked: true },
  { section: "discipline", key: "daily_report_dedicated_time", checked: true },
  { section: "discipline", key: "declined_misaligned_invitation", checked: true },
  { section: "discipline", key: "screen_zen_social_limits", checked: true },
  { section: "discipline", key: "had_breakfast_before_commuting", checked: true },
  { section: "discipline", key: "ate_as_planned", checked: true },
  { section: "discipline", key: "workspace_clean_eod", checked: true },
  { section: "discipline", key: "prepared_for_tomorrow", checked: true },
  { section: "discipline", key: "shipped_visible", checked: true },
  { section: "discipline", key: "acted_despite_low_motivation", checked: true },
  { section: "growth", key: "deliberate_learning", checked: true },
  { section: "growth", key: "skill_practice", checked: true },
  { section: "growth", key: "applied", checked: true },
  { section: "growth", key: "reflection", checked: true },
  { section: "growth", key: "fe_one_hour", checked: true },
  { section: "growth", key: "ai_one_hour", checked: true },
  { section: "growth", key: "ielts_one_hour", checked: true },
  { section: "growth", key: "pure_curiosity_ten_min", checked: true },
  { section: "mental_health", key: "mental_wellbeing_stable", checked: true },
  { section: "mental_health", key: "stress_manageable_work", checked: true },
  { section: "mental_health", key: "stress_manageable_home", checked: true },
  { section: "mental_health", key: "coping_when_stress_spiked", checked: true },
  { section: "mental_health", key: "worry_manageable_today", checked: true },
  { section: "mental_health", key: "mood_energy_sustainable", checked: true },
  { section: "mental_health", key: "supportive_connection_today", checked: true },
  { section: "mental_health", key: "real_break_work_screens", checked: true },
  { section: "mental_health", key: "sleep_habits_for_mood", checked: true },
  { section: "physical_health", key: "movement_plan_done", checked: true },
  { section: "physical_health", key: "felt_physically_well_today", checked: true },
  { section: "physical_health", key: "sick_today", checked: false },
  { section: "physical_health", key: "minor_pain_today", checked: false },
  { section: "physical_health", key: "major_pain_today", checked: false },
  { section: "physical_health", key: "had_breakfast_before_commuting", checked: true },
  { section: "physical_health", key: "ate_as_planned", checked: true },
  { section: "physical_health", key: "ate_junk_food", checked: false },
  { section: "sleep", key: "wake_7_00_am", checked: true },
  { section: "sleep", key: "sleep_11_45_pm", checked: true },
  { section: "finance", key: "spent_over_10_azn", checked: false },
  { section: "finance", key: "unplanned_payment_today", checked: false },
  { section: "focus", key: "deep_block", checked: true },
  { section: "focus", key: "priority_moved", checked: true },
  { section: "focus", key: "distractions_ok", checked: true },
  { section: "focus", key: "closure", checked: true },
  { section: "focus", key: "declined_misaligned_invitation", checked: true },
  { section: "focus", key: "screen_zen_social_limits", checked: true },
  { section: "relationships", key: "real_contact", checked: true },
  { section: "relationships", key: "showed_up", checked: true },
  { section: "relationships", key: "honesty_repair", checked: true },
  { section: "relationships", key: "boundaries", checked: true },
  { section: "social", key: "shared_sensitive_info", checked: false },
  { section: "social", key: "conflict_with_others", checked: false },
  { section: "social", key: "constructive_communication", checked: true },
  { section: "social", key: "gossip_with_anyone", checked: false },
  { section: "social", key: "avoided_snark_when_tense", checked: true },
  { section: "social", key: "added_value_no_return", checked: true },
];

/** Alias for {@link TEMPLATE_GOOD_DAY_OPS}. */
export const TEMPLATE_PRODUCTIVE_DAY_OPS: TemplateOp[] = TEMPLATE_GOOD_DAY_OPS;

/**
 * Rough “bad” day template: work/growth/focus/relationships off, strain flags on where applicable.
 * Shared keys (e.g. `ate_as_planned`) are set once per logical value via section-specific ops — last write wins in {@link flatFromTemplateOps}, so keep duplicates aligned.
 */
export const TEMPLATE_UNPRODUCTIVE_DAY_OPS: TemplateOp[] = [
  { section: "discipline", key: "planned_done", checked: false },
  { section: "discipline", key: "meetings_friday_only", checked: false },
  { section: "discipline", key: "wake_dedicated_time", checked: false },
  { section: "discipline", key: "no_late_to_work", checked: false },
  { section: "discipline", key: "daily_report_dedicated_time", checked: false },
  { section: "discipline", key: "declined_misaligned_invitation", checked: false },
  { section: "discipline", key: "screen_zen_social_limits", checked: false },
  { section: "discipline", key: "had_breakfast_before_commuting", checked: false },
  { section: "discipline", key: "ate_as_planned", checked: false },
  { section: "discipline", key: "workspace_clean_eod", checked: false },
  { section: "discipline", key: "prepared_for_tomorrow", checked: false },
  { section: "discipline", key: "shipped_visible", checked: false },
  { section: "discipline", key: "acted_despite_low_motivation", checked: false },
  { section: "growth", key: "deliberate_learning", checked: false },
  { section: "growth", key: "skill_practice", checked: false },
  { section: "growth", key: "applied", checked: false },
  { section: "growth", key: "reflection", checked: false },
  { section: "growth", key: "fe_one_hour", checked: false },
  { section: "growth", key: "ai_one_hour", checked: false },
  { section: "growth", key: "ielts_one_hour", checked: false },
  { section: "growth", key: "pure_curiosity_ten_min", checked: false },
  { section: "mental_health", key: "mental_wellbeing_stable", checked: false },
  { section: "mental_health", key: "stress_manageable_work", checked: false },
  { section: "mental_health", key: "stress_manageable_home", checked: false },
  { section: "mental_health", key: "coping_when_stress_spiked", checked: false },
  { section: "mental_health", key: "worry_manageable_today", checked: false },
  { section: "mental_health", key: "mood_energy_sustainable", checked: false },
  { section: "mental_health", key: "supportive_connection_today", checked: false },
  { section: "mental_health", key: "real_break_work_screens", checked: false },
  { section: "mental_health", key: "sleep_habits_for_mood", checked: false },
  { section: "physical_health", key: "movement_plan_done", checked: false },
  { section: "physical_health", key: "felt_physically_well_today", checked: false },
  { section: "physical_health", key: "sick_today", checked: false },
  { section: "physical_health", key: "minor_pain_today", checked: false },
  { section: "physical_health", key: "major_pain_today", checked: false },
  { section: "physical_health", key: "had_breakfast_before_commuting", checked: false },
  { section: "physical_health", key: "ate_junk_food", checked: true },
  { section: "sleep", key: "wake_7_00_am", checked: false },
  { section: "sleep", key: "sleep_11_45_pm", checked: false },
  { section: "finance", key: "spent_over_10_azn", checked: true },
  { section: "finance", key: "unplanned_payment_today", checked: true },
  { section: "focus", key: "deep_block", checked: false },
  { section: "focus", key: "priority_moved", checked: false },
  { section: "focus", key: "distractions_ok", checked: false },
  { section: "focus", key: "closure", checked: false },
  { section: "relationships", key: "real_contact", checked: false },
  { section: "relationships", key: "showed_up", checked: false },
  { section: "relationships", key: "honesty_repair", checked: false },
  { section: "relationships", key: "boundaries", checked: false },
  { section: "social", key: "shared_sensitive_info", checked: true },
  { section: "social", key: "conflict_with_others", checked: true },
  { section: "social", key: "constructive_communication", checked: false },
  { section: "social", key: "gossip_with_anyone", checked: true },
  { section: "social", key: "avoided_snark_when_tense", checked: false },
  { section: "social", key: "added_value_no_return", checked: false },
];

/** Away from routine: light discipline, minimal deep-work bars, still human basics. */
export const TEMPLATE_TRAVEL_DAY_OPS: TemplateOp[] = [
  { section: "discipline", key: "planned_done", checked: false },
  { section: "discipline", key: "meetings_friday_only", checked: true },
  { section: "discipline", key: "wake_dedicated_time", checked: false },
  { section: "discipline", key: "no_late_to_work", checked: false },
  { section: "discipline", key: "daily_report_dedicated_time", checked: false },
  { section: "discipline", key: "declined_misaligned_invitation", checked: true },
  { section: "discipline", key: "screen_zen_social_limits", checked: true },
  { section: "discipline", key: "had_breakfast_before_commuting", checked: false },
  { section: "discipline", key: "ate_as_planned", checked: false },
  { section: "discipline", key: "workspace_clean_eod", checked: false },
  { section: "discipline", key: "prepared_for_tomorrow", checked: false },
  { section: "discipline", key: "shipped_visible", checked: false },
  { section: "discipline", key: "acted_despite_low_motivation", checked: true },
  { section: "growth", key: "deliberate_learning", checked: false },
  { section: "growth", key: "skill_practice", checked: false },
  { section: "growth", key: "applied", checked: false },
  { section: "growth", key: "reflection", checked: true },
  { section: "growth", key: "fe_one_hour", checked: false },
  { section: "growth", key: "ai_one_hour", checked: false },
  { section: "growth", key: "ielts_one_hour", checked: false },
  { section: "growth", key: "pure_curiosity_ten_min", checked: true },
  { section: "mental_health", key: "mental_wellbeing_stable", checked: true },
  { section: "mental_health", key: "stress_manageable_work", checked: false },
  { section: "mental_health", key: "stress_manageable_home", checked: true },
  { section: "mental_health", key: "coping_when_stress_spiked", checked: true },
  { section: "mental_health", key: "worry_manageable_today", checked: true },
  { section: "mental_health", key: "mood_energy_sustainable", checked: true },
  { section: "mental_health", key: "supportive_connection_today", checked: true },
  { section: "mental_health", key: "real_break_work_screens", checked: true },
  { section: "mental_health", key: "sleep_habits_for_mood", checked: false },
  { section: "physical_health", key: "movement_plan_done", checked: true },
  { section: "physical_health", key: "felt_physically_well_today", checked: true },
  { section: "physical_health", key: "sick_today", checked: false },
  { section: "physical_health", key: "minor_pain_today", checked: false },
  { section: "physical_health", key: "major_pain_today", checked: false },
  { section: "physical_health", key: "had_breakfast_before_commuting", checked: false },
  { section: "physical_health", key: "ate_as_planned", checked: false },
  { section: "physical_health", key: "ate_junk_food", checked: false },
  { section: "sleep", key: "wake_7_00_am", checked: false },
  { section: "sleep", key: "sleep_11_45_pm", checked: false },
  { section: "finance", key: "spent_over_10_azn", checked: false },
  { section: "finance", key: "unplanned_payment_today", checked: false },
  { section: "focus", key: "deep_block", checked: false },
  { section: "focus", key: "priority_moved", checked: false },
  { section: "focus", key: "distractions_ok", checked: true },
  { section: "focus", key: "closure", checked: false },
  { section: "focus", key: "declined_misaligned_invitation", checked: true },
  { section: "focus", key: "screen_zen_social_limits", checked: true },
  { section: "relationships", key: "real_contact", checked: true },
  { section: "relationships", key: "showed_up", checked: true },
  { section: "relationships", key: "honesty_repair", checked: true },
  { section: "relationships", key: "boundaries", checked: true },
  { section: "social", key: "shared_sensitive_info", checked: false },
  { section: "social", key: "conflict_with_others", checked: false },
  { section: "social", key: "constructive_communication", checked: true },
  { section: "social", key: "gossip_with_anyone", checked: false },
  { section: "social", key: "avoided_snark_when_tense", checked: true },
  { section: "social", key: "added_value_no_return", checked: true },
];

/** Intentional light / recovery day — same preset as travel (away from normal routine). */
export const TEMPLATE_REST_DAY_OPS: TemplateOp[] = TEMPLATE_TRAVEL_DAY_OPS.map((o) => ({ ...o }));

export const DAY_TEMPLATE_OPS: Record<DayTemplateKind, TemplateOp[]> = {
  productive: TEMPLATE_PRODUCTIVE_DAY_OPS,
  unproductive: TEMPLATE_UNPRODUCTIVE_DAY_OPS,
  rest: TEMPLATE_REST_DAY_OPS,
};

export const DAY_TEMPLATE_BUTTON_LABEL: Record<DayTemplateKind, string> = {
  productive: "Productive day",
  unproductive: "Unproductive day",
  rest: "Rest day",
};

export function flatFromDayTemplateKind(kind: DayTemplateKind): Record<string, boolean> {
  return flatFromTemplateOps(DAY_TEMPLATE_OPS[kind]);
}

export function emptyChecklistFlat(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const s of DAILY_CHECK_SECTIONS) {
    for (const item of s.items) {
      out[flatKeyForCheckbox(s.section, item.key)] = false;
    }
  }
  return out;
}

export function flatFromTemplateOps(ops: TemplateOp[]): Record<string, boolean> {
  const flat = emptyChecklistFlat();
  for (const op of ops) {
    flat[flatKeyForCheckbox(op.section, op.key)] = op.checked;
  }
  return flat;
}
