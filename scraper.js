const fs = require('fs');
const path = require('path');

const DELAY_MS = 300; // 300ms polite delay between requests

// Helper function to sleep
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to clean HTML tags from text
function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Italian university to city mapping
const UNI_TO_CITY_ITALY = {
  'Alma Mater Studiorum - Università di BOLOGNA': 'Bologna',
  'Ateneo Straniero': 'Italy',
  'HUMANITAS University': 'Milan',
  'LINK CAMPUS University': 'Rome',
  'LUM "Giuseppe Degennaro"': 'Bari',
  'Libera Università degli Studi "Maria SS.Assunta" - LUMSA': 'Rome',
  'Libera Università di BOLZANO': 'Bolzano',
  'Libera Università di lingue e comunicazione IULM-MI': 'Milan',
  'Luiss Libera Università Internazionale degli Studi Sociali Guido Carli': 'Rome',
  'Politecnico di BARI': 'Bari',
  'Politecnico di MILANO': 'Milan',
  'Politecnico di TORINO': 'Turin',
  'UNISR - Università Vita Salute San Raffaele': 'Milan',
  'UniCamillus - Saint Camillus International University of Health Sciences': 'Rome',
  'Università "Campus Bio-Medico" di ROMA': 'Rome',
  'Università "Carlo Cattaneo" - LIUC': 'Castellanza',
  "Università Ca' Foscari VENEZIA": 'Venice',
  'Università Cattolica del Sacro Cuore': 'Milan',
  'Università Commerciale "Luigi Bocconi" MILANO': 'Milan',
  'Università IUAV di VENEZIA': 'Venice',
  'Università Politecnica delle MARCHE': 'Ancona',
  'Università Telematica "GIUSTINO FORTUNATO"': 'Benevento',
  'Università Telematica Internazionale UNINETTUNO': 'Rome',
  'Università Telematica PEGASO': 'Naples',
  'Università degli Studi "G. d\'Annunzio" CHIETI-PESCARA': 'Chieti-Pescara',
  'Università degli Studi "Guglielmo Marconi" - Telematica': 'Rome',
  'Università degli Studi "Mediterranea" di REGGIO CALABRIA': 'Reggio Calabria',
  'Università degli Studi EUROPEA di ROMA': 'Rome',
  'Università degli Studi INSUBRIA Varese-Como': 'Varese-Como',
  'Università degli Studi ROMA TRE': 'Rome',
  'Università degli Studi del MOLISE': 'Campobasso',
  'Università degli Studi del PIEMONTE ORIENTALE': 'Vercelli',
  'Università degli Studi del SANNIO di BENEVENTO': 'Benevento',
  'Università degli Studi dell\'AQUILA': 'L\'Aquila',
  'Università degli Studi della Campania "Luigi Vanvitelli"': 'Caserta',
  'Università degli Studi della TUSCIA': 'Viterbo',
  'Università degli Studi di BARI ALDO MORO': 'Bari',
  'Università degli Studi di BERGAMO': 'Bergamo',
  'Università degli Studi di BRESCIA': 'Brescia',
  'Università degli Studi di CAGLIARI': 'Cagliari',
  'Università degli Studi di CAMERINO': 'Camerino',
  'Università degli Studi di CASSINO e del LAZIO MERIDIONALE': 'Cassino',
  'Università degli Studi di CATANIA': 'Catania',
  'Università degli Studi di FERRARA': 'Ferrara',
  'Università degli Studi di FIRENZE': 'Florence',
  'Università degli Studi di FOGGIA': 'Foggia',
  'Università degli Studi di GENOVA': 'Genoa',
  'Università degli Studi di MACERATA': 'Macerata',
  'Università degli Studi di MESSINA': 'Messina',
  'Università degli Studi di MILANO': 'Milan',
  'Università degli Studi di MILANO-BICOCCA': 'Milan',
  'Università degli Studi di MODENA e REGGIO EMILIA': 'Modena-Reggio Emilia',
  'Università degli Studi di NAPOLI "L\'Orientale"': 'Naples',
  'Università degli Studi di NAPOLI "Parthenope"': 'Naples',
  'Università degli Studi di Napoli Federico II': 'Naples',
  'Università degli Studi di PADOVA': 'Padua',
  'Università degli Studi di PALERMO': 'Palermo',
  'Università degli Studi di PARMA': 'Parma',
  'Università degli Studi di PAVIA': 'Pavia',
  'Università degli Studi di PERUGIA': 'Perugia',
  'Università degli Studi di ROMA "Foro Italico"': 'Rome',
  'Università degli Studi di ROMA "La Sapienza"': 'Rome',
  'Università degli Studi di ROMA "Tor Vergata"': 'Rome',
  'Università degli Studi di Roma UnitelmaSapienza': 'Rome',
  'Università degli Studi di SALERNO': 'Salerno',
  'Università degli Studi di SASSARI': 'Sassari',
  'Università degli Studi di SCIENZE GASTRONOMICHE': 'Pollenzo',
  'Università degli Studi di SIENA': 'Siena',
  'Università degli Studi di TERAMO': 'Teramo',
  'Università degli Studi di TORINO': 'Turin',
  'Università degli Studi di TRENTO': 'Trento',
  'Università degli Studi di TRIESTE': 'Trieste',
  'Università degli Studi di UDINE': 'Udine',
  'Università degli Studi di Urbino Carlo Bo': 'Urbino',
  'Università degli Studi di VERONA': 'Verona',
  'Università del SALENTO': 'Lecce',
  'Università della CALABRIA': 'Cosenza',
  'Università della VALLE D\'AOSTA': 'Aosta',
  'Università di PISA': 'Pisa',
  'Università per Stranieri di PERUGIA': 'Perugia'
};

// Finnish university to city mapping
function getFinlandCity(uniName) {
  if (typeof uniName !== 'string') return 'Finland';
  const name = uniName.toLowerCase();
  if (name.includes('aalto')) return 'Espoo';
  if (name.includes('helsinki')) return 'Helsinki';
  if (name.includes('tampere')) return 'Tampere';
  if (name.includes('oulu')) return 'Oulu';
  if (name.includes('turku') || name.includes('åbo')) return 'Turku';
  if (name.includes('jyväskylä') || name.includes('jamk')) return 'Jyväskylä';
  if (name.includes('lut university') || name.includes('lappeenranta')) return 'Lappeenranta';
  if (name.includes('eastern finland')) return 'Joensuu';
  if (name.includes('vaasa')) return 'Vaasa';
  if (name.includes('lahti') || name.includes('lab university')) return 'Lahti';
  if (name.includes('kajaani')) return 'Kajaani';
  if (name.includes('arcada') || name.includes('metropolia') || name.includes('haaga-helia')) return 'Helsinki';
  if (name.includes('centria')) return 'Kokkola';
  if (name.includes('novia')) return 'Vaasa';
  if (name.includes('savonia')) return 'Kuopio';
  if (name.includes('karelia')) return 'Joensuu';
  if (name.includes('satakunta') || name.includes('samk')) return 'Pori';
  if (name.includes('seinäjoki') || name.includes('seamk')) return 'Seinäjoki';
  if (name.includes('hämäläinen') || name.includes('hamk')) return 'Hämeenlinna';
  if (name.includes('laurea')) return 'Vantaa';
  if (name.includes('saimaa')) return 'Lappeenranta';
  return 'Finland';
}

// Denmark campus slug to city mapping
const CAMPUS_TO_CITY_DENMARK = {
  'copenhagen': 'Copenhagen',
  'kobenhavn': 'Copenhagen',
  'carlsberg': 'Copenhagen',
  'sigurdsgade': 'Copenhagen',
  'norrebro': 'Copenhagen',
  'nansensgade': 'Copenhagen',
  'guldbergsgade': 'Copenhagen',
  'prinsesse-charlottes': 'Copenhagen',
  'north-campus': 'Copenhagen',
  'south-campus': 'Copenhagen',
  'city-campus': 'Copenhagen',
  'opera-academy': 'Copenhagen',
  'music-pedagogy': 'Copenhagen',
  'frederiksberg-campus': 'Frederiksberg',
  'frederiksberg': 'Frederiksberg',
  'aarhus': 'Aarhus',
  'campus-aarhus': 'Aarhus',
  'filmbyen': 'Aarhus',
  'aalborg': 'Aalborg',
  'odense': 'Odense',
  'ucl-education-and-social-sciences-odense': 'Odense',
  'kolding': 'Kolding',
  'ea-kolding-iba': 'Kolding',
  'viborg': 'Viborg',
  'campus-viborg': 'Viborg',
  'esbjerg': 'Esbjerg',
  'herning': 'Herning',
  'kalundborg': 'Kalundborg',
  'horsens': 'Horsens',
  'haderslev': 'Haderslev',
  'sonderborg': 'Sønderborg',
  'snderborg': 'Sønderborg',
  'vejle': 'Vejle',
  'vordingborg': 'Vordingborg',
  'bornholm': 'Bornholm',
  'hirtshals': 'Hirtshals',
  'beijing': 'Beijing',
  'north-zealand': 'Hillerød'
};

function getDenmarkCity(getPath) {
  if (typeof getPath !== 'string') return 'Denmark';
  const parts = getPath.split('/');
  if (parts.length >= 5) {
    const slug = parts[4].toLowerCase();
    if (CAMPUS_TO_CITY_DENMARK[slug]) {
      return CAMPUS_TO_CITY_DENMARK[slug];
    }
    for (const key of Object.keys(CAMPUS_TO_CITY_DENMARK)) {
      if (slug.includes(key)) return CAMPUS_TO_CITY_DENMARK[key];
    }
    return parts[4].charAt(0).toUpperCase() + parts[4].slice(1).replace(/-/g, ' ');
  }
  return 'Denmark';
}

// 1. Scrape Germany (DAAD)
async function scrapeGermany() {
  console.log('--- Scraping Germany (DAAD) ---');
  const BASE_URL = 'https://api.daad.de/api/ajax/hsk/list/en';
  const LIMIT = 100;
  let page = 1;
  let itemsCollected = [];
  let totalCount = 0;

  while (true) {
    console.log(`[Germany] Fetching page ${page}...`);
    const url = `${BASE_URL}?hec-teachingLanguage=2&hec-limit=${LIMIT}&hec-p=${page}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`[Germany] HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    if (!data.results || !data.results.items || data.results.items.length === 0) {
      break;
    }

    totalCount = data.results.count || totalCount;
    const items = data.results.items;

    for (const item of items) {
      const degreeObj = item.items.find(i => i.icon === 'degree');
      const durationObj = item.items.find(i => i.icon === 'duration');
      const locationObj = item.items.find(i => i.icon === 'location');
      const studyTypeObj = item.items.find(i => i.icon === 'studyType');
      const deadlineObj = item.items.find(i => i.icon === 'deadline');

      let deadlines = [];
      if (deadlineObj && deadlineObj.text) {
        if (Array.isArray(deadlineObj.text)) {
          deadlines = deadlineObj.text.map(cleanText).filter(t => t.length > 0);
        } else {
          const cleaned = cleanText(deadlineObj.text);
          if (cleaned) deadlines.push(cleaned);
        }
      }

      itemsCollected.push({
        id: `germany_${item.id || ''}`,
        title: item.headline || '',
        university: item.subline || '',
        degree: degreeObj ? degreeObj.text : 'Unknown',
        location: locationObj ? locationObj.text : 'Unknown',
        duration: durationObj ? durationObj.text : 'Unknown',
        studyMode: studyTypeObj ? studyTypeObj.text : 'Unknown',
        deadlines: deadlines,
        link: item.link && item.link.url ? `https://www.daad.de${item.link.url}` : '',
        logo: item.logo && item.logo.src && item.logo.src.medium ? item.logo.src.medium.href : '',
        country: 'Germany',
        tuitionFee: 'Free (Public University) or Low Semester Fee (~100-400 EUR)',
        semesterStart: 'Winter (October) / Summer (April)'
      });
    }

    console.log(`[Germany] Collected ${itemsCollected.length} / ${totalCount}`);
    if (itemsCollected.length >= totalCount) {
      break;
    }

    page++;
    await sleep(DELAY_MS);
  }

  console.log(`[Germany] Complete. Total: ${itemsCollected.length}`);
  return itemsCollected;
}

// 2. Scrape Greece (Study in Greece)
async function scrapeGreece() {
  console.log('--- Scraping Greece (Study in Greece) ---');
  const BASE_URL = 'https://atsigapi.studyingreece.edu.gr/programmes-api/programmes';
  const LIMIT = 200;
  let page = 1;
  let itemsCollected = [];

  while (true) {
    console.log(`[Greece] Fetching page ${page}...`);
    const url = `${BASE_URL}?limit=${LIMIT}&page=${page}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`[Greece] HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    const items = data.items || [];
    if (items.length === 0) break;

    // Filter client-side for English language
    const englishItems = items.filter(item => item.languages && item.languages.includes('English'));

    for (const item of englishItems) {
      itemsCollected.push({
        id: `greece_${item.id}`,
        title: item.name_en || '',
        university: item.department && item.department.university ? item.department.university.name_en : 'Unknown University',
        degree: item.type || 'Unknown',
        location: item.city_en || 'Greece',
        duration: item.semesters ? `${item.semesters} semesters` : 'Unknown',
        studyMode: item.study_modes && item.study_modes.length > 0 ? item.study_modes.join(', ') : 'In Person',
        deadlines: [],
        link: item.website || '',
        logo: item.department && item.department.university ? item.department.university.image_url : '',
        country: 'Greece',
        tuitionFee: item.has_tuition_fees && item.tuition_fees_from ? `${item.tuition_fees_from} EUR total` : 'Free',
        semesterStart: 'Autumn (Sept/Oct) / Spring (Feb)'
      });
    }

    console.log(`[Greece] Fetched page ${page}. English items count: ${itemsCollected.length} (Total raw items: ${items.length})`);

    if (!data.has_next || items.length < LIMIT) {
      break;
    }

    page++;
    await sleep(DELAY_MS);
  }

  console.log(`[Greece] Complete. Total English-taught: ${itemsCollected.length}`);
  return itemsCollected;
}

// 3. Scrape Italy (Universitaly)
async function scrapeItaly() {
  console.log('--- Scraping Italy (Universitaly) ---');
  let page = 1;
  let itemsCollected = [];

  while (true) {
    console.log(`[Italy] Fetching page ${page}...`);
    const url = `https://universitaly-backend.cineca.it/api/offerta-formativa/cerca-corsi?searchType=u&page=${page}&lingua=EN`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`[Italy] HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    const corsi = data.corsi || [];
    if (corsi.length === 0) break;

    for (const item of corsi) {
      // Map degree description
      let degree = 'Unknown';
      if (item.tipoLaurea && item.tipoLaurea.descrizioneEn) {
        const desc = item.tipoLaurea.descrizioneEn;
        if (desc.includes('Triennale')) degree = 'Bachelor';
        else if (desc.includes('Magistrale')) {
          if (desc.includes('Ciclo unico') || desc.includes('ciclo unico')) {
            degree = 'Single Cycle Master';
          } else {
            degree = 'Master';
          }
        } else {
          degree = desc.replace('EN ', '');
        }
      }

      // Map study mode description
      let studyMode = 'In Person';
      if (item.modalitaDidattica && item.modalitaDidattica.descrizioneEn) {
        const modeDesc = item.modalitaDidattica.descrizioneEn.toLowerCase();
        if (modeDesc.includes('presenza')) studyMode = 'In Person';
        else if (modeDesc.includes('teledidattica') || modeDesc.includes('distanza')) studyMode = 'Distance Learning';
        else studyMode = item.modalitaDidattica.descrizioneEn.replace('EN ', '');
      }

      // Lookup city location
      const uniName = item.nomeStruttura || '';
      const location = UNI_TO_CITY_ITALY[uniName] || 'Italy';

      itemsCollected.push({
        id: `italy_${item.id}`,
        title: item.nomeCorsoEn || item.nomeCorso || '',
        university: uniName,
        degree: degree,
        location: location,
        duration: item.durataAnni ? `${item.durataAnni} years` : 'Unknown',
        studyMode: studyMode,
        deadlines: [],
        link: item.url || '',
        logo: '',
        country: 'Italy',
        tuitionFee: 'Varies (based on family income, typically 1,000 - 4,000 EUR/year)',
        semesterStart: 'Autumn (September/October)'
      });
    }

    console.log(`[Italy] Collected ${itemsCollected.length} / ${data.totalResults}`);

    if (page >= data.totalPages || itemsCollected.length >= data.totalResults) {
      break;
    }

    page++;
    await sleep(DELAY_MS);
  }

  console.log(`[Italy] Complete. Total: ${itemsCollected.length}`);
  return itemsCollected;
}

// 4. Scrape Sweden (University Admissions Sweden)
async function scrapeSweden() {
  console.log('--- Scraping Sweden (University Admissions) ---');
  const url = 'https://www.universityadmissions.se/intl/api/sok';
  let page = 1;
  let itemsCollected = [];
  let totalCount = 0;

  while (true) {
    console.log(`[Sweden] Fetching page ${page}...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        fritext: "",
        sortering: "relevance",
        termin: "27", // Autumn intake
        sokfilter: {
          "program": true
        },
        sida: page
      })
    });

    if (!response.ok) {
      throw new Error(`[Sweden] HTTP error! Status: ${response.status}`);
    }

    let text = await response.text();
    if (text.startsWith(")]}',")) {
      text = text.slice(5).trim();
    }
    const data = JSON.parse(text);
    const items = data.sokresultatItems || [];
    if (items.length === 0) break;

    totalCount = data.totaltAntalTraffar || totalCount;

    for (const item of items) {
      const alt = item.anmalningsalternativ;
      if (!alt) continue;

      // Degree level: standardize
      let degree = 'Master';
      const lvl = alt.utbildningsniva ? alt.utbildningsniva.toLowerCase() : '';
      if (lvl.includes('bachelor')) degree = 'Bachelor';
      else if (lvl.includes('master')) degree = 'Master';
      else degree = alt.utbildningsniva;

      // Study mode: standardize
      let studyMode = 'In Person';
      const form = alt.undervisningsform ? alt.undervisningsform.toLowerCase() : '';
      if (form.includes('campus')) studyMode = 'In Person';
      else if (form.includes('distans') || form.includes('distance')) studyMode = 'Distance Learning';
      else studyMode = alt.undervisningsform;

      // Deadlines
      const deadlines = item.slutdatum ? [item.slutdatum] : [];

      itemsCollected.push({
        id: `sweden_${alt.anmalningskod}`,
        title: alt.titel || '',
        university: alt.organisation || '',
        degree: degree,
        location: alt.studieort || 'Sweden',
        duration: alt.poang ? `${alt.poang} credits` : 'Unknown',
        studyMode: studyMode,
        deadlines: deadlines,
        link: alt.kursbeskrivningUrl || '',
        logo: '',
        country: 'Sweden',
        tuitionFee: alt.studieavgiftTotal ? `SEK ${alt.studieavgiftDelsumma.toLocaleString()}/semester (SEK ${alt.studieavgiftTotal.toLocaleString()} total)` : 'Free for EU/EEA (non-EU/EEA fees vary)',
        semesterStart: 'Autumn (September)'
      });
    }

    console.log(`[Sweden] Collected ${itemsCollected.length} / ${totalCount}`);

    if (itemsCollected.length >= totalCount || items.length < 5) {
      break;
    }

    page++;
    await sleep(DELAY_MS);
  }

  console.log(`[Sweden] Complete. Total: ${itemsCollected.length}`);
  return itemsCollected;
}

// 5. Scrape Finland (Studyinfo.fi)
async function scrapeFinland() {
  console.log('--- Scraping Finland (Studyinfo) ---');
  const LIMIT = 100;
  let page = 1;
  let itemsCollected = [];
  let totalCount = 0;

  while (true) {
    console.log(`[Finland] Fetching page ${page}...`);
    const url = `https://studyinfo.fi/konfo-backend/search/koulutukset?opetuskieli=oppilaitoksenopetuskieli_4&size=${LIMIT}&page=${page}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`[Finland] HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const hits = data.hits || [];
    if (hits.length === 0) break;

    totalCount = data.total || totalCount;

    for (const hit of hits) {
      const title = hit.nimi.en || hit.nimi.fi || hit.nimi.sv || 'Unknown Program';
      const university = hit.toteutustenTarjoajat && hit.toteutustenTarjoajat.nimi ? (hit.toteutustenTarjoajat.nimi.en || hit.toteutustenTarjoajat.nimi.fi || hit.toteutustenTarjoajat.nimi.sv) : 'Unknown University';
      
      // Degree level mapping
      let degree = 'Master';
      const titleLower = title.toLowerCase();
      if (titleLower.includes('bachelor') || titleLower.includes('bsc') || titleLower.includes('ba ')) {
        degree = 'Bachelor';
      } else if (titleLower.includes('master') || titleLower.includes('msc') || titleLower.includes('ma ')) {
        degree = 'Master';
      } else if (titleLower.includes('doctor') || titleLower.includes('phd')) {
        degree = 'Doctoral Programme';
      } else {
        const tkName = hit.tutkintonimikkeet && hit.tutkintonimikkeet[0] && hit.tutkintonimikkeet[0].nimi && hit.tutkintonimikkeet[0].nimi.en ? hit.tutkintonimikkeet[0].nimi.en.toLowerCase() : '';
        if (tkName.includes('bachelor')) degree = 'Bachelor';
        else if (tkName.includes('master')) degree = 'Master';
        else if (tkName.includes('doctor')) degree = 'Doctoral Programme';
      }

      // Location
      const location = getFinlandCity(university);

      // Duration
      const duration = hit.opintojenLaajuusNumero ? `${hit.opintojenLaajuusNumero} ECTS` : 'Unknown';

      // Study Mode
      let studyMode = 'In Person';
      if (hit.koulutustyyppi === 'amk-opintojakso' || hit.koulutustyyppi === 'yo-opintojakso-avoin') {
        studyMode = 'Online / Blended';
      }

      itemsCollected.push({
        id: `finland_${hit.oid}`,
        title: title,
        university: university,
        degree: degree,
        location: location,
        duration: duration,
        studyMode: studyMode,
        deadlines: [],
        link: `https://studyinfo.fi/konfo/en/koulutus/${hit.oid}`,
        logo: hit.teemakuva || '',
        country: 'Finland',
        tuitionFee: 'Free for EU/EEA (non-EU/EEA fees typically 4,000 - 18,000 EUR/year)',
        semesterStart: 'Autumn (Aug/Sept) / Spring (Jan)'
      });
    }

    console.log(`[Finland] Collected ${itemsCollected.length} / ${totalCount}`);

    if (itemsCollected.length >= totalCount || hits.length < LIMIT) {
      break;
    }

    page++;
    await sleep(DELAY_MS);
  }

  console.log(`[Finland] Complete. Total: ${itemsCollected.length}`);
  return itemsCollected;
}

// 6. Scrape France (Campus France)
async function scrapeFrance() {
  console.log('--- Scraping France (Campus France) ---');
  const url = 'https://tie-api.campusfrance.org/sgetprograms/1';
  let itemsCollected = [];

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  if (!response.ok) {
    throw new Error(`[France] HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  const programs = data.programs || [];
  console.log(`[France] Total programs in catalog: ${programs.length}`);

  const englishPrograms = programs.filter(p => p.taughtenAll === 1);
  console.log(`[France] Total 100% English-taught programs: ${englishPrograms.length}`);

  for (const item of englishPrograms) {
    // Map degree level
    let degree = 'Master';
    const lvl = item.levelObtainedId;
    if ([10, 11, 12, 25].includes(lvl)) {
      degree = 'Bachelor';
    } else if ([21, 22, 23, 26].includes(lvl)) {
      degree = 'Master';
    } else if ([40, 41].includes(lvl)) {
      degree = 'Short Course';
    } else {
      const title = (item.programLabel || '').toLowerCase();
      if (title.includes('bachelor') || title.includes('bsc')) degree = 'Bachelor';
      else if (title.includes('master') || title.includes('msc') || title.includes('mba')) degree = 'Master';
    }

    // Map duration
    let duration = '2 years';
    if (degree === 'Bachelor') {
      duration = '3 years';
    } else if (degree === 'Short Course') {
      duration = 'Varies';
    }

    itemsCollected.push({
      id: `france_${item.programId}`,
      title: item.programLabel || '',
      university: item.institutionLabel || 'Unknown Institution',
      degree: degree,
      location: item.institutionCity || 'France',
      duration: duration,
      studyMode: 'In Person',
      deadlines: [],
      link: `https://taughtie.campusfrance.org/tiesearch/#/program/${item.programId}`,
      logo: '',
      country: 'France',
      tuitionFee: 'Varies (typically 2,770 - 3,770 EUR/year for non-EU students at public universities)',
      semesterStart: 'Autumn (September/October)'
    });
  }

  console.log(`[France] Complete. Total: ${itemsCollected.length}`);
  return itemsCollected;
}

// 7. Scrape Denmark (Study in Denmark)
async function scrapeDenmark() {
  console.log('--- Scraping Denmark (Study in Denmark) ---');
  const url = 'https://studyindenmark.dk/++api++/portal/@querystring-search';
  let itemsCollected = [];

  const queryObj = {
    "metadata_fields": "_all",
    "b_size": "1000",
    "limit": "1000",
    "query": [
      {
        "i": "portal_type",
        "o": "plone.app.querystring.operation.selection.any",
        "v": ["program"]
      },
      {
        "i": "path",
        "o": "plone.app.querystring.operation.string.absolutePath",
        "v": "/portal"
      }
    ]
  };

  const response = await fetch(`${url}?query=${encodeURIComponent(JSON.stringify(queryObj))}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    }
  });

  if (!response.ok) {
    throw new Error(`[Denmark] HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  const items = data.items || [];
  console.log(`[Denmark] Total programs in catalog: ${items.length}`);

  for (const item of items) {
    // Map degree type
    let degree = 'Master';
    const degTitle = (item.degree_title || '').toLowerCase();
    if (degTitle.includes('bachelor')) {
      degree = 'Bachelor';
    } else if (degTitle.includes('master')) {
      degree = 'Master';
    } else {
      const degId = item.degree;
      if (degId === 29) degree = 'Bachelor';
      else if (degId === 30 || degId === 237) degree = 'Master';
      else degree = item.degree_title || 'Other';
    }

    // Map location
    const location = getDenmarkCity(item.getPath);

    // Map duration
    let duration = '2 years';
    if (degTitle.includes('2 years')) duration = '2 years';
    else if (degTitle.includes('1 year')) duration = '1 year';
    else if (degree === 'Bachelor') duration = '3 years';
    else if (item.credits) {
      const creds = parseInt(item.credits);
      if (creds === 120) duration = '2 years';
      else if (creds === 180) duration = '3 years';
      else if (creds === 240) duration = '4 years';
    }

    const ECTS = item.credits ? `${item.credits} ECTS` : 'Unknown';

    // Search for direct program link in Denmark program_description
    const ignoreKeywords = [
      'studyindenmark.dk', 'youtube.com', 'facebook.com', 'instagram.com', 
      'twitter.com', 'linkedin.com', 'ufm.dk', 'fivu.dk', 'google.com', 
      'flickr.com', 'pinterest.com', 'vimeo.com'
    ];

    const urls = [];
    const searchLinks = (obj) => {
      if (!obj) return;
      if (typeof obj === 'string') {
        const matches = obj.match(/https?:\/\/[^\s"'>)]+/gi);
        if (matches) {
          matches.forEach(m => {
            const urlClean = m.replace(/[.,;:]$/, '');
            if (!ignoreKeywords.some(kw => urlClean.toLowerCase().includes(kw))) {
              urls.push(urlClean);
            }
          });
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(searchLinks);
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(searchLinks);
      }
    };

    searchLinks(item.program_description);
    
    let directLink = item['@id'] || '';
    if (urls.length > 0) {
      const keywords = ['education', 'bachelor', 'master', 'programme', 'study', 'en', 'uk', 'apply', 'admission'];
      const matches = urls.filter(u => keywords.some(k => u.toLowerCase().includes(k)));
      let bestUrl = matches.length > 0 ? matches[0] : urls[0];
      if (bestUrl && bestUrl.includes('aau.dk/education/')) {
        const parts = bestUrl.split('/');
        if (parts.length >= 7) {
          bestUrl = parts.slice(0, 6).join('/');
        }
      }
      directLink = bestUrl;
    }

    // Direct link overrides/fallbacks for specific universities
    if (!directLink || directLink.includes('studyindenmark.dk/portal')) {
      const inst = (item.institution_title || '').toLowerCase();
      const degLower = degree.toLowerCase();
      const getPath = item.getPath || '';
      const pathParts = getPath.split('/');
      let slug = pathParts[pathParts.length - 1] || item.getId || '';
      slug = slug.replace(/-1$/, ''); // Remove trailing Plone duplicates

      if (inst.includes('aalborg') || inst.includes('aau')) {
        const cleanedSlug = slug.replace(/-msc-in-engineering$/, '').replace(/-bsc-in-engineering$/, '');
        directLink = `https://www.en.aau.dk/education/${degLower}/${cleanedSlug}`;
      } else if (inst.includes('roskilde') || inst.includes('ruc')) {
        directLink = `https://ruc.dk/en/${degLower}/${slug}`;
      } else if (inst.includes('southern denmark') || inst.includes('sdu')) {
        directLink = `https://www.sdu.dk/en/education/${degLower}/${slug}`;
      } else if (inst.includes('copenhagen') && (inst.includes('ucph') || inst.includes('university of copenhagen'))) {
        directLink = `https://studies.ku.dk/${degLower}s/${slug}`;
      } else if (inst.includes('aarhus') && (inst.includes('au') || inst.includes('aarhus university'))) {
        if (degLower === 'master') {
          directLink = `https://kandidat.au.dk/en/${slug}`;
        } else {
          directLink = `https://bachelor.au.dk/en/${slug}`;
        }
      }
    }

    itemsCollected.push({
      id: `denmark_${item.getPath.replace(/\//g, '_')}`,
      title: item.Title || '',
      university: item.institution_title || 'Unknown University',
      degree: degree,
      location: location,
      duration: duration + ` (${ECTS})`,
      studyMode: 'In Person',
      deadlines: [],
      link: directLink,
      logo: '',
      country: 'Denmark',
      tuitionFee: 'Free for EU/EEA (non-EU/EEA fees typically 6,000 - 16,000 EUR/year)',
      semesterStart: 'Autumn (September) / Spring (February)'
    });
  }

  console.log(`[Denmark] Complete. Total: ${itemsCollected.length}`);
  return itemsCollected;
}

// 8. Scrape Austria (Studienwahl.at)
async function scrapeAustria() {
  console.log('--- Scraping Austria (Studienwahl.at) ---');
  let itemsCollected = [];

  try {
    const response = await fetch('https://www.studienwahl.at/studies/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      }
    });
    if (!response.ok) {
      throw new Error(`[Austria] Initial GET failed with status: ${response.status}`);
    }
    const html = await response.text();
    const csrfMatch = html.match(/<meta name="csrf-token" content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;
    if (!csrfToken) {
      throw new Error('[Austria] CSRF token not found');
    }
    const setCookieHeaders = response.headers.getSetCookie();
    const cookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');

    let page = 1;
    let totalCount = 578; // Fallback default
    
    while (true) {
      console.log(`[Austria] Fetching page ${page}...`);
      const postUrl = `https://www.studienwahl.at/studies/?page=${page}&per-page=10`;
      const body = new URLSearchParams();
      body.append('_csrf', csrfToken);
      body.append('StudySearchForm[sprache][]', '2'); // English
      body.append('helperDropDownBildungseinrichtung', '0');
      body.append('StudySearchForm[bildungseinrichtung]', '');
      body.append('StudySearchForm[q]', '');

      const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        },
        body: body.toString()
      });

      if (!postResponse.ok) {
        console.error(`[Austria] Failed to fetch page ${page}: status ${postResponse.status}`);
        break;
      }

      const postHtml = await postResponse.text();
      
      // Parse Hits/Total Count from first page
      if (page === 1) {
        const hitsMatch = postHtml.match(/resulted in\s*(?:<b>)?\s*(\d+)\s*(?:<\/b>)?\s*hits/i);
        if (hitsMatch) {
          totalCount = parseInt(hitsMatch[1]);
          console.log(`[Austria] Found total hits count: ${totalCount}`);
        }
      }

      const parts = postHtml.split(/<div class="course/);
      const pageItemsCount = parts.length - 1;
      if (pageItemsCount === 0) {
        console.log(`[Austria] No items found on page ${page}, stopping.`);
        break;
      }

      for (let i = 1; i < parts.length; i++) {
        const block = parts[i];
        
        const titleMatch = block.match(/<h2>\s*([\s\S]+?)\s*<\/h2>/);
        const title = titleMatch ? cleanText(titleMatch[1]) : '';
        
        const uniMatch = block.match(/<\/h2>\s*<p>\s*([\s\S]+?)\s*<\/p>/) || block.match(/<p>\s*([\s\S]+?)\s*<\/p>/);
        const university = uniMatch ? cleanText(uniMatch[1]) : '';
        
        const degLocMatch = block.match(/<b>\s*([\s\S]+?)\s*(?:»|&raquo;)\s*([\s\S]+?)\s*<\/b>/);
        let degree = 'Unknown';
        let location = 'Austria';
        if (degLocMatch) {
          degree = cleanText(degLocMatch[1]);
          location = cleanText(degLocMatch[2]);
        }
        
        const linkMatch = block.match(/<a\s+[^>]*href="([^"]+)"[^>]*>More<\/a>/i);
        const link = linkMatch ? 'https://www.studienwahl.at' + linkMatch[1] : '';
        
        let stdDegree = 'Other';
        const degLower = degree.toLowerCase();
        if (degLower.includes('bachelor')) {
          stdDegree = 'Bachelor';
        } else if (degLower.includes('master')) {
          stdDegree = 'Master';
        } else if (degLower.includes('phd') || degLower.includes('doctoral')) {
          stdDegree = 'Doctoral Programme';
        } else {
          stdDegree = degree;
        }

        const cleanLocation = location.trim();

        itemsCollected.push({
          id: `austria_${page}_${i}_${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          title: title,
          university: university,
          degree: stdDegree,
          location: cleanLocation,
          duration: 'Unknown',
          studyMode: 'In Person',
          deadlines: [],
          link: link,
          logo: '',
          country: 'Austria',
          tuitionFee: 'Free for EU/EEA (~726 EUR/semester for non-EU at public universities)',
          semesterStart: 'Autumn (October) / Spring (March)'
        });
      }

      console.log(`[Austria] Page ${page} fetched. Collected ${itemsCollected.length} / ${totalCount}`);
      
      if (itemsCollected.length >= totalCount) {
        break;
      }

      page++;
      await sleep(DELAY_MS);
    }
  } catch (error) {
    console.error('[Austria] Error during scraping:', error);
  }

  console.log(`[Austria] Complete. Total: ${itemsCollected.length}`);
  return itemsCollected;
}

// 9. Scrape Czechia (Study in Czechia)
async function scrapeCzechia() {
  console.log('--- Scraping Czechia (Study in Czechia) ---');
  
  const CATEGORY_SLUGS = [
    "agriculture--forestry--fisheries-and-veterinary",
    "arts-and-humanities",
    "business--administration-and-law",
    "education",
    "engineering--manufacturing-and-construction",
    "field-unknown",
    "generic-programmes-and-qualifications",
    "health-and-welfare",
    "information-and-communication-technologies--icts-",
    "natural-sciences--mathematics-and-statistics",
    "services",
    "social-sciences--journalism-and-information"
  ];

  let rawPrograms = [];
  const cityMap = {};
  const instMap = {};

  // 1. Fetch all category indexes
  for (const slug of CATEGORY_SLUGS) {
    try {
      console.log(`[Czechia] Fetching category index for ${slug}...`);
      const res = await fetch(`https://portal.studyin.cz/en/find-your-study-programme/get-data/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!res.ok) continue;
      const json = await res.json();
      
      // Save mappings
      if (json.FilterParams) {
        if (json.FilterParams.City) {
          Object.assign(cityMap, json.FilterParams.City);
        }
        if (json.FilterParams.Institution) {
          Object.assign(instMap, json.FilterParams.Institution);
        }
      }

      const programs = Object.values(json.StudyProgramme || {});
      const englishDegreePrograms = programs.filter(p => p.IDTypeOfStudy === "1" && p.LanguageOfTeachingFilter && p.LanguageOfTeachingFilter.includes("i00000000002"));
      
      rawPrograms = rawPrograms.concat(englishDegreePrograms);
      await sleep(150);
    } catch (e) {
      console.error(`[Czechia] Error fetching category ${slug}:`, e);
    }
  }

  console.log(`[Czechia] Collected ${rawPrograms.length} raw English degree programs. Fetching details for direct links...`);

  const itemsCollected = [];
  const queue = [...rawPrograms];
  let processedCount = 0;
  
  const concurrency = 10;
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      let directLink = `https://portal.studyin.cz/en/study-programme/${item.WebKey}`;
      try {
        const detailRes = await fetch(`https://portal.studyin.cz/en/study-programme/${item.WebKey}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (detailRes.ok) {
          const detailHtml = await detailRes.text();
          
          const webMatch = detailHtml.match(/<strong>Web:<\/strong>[\s\S]*?<td class="externLink">\s*<a[^>]*href="([^"]+)"/i) ||
                           detailHtml.match(/Web:[\s\S]*?<td class="externLink">\s*<a[^>]*href="([^"]+)"/i);
          if (webMatch) {
            directLink = webMatch[1].trim();
          }
        }
      } catch (err) {
        console.error(`[Czechia] Error fetching details for ${item.WebKey}:`, err);
      }

      const university = instMap[item.IDInstitution] || item.IDInstitution || 'Czech University';
      const city = cityMap[item.IDCity] || item.IDCity || 'Czechia';

      let tuitionFee = 'Varies';
      if (item.TuitionDisplay && item.TuitionDisplay.length > 0) {
        const feeObj = item.TuitionDisplay[0];
        tuitionFee = feeObj.PerYear || feeObj.PerPeriod || 'Varies';
      }

      let degree = 'Master';
      if (item.IDLevelOfStudy === '1') degree = 'Bachelor';
      else if (item.IDLevelOfStudy === '2') degree = 'Master';
      else if (item.IDLevelOfStudy === '3') degree = 'Doctoral Programme';

      itemsCollected.push({
        id: `czechia_${item.WebKey}`,
        title: item.Name || '',
        university: university,
        degree: degree,
        location: city,
        duration: item.DurationDisplay || 'Unknown',
        studyMode: item.IDFormOfStudy === '1' ? 'In Person' : 'Distance / Blended',
        deadlines: [],
        link: directLink,
        logo: '',
        country: 'Czechia',
        tuitionFee: tuitionFee,
        semesterStart: 'Autumn (Sept/Oct) / Spring (Feb)'
      });

      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`[Czechia] Processed ${processedCount} / ${rawPrograms.length} details pages...`);
      }
      await sleep(100);
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);

  console.log(`[Czechia] Complete. Total: ${itemsCollected.length}`);
  return itemsCollected;
}

// 10. Scrape Poland (RAD-on API)
async function scrapePoland() {
  console.log('--- Scraping Poland (RAD-on API) ---');
  let itemsCollected = [];
  let url = 'https://radon.nauka.gov.pl/opendata/polon/courses?resultNumbers=100&educationLanguageCode=eng&currentStatusCode=3';

  try {
    while (url) {
      console.log(`[Poland] Fetching page: ${url.substring(0, 120)}...`);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!res.ok) {
        console.error(`[Poland] HTTP Error! Status: ${res.status}`);
        break;
      }
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        break;
      }

      for (const course of data.results) {
        const title = course.courseName || '';
        const university = course.mainInstitutionName || 'Unknown University';
        const location = course.leadingInstitutionCity || 'Poland';
        
        // Map Degree Level and Duration/StudyMode from instances
        let degree = 'Master';
        let duration = '2 years';
        let studyMode = 'In Person';
        
        // Get degree from course levelCode/levelName
        const levelCode = course.levelCode;
        if (levelCode === '1' || levelCode === '6') {
          degree = 'Bachelor';
          duration = '3 years';
        } else if (levelCode === '2' || levelCode === '7' || levelCode === '5') {
          degree = 'Master';
          duration = '2 years';
        } else if (levelCode === '3' || levelCode === '8') {
          degree = 'PhD';
          duration = '3-4 years';
        }

        let ectsText = '';
        if (course.courseInstances && course.courseInstances.length > 0) {
          // Find first instance matching English
          const inst = course.courseInstances.find(i => i.languageCode === 'eng') || course.courseInstances[0];
          
          if (inst.ects) {
            ectsText = ` (${inst.ects} ECTS)`;
          }

          if (inst.numberOfSemesters) {
            const sems = parseInt(inst.numberOfSemesters);
            if (!isNaN(sems) && sems > 0) {
              const years = Math.round((sems / 2) * 10) / 10;
              duration = `${years} year${years === 1 ? '' : 's'}`;
            }
          }

          if (inst.formCode === '2') {
            studyMode = 'In Person (Part-Time)';
          } else {
            studyMode = 'In Person (Full-Time)';
          }
        }

        const fullDuration = ectsText ? `${duration}${ectsText}` : duration;
        const searchLink = `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + university)}`;

        itemsCollected.push({
          id: `poland_${course.courseUuid}`,
          title: title,
          university: university,
          degree: degree,
          location: location,
          duration: fullDuration,
          studyMode: studyMode,
          deadlines: [],
          link: searchLink,
          logo: '',
          country: 'Poland',
          tuitionFee: 'Free for EU/EEA (non-EU/EEA fees typically 2,000 - 4,000 EUR/year)',
          semesterStart: 'Autumn (October) / Spring (February)'
        });
      }

      if (data.pagination && data.pagination.token) {
        url = `https://radon.nauka.gov.pl/opendata/polon/courses?resultNumbers=100&educationLanguageCode=eng&currentStatusCode=3&token=${data.pagination.token}`;
      } else {
        url = null;
      }
      
      // Gentle sleep between pages
      await sleep(150);
    }
  } catch (error) {
    console.error('[Poland] Error during scraping:', error);
  }

  console.log(`[Poland] Complete. Total: ${itemsCollected.length}`);
  return itemsCollected;
}

// Main aggregate function
async function scrapeAll() {
  console.log('Starting European English-taught programs crawler...');
  let allPrograms = [];

  try {
    const germany = await scrapeGermany();
    allPrograms = allPrograms.concat(germany);
    await sleep(DELAY_MS);

    const greece = await scrapeGreece();
    allPrograms = allPrograms.concat(greece);
    await sleep(DELAY_MS);

    const italy = await scrapeItaly();
    allPrograms = allPrograms.concat(italy);
    await sleep(DELAY_MS);

    const sweden = await scrapeSweden();
    allPrograms = allPrograms.concat(sweden);
    await sleep(DELAY_MS);

    const finland = await scrapeFinland();
    allPrograms = allPrograms.concat(finland);
    await sleep(DELAY_MS);

    const france = await scrapeFrance();
    allPrograms = allPrograms.concat(france);
    await sleep(DELAY_MS);

    const denmark = await scrapeDenmark();
    allPrograms = allPrograms.concat(denmark);
    await sleep(DELAY_MS);

    const austria = await scrapeAustria();
    allPrograms = allPrograms.concat(austria);
    await sleep(DELAY_MS);

    const czechia = await scrapeCzechia();
    allPrograms = allPrograms.concat(czechia);
    await sleep(DELAY_MS);

    const poland = await scrapePoland();
    allPrograms = allPrograms.concat(poland);

    console.log(`\nAggregated all databases successfully. Total programs: ${allPrograms.length}`);

    // Write standard JSON file
    const jsonPath = path.join(__dirname, 'programs.json');
    fs.writeFileSync(jsonPath, JSON.stringify(allPrograms, null, 2), 'utf-8');
    console.log(`Saved JSON to ${jsonPath}`);

    // Write self-contained JS file to bypass CORS
    const jsPath = path.join(__dirname, 'programs-data.js');
    const jsContent = `// Self-contained European English-Taught Programs Database\nconst PROGRAMS_DATA = ${JSON.stringify(allPrograms, null, 2)};\n`;
    fs.writeFileSync(jsPath, jsContent, 'utf-8');
    console.log(`Saved JS data wrapper to ${jsPath}`);

  } catch (error) {
    console.error('Error during aggregate scraping:', error);
  }
}

scrapeAll();
