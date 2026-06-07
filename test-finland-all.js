async function test() {
  try {
    const url = 'https://studyinfo.fi/konfo-backend/search/koulutukset?opetuskieli=oppilaitoksenopetuskieli_4&size=10';
    console.log('Fetching all English programs in Finland:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const data = await response.json();
    console.log('Total English programs in Finland:', data.total);
    console.log('Sample hit:', JSON.stringify(data.hits && data.hits[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
