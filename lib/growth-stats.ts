import type { DayEntry } from "./daily-checks-schema";

export const SCORING_VERSION = "v3.9-mental-health-expanded-utc";
export const GROWTH_STATS_WINDOW_DAYS = 14;

export type FieldPolarity = "good_when_true" | "good_when_false";

export type GrowthStatField = {
  section: string;
  key: string;
  weight: number;
  polarity: FieldPolarity;
};

export type GrowthStatBlock = {
  id: string;
  label: string;
  detail: string;
  fields: GrowthStatField[];
};

/** Panel rows; weights × 14 calendar days (UTC) define each category max. Finance: first two rows invert (points when unchecked). */
export const GROWTH_STAT_BLOCKS: GrowthStatBlock[] = [
  {
    id: "discipline",
    label: "Discipline",
    detail:
      "Keeping promises to yourself, sticking to routines you said mattered, starting on time, and following through after a bad day. Not perfection — reliability relative to your own bar.",
    fields: [
      { section: "discipline", key: "planned_done", weight: 15, polarity: "good_when_true" },
      { section: "discipline", key: "meetings_friday_only", weight: 3, polarity: "good_when_true" },
      { section: "discipline", key: "wake_dedicated_time", weight: 10, polarity: "good_when_true" },
      { section: "discipline", key: "no_late_to_work", weight: 12, polarity: "good_when_true" },
      {
        section: "discipline",
        key: "daily_report_dedicated_time",
        weight: 10,
        polarity: "good_when_true",
      },
      {
        section: "discipline",
        key: "declined_misaligned_invitation",
        weight: 12,
        polarity: "good_when_true",
      },
      {
        section: "discipline",
        key: "screen_zen_social_limits",
        weight: 8,
        polarity: "good_when_true",
      },
      { section: "discipline", key: "ate_as_planned", weight: 8, polarity: "good_when_true" },
      { section: "discipline", key: "workspace_clean_eod", weight: 4, polarity: "good_when_true" },
      { section: "discipline", key: "prepared_for_tomorrow", weight: 5, polarity: "good_when_true" },
      { section: "discipline", key: "shipped_visible", weight: 18, polarity: "good_when_true" },
      {
        section: "discipline",
        key: "acted_despite_low_motivation",
        weight: 20,
        polarity: "good_when_true",
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    detail:
      "Reading, courses, deliberate skill practice, reflection, and applying what you learn — not busywork. Stagnation or repeating the same year lowers this; real learning and use raises it.",
    fields: [
      { section: "growth", key: "deliberate_learning", weight: 8, polarity: "good_when_true" },
      { section: "growth", key: "skill_practice", weight: 8, polarity: "good_when_true" },
      { section: "growth", key: "applied", weight: 9, polarity: "good_when_true" },
      { section: "growth", key: "reflection", weight: 7, polarity: "good_when_true" },
      { section: "growth", key: "fe_one_hour", weight: 10, polarity: "good_when_true" },
      { section: "growth", key: "ai_one_hour", weight: 10, polarity: "good_when_true" },
      { section: "growth", key: "ielts_one_hour", weight: 9, polarity: "good_when_true" },
      {
        section: "growth",
        key: "pure_curiosity_ten_min",
        weight: 4,
        polarity: "good_when_true",
      },
      {
        section: "growth",
        key: "acted_despite_low_motivation",
        weight: 20,
        polarity: "good_when_true",
      },
    ],
  },
  {
    id: "mental_health",
    label: "Mental health",
    detail:
      "Stability, stress at work and home (most of the day), coping when it spikes, worry you could manage, sustainable mood and energy, real connection and breaks, and habits that protect sleep and mood — your honest read, not a diagnosis.",
    fields: [
      { section: "mental_health", key: "mental_wellbeing_stable", weight: 8, polarity: "good_when_true" },
      { section: "mental_health", key: "stress_manageable_work", weight: 11, polarity: "good_when_true" },
      { section: "mental_health", key: "stress_manageable_home", weight: 14, polarity: "good_when_true" },
      { section: "mental_health", key: "coping_when_stress_spiked", weight: 9, polarity: "good_when_true" },
      { section: "mental_health", key: "worry_manageable_today", weight: 8, polarity: "good_when_true" },
      { section: "mental_health", key: "mood_energy_sustainable", weight: 8, polarity: "good_when_true" },
      { section: "mental_health", key: "supportive_connection_today", weight: 6, polarity: "good_when_true" },
      { section: "mental_health", key: "real_break_work_screens", weight: 7, polarity: "good_when_true" },
      { section: "mental_health", key: "sleep_habits_for_mood", weight: 7, polarity: "good_when_true" },
    ],
  },
  {
    id: "physical_health",
    label: "Physical health",
    detail:
      "Movement and training, same-day sense of physical wellness versus sickness or pain, and how you ate relative to your plan — activity and nourishment, not your ideal gym fantasy.",
    fields: [
      { section: "physical_health", key: "movement_plan_done", weight: 8, polarity: "good_when_true" },
      { section: "physical_health", key: "felt_physically_well_today", weight: 4, polarity: "good_when_true" },
      { section: "physical_health", key: "sick_today", weight: 4, polarity: "good_when_false" },
      { section: "physical_health", key: "minor_pain_today", weight: 3, polarity: "good_when_false" },
      { section: "physical_health", key: "major_pain_today", weight: 4, polarity: "good_when_false" },
      { section: "physical_health", key: "ate_as_planned", weight: 8, polarity: "good_when_true" },
      { section: "physical_health", key: "ate_junk_food", weight: 14, polarity: "good_when_false" },
    ],
  },
  {
    id: "sleep",
    label: "Sleep",
    detail:
      "Bedtime and wake consistency, hours you actually get, how rested you feel, night-time screens or caffeine, alcohol before bed, waking up at night, and whether you protect sleep when life gets loud.",
    fields: [
      { section: "sleep", key: "wake_7_00_am", weight: 10, polarity: "good_when_true" },
      { section: "sleep", key: "sleep_11_45_pm", weight: 10, polarity: "good_when_true" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    detail:
      "How your spending matches what you said matters — rent, food, transport, subscriptions, impulse buys, debt payments, savings you actually set aside. Income level is not the score; it's whether your outflow feels intentional, tracked enough for you, and free of constant money shame or avoidance.",
    fields: [
      { section: "finance", key: "spent_over_10_azn", weight: 8, polarity: "good_when_false" },
      {
        section: "finance",
        key: "unplanned_payment_today",
        weight: 7,
        polarity: "good_when_false",
      },
    ],
  },
  {
    id: "focus",
    label: "Focus",
    detail:
      "Length and quality of deep-work blocks, how often you get pulled into distractions (phone, tabs, chatter), and whether you can aim attention at one important thing when it matters. Mood and sleep spill over into this.",
    fields: [
      { section: "focus", key: "deep_block", weight: 9, polarity: "good_when_true" },
      { section: "focus", key: "priority_moved", weight: 10, polarity: "good_when_true" },
      { section: "focus", key: "distractions_ok", weight: 7, polarity: "good_when_true" },
      { section: "focus", key: "closure", weight: 6, polarity: "good_when_true" },
      {
        section: "focus",
        key: "declined_misaligned_invitation",
        weight: 12,
        polarity: "good_when_true",
      },
      {
        section: "focus",
        key: "screen_zen_social_limits",
        weight: 8,
        polarity: "good_when_true",
      },
    ],
  },
  {
    id: "relationships",
    label: "Relationships",
    detail:
      "Time and presence with people who matter, honesty, repair after conflict, and whether you show up when it counts — family, close friends, partner, not follower counts.",
    fields: [
      { section: "relationships", key: "real_contact", weight: 8, polarity: "good_when_true" },
      { section: "relationships", key: "showed_up", weight: 9, polarity: "good_when_true" },
      { section: "relationships", key: "honesty_repair", weight: 8, polarity: "good_when_true" },
      { section: "relationships", key: "boundaries", weight: 8, polarity: "good_when_true" },
    ],
  },
  {
    id: "social",
    label: "Social",
    detail:
      "Boundaries around sensitive information, avoiding unnecessary conflict and gossip, and showing up constructively in how you talk with people — not perfection, but honest self-accountability.",
    fields: [
      {
        section: "social",
        key: "shared_sensitive_info",
        weight: 19,
        polarity: "good_when_false",
      },
      {
        section: "social",
        key: "conflict_with_others",
        weight: 20,
        polarity: "good_when_false",
      },
      {
        section: "social",
        key: "constructive_communication",
        weight: 12,
        polarity: "good_when_true",
      },
      {
        section: "social",
        key: "gossip_with_anyone",
        weight: 15,
        polarity: "good_when_false",
      },
      {
        section: "social",
        key: "avoided_snark_when_tense",
        weight: 7,
        polarity: "good_when_true",
      },
      {
        section: "social",
        key: "added_value_no_return",
        weight: 18,
        polarity: "good_when_true",
      },
    ],
  },
];

const RULE_BY_CELL = new Map<string, GrowthStatField>();
for (const b of GROWTH_STAT_BLOCKS) {
  for (const f of b.fields) {
    RULE_BY_CELL.set(`${f.section}:${f.key}`, f);
  }
}

export function getGrowthFieldRule(section: string, key: string): GrowthStatField | undefined {
  return RULE_BY_CELL.get(`${section}:${key}`);
}

function blockMaxWeightPerDay(block: GrowthStatBlock): number {
  return block.fields.reduce((s, f) => s + f.weight, 0);
}

function fieldContribution(entry: DayEntry | undefined, f: GrowthStatField): number {
  if (!entry) return 0;
  const checked = entry[f.section]?.[f.key] === true;
  if (f.polarity === "good_when_true") return checked ? f.weight : 0;
  return checked ? 0 : f.weight;
}

export type GrowthStatRow = {
  id: string;
  label: string;
  detail: string;
  value: number;
  maxWeightPerDay: number;
};

/**
 * Weighted % per block: round(100 × earned / max), max = (sum of weights in block) × number of calendar days in window.
 * Missing days earn 0 on all items (strict calendar denominator).
 */
export function growthStatsFromRowDays(
  rowDays: { entryDate: string; entry: DayEntry }[],
  calendarDates: string[],
): GrowthStatRow[] {
  const byDate = new Map<string, DayEntry>();
  for (const r of rowDays) {
    byDate.set(r.entryDate.slice(0, 10), r.entry);
  }

  const D = calendarDates.length;

  return GROWTH_STAT_BLOCKS.map((block) => {
    const sumW = blockMaxWeightPerDay(block);
    const maxPoints = sumW * D;
    let points = 0;
    for (const date of calendarDates) {
      const entry = byDate.get(date);
      for (const f of block.fields) {
        points += fieldContribution(entry, f);
      }
    }
    const value = maxPoints > 0 ? Math.round((100 * points) / maxPoints) : 0;
    return {
      id: block.id,
      label: block.label,
      detail: block.detail,
      value: Math.min(100, Math.max(0, value)),
      maxWeightPerDay: sumW,
    };
  });
}
