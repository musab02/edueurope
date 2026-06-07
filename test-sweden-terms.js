async function test() {
  try {
    const url = 'https://www.universityadmissions.se/intl/api/sok';
    const terms = ["26", "27", "28", "29"];
    
    for (const term of terms) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({
          fritext: "",
          sortering: "relevance",
          termin: term,
          sokfilter: {
            "program": true
          },
          sida: 1
        })
      });
      
      let text = await response.text();
      if (text.startsWith(")]}',")) {
        text = text.slice(5).trim();
      }
      try {
        const data = JSON.parse(text);
        console.log(`Term ${term} - Total hits:`, data.totaltAntalTraffar);
      } catch (err) {
        console.log(`Term ${term} failed to parse JSON.`);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

test();
