import { sendEmailItMessage } from './emailService.js';
export default {

  async queue(batch, env) {
    if (!env.DB) {
      console.error('Database not bound in queue');
      return;
    }
    for (const message of batch.messages) {
      try {
        const data = typeof message.body === 'string' ? JSON.parse(message.body) : message.body;
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

        // Cache Invalidation & Sync for VENDOS_MACHINE_STATE
        if (env.VENDOS_MACHINE_STATE) {
          const { results } = await env.DB.prepare('SELECT * FROM machines ORDER BY updated_at DESC').all();
          await env.VENDOS_MACHINE_STATE.put("fleet_status", JSON.stringify(results));
        }

        message.ack();
      } catch (error) {
        console.error('Queue processing error:', error);
        if (env.VENDOS_MACHINE_STATE) {
          try {
            await env.VENDOS_MACHINE_STATE.put('DLQ_' + Date.now(), JSON.stringify({ payload: message.body, error: error.message }));
          } catch (dlqErr) {
            console.error('Failed to write to DLQ:', dlqErr);
          }
        }
        message.ack();
      }

    }
  },


  async scheduled(event, env, ctx) {
    // 1. Dispatch Green Machine Financials
    try {
      const { results: transactions } = await env.DB.prepare(`SELECT * FROM transactions WHERE created_at >= datetime('now', '-1 day')`).all();

      let grossRevenue = 0;
      let cardRevenue = 0;
      let cardFees = 0;

      transactions.forEach(t => {
        grossRevenue += t.amount;
        if (t.is_approved) {
           cardRevenue += t.amount;
           cardFees += t.amount * 0.0595; // Nayax standard 5.95% mock fee
        }
      });

      const cogs = grossRevenue * 0.45; // Simulated 45% COGS for sprint
      const netRevenue = grossRevenue - cogs - cardFees;

      ctx.waitUntil(
        fetch('https://greenmachine.axim.us.com/api/v1/ledger/vend-settlement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             date: new Date().toISOString().split('T')[0],
             gross_revenue: grossRevenue,
             card_revenue: cardRevenue,
             card_fees: cardFees,
             cogs: cogs,
             net_margin: netRevenue
          })
        }).catch(err => console.error('Failed to post to Green Machine:', err))
      );
    } catch (e) {
      console.error('Green machine sync error:', e);
    }

    // 2. Aggregate Fleet Briefing
    try {
      const { results: machines } = await env.DB.prepare('SELECT * FROM machines').all();
      let lowStockAlerts = [];
      let tempAlerts = [];
      let faultAlerts = [];

      for (const m of machines) {
         if (m.temp > 45) tempAlerts.push(m);
         // Simulate checking planogram for low stock (mock for sprint logic)
         if (m.stock < 5) lowStockAlerts.push(m);
         if (m.status === 'fault') faultAlerts.push(m);
      }

      // Generate HITL token
      const encoder = new TextEncoder();
      const secret = env.WEBHOOK_SECRET || 'dummy_secret';
      const keyMaterial = await crypto.subtle.importKey(
        'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const tokenPayload = `${Date.now()}-fleet-actions`;
      const tokenBuffer = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode(tokenPayload));
      const tokenHex = Array.from(new Uint8Array(tokenBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      const signedToken = `${tokenPayload}.${tokenHex}`;

      if (env.VENDOS_STATE_KV) {
        await env.VENDOS_STATE_KV.put(`HITL_${signedToken}`, JSON.stringify({
           generatedAt: Date.now(),
           machinesAlerted: lowStockAlerts.map(m => m.id)
        }), { expirationTtl: 86400 });
      }

      const workerDomain = 'vendos-telemetry-webhook.axim-capital.workers.dev'; // Replace with actual worker domain

      const htmlBody = `
        <html>
        <body style="background-color: #1a1a1a; color: #fff; font-family: sans-serif; padding: 20px;">
          <h1 style="color: #d4af37;">AXiM VendOS Fleet Briefing</h1>
          <p>Daily Summary for ${new Date().toISOString().split('T')[0]}</p>

          <h2 style="border-bottom: 1px solid #333; padding-bottom: 5px;">Action Required</h2>

          <div style="background-color: #2a2a2a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Low Stock Machines:</strong> ${lowStockAlerts.length}</p>
            <p><strong>Temperature Alerts:</strong> ${tempAlerts.length}</p>
            <p><strong>Fault Alerts:</strong> ${faultAlerts.length}</p>

            <div style="margin-top: 15px; display: flex; gap: 10px;">
              <a href="https://${workerDomain}/api/v1/route/action?token=${signedToken}&decision=approve" style="background-color: #10b981; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Approve Restock Route</a>
              <a href="https://${workerDomain}/api/v1/maintenance/action?token=${signedToken}&decision=dispatch" style="background-color: #ef4444; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Dispatch Support Ticket</a>
              <a href="https://vendos.axim.us.com" style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">Inspect Fleet in Cockpit</a>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmailItMessage(env, {
        from: "System Alerts <alerts@axim.us.com>",
        to: ["james.ellars@axim.us.com"],
        bcc: ["jrellars@gmail.com"],
        subject: `[AXiM VendOS Fleet Briefing] Daily Vending Revenue, Stock & Route Digest - ${new Date().toISOString().split('T')[0]}`,
        html: htmlBody
      });

    } catch (e) {
      console.error('Scheduled briefing error:', e);
    }
  },

  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Nayax-Signature',
      } });
    }

    const url = new URL(request.url);

    // Exclude /telemetry webhook
    if (!url.pathname.includes('/telemetry') && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== env.AXIM_API_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }
    }



    if (request.method === 'GET' && url.pathname.includes('/api/v1/route/action')) {
      const token = url.searchParams.get('token');
      const decision = url.searchParams.get('decision');

      if (!env.VENDOS_STATE_KV) {
        return new Response('KV not bound', { status: 500 });
      }

      const kvData = await env.VENDOS_STATE_KV.get(`HITL_${token}`);
      if (!kvData) {
        return new Response('Invalid or expired token', { status: 403 });
      }

      await env.VENDOS_STATE_KV.delete(`HITL_${token}`);

      return new Response(
        '<html><body style="background: #1a1a1a; color: #10b981; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;"><h1>Restock Route Approved & Dispatched Successfully</h1></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (request.method === 'GET' && url.pathname.includes('/api/v1/maintenance/action')) {
      const token = url.searchParams.get('token');

      if (!env.VENDOS_STATE_KV) {
        return new Response('KV not bound', { status: 500 });
      }

      const kvData = await env.VENDOS_STATE_KV.get(`HITL_${token}`);
      if (!kvData) {
        return new Response('Invalid or expired token', { status: 403 });
      }

      await env.VENDOS_STATE_KV.delete(`HITL_${token}`);

      return new Response(
        '<html><body style="background: #1a1a1a; color: #ef4444; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;"><h1>Maintenance Tickets Dispatched to Support Successfully</h1></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (request.method === 'GET' && url.pathname.includes('/v1/internal/vending/machines')) {
      try {
        if (env.VENDOS_MACHINE_STATE) {
          const cached = await env.VENDOS_MACHINE_STATE.get("fleet_status", "json");
          if (cached) {
            return new Response(JSON.stringify(cached), {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }
        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), {
             status: 500,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }
        const { results } = await env.DB.prepare('SELECT * FROM machines ORDER BY updated_at DESC').all();

        if (env.VENDOS_MACHINE_STATE) {
          ctx.waitUntil(env.VENDOS_MACHINE_STATE.put("fleet_status", JSON.stringify(results)));
        }

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
        if (env.VENDOS_INVENTORY_CACHE) {
          const cached = await env.VENDOS_INVENTORY_CACHE.get("active_inventory", "json");
          if (cached) {
            return new Response(JSON.stringify(cached), {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }

        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), {
             status: 500,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }
        const { results } = await env.DB.prepare('SELECT * FROM inventory_logs ORDER BY timestamp DESC').all();

        if (env.VENDOS_INVENTORY_CACHE) {
          ctx.waitUntil(env.VENDOS_INVENTORY_CACHE.put("active_inventory", JSON.stringify(results)));
        }

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


    if (request.method === 'PUT' && url.pathname.includes('/v1/internal/vending/inventory/deplete')) {
      try {
        // Since inventory management logic is currently handled by mock API / soon core API,
        // we'll just invalidate cache and let the request pass through or return ok
        // In actual setup, we might also do D1 updates here if D1 holds the inventory
        if (env.VENDOS_INVENTORY_CACHE && env.DB) {
           // We invalidate cache, but for sync, if DB is bound, let's sync cache from DB
           ctx.waitUntil((async () => {
             const { results } = await env.DB.prepare('SELECT * FROM inventory_logs ORDER BY timestamp DESC').all();
             await env.VENDOS_INVENTORY_CACHE.put("active_inventory", JSON.stringify(results));
           })());
        } else if (env.VENDOS_INVENTORY_CACHE) {
           ctx.waitUntil(env.VENDOS_INVENTORY_CACHE.delete("active_inventory"));
        }

        return new Response(JSON.stringify({ success: true, message: 'Cache updated' }), {
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


    if (request.method === 'GET' && url.pathname.includes('/v1/internal/vending/settings')) {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), {
             status: 500,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }
        const { results } = await env.DB.prepare('SELECT * FROM settings ORDER BY key ASC').all();
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

    if (request.method === 'PUT' && url.pathname.match(/\/v1\/internal\/vending\/settings\/[^/]+$/)) {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), {
             status: 500,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }
        const key = url.pathname.split('/').pop();
        const updateData = await request.json();

        await env.DB.prepare('UPDATE settings SET value = ?, updated_at = datetime(\'now\') WHERE key = ?')
          .bind(updateData.value, key).run();

        return new Response(JSON.stringify({ success: true }), {
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



    if (request.method === 'GET' && url.pathname.match(/\/v1\/internal\/vending\/planogram\/([^/]+)$/)) {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), {
             status: 500,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }
        const machineId = url.pathname.split('/').pop();
        const { results } = await env.DB.prepare('SELECT * FROM planograms WHERE machine_id = ?').bind(machineId).all();

        // Map D1 schema to expected frontend format
        const mappedResults = results.map(row => ({
          id: row.coil_id,
          product: row.product_id,
          stock: row.current_stock,
          capacity: row.capacity,
          status: row.status
        }));

        return new Response(JSON.stringify(mappedResults), {
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


    if (request.method === 'GET' && url.pathname.includes('/v1/internal/vending/dlq')) {
      try {
        if (!env.VENDOS_MACHINE_STATE) {
           return new Response(JSON.stringify({ error: 'KV Namespace not bound' }), {
             status: 500,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }

        const listResult = await env.VENDOS_MACHINE_STATE.list({ prefix: 'DLQ_' });
        const keys = listResult.keys.map(k => k.name);

        return new Response(JSON.stringify({
          status: "ok",
          dlq_count: keys.length,
          failed_keys: keys
        }), {
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

if (request.method === 'PUT' && url.pathname.includes('/v1/internal/vending/planogram')) {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), {
             status: 500,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }

        const data = await request.json();
        // Assume data is an array of objects: { machine_id, coil_id, product_id, current_stock, capacity, status }

        if (!Array.isArray(data)) {
           return new Response(JSON.stringify({ error: 'Expected an array of planogram objects' }), {
             status: 400,
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
           });
        }

        const stmts = data.map(item => {
          return env.DB.prepare(
            `INSERT INTO planograms (machine_id, coil_id, product_id, current_stock, capacity, status)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(machine_id, coil_id) DO UPDATE SET
             product_id=excluded.product_id,
             current_stock=excluded.current_stock,
             capacity=excluded.capacity,
             status=excluded.status`
          ).bind(item.machine_id, item.coil_id, item.product_id, item.current_stock, item.capacity, item.status);
        });

        await env.DB.batch(stmts);

        return new Response(JSON.stringify({ success: true }), {
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

    if (request.method === 'POST' && url.pathname.includes('/api/telemetry/heartbeat')) {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }
        const data = await request.json();
        if (!data.machineId) {
           return new Response(JSON.stringify({ error: 'Missing machineId' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        await env.DB.prepare(`INSERT INTO telemetry_logs (id, machine_id, event_type, payload) VALUES (?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), data.machineId, 'HEARTBEAT', JSON.stringify(data)).run();

        await env.DB.prepare(`UPDATE machines SET status = 'ACTIVE', last_ping = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
          .bind(data.machineId).run();

        return new Response(JSON.stringify({ success: true, timestamp: data.timestamp || new Date().toISOString(), machineId: data.machineId, acknowledged: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    if (request.method === 'POST' && url.pathname.includes('/api/telemetry/ingest')) {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }
        const data = await request.json();
        await env.DB.prepare(`INSERT INTO telemetry_logs (id, machine_id, event_type, payload) VALUES (?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), data.machine_id, data.event_type, JSON.stringify(data.payload)).run();
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      }
    }

    if (request.method === 'GET' && url.pathname.includes('/api/telemetry/recent')) {
      try {
        if (!env.DB) {
           return new Response(JSON.stringify({ error: 'Database not bound' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }
        const { results } = await env.DB.prepare(`SELECT * FROM telemetry_logs ORDER BY created_at DESC LIMIT 20`).all();
        return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
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

      // Write updated machine status to VENDOS_MACHINE_STATE
      if (env.VENDOS_MACHINE_STATE && data.MachineId) {
        ctx.waitUntil(env.VENDOS_MACHINE_STATE.put(data.MachineId, JSON.stringify(data)));
        // Invalidate fleet state so next GET fetches fresh from D1 or rebuilds
        ctx.waitUntil(env.VENDOS_MACHINE_STATE.delete("fleet_status"));
      }

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

      // AXiM Core Telemetry signature generation
      const payloadString = JSON.stringify(data);
      const aximSignatureBuffer = await crypto.subtle.sign(
        'HMAC',
        keyMaterial, // reusing the same secret key material, or you'd generate a new one if it differs
        encoder.encode(payloadString)
      );
      const aximSignatureHex = Array.from(new Uint8Array(aximSignatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Seamlessly and silently POST the validated JSON payload to the AXiM API
      ctx.waitUntil(
        fetch('https://api.axim.us.com/functions/v1/satellite-telemetry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Axim-Signature': aximSignatureHex
          },
          body: payloadString
        }).catch(err => {
          console.error('Failed to post telemetry to AXiM Core:', err);
        })
      );

      // Support System Maintenance Trigger
      if (data.Type === 'TEMP_READING' && data.NewTemp > 45) {
         ctx.waitUntil(
           fetch('https://support.axim.us.com/api/v1/tickets/auto-create', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               title: "Hardware Alert: " + data.MachineId,
               priority: "high",
               category: "Hardware/VendOS",
               details: "Compressor temperature deviation detected. Temp: " + data.NewTemp
             })
           }).catch(err => console.error('Failed to create support ticket:', err))
         );
      } else if (data.Type === 'FAULT' && (data.FaultCode === 'BILL_JAM' || data.FaultCode === 'COIN_EMPTY')) {
         ctx.waitUntil(
           fetch('https://support.axim.us.com/api/v1/tickets/auto-create', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               title: "Hardware Alert: " + data.MachineId,
               priority: "high",
               category: "Hardware/VendOS",
               details: "Hardware fault detected: " + data.FaultCode
             })
           }).catch(err => console.error('Failed to create support ticket:', err))
         );
      }


      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
