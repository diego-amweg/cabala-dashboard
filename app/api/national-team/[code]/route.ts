import { NextRequest, NextResponse } from 'next/server';

interface TeamMeta {
  tsdbName: string;
  fullName: string;
}

const TEAM_MAP: Record<string, TeamMeta> = {
  ARG: { tsdbName: 'Argentina', fullName: 'Argentina' },
  BRA: { tsdbName: 'Brazil',    fullName: 'Brasil' },
  MAR: { tsdbName: 'Morocco',   fullName: 'Marruecos' },
  JPN: { tsdbName: 'Japan',     fullName: 'Japón' },
  MEX: { tsdbName: 'Mexico',    fullName: 'México' },
  ESP: { tsdbName: 'Spain',     fullName: 'España' },
  FRA: { tsdbName: 'France',    fullName: 'Francia' },
  ENG: { tsdbName: 'England',   fullName: 'Inglaterra' },
};

interface TSDBTeam {
  idTeam: string;
  strTeam: string;
  strSport: string;
  strLeague?: string;
  strLeagueAlternate?: string;
  strTeamBadge?: string;
}

interface TSDBResponse {
  teams: TSDBTeam[] | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const team = TEAM_MAP[upper];

  if (!team) {
    return NextResponse.json({ error: 'team not found' }, { status: 404 });
  }

  const fallback = { code: upper, name: team.fullName, badgeUrl: null as string | null };

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team.tsdbName)}`,
      {
        headers: { 'User-Agent': 'cabala-dashboard/1.0' },
        next: { revalidate: 604800 },
      }
    );

    if (!res.ok) return NextResponse.json(fallback);

    const data: TSDBResponse = await res.json();
    if (!data.teams || data.teams.length === 0) return NextResponse.json(fallback);

    const national = data.teams.find(t =>
      t.strSport === 'Soccer' &&
      /world cup|nations|national/i.test(`${t.strLeague ?? ''} ${t.strLeagueAlternate ?? ''}`)
    ) ?? data.teams.find(t => t.strSport === 'Soccer') ?? data.teams[0];

    return NextResponse.json({
      code: upper,
      name: team.fullName,
      badgeUrl: national.strTeamBadge ?? null,
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
