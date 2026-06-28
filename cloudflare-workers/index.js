export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Nayax-Signature',
      } });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname.includes('/v1/internal/vending/machines')) {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), {
             status: 500,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }
        const { results } = await env.DB.prepare('SELECT * FROM machines ORDER BY updated_at DESC').all();
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (request.method === 'GET' && url.pathname.includes('/v1/internal/vending/inventory')) {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), {
             status: 500,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }
        const { results } = await env.DB.prepare('SELECT * FROM inventory_logs ORDER BY timestamp DESC').all();
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    if (request.method === 'GET' && url.pathname.includes('/v1/internal/vending/ledger')) {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), {
             status: 500,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }
        const { results } = await env.DB.prepare('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 100').all();
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

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

      // Cloudflare D1 Worker Binding logic
      if (env.DB) {
        ctx.waitUntil(
          (async () => {
            try {
              if (data.Type === 'VEND') {
                const transactionId = data.NayaxTransactionId || crypto.randomUUID();
                const machineId = data.MachineId;
                const amount = data.Amount || 0;
                const quantity = data.Quantity || 1;
                const isApproved = data.IsApproved ? 1 : 0;

                // Insert transaction
                await env.DB.prepare(
                  `INSERT INTO transactions (id, transaction_id, machine_id, amount, quantity, is_approved)
                   VALUES (?, ?, ?, ?, ?, ?)`
                ).bind(crypto.randomUUID(), transactionId, machineId, amount, quantity, isApproved).run();

                // Insert into inventory_logs
                if (data.SelectionId) {
                  await env.DB.prepare(
                    `INSERT INTO inventory_logs (id, machine_id, selection_id) VALUES (?, ?, ?)`
                  ).bind(crypto.randomUUID(), machineId, data.SelectionId).run();
                }

                // Update stock in machines table
                // Assume NewStock is provided in the payload, or we decrement by quantity
                if (data.NewStock !== undefined) {
                   await env.DB.prepare(
                     `UPDATE machines SET stock = ?, updated_at = datetime('now') WHERE id = ?`
                   ).bind(data.NewStock, machineId).run();
                } else {
                   await env.DB.prepare(
                     `UPDATE machines SET stock = MAX(0, stock - ?), updated_at = datetime('now') WHERE id = ?`
                   ).bind(quantity, machineId).run();
                }
              } else if (data.Type === 'TEMP_READING') {
                const machineId = data.MachineId;
                const newTemp = data.NewTemp;
                if (machineId && newTemp !== undefined) {
                  await env.DB.prepare(
                    `UPDATE machines SET temp = ?, updated_at = datetime('now') WHERE id = ?`
                  ).bind(newTemp, machineId).run();
                }
              }
            } catch (dbErr) {
              console.error('D1 Database error:', dbErr);
            }
          })()
        );
      }

      // Seamlessly and silently POST the validated JSON payload to the AXiM API
      ctx.waitUntil(
        fetch('https://api.aximcapital.com/v1/internal/vending/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(err => {
          console.error('Failed to post telemetry to AXiM Core:', err);
        })
      );

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
