async function test() {
  try {
    const url = 'https://studyindenmark.dk/++api++/portal/@querystring-search';
    const queryObj = {
      "metadata_fields": "_all",
      "b_size": "20",
      "limit": "20",
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
      console.log(`\nProgram: ${item.Title} (${item.institution_title})`);
      
      // Look for external links in program_description
      const urls = [];
      const searchLinks = (obj) => {
        if (!obj) return;
        if (typeof obj === 'string') {
          if (obj.startsWith('http') && !obj.includes('studyindenmark.dk') && !obj.includes('youtube.com')) {
            urls.push(obj);
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
      console.log('Found external links:', urls);
      
      // Let's see if we can get a direct link
      let bestLink = item['@id'] || '';
      if (urls.length > 0) {
        // Look for links that contain "education", "bachelor", "master", "programme", "study"
        const keywords = ['education', 'bachelor', 'master', 'programme', 'study', 'en', 'uk'];
        const matches = urls.filter(u => keywords.some(k => u.toLowerCase().includes(k)));
        if (matches.length > 0) {
          bestLink = matches[0];
        } else {
          bestLink = urls[0];
        }
      }
      console.log('Selected Best Link:', bestLink);
    }
  } catch (e) {
    console.error(e);
  }
}
test();
