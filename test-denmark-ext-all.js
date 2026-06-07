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
    
    let directLinksCount = 0;
    let fallbackCount = 0;
    
    // Ignored domains list
    const ignoreKeywords = [
      'studyindenmark.dk', 'youtube.com', 'facebook.com', 'instagram.com', 
      'twitter.com', 'linkedin.com', 'ufm.dk', 'fivu.dk', 'google.com', 
      'flickr.com', 'pinterest.com', 'vimeo.com'
    ];

    for (const item of items) {
      const urls = [];
      const searchLinks = (obj) => {
        if (!obj) return;
        if (typeof obj === 'string') {
          // Look for any http/https URL
          const matches = obj.match(/https?:\/\/[^\s"'>)]+/gi);
          if (matches) {
            matches.forEach(m => {
              const urlClean = m.replace(/[.,;:]$/, ''); // Remove trailing punctuation
              if (!ignoreKeywords.some(kw => urlClean.toLowerCase().includes(kw))) {
                urls.push(urlClean);
              }
            });
          }
        } else if (Array.isArray(obj)) {
          obj.forEach(searchLinks);
        } else if (typeof obj === 'object') {
          Object.values(obj).forEach(searchLinks);
        }
      };

      searchLinks(item.program_description);
      
      let finalLink = item['@id'] || '';
      if (urls.length > 0) {
        // Find links that contain keywords related to programs
        const keywords = ['education', 'bachelor', 'master', 'programme', 'study', 'en', 'uk', 'apply', 'admission'];
        const matches = urls.filter(u => keywords.some(k => u.toLowerCase().includes(k)));
        
        let bestUrl = matches.length > 0 ? matches[0] : urls[0];
        
        // Clean trailing specialization paths if possible
        // e.g. for aau.dk/education/.../dynamic-systems -> aau.dk/education/...
        if (bestUrl.includes('aau.dk/education/')) {
          const parts = bestUrl.split('/');
          if (parts.length > 7) {
            bestUrl = parts.slice(0, 7).join('/');
          }
        }
        
        finalLink = bestUrl;
        directLinksCount++;
      } else {
        fallbackCount++;
      }
    }
    
    console.log(`Denmark results:`);
    console.log(`Total programs: ${items.length}`);
    console.log(`Direct links found: ${directLinksCount} (${((directLinksCount/items.length)*100).toFixed(1)}%)`);
    console.log(`Fallback portal links: ${fallbackCount}`);
  } catch (e) {
    console.error(e);
  }
}
test();
