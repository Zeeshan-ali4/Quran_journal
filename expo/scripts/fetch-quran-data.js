#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const ARABIC_URL = 'https://api.alquran.cloud/v1/quran/quran-uthmani';
const TRANSLATION_URL = 'https://api.alquran.cloud/v1/quran/en.asad';

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function buildOfflineData(arabicSurahs, translationSurahs) {
  if (!Array.isArray(arabicSurahs) || !Array.isArray(translationSurahs)) {
    throw new Error('Unexpected API response: surahs array missing');
  }

  const bySurah = {};

  for (let index = 0; index < arabicSurahs.length; index += 1) {
    const arabicSurah = arabicSurahs[index];
    const translationSurah = translationSurahs[index];

    if (!arabicSurah || !translationSurah) {
      throw new Error(`Missing surah pair at index ${index}`);
    }

    const surahKey = String(arabicSurah.number);
    bySurah[surahKey] = arabicSurah.ayahs.map((ayah, ayahIndex) => ({
      numberInSurah: ayah.numberInSurah,
      arabic: ayah.text,
      translation: translationSurah.ayahs[ayahIndex]?.text ?? '',
    }));
  }

  return bySurah;
}

async function main() {
  const [arabicPayload, translationPayload] = await Promise.all([
    fetchJson(ARABIC_URL),
    fetchJson(TRANSLATION_URL),
  ]);

  const arabicSurahs = arabicPayload?.data?.surahs;
  const translationSurahs = translationPayload?.data?.surahs;

  const offlineData = buildOfflineData(arabicSurahs, translationSurahs);
  const outputPath = path.join(__dirname, '..', 'data', 'quran-offline.json');

  await fs.writeFile(outputPath, `${JSON.stringify(offlineData)}\n`, 'utf8');
  console.log(`Wrote ${Object.keys(offlineData).length} surahs to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
