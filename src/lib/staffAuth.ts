const STAFF_IDS = ['anna', 'kaitlyn', 'nicole'] as const;

export type StaffId = (typeof STAFF_IDS)[number];

export async function authenticateStaff(username: string, password: string): Promise<StaffId | null> {
  try {
    const response = await fetch('/api/staff-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const result = (await response.json()) as { staffId?: unknown };
    return STAFF_IDS.find((staffId) => staffId === result.staffId) ?? null;
  } catch {
    return null;
  }
}