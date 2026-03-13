const fs = require('fs');
const path = require('path');

const COUNTIES_INDEX_URL = 'https://knowledgehub.devolution.go.ke/kh/Category/counties/';
const OUTPUT_PATH = path.resolve(
  __dirname,
  '../src/data/kenyaAdministrativeUnits.json'
);

const REGION_ORDER = [
  'Coast',
  'North Eastern',
  'Eastern',
  'Central',
  'Rift Valley',
  'Western',
  'Nyanza',
  'Nairobi',
];

const REGION_BY_COUNTY = {
  Mombasa: 'Coast',
  Kwale: 'Coast',
  Kilifi: 'Coast',
  'Tana River': 'Coast',
  Lamu: 'Coast',
  'Taita/Taveta': 'Coast',
  Garissa: 'North Eastern',
  Wajir: 'North Eastern',
  Mandera: 'North Eastern',
  Marsabit: 'Eastern',
  Isiolo: 'Eastern',
  Meru: 'Eastern',
  'Tharaka-Nithi': 'Eastern',
  Embu: 'Eastern',
  Kitui: 'Eastern',
  Machakos: 'Eastern',
  Makueni: 'Eastern',
  Nyandarua: 'Central',
  Nyeri: 'Central',
  Kirinyaga: 'Central',
  "Murang'a": 'Central',
  Kiambu: 'Central',
  Turkana: 'Rift Valley',
  'West Pokot': 'Rift Valley',
  Samburu: 'Rift Valley',
  'Trans Nzoia': 'Rift Valley',
  'Uasin Gishu': 'Rift Valley',
  'Elgeyo/Marakwet': 'Rift Valley',
  Nandi: 'Rift Valley',
  Baringo: 'Rift Valley',
  Laikipia: 'Rift Valley',
  Nakuru: 'Rift Valley',
  Narok: 'Rift Valley',
  Kajiado: 'Rift Valley',
  Kericho: 'Rift Valley',
  Bomet: 'Rift Valley',
  Kakamega: 'Western',
  Vihiga: 'Western',
  Bungoma: 'Western',
  Busia: 'Western',
  Siaya: 'Nyanza',
  Kisumu: 'Nyanza',
  'Homa Bay': 'Nyanza',
  Migori: 'Nyanza',
  Kisii: 'Nyanza',
  Nyamira: 'Nyanza',
  'Nairobi City': 'Nairobi',
};

const COUNTY_NAME_OVERRIDES = {
  'Elgeyo Marakwet': 'Elgeyo/Marakwet',
  Homabay: 'Homa Bay',
  Nairobi: 'Nairobi City',
  'Taita Taveta': 'Taita/Taveta',
  Transzoia: 'Trans Nzoia',
};

const SUB_COUNTY_OVERRIDES = {
  Kakamega: [
    'Butere',
    'Ikolomani',
    'Khwisero',
    'Likuyani',
    'Lugari',
    'Lurambi',
    'Malava',
    'Matungu',
    'Mumias East',
    'Mumias West',
    'Navakholo',
    'Shinyalu',
  ],
  Kiambu: [
    'Gatundu North',
    'Gatundu South',
    'Githunguri',
    'Juja',
    'Kabete',
    'Kiambaa',
    'Kiambu',
    'Kikuyu',
    'Lari',
    'Limuru',
    'Ruiru',
    'Thika Town',
  ],
  'Kisii': [
    'Bobasi',
    'Bonchari',
    'Bomachoge Chache',
    'Bomachoge Borabu',
    'Kitutu Chache North',
    'Kitutu Chache South',
    'Nyaribari Chache',
    'Nyaribari Masaba',
    'South Mugirango',
  ],
  Laikipia: [
    'Laikipia Central',
    'Laikipia East',
    'Laikipia North',
    'Laikipia West',
    'Nyahururu',
  ],
  Marsabit: ['Laisamis', 'Moyale', 'North Horr', 'Saku'],
};

const HTML_ENTITIES = {
  '&amp;': '&',
  '&apos;': "'",
  '&#039;': "'",
  '&quot;': '"',
  '&nbsp;': ' ',
  '&ndash;': '-',
  '&mdash;': '-',
  '&rsquo;': "'",
  '&lsquo;': "'",
  '&ldquo;': '"',
  '&rdquo;': '"',
};

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCharCode(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(
      /&(amp|apos|quot|nbsp|ndash|mdash|rsquo|lsquo|ldquo|rdquo|#039);/g,
      (match) => HTML_ENTITIES[match] || match
    );
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanCountyName(rawCountyName) {
  const countyName = stripTags(rawCountyName).replace(/\s+County$/i, '').trim();
  return COUNTY_NAME_OVERRIDES[countyName] || countyName;
}

function cleanSubCountyName(rawSubCountyName) {
  return stripTags(rawSubCountyName)
    .replace(/\bConstituency\b/gi, '')
    .replace(/\bSub[- ]County\b/gi, '')
    .replace(/[.,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupe(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function parseExpectedCount(metaHtml) {
  const metaText = stripTags(metaHtml);
  const countMatch = metaText.match(
    /(divided into|organized into)\s+(\d+)\s+(sub-counties|sub counties|constituencies|constituencies or sub-counties)/i
  );

  return countMatch ? Number(countMatch[2]) : null;
}

function parseSubCounties(metaHtml) {
  const listMatch = metaHtml.match(/<(ol|ul)>\s*([\s\S]*?)<\/\1>/i);

  if (listMatch) {
    return dedupe(
      [...listMatch[2].matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((match) =>
        cleanSubCountyName(match[1])
      )
    );
  }

  const paragraphs = [...metaHtml.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((match) =>
    cleanSubCountyName(match[1])
  );
  const introIndex = paragraphs.findIndex((paragraph) =>
    /namely/i.test(paragraph)
  );

  if (introIndex === -1) {
    return [];
  }

  const items = [];

  for (const paragraph of paragraphs.slice(introIndex + 1)) {
    if (!paragraph) {
      continue;
    }

    if (
      /^(The county|The County|Governor|Hon\.|Mr\.|Mrs\.|Ms\.|Under his leadership|Cyprian|Ann Kananu|The current governor)/i.test(
        paragraph
      )
    ) {
      break;
    }

    if (paragraph.split(' ').length > 5) {
      break;
    }

    items.push(paragraph);
  }

  return dedupe(items);
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function main() {
  const indexHtml = await fetchText(COUNTIES_INDEX_URL);
  const countyUrls = dedupe(
    [...indexHtml.matchAll(/https:\/\/knowledgehub\.devolution\.go\.ke\/kh\/Category\/counties\/([a-z0-9-]+-county)\//g)].map(
      (match) => match[0]
    )
  );

  if (countyUrls.length !== 47) {
    throw new Error(`Expected 47 county pages, found ${countyUrls.length}`);
  }

  const counties = [];

  for (const countyUrl of countyUrls) {
    const countyHtml = await fetchText(countyUrl);
    const countyTitleMatch = countyHtml.match(
      /<h1 class="bkbm-archive-title">[\s\S]*?<span>([\s\S]*?)<\/span>/i
    );

    if (!countyTitleMatch) {
      throw new Error(`Could not find county title on ${countyUrl}`);
    }

    const rawCountyName = countyTitleMatch[1];
    const countyName = cleanCountyName(rawCountyName);
    const metaMatch = countyHtml.match(/<div class="bkbm-archive-meta">([\s\S]*?)<\/div>/i);

    if (!metaMatch) {
      throw new Error(`Could not find county metadata on ${countyUrl}`);
    }

    const metaHtml = metaMatch[1];
    const expectedCount = parseExpectedCount(metaHtml);
    const parsedSubCounties = parseSubCounties(metaHtml);
    const subCounties = SUB_COUNTY_OVERRIDES[countyName] || parsedSubCounties;

    if (!subCounties.length) {
      throw new Error(`Could not parse sub-counties for ${countyName}`);
    }

    if (expectedCount !== null && subCounties.length !== expectedCount) {
      console.warn(
        `[warn] ${countyName} page says ${expectedCount} sub-counties but parsed ${subCounties.length}`
      );
    }

    const region = REGION_BY_COUNTY[countyName];

    if (!region) {
      throw new Error(`Missing region mapping for ${countyName}`);
    }

    counties.push({
      name: countyName,
      region,
      subCounties: subCounties.sort((left, right) => left.localeCompare(right)),
      sourceUrl: countyUrl,
    });
  }

  const sortedCounties = counties.sort((left, right) => {
    const regionDifference =
      REGION_ORDER.indexOf(left.region) - REGION_ORDER.indexOf(right.region);

    if (regionDifference !== 0) {
      return regionDifference;
    }

    return left.name.localeCompare(right.name);
  });

  const regions = REGION_ORDER.map((region) => ({
    name: region,
    counties: sortedCounties
      .filter((county) => county.region === region)
      .map((county) => ({
        name: county.name,
        subCounties: county.subCounties,
      })),
  }));

  const output = {
    generatedAt: new Date().toISOString(),
    sources: [
      {
        name: 'State Department for Devolution counties index',
        url: COUNTIES_INDEX_URL,
      },
      {
        name: '2019 Kenya Population and Housing Census Volume I (county and sub-county reference)',
        url: 'https://www.knbs.or.ke/2019-kenya-population-and-housing-census-volume-i-population-by-county-and-sub-county/',
      },
    ],
    regions,
    counties: sortedCounties,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  console.log(`Generated ${OUTPUT_PATH} with ${sortedCounties.length} counties.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
