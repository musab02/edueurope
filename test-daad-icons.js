async function test() {
  try {
    const icons = new Set();
    const texts = {};
    for (let page = 1; page <= 5; page++) {
      const url = `https://api.daad.de/api/ajax/hsk/list/en?hec-teachingLanguage=2&hec-limit=100&hec-p=${page}`;
      const res = await fetch(url);
      const data = await res.json();
      for (const item of data.results.items || []) {
        for (const subItem of item.items || []) {
          icons.add(subItem.icon);
          if (!texts[subItem.icon]) texts[subItem.icon] = [];
          if (texts[subItem.icon].length < 3) {
            texts[subItem.icon].push(subItem.text);
          }
        }
      }
    }
    console.log('All icons found:', Array.from(icons));
    console.log('Sample texts per icon:', texts);
  } catch (e) {
    console.error(e);
  }
}
test();
