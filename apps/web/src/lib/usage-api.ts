export type UsageDayBucket = {
  day: string;
  sandboxHours: number;
  commands: number;
  durationMs: number;
};

export type UsageSummary = {
  days: number;
  totalDurationMs: number;
  totalSandboxHours: number;
  totalCommands: number;
  byDay: UsageDayBucket[];
};

export async function fetchUsage(days = 7): Promise<UsageSummary> {
  const res = await fetch(`/api/usage?days=${days}`, { cache: "no-store" });
  const data = (await res.json()) as {
    usage?: UsageSummary;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `usage ${res.status}`);
  }
  if (!data.usage) throw new Error("missing usage payload");
  return data.usage;
}
