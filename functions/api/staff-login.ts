interface StaffLoginEnv {
  STAFF_ANNA_USERNAME?: string;
  STAFF_ANNA_PASSWORD?: string;
  STAFF_KAITLYN_USERNAME?: string;
  STAFF_KAITLYN_PASSWORD?: string;
  STAFF_NICOLE_USERNAME?: string;
  STAFF_NICOLE_PASSWORD?: string;
}

function jsonResponse(body: Record<string, string>, status: number): Response {
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

  const accounts = [
    { staffId: 'anna', username: env.STAFF_ANNA_USERNAME, password: env.STAFF_ANNA_PASSWORD },
    { staffId: 'kaitlyn', username: env.STAFF_KAITLYN_USERNAME, password: env.STAFF_KAITLYN_PASSWORD },
    { staffId: 'nicole', username: env.STAFF_NICOLE_USERNAME, password: env.STAFF_NICOLE_PASSWORD },
  ];

  if (accounts.some((account) => !account.username || !account.password)) {
    return jsonResponse({ error: 'Sign-in is unavailable.' }, 503);
  }

  const account = accounts.find(
    (candidate) => candidate.username!.trim().toLowerCase() === username && candidate.password === password
  );

  if (!account) return jsonResponse({ error: 'Invalid username or password.' }, 401);
  return jsonResponse({ staffId: account.staffId }, 200);
}