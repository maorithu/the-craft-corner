import { createStaffUser } from '../../src/lib/db';

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env?: { DB?: any } }): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Invalid request body.' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ success: false, error: 'Invalid request body.' }, 400);
  }

  const form = body as Record<string, unknown>;
  const username = typeof form.username === 'string' ? form.username.trim().toLowerCase() : '';
  const password = typeof form.password === 'string' ? form.password : '';
  const fullName = typeof form.fullName === 'string' ? form.fullName.trim() : '';
  const role = typeof form.role === 'string' ? form.role.trim() : 'Staff';
  const department = typeof form.department === 'string' ? form.department.trim() : 'Operations';
  const icon = typeof form.icon === 'string' ? form.icon.trim() : '👤';
  const description = typeof form.description === 'string' ? form.description.trim() : '';
  const permissions = Array.isArray(form.permissions)
    ? form.permissions.filter((value): value is string => typeof value === 'string')
    : ['manage_orders'];

  if (!username || !password || !fullName) {
    return jsonResponse({ success: false, error: 'Username, password, and full name are required.' }, 400);
  }

  const created = await createStaffUser({
    username,
    password,
    fullName,
    role,
    department,
    departmentShort: department,
    icon,
    description,
    permissions,
  }, env);

  if (!created) {
    return jsonResponse({ success: false, error: 'That username is already in use or could not be created.' }, 409);
  }

  return jsonResponse({ success: true, staff: created }, 201);
}
