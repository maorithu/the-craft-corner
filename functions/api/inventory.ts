import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  DbProduct,
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

export async function onRequestGet({ env }: { env?: { DB?: any } } = {}): Promise<Response> {
  try {
    const products = await getAllProducts(env);
    return jsonResponse({ success: true, products });
  } catch (err) {
    console.error('GET /api/inventory error:', err);
    return jsonResponse({ success: false, error: 'Failed to load inventory.' }, 500);
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
    const body = (await request.json()) as Partial<DbProduct>;
    if (!body || typeof body !== 'object' || !body.name) {
      return jsonResponse({ success: false, error: 'Product name is required.' }, 400);
    }

    const product = await addProduct(body, env);
    return jsonResponse({ success: true, product }, 201);
  } catch (err) {
    console.error('POST /api/inventory error:', err);
    return jsonResponse({ success: false, error: 'Failed to add product.' }, 500);
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
    const body = (await request.json()) as Partial<DbProduct> & { id?: string | number };
    if (!body || typeof body !== 'object' || body.id === undefined) {
      return jsonResponse({ success: false, error: 'Product id is required.' }, 400);
    }

    const { id, ...updates } = body;
    const product = await updateProduct(id, updates, env);
    if (!product) {
      return jsonResponse({ success: false, error: 'Product not found.' }, 404);
    }

    return jsonResponse({ success: true, product });
  } catch (err) {
    console.error('PUT /api/inventory error:', err);
    return jsonResponse({ success: false, error: 'Failed to update product.' }, 500);
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
    const id = url.searchParams.get('id');
    if (!id) {
      return jsonResponse({ success: false, error: 'Product id is required.' }, 400);
    }

    const deleted = await deleteProduct(id, env);
    return jsonResponse({ success: deleted });
  } catch (err) {
    console.error('DELETE /api/inventory error:', err);
    return jsonResponse({ success: false, error: 'Failed to delete product.' }, 500);
  }
}
