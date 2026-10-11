import { Buffer } from 'node:buffer';

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost({ request }: { request: Request }): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string' || typeof (file as Blob).arrayBuffer !== 'function') {
      return jsonResponse({ success: false, error: 'No image file provided.' }, 400);
    }

    const blob = file as File;
    const mimeType = blob.type || 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      return jsonResponse({ success: false, error: 'Uploaded file must be an image.' }, 400);
    }

    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const imageUrl = `data:${mimeType};base64,${base64}`;

    return jsonResponse({ success: true, imageUrl });
  } catch (err) {
    console.error('POST /api/inventory/upload error:', err);
    return jsonResponse({ success: false, error: 'Failed to process uploaded image.' }, 500);
  }
}
