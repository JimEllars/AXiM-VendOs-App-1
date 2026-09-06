export async function sendEmailItMessage(env, payload) {
  try {
    const response = await fetch('https://api.emailit.com/v2/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.EMAILIT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`EmailIt API error: ${response.status} ${err}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Email dispatch failed, buffering to DLQ:', error);
    if (env.VENDOS_DLQ_KV) {
      const dlqKey = `EMAIL_DLQ_${Date.now()}_${crypto.randomUUID()}`;
      await env.VENDOS_DLQ_KV.put(dlqKey, JSON.stringify({
        payload,
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
    throw error;
  }
}
