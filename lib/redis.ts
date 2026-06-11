const url = process.env.KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN;

export async function redisCmd<T>(cmd: (string | number)[]): Promise<T | null> {
  if (!url || !token) return null;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cmd)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data.result as T;
  } catch {
    return null;
  }
}
