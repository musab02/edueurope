async function test() {
  try {
    const url = 'https://tie-api.campusfrance.org/sgetprograms/1';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const data = await response.json();
    console.log(JSON.stringify(data.programs.filter(p => p.taughtenAll === 1)[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
