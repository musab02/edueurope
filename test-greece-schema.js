async function test() {
  try {
    const res = await fetch('https://atsigapi.studyingreece.edu.gr/programmes-api/programmes?limit=2&page=1');
    const json = await res.json();
    console.log(JSON.stringify(json.items[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
