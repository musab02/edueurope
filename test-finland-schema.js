async function test() {
  try {
    const url = 'https://studyinfo.fi/konfo-backend/search/koulutukset?opetuskieli=oppilaitoksenopetuskieli_4&size=2&page=1';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const data = await response.json();
    console.log(JSON.stringify(data.hits[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
