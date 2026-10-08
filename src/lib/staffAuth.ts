export type StaffProfile = {
  id: string;
  username: string;
  name: string;
  icon: string;
  role: string;
  deptName: string;
  deptShort: string;
  description: string;
  colorBg: string;
  colorBorder: string;
  colorText: string;
  permissions?: string[];
};

export async function authenticateStaff(username: string, password: string): Promise<StaffProfile | null> {
  try {
    const response = await fetch('/api/staff-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const result = (await response.json()) as { staff?: StaffProfile; staffId?: unknown };
    if (result.staff) return result.staff;

    if (typeof result.staffId === 'string') {
      return {
        id: result.staffId,
        username,
        name: result.staffId,
        icon: '👤',
        role: 'Staff',
        deptName: 'Operations',
        deptShort: 'Operations',
        description: '',
        colorBg: '#eff6ff',
        colorBorder: '#bfdbfe',
        colorText: '#1e3a8a',
        permissions: ['manage_orders'],
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function authenticateAdminStaff(username: string, password: string): Promise<StaffProfile | null> {
  try {
    const response = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const result = (await response.json()) as { staff?: StaffProfile };
    return result.staff ?? null;
  } catch {
    return null;
  }
}

export async function getStaffDirectory(): Promise<StaffProfile[]> {
  try {
    const response = await fetch('/api/staff-users', { cache: 'no-store' });
    if (!response.ok) return [];

    const result = (await response.json()) as { staff?: StaffProfile[] };
    return Array.isArray(result.staff) ? result.staff : [];
  } catch {
    return [];
  }
}