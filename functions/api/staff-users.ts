import { getAllStaffUsers } from '../../src/lib/db';

function formatStaffUser(staffUser: {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department?: string;
  departmentShort?: string;
  icon?: string;
  description?: string;
  colorBg?: string;
  colorBorder?: string;
  colorText?: string;
  permissions?: string | string[];
}) {
  let permissions: string[] = [];

  if (typeof staffUser.permissions === 'string') {
    try {
      const parsed = JSON.parse(staffUser.permissions);
      permissions = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
    } catch {
      permissions = [];
    }
  } else if (Array.isArray(staffUser.permissions)) {
    permissions = staffUser.permissions.filter((value): value is string => typeof value === 'string');
  }

  return {
    id: staffUser.id,
    username: staffUser.username,
    name: staffUser.fullName,
    icon: staffUser.icon || '👤',
    role: staffUser.role || 'Staff',
    deptName: staffUser.department || 'Operations',
    deptShort: staffUser.departmentShort || staffUser.department || 'Operations',
    description: staffUser.description || '',
    colorBg: staffUser.colorBg || '#eff6ff',
    colorBorder: staffUser.colorBorder || '#bfdbfe',
    colorText: staffUser.colorText || '#1e3a8a',
    permissions,
  };
}

export async function onRequestGet({ env }: { env?: { DB?: any } } = {}): Promise<Response> {
  const staffUsers = await getAllStaffUsers(env);

  return new Response(JSON.stringify({ staff: staffUsers.map(formatStaffUser) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
