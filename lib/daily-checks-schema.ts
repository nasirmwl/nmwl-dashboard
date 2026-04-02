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
        key: "doing_unplanned_work",
        label: "Addressed unplanned or ad hoc work as required",
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
    legend: "Health",
    section: "health",
    items: [
      {
        key: "movement_plan_done",
        label: "Completed planned movement or training for the day",
      },
      {
        key: "mental_wellbeing_stable",
        label: "Mental well-being felt stable today",
      },
      {
        key: "stress_manageable_work",
        label: "Stress remained manageable at work",
      },
      {
        key: "stress_manageable_home",
        label: "Stress remained manageable at home",
      },
      {
        key: "symptoms_proactive",
        label: "Minor symptoms or discomfort addressed proactively",
      },
      {
        key: "breathing_today",
        label: "Breathing exercises or intentional breathwork",
      },
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
      if (entry[s.section]?.[item.key] === true) c++;
    }
  }
  return c;
}
