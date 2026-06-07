async function test() {
  try {
    const url = 'https://studyindenmark.dk/++api++/portal/@querystring-search';
    const queryObj = {
      "metadata_fields": "_all",
      "b_size": "2",
      "limit": "2",
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
    console.log(JSON.stringify(data.items[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
