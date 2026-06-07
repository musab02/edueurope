async function test() {
  try {
    const url = 'https://api.daad.de/api/ajax/hsk/list/en?hec-teachingLanguage=2&hec-limit=5&hec-p=1';
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data.results.items[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
