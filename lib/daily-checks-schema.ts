/** Single source for daily checklist sections, keys, and UI labels. DB columns = item.key (snake_case). */

export const DAILY_CHECK_SECTIONS = [
  {
    legend: "Discipline",
    section: "discipline",
    items: [
      { key: "planned_done", label: "Planned work completed as intended" },
      {
        key: "meetings_friday_only",
        label: "No meetings added beyond those planned for Friday",
      },
      { key: "wake_dedicated_time", label: "Woke at my scheduled wake-up time" },
      { key: "no_late_to_work", label: "Not late to work" },
      {
        key: "daily_report_dedicated_time",
        label: "Daily report completed at its scheduled time",
      },
      {
        key: "declined_misaligned_invitation",
        label:
          "Declined an invitation or request that didn't align with my priorities",
      },
      {
        key: "screen_zen_social_limits",
        label:
          "Did I stay within my social media limits based on Screen Zen?",
      },
      { key: "ate_as_planned", label: "Ate in line with what I planned" },
      {
        key: "workspace_clean_eod",
        label: "Workspace clean and organized at end of day",
      },
      {
        key: "prepared_for_tomorrow",
        label: "Prepared clothes / bag / gear for tomorrow",
      },
      {
        key: "shipped_visible",
        label: "Shipped something visible (PR, feature, improvement)",
      },
      { key: "acted_despite_low_motivation", label: "Acted despite low motivation" },
    ],
  },
  {
    legend: "Growth",
    section: "growth",
    items: [
      {
        key: "deliberate_learning",
        label:
          "At least 25 minutes of focused reading, learning, or study (not passive scrolling)",
      },
      {
        key: "skill_practice",
        label:
          "At least 20 minutes of deliberate practice on a skill I am actively improving",
      },
      {
        key: "applied",
        label:
          "Used something learned in the last 7 days in real work, a deliverable, or a live conversation",
      },
      {
        key: "reflection",
        label:
          "Before closing the day, wrote the first concrete action I will take tomorrow",
      },
      { key: "fe_one_hour", label: "At least 1 hour of dedicated front-end (FE) work" },
      {
        key: "ai_one_hour",
        label: "At least 1 hour dedicated to AI (study or practice)",
      },
      { key: "ielts_one_hour", label: "At least 1 hour of IELTS practice" },
      {
        key: "pure_curiosity_ten_min",
        label:
          "Engaged in 10 minutes of 'pure' curiosity (reading/watching something unrelated to work or goals).",
      },
    ],
  },
  {
    legend: "Mental health",
    section: "mental_health",
    items: [
      {
        key: "mental_wellbeing_stable",
        label: "My mental well-being felt stable today",
      },
      {
        key: "stress_manageable_work",
        label: "Stress at work stayed manageable for most of the day",
      },
      {
        key: "stress_manageable_home",
        label: "Stress at home stayed manageable for most of the day",
      },
      {
        key: "coping_when_stress_spiked",
        label:
          "I used a deliberate coping strategy when stress spiked (breath, walk, boundary, or similar)",
      },
      {
        key: "worry_manageable_today",
        label: "Rumination or worry stayed within what I could manage today",
      },
      {
        key: "mood_energy_sustainable",
        label: "My mood or energy felt sustainable for what I had to do today",
      },
      {
        key: "supportive_connection_today",
        label: "I had at least one interaction that felt supportive or genuinely connecting",
      },
      {
        key: "real_break_work_screens",
        label: "I took a real break from work or screens (not just switching tasks)",
      },
      {
        key: "sleep_habits_for_mood",
        label:
          "I protected sleep-related habits that affect mood (caffeine, late scrolling, or similar)",
      },
    ],
  },
  {
    legend: "Physical health",
    section: "physical_health",
    items: [
      {
        key: "movement_plan_done",
        label: "Completed planned movement or training for the day",
      },
      {
        key: "felt_physically_well_today",
        label: "I felt physically well overall today",
      },
      {
        key: "sick_today",
        label: "I was sick or noticeably unwell today",
      },
      {
        key: "minor_pain_today",
        label: "I experienced minor pain or discomfort today",
      },
      {
        key: "major_pain_today",
        label: "I experienced significant or severe pain today",
      },
      { key: "ate_as_planned", label: "Ate in line with what I planned" },
      { key: "ate_junk_food", label: "Ate junk food" },
    ],
  },
  {
    legend: "Sleep",
    section: "sleep",
    items: [
      { key: "wake_7_00_am", label: "Woke at 7:00 a.m." },
      { key: "sleep_11_45_pm", label: "Bedtime by 11:45 p.m." },
    ],
  },
  {
    legend: "Finance",
    section: "finance",
    items: [
      { key: "spent_over_10_azn", label: "Did I spend more than X AZN today?" },
      { key: "unplanned_payment_today", label: "Did I make an unplanned payment today?" },
    ],
  },
  {
    legend: "Focus",
    section: "focus",
    items: [
      { key: "deep_block", label: "Protected a block for deep or focused work" },
      { key: "priority_moved", label: "Top priority moved forward meaningfully" },
      { key: "distractions_ok", label: "Distractions kept under control" },
      {
        key: "closure",
        label: "Reasonable end-of-day closure (inbox, tabs, loose ends)",
      },
      {
        key: "declined_misaligned_invitation",
        label:
          "Declined an invitation or request that didn't align with my priorities",
      },
      {
        key: "screen_zen_social_limits",
        label:
          "Did I stay within my social media limits based on Screen Zen?",
      },
    ],
  },
  {
    legend: "Relationships",
    section: "relationships",
    items: [
      {
        key: "real_contact",
        label: "Meaningful live contact with someone important",
      },
      { key: "showed_up", label: "Fulfilled a commitment to someone" },
      { key: "honesty_repair", label: "Honesty or repair where it mattered" },
      {
        key: "boundaries",
        label: "Time and emotional boundaries respected (mine or theirs)",
      },
    ],
  },
  {
    legend: "Social",
    section: "social",
    items: [
      {
        key: "shared_sensitive_info",
        label: "Did I share any sensitive info with any other people?",
      },
      {
        key: "conflict_with_others",
        label: "Did I conflict with any other people?",
      },
      {
        key: "constructive_communication",
        label: "Was I constructive during communication with people?",
      },
      {
        key: "gossip_with_anyone",
        label: "Did I gossip with anyone about anybody positive or negative?",
      },
      {
        key: "avoided_snark_when_tense",
        label: "Avoided passive-aggressive or sarcastic jabs when tense",
      },
      {
        key: "added_value_no_return",
        label: "Added value to someone without expecting return",
      },
    ],
  },
] as const;

const CHECK_ITEM_KEY_COUNTS = (() => {
  const m = new Map<string, number>();
  for (const s of DAILY_CHECK_SECTIONS) {
    for (const item of s.items) {
      m.set(item.key, (m.get(item.key) ?? 0) + 1);
    }
  }
  return m;
})();

/**
 * Client flat state key. Items whose `key` appears in more than one section share one DB column
 * and one checkbox value — use a single flat key so Discipline/Focus stay in sync.
 */
export function flatKeyForCheckbox(section: string, itemKey: string): string {
  return (CHECK_ITEM_KEY_COUNTS.get(itemKey) ?? 0) > 1
    ? `__shared:${itemKey}`
    : `${section}:${itemKey}`;
}

export type DayEntry = {
  [section: string]: Record<string, boolean> | undefined;
  expenditure?: Record<string, boolean>;
};

export function totalChecklistItemCount(): number {
  const keys = new Set<string>();
  for (const s of DAILY_CHECK_SECTIONS) {
    for (const item of s.items) keys.add(item.key);
  }
  return keys.size;
}

export function countCheckedInEntry(entry: DayEntry): number {
  const seenKeys = new Set<string>();
  let c = 0;
  for (const s of DAILY_CHECK_SECTIONS) {
    for (const item of s.items) {
      if (seenKeys.has(item.key)) continue;
      seenKeys.add(item.key);
      if (readDayEntryBoolean(entry, s.section, item.key)) c++;
    }
  }
  return c;
}

/** Read a checklist boolean; supports legacy `health` bucket from before mental/physical split. */
export function readDayEntryBoolean(
  day: DayEntry | undefined,
  section: string,
  dataKey: string,
): boolean {
  if (!day) return false;
  const sec = day[section];
  if (sec && typeof sec[dataKey] === "boolean") return sec[dataKey];
  if (
    section === "finance" &&
    day.expenditure &&
    typeof day.expenditure[dataKey] === "boolean"
  ) {
    return day.expenditure[dataKey];
  }
  const legacyHealth = day["health"];
  if (
    legacyHealth &&
    typeof legacyHealth === "object" &&
    !Array.isArray(legacyHealth) &&
    typeof legacyHealth[dataKey] === "boolean" &&
    (section === "mental_health" || section === "physical_health")
  ) {
    return legacyHealth[dataKey];
  }
  return false;
}
