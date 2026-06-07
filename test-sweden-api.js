async function test() {
  try {
    const url = 'https://www.universityadmissions.se/intl/api/sok';
    console.log('Fetching Sweden search via POST:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      body: JSON.stringify({
        fritext: "Computer Science",
        sortering: "relevance",
        termin: "28", // Spring 2027
        sokfilter: {
          "program": true
        }
      })
    });
    
    console.log('Status code:', response.status);
    const text = await response.text();
    console.log('First 200 chars of response:', text.slice(0, 200));
  } catch (e) {
    console.error('Error fetching Sweden API:', e);
  }
}

test();
