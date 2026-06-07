async function test() {
  try {
    const url = 'https://www.studienwahl.at/studies/humanities/education-and-social-sciences/cultural-anthropology-and-social-anthropology-ethnology/624-cultural-and-social-anthropology-0-0.en.html';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = await res.text();
    
    // Look for links that contain "http"
    const aRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]+?)<\/a>/g;
    let match;
    console.log('--- All hyperlinks ---');
    while ((match = aRegex.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].trim().replace(/\s+/g, ' ');
      if (href.startsWith('http')) {
        console.log(`Text: "${text}" -> Href: "${href}"`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
test();
