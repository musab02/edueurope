async function test() {
  try {
    const url = 'https://tie-api.campusfrance.org/sgetprogram/2118';
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await response.json();
    console.log('Program detail keys:', Object.keys(data));
    console.log('Full program detail content (without objective):');
    const cleanData = { ...data };
    delete cleanData.objective;
    console.log(JSON.stringify(cleanData, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
