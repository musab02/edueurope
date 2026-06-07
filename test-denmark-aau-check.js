async function test() {
  try {
    const url = 'https://studyindenmark.dk/++api++/portal/@querystring-search';
    const queryObj = {
      "metadata_fields": "_all",
      "b_size": "1000",
      "limit": "1000",
      "query": [
        {
          "i": "portal_type",
          "o": "plone.app.querystring.operation.selection.any",
          "v": ["program"]
        }
      ]
    };
    const response = await fetch(`${url}?query=${encodeURIComponent(JSON.stringify(queryObj))}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const data = await response.json();
    const items = data.items || [];

    for (const item of items) {
      const urls = [];
      const searchLinks = (obj) => {
        if (!obj) return;
        if (typeof obj === 'string') {
          const matches = obj.match(/https?:\/\/[^\s"'>)]+/gi);
          if (matches) {
            matches.forEach(m => {
              const urlClean = m.replace(/[.,;:]$/, '');
              if (!urlClean.toLowerCase().includes('studyindenmark.dk') && !urlClean.toLowerCase().includes('youtube.com')) {
                urls.push(urlClean);
              }
            });
          }
        } else if (Array.isArray(obj)) {
          obj.forEach(searchLinks);
        } else if (typeof obj === 'object') {
          if (obj.url && typeof obj.url === 'string') {
            searchLinks(obj.url);
          }
          if (obj.data && obj.data.url) {
            searchLinks(obj.data.url);
          }
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

      if (directLink.includes('studyindenmark.dk/portal') && item.institution_title && item.institution_title.includes('Aalborg')) {
        console.log('Found AAU fallback:');
        console.log(`Title: ${item.Title}`);
        console.log(`ID: ${item['@id']}`);
        console.log(`Path: ${item.getPath}`);
        console.log(`Description:`, JSON.stringify(item.program_description, null, 2));
      }
    }
  } catch (e) {
    console.error(e);
  }
}
test();
