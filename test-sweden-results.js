async function test() {
  try {
    const url = 'https://www.universityadmissions.se/intl/api/sok';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        fritext: "Computer Science",
        sortering: "relevance",
        termin: "28",
        sokfilter: {
          "program": true
        }
      })
    });
    
    let text = await response.text();
    if (text.startsWith(")]}',")) {
      text = text.slice(5).trim();
    }
    const data = JSON.parse(text);
    console.log('Response Keys:', Object.keys(data));
    console.log('Total hits:', data.totalHits);
    console.log('Items count:', data.sokresultatItems && data.sokresultatItems.length);
    if (data.sokresultatItems && data.sokresultatItems.length > 0) {
      console.log('First item sample:', JSON.stringify(data.sokresultatItems[0], null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}

test();
