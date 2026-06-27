export default {
  async fetch(request, env, ctx) {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const signature = request.headers.get('X-Nayax-Signature');
      if (!signature) {
        return new Response('Missing Signature', { status: 401 });
      }

      const body = await request.text();
      const secret = env.WEBHOOK_SECRET || 'dummy_secret';

      // HMAC SHA-256 Validation Logic
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      // Convert hex signature to ArrayBuffer
      // Add error handling for invalid signature formats
      if (!/^[\da-f]+$/i.test(signature) || signature.length % 2 !== 0) {
        return new Response('Invalid Signature Format', { status: 403 });
      }

      const signatureBuffer = new Uint8Array(
        signature.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))
      );

      const isValid = await crypto.subtle.verify(
        'HMAC',
        keyMaterial,
        signatureBuffer,
        encoder.encode(body)
      );

      if (!isValid) {
        return new Response('Invalid Signature', { status: 403 });
      }

      // Webhook payload is valid. Parse and process.
      const data = JSON.parse(body);

      // TODO: Push data to Cloudflare SQS / D1 / KV / Supabase here
      console.log('Valid telemetry received for machine:', data.machineId);

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
