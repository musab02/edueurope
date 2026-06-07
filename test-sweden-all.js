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
        fritext: "",
        sortering: "relevance",
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
    const data = JSON.parse(text);
    console.log('Total Swedish programs:', data.totaltAntalTraffar);
    console.log('Items returned on page 1:', data.sokresultatItems && data.sokresultatItems.length);
    if (data.sokresultatItems && data.sokresultatItems.length > 0) {
      console.log('Sample item:', JSON.stringify(data.sokresultatItems[0].anmalningsalternativ, null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}

test();
