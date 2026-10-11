interface AdminLoginEnv {
  STAFF_ADMIN_USERNAME?: string;
  STAFF_ADMIN_PASSWORD?: string;
  STAFF_DEFAULT_USERNAME?: string;
  STAFF_DEFAULT_PASSWORD?: string;
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

export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: AdminLoginEnv;
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
  const username = typeof requestData.username === 'string' ? requestData.username.trim().toLowerCase() : '';
  const password = typeof requestData.password === 'string' ? requestData.password : '';

  if (!username || !password) {
    return jsonResponse({ error: 'Invalid username or password.' }, 401);
  }

  const adminCandidates = [
    {
      username: env?.STAFF_ADMIN_USERNAME || process.env?.STAFF_ADMIN_USERNAME,
      password: env?.STAFF_ADMIN_PASSWORD || process.env?.STAFF_ADMIN_PASSWORD,
      id: 'store_admin',
      name: 'Store Admin',
    },
    {
      username: env?.STAFF_DEFAULT_USERNAME || process.env?.STAFF_DEFAULT_USERNAME,
      password: env?.STAFF_DEFAULT_PASSWORD || process.env?.STAFF_DEFAULT_PASSWORD,
      id: 'staff_admin',
      name: 'Staff Admin',
    },
  ].filter((c) => Boolean(c.username && c.password));

  // Local development fallback when no Cloudflare secrets are configured on localhost
  const reqUrl = new URL(request.url);
  const isLocalDev = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1';
  if (adminCandidates.length === 0 && isLocalDev) {
    adminCandidates.push({
      username: 'admin',
      password: 'admin',
      id: 'staff_admin',
      name: 'Staff Admin',
    });
  }

  const match = adminCandidates.find(
    (candidate) =>
      candidate.username &&
      candidate.password &&
      candidate.username.trim().toLowerCase() === username &&
      candidate.password === password
  );

  if (!match) {
    return jsonResponse({ error: 'Invalid username or password.' }, 401);
  }

  return jsonResponse({
    staff: {
      id: match.id,
      username,
      name: match.name,
      icon: '👑',
      role: 'Administrator',
      deptName: 'Operations',
      deptShort: 'Operations',
      description: 'Cloudflare-managed staff management account',
      colorBg: '#fef3c7',
      colorBorder: '#fcd34d',
      colorText: '#92400e',
      permissions: ['manage_orders', 'manage_inventory', 'manage_staff', 'view_dashboard'],
    },
  }, 200);
}
