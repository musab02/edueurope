async function test() {
  try {
    const slug = 'business--administration-and-law';
    const res = await fetch(`https://portal.studyin.cz/en/find-your-study-programme/get-data/${slug}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const json = await res.json();
    const programs = Object.entries(json.StudyProgramme);
    console.log('Total programs in category:', programs.length);
    console.log('Sample program structure:', JSON.stringify(programs[0], null, 2));
    console.log('First 5 FilterParams keys:', Object.keys(json.FilterParams));
    if (json.FilterParams.City) {
      console.log('Sample City mapping:', Object.entries(json.FilterParams.City).slice(0, 3));
    }
    if (json.FilterParams.Institution) {
      console.log('Sample Institution mapping:', Object.entries(json.FilterParams.Institution).slice(0, 3));
    }
  } catch (e) {
    console.error(e);
  }
}
test();
