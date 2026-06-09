// nombres de selecciones inglés -> español (football-data los manda en inglés).
// lo que no esté acá sale con el nombre original (fallback) y se agrega al verlo.
export const TEAM_ES: Record<string, string> = {
  'Argentina': 'Argentina', 'Brazil': 'Brasil', 'Uruguay': 'Uruguay', 'Paraguay': 'Paraguay',
  'Colombia': 'Colombia', 'Ecuador': 'Ecuador', 'Mexico': 'México', 'USA': 'Estados Unidos',
  'United States': 'Estados Unidos', 'Canada': 'Canadá', 'France': 'Francia', 'Spain': 'España',
  'Japan': 'Japón', 'England': 'Inglaterra', 'Germany': 'Alemania', 'Netherlands': 'Países Bajos',
  'Portugal': 'Portugal', 'Croatia': 'Croacia', 'Morocco': 'Marruecos', 'Senegal': 'Senegal',
  'Belgium': 'Bélgica', 'Switzerland': 'Suiza', 'Italy': 'Italia', 'South Korea': 'Corea del Sur',
  'Korea Republic': 'Corea del Sur', 'Saudi Arabia': 'Arabia Saudita', 'Iran': 'Irán',
  'Australia': 'Australia', 'Qatar': 'Catar', 'Tunisia': 'Túnez', 'Algeria': 'Argelia',
  'Egypt': 'Egipto', 'Nigeria': 'Nigeria', 'Ghana': 'Ghana', 'Ivory Coast': 'Costa de Marfil',
  "Côte d'Ivoire": 'Costa de Marfil', 'Cameroon': 'Camerún', 'South Africa': 'Sudáfrica',
  'Cape Verde': 'Cabo Verde', 'Cape Verde Islands': 'Cabo Verde', 'Curacao': 'Curazao',
  'Curaçao': 'Curazao', 'Panama': 'Panamá', 'Costa Rica': 'Costa Rica', 'Honduras': 'Honduras',
  'Jamaica': 'Jamaica', 'Haiti': 'Haití', 'New Zealand': 'Nueva Zelanda', 'Jordan': 'Jordania',
  'Uzbekistan': 'Uzbekistán', 'Norway': 'Noruega', 'Scotland': 'Escocia', 'Austria': 'Austria',
  'Denmark': 'Dinamarca', 'Poland': 'Polonia', 'Czech Republic': 'República Checa',
  'Czechia': 'República Checa', 'Bosnia-Herzegovina': 'Bosnia y Herzegovina', 'Iraq': 'Irak',
  'Congo DR': 'RD del Congo', 'Turkey': 'Turquía', 'Greece': 'Grecia', 'Wales': 'Gales',
  'Ukraine': 'Ucrania', 'Sweden': 'Suecia', 'Serbia': 'Serbia',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  'DR Congo': 'RD del Congo',
};

export function teamES(name: string): string {
  return TEAM_ES[name] ?? name;
}

// idioma nativo de cada selección, para medir atención también en su propia wikipedia (no solo en inglés).
// las claves son los nombres de football-data. los anglófonos se omiten: su atención ya se mide en EN.
export const NATIVE_LANG: Record<string, string> = {
  Argentina: 'es', Uruguay: 'es', Paraguay: 'es', Colombia: 'es', Ecuador: 'es', Mexico: 'es', Spain: 'es', Panama: 'es',
  Brazil: 'pt', Portugal: 'pt', 'Cape Verde Islands': 'pt',
  Morocco: 'ar', Egypt: 'ar', Algeria: 'ar', Tunisia: 'ar', 'Saudi Arabia': 'ar', Jordan: 'ar', Iraq: 'ar', Qatar: 'ar',
  France: 'fr', Senegal: 'fr', 'Ivory Coast': 'fr', 'Congo DR': 'fr', Haiti: 'fr',
  Germany: 'de', Austria: 'de', Switzerland: 'de',
  Netherlands: 'nl', Belgium: 'nl', 'Curaçao': 'nl',
  Japan: 'ja', 'South Korea': 'ko', Iran: 'fa', Croatia: 'hr', Turkey: 'tr',
  Norway: 'no', Sweden: 'sv', Czechia: 'cs', 'Bosnia-Herzegovina': 'bs', Uzbekistan: 'uz',
};

export function nativeLang(name: string): string | null {
  return NATIVE_LANG[name] ?? null;
}
