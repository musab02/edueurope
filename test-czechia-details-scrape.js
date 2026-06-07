async function test() {
  try {
    const sampleWebKeys = [
      'economics-and-management-ft-bachelor-degree-fbe-mendelu',
      'system-engineering-and-informatics-ft-master-degree-fbe-mendelu',
      'applied-informatics-ft-bachelor-degree-fbe-mendelu'
    ];

    for (const key of sampleWebKeys) {
      console.log(`Scraping details for: ${key}`);
      const res = await fetch(`https://portal.studyin.cz/en/study-programme/${key}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const html = await res.text();
      
      const webMatch = html.match(/<strong>Web:<\/strong>[\s\S]*?<td class="externLink">\s*<a[^>]*href="([^"]+)"/i) ||
                       html.match(/Web:[\s\S]*?<td class="externLink">\s*<a[^>]*href="([^"]+)"/i);
      
      console.log('Result direct link:', webMatch ? webMatch[1] : 'NOT FOUND (using studyin.cz fallback)');
    }
  } catch (e) {
    console.error(e);
  }
}
test();
