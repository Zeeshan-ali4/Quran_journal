const BASE = 'http://api.quran-tafseer.com';

export interface TafsirMeta {
  id: number;
  name: string;
  language: string;
  author: string;
}

interface TafsirResponse {
  text: string;
}

export async function fetchAvailableTafsirs(): Promise<TafsirMeta[]> {
  const response = await fetch(`${BASE}/tafseer/`);

  if (!response.ok) {
    throw new Error(`quran-tafseer.com ${response.status} while fetching tafsir list`);
  }

  return (await response.json()) as TafsirMeta[];
}

export async function fetchSurahTafsir(
  tafsirId: number,
  surahNumber: number,
  ayahCount: number,
): Promise<string[]> {
  const requests = Array.from({ length: ayahCount }, (_, index) => {
    const ayahNumber = index + 1;
    return fetch(`${BASE}/tafseer/${tafsirId}/${surahNumber}/${ayahNumber}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `quran-tafseer.com ${response.status} for tafsir ${tafsirId}/${surahNumber}/${ayahNumber}`,
          );
        }

        const json = (await response.json()) as TafsirResponse;
        return json.text;
      });
  });

  return Promise.all(requests);
}
