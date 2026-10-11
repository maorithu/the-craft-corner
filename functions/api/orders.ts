import {
  getAllOrders,
  getOrderByQuery,
  createOrder,
  updateOrder,
  deleteOrder,
  DbOrder,
} from '../../src/lib/db';

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestGet({
  request,
  env,
}: {
  request: Request;
  env?: { DB?: any };
}): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query =
      url.searchParams.get('query') ||
      url.searchParams.get('q') ||
      url.searchParams.get('orderCode');

    if (query) {
      const order = await getOrderByQuery(query, env);
      return jsonResponse({ success: true, order });
    }

    const orders = await getAllOrders(env);
    return jsonResponse({ success: true, orders });
  } catch (err) {
    console.error('GET /api/orders error:', err);
    return jsonResponse({ success: false, error: 'Failed to load orders.' }, 500);
  }
}

export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env?: { DB?: any };
}): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<DbOrder>;
    if (!body || typeof body !== 'object') {
      return jsonResponse({ success: false, error: 'Invalid order data.' }, 400);
    }

    const order = await createOrder(body, env);
    return jsonResponse({ success: true, order }, 201);
  } catch (err) {
    console.error('POST /api/orders error:', err);
    return jsonResponse({ success: false, error: 'Failed to create order.' }, 500);
  }
}

export async function onRequestPut({
  request,
  env,
}: {
  request: Request;
  env?: { DB?: any };
}): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<DbOrder> & { orderCode?: string };
    if (!body || typeof body !== 'object' || !body.orderCode) {
      return jsonResponse({ success: false, error: 'orderCode is required.' }, 400);
    }

    const { orderCode, ...updates } = body;
    const order = await updateOrder(orderCode, updates, env);
    if (!order) {
      return jsonResponse({ success: false, error: 'Order not found.' }, 404);
    }

    return jsonResponse({ success: true, order });
  } catch (err) {
    console.error('PUT /api/orders error:', err);
    return jsonResponse({ success: false, error: 'Failed to update order.' }, 500);
  }
}

export async function onRequestDelete({
  request,
  env,
}: {
  request: Request;
  env?: { DB?: any };
}): Promise<Response> {
  try {
    const url = new URL(request.url);
    const orderCode = url.searchParams.get('orderCode');
    if (!orderCode) {
      return jsonResponse({ success: false, error: 'orderCode is required.' }, 400);
    }

    const deleted = await deleteOrder(orderCode, env);
    return jsonResponse({ success: deleted });
  } catch (err) {
    console.error('DELETE /api/orders error:', err);
    return jsonResponse({ success: false, error: 'Failed to delete order.' }, 500);
  }
}
