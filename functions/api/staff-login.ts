import { getStaffByUsername, verifyStaffPassword } from '../../src/lib/db';

interface StaffLoginEnv {
  // No legacy env-backed fallback accounts remain.
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function normalizeStaffUser(staffUser: { id: string; username: string; fullName: string; role: string; department?: string; departmentShort?: string; icon?: string; description?: string; colorBg?: string; colorBorder?: string; colorText?: string; permissions?: string | string[] }) {
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

export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: StaffLoginEnv;
}): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400);
  }

  if (typeof body !== 'object' || body === null) {
    return jsonResponse({ error: 'Invalid request.' }, 400);
  }

  const requestData = body as Record<string, unknown>;
  const username = typeof requestData.username === 'string'
    ? requestData.username.trim().toLowerCase()
    : '';
  const password = typeof requestData.password === 'string' ? requestData.password : '';

  if (!username || !password) {
    return jsonResponse({ error: 'Invalid username or password.' }, 401);
  }

  const dbStaff = getStaffByUsername(username);
  if (dbStaff && verifyStaffPassword(password, dbStaff.passwordHash, dbStaff.passwordSalt)) {
    return jsonResponse({ staff: normalizeStaffUser(dbStaff) }, 200);
  }

  return jsonResponse({ error: 'Invalid username or password.' }, 401);
}