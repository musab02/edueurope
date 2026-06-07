async function test() {
  try {
    const url1 = 'https://studyinfo.fi/konfo-backend/search/koulutukset?opetuskieli=oppilaitoksenopetuskieli_4&size=2&page=1';
    const url2 = 'https://studyinfo.fi/konfo-backend/search/koulutukset?opetuskieli=oppilaitoksenopetuskieli_4&size=2&page=2';
    
    console.log('Fetching Page 1...');
    const r1 = await fetch(url1, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const d1 = await r1.json();
    console.log('Page 1 first item OID:', d1.hits[0] && d1.hits[0].oid);

    console.log('Fetching Page 2...');
    const r2 = await fetch(url2, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const d2 = await r2.json();
    console.log('Page 2 first item OID:', d2.hits[0] && d2.hits[0].oid);
  } catch (e) {
    console.error(e);
  }
}

test();
