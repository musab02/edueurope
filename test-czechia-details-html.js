async function test() {
  try {
    const url = 'https://portal.studyin.cz/en/study-programme/economics-and-management-ft-bachelor-degree-fbe-mendelu';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = await res.text();
    
    const idx = html.indexOf('29921-masters-degree');
    if (idx !== -1) {
      console.log('Context (400 chars):', html.substring(idx - 200, idx + 200));
    }
  } catch (e) {
    console.error(e);
  }
}
test();
