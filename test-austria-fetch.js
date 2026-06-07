async function test() {
  try {
    const response = await fetch('https://www.studienwahl.at/studies/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      }
    });
    const html = await response.text();
    const csrfMatch = html.match(/<meta name="csrf-token" content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;
    const setCookieHeaders = response.headers.getSetCookie();
    const cookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');

    const postUrl = 'https://www.studienwahl.at/studies/?page=1&per-page=50';
    const body = new URLSearchParams();
    body.append('_csrf', csrfToken);
    body.append('StudySearchForm[sprache][]', '2'); // English
    body.append('helperDropDownBildungseinrichtung', '0');
    body.append('StudySearchForm[bildungseinrichtung]', '');
    body.append('StudySearchForm[q]', '');

    const postResponse = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      body: body.toString()
    });

    const postHtml = await postResponse.text();
    const fs = require('fs');
    fs.writeFileSync('austria.html', postHtml);
    
    function cleanText(text) {
      if (typeof text !== 'string') return '';
      return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    const parts = postHtml.split(/<div class="course/);
    console.log('Total parts split:', parts.length - 1);
    
    const items = [];
    for (let i = 1; i < parts.length; i++) {
      const block = parts[i];
      
      const titleMatch = block.match(/<h2>\s*([\s\S]+?)\s*<\/h2>/);
      const title = titleMatch ? cleanText(titleMatch[1]) : '';
      
      const uniMatch = block.match(/<\/h2>\s*<p>\s*([\s\S]+?)\s*<\/p>/) || block.match(/<p>\s*([\s\S]+?)\s*<\/p>/);
      const university = uniMatch ? cleanText(uniMatch[1]) : '';
      
      const degLocMatch = block.match(/<b>\s*([\s\S]+?)\s*(?:»|&raquo;)\s*([\s\S]+?)\s*<\/b>/);
      let degree = 'Unknown';
      let location = 'Austria';
      if (degLocMatch) {
        degree = cleanText(degLocMatch[1]);
        location = cleanText(degLocMatch[2]);
      }
      
      const linkMatch = block.match(/<a\s+[^>]*href="([^"]+)"[^>]*>More<\/a>/i);
      const link = linkMatch ? 'https://www.studienwahl.at' + linkMatch[1] : '';
      
      let stdDegree = 'Other';
      const degLower = degree.toLowerCase();
      if (degLower.includes('bachelor')) {
        stdDegree = 'Bachelor';
      } else if (degLower.includes('master')) {
        stdDegree = 'Master';
      } else if (degLower.includes('phd') || degLower.includes('doctoral')) {
        stdDegree = 'Doctoral Programme';
      } else {
        stdDegree = degree;
      }
      
      items.push({
        title,
        university,
        degree: stdDegree,
        rawDegree: degree,
        location,
        link
      });
    }

    console.log('Parsed items:', items.slice(0, 5));
    console.log('Last item:', items[items.length - 1]);
  } catch (e) {
    console.error(e);
  }
}

test();
