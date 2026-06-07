async function test() {
  try {
    const url = 'https://portal.studyin.cz/en/study-programme/economics-and-management-ft-bachelor-degree-fbe-mendelu';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = await res.text();
    
    const aRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]+?)<\/a>/g;
    let match;
    while ((match = aRegex.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].trim().replace(/\s+/g, ' ');
      if (href.includes('pef.mendelu.cz') || href.includes('29921-masters-degree')) {
        console.log(`FOUND LINK MATCH: Text: "${text}" -> Href: "${href}"`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
test();
