const rateMap = new Map<string, { count: number; ts: number }>();

export function rateLimit(ip: string, max = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.ts > windowMs) {
    rateMap.set(ip, { count: 1, ts: now });
    return true; // allowed
  }
  if (entry.count >= max) return false; // blocked
  entry.count++;
  return true;
}

// Use in every API route:
// const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
// if (!rateLimit(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
