import { resetProducts } from '../../../src/lib/db';

export async function onRequestPost({ env }: { env?: { DB?: any } } = {}): Promise<Response> {
  try {
    const products = await resetProducts(env);
    return new Response(JSON.stringify({ success: true, products }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('POST /api/inventory/reset error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to reset inventory.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
