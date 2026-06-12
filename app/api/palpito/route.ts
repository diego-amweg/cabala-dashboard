import { NextResponse } from 'next/server';
import { redisCmd } from '@/lib/redis';
import { cacheGet } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const PALABRAS_A = ['gambeta', 'rabona', 'chilena', 'palomita', 'taquito', 'caño', 'enganche', 'contra', 'tribuna', 'banderazo', 'alargue', 'bombo', 'termo', 'penal', 'mufa', 'yeta', 'fierro', 'wing'];
const PALABRAS_B = ['dorado', 'mistico', 'eterno', 'bravo', 'glorioso', 'cabulero', 'infernal', 'celeste', 'criollo', 'potrero', 'mundial', 'salvaje'];

const rand = (max: number) => Math.floor(Math.random() * max);

interface FixtureItem {
  id: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
}
type CachedFixtures = { items: FixtureItem[]; updatedAt: number; isMatchDay: boolean };

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    if (body.action === 'register') {
      const rlKey = `palpito:rlr:${ip}`;
      const count = await redisCmd<number>(['INCR', rlKey]);
      if (count === null) return NextResponse.json({ error: 'redis', detail: 'rl_incr_failed' });
      if (count === 1) await redisCmd(['EXPIRE', rlKey, 3600]);
      if (count > 5) return NextResponse.json({ error: 'rate' });

      const id = crypto.randomUUID();
      const alias = `${PALABRAS_A[rand(PALABRAS_A.length)]}-${PALABRAS_B[rand(PALABRAS_B.length)]}-${10 + rand(90)}`;

      const setRes = await redisCmd(['SET', `palpito:user:${id}`, JSON.stringify({ alias, createdAt: Date.now() })]);
      if (setRes === null) return NextResponse.json({ error: 'redis', detail: 'user_set_failed' });

      return NextResponse.json({ id, alias });
    }

    if (body.action === 'bet') {
      const rlKey = `palpito:rl:${ip}`;
      const count = await redisCmd<number>(['INCR', rlKey]);
      if (count === null) return NextResponse.json({ error: 'redis', detail: 'rl_incr_failed' });
      if (count === 1) await redisCmd(['EXPIRE', rlKey, 60]);
      if (count > 60) return NextResponse.json({ error: 'rate' });

      const { id, matchId, h, a } = body;
      const parsedH = typeof h === 'number' ? h : parseInt(h, 10);
      const parsedA = typeof a === 'number' ? a : parseInt(a, 10);

      if (typeof id !== 'string' || typeof matchId !== 'string' || !Number.isInteger(parsedH) || !Number.isInteger(parsedA) || parsedH < 0 || parsedH > 20 || parsedA < 0 || parsedA > 20) {
        return NextResponse.json({ error: 'invalid' });
      }

      const userRaw = await redisCmd<string>(['GET', `palpito:user:${id}`]);
      if (!userRaw) return NextResponse.json({ error: 'unknown' });

      const cached = await cacheGet<CachedFixtures>('fixtures:groups');
      if (!cached || !cached.items || cached.items.length === 0) return NextResponse.json({ error: 'fixtures', detail: 'cache_empty' });

      const match = cached.items.find(m => m.id === matchId);
      if (!match) return NextResponse.json({ error: 'match' });

      if (match.status !== 'scheduled') {
        return NextResponse.json({ error: 'locked' });
      }

      const betKey = `palpito:bets:${id}`;
      const betsRaw = await redisCmd<string>(['GET', betKey]);
      const bets = (betsRaw ? JSON.parse(betsRaw) : {}) as Record<string, { h: number; a: number; ts: number }>;

      bets[matchId] = { h: parsedH, a: parsedA, ts: Date.now() };

      const setRes = await redisCmd(['SET', betKey, JSON.stringify(bets)]);
      if (setRes === null) return NextResponse.json({ error: 'redis', detail: 'bets_set_failed' });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'bad_action' });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'server', detail: err instanceof Error ? err.message : 'unknown' });
  }
}

export async function GET(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'missing_id' });

    const userRaw = await redisCmd<string>(['GET', `palpito:user:${id}`]);
    if (!userRaw) return NextResponse.json({ registered: false });

    const user = JSON.parse(userRaw) as { alias: string };

    const betsRaw = await redisCmd<string>(['GET', `palpito:bets:${id}`]);
    const bets = (betsRaw ? JSON.parse(betsRaw) : {}) as Record<string, { h: number; a: number; ts: number }>;

    const cached = await cacheGet<CachedFixtures>('fixtures:groups');
    if (!cached || !cached.items || cached.items.length === 0) return NextResponse.json({ error: 'fixtures', detail: 'cache_empty' });

    let pts = 0;
    let exactos = 0;
    let ganadores = 0;

    for (const match of cached.items) {
      if (match.status === 'finished' && match.homeScore !== undefined && match.awayScore !== undefined && bets[match.id]) {
        const bet = bets[match.id];
        if (bet.h === match.homeScore && bet.a === match.awayScore) {
          pts += 3;
          exactos++;
        } else if (Math.sign(bet.h - bet.a) === Math.sign(match.homeScore - match.awayScore)) {
          pts += 1;
          ganadores++;
        }
      }
    }

    const zaddRes = await redisCmd(['ZADD', 'palpito:rank', pts, id]);
    if (zaddRes === null) return NextResponse.json({ error: 'redis', detail: 'zadd_failed' });

    const rankRaw = await redisCmd<number>(['ZREVRANK', 'palpito:rank', id]);
    const rank = rankRaw !== null ? rankRaw + 1 : null;

    const totalRaw = await redisCmd<number>(['ZCARD', 'palpito:rank']);
    const total = totalRaw || 0;

    const topRaw = await redisCmd<(string | number)[]>(['ZREVRANGE', 'palpito:rank', 0, 9, 'WITHSCORES']);
    const top = [];
    if (topRaw && topRaw.length > 0) {
      const topIds: string[] = [];
      const topScores: number[] = [];
      for (let i = 0; i < topRaw.length; i += 2) {
        topIds.push(String(topRaw[i]));
        topScores.push(Number(topRaw[i + 1]));
      }

      if (topIds.length > 0) {
        const usersRaw = await redisCmd<string[]>(['MGET', ...topIds.map(tid => `palpito:user:${tid}`)]);
        if (usersRaw) {
          for (let i = 0; i < topIds.length; i++) {
            const uRaw = usersRaw[i];
            const uAlias = uRaw ? (JSON.parse(uRaw) as { alias: string }).alias : 'anon';
            top.push({ alias: uAlias, pts: topScores[i] });
          }
        }
      }
    }

    return NextResponse.json({
      registered: true,
      alias: user.alias,
      bets,
      pts,
      exactos,
      ganadores,
      rank,
      total,
      top
    });

  } catch (err: unknown) {
    return NextResponse.json({ error: 'server', detail: err instanceof Error ? err.message : 'unknown' });
  }
}