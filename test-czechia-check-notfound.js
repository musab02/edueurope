async function test() {
  try {
    const key = 'system-engineering-and-informatics-ft-master-degree-fbe-mendelu';
    const res = await fetch(`https://portal.studyin.cz/en/study-programme/${key}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    console.log('Includes mendelu:', html.toLowerCase().includes('mendelu'));
    console.log('Includes http:', html.toLowerCase().includes('http'));
  } catch (e) {
    console.error(e);
  }
}
test();
