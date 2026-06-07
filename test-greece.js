async function test() {
  try {
    let page = 1;
    let allItems = [];
    const limit = 200;
    
    while (true) {
      const url = `https://atsigapi.studyingreece.edu.gr/programmes-api/programmes?limit=${limit}&page=${page}`;
      console.log('Fetching:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const items = data.items || [];
      if (items.length === 0) break;
      
      allItems = allItems.concat(items);
      console.log(`Fetched ${items.length} items. Total so far: ${allItems.length}/${data.total}`);
      
      if (!data.has_next || allItems.length >= data.total) {
        break;
      }
      page++;
    }

    console.log('Finished fetching. Total items:', allItems.length);
    
    // 1. Unique degrees
    const degrees = new Set(allItems.map(i => i.type));
    console.log('Unique degree types:', Array.from(degrees));
    
    // 2. Languages filter
    const englishPrograms = allItems.filter(i => i.languages && i.languages.includes('English'));
    console.log('Total English-taught programs:', englishPrograms.length);

    if (englishPrograms.length > 0) {
      console.log('Sample English program fields:');
      const sample = englishPrograms[0];
      console.log(JSON.stringify({
        id: sample.id,
        name_en: sample.name_en,
        university: sample.department && sample.department.university ? sample.department.university.name_en : 'N/A',
        city_en: sample.city_en,
        semesters: sample.semesters,
        study_modes: sample.study_modes,
        website: sample.website,
        logo: sample.department && sample.department.university ? sample.department.university.image_url : 'N/A',
        apply_status: sample.apply_status,
        created_at: sample.created_at,
        updated_at: sample.updated_at
      }, null, 2));

      // Look for any keys containing date or deadline
      const sampleKeys = Object.keys(sample);
      const dateKeys = sampleKeys.filter(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('dead') || k.toLowerCase().includes('time') || k.toLowerCase().includes('period'));
      console.log('Keys that might represent dates/deadlines/periods:', dateKeys);
      
      // Let's print out what values those keys have for the first 5 English programs
      console.log('Values of date keys for first 5 programs:');
      englishPrograms.slice(0, 5).forEach((p, index) => {
        console.log(`Program ${index + 1}: ${p.name_en}`);
        dateKeys.forEach(k => {
          console.log(`  ${k}:`, p[k]);
        });
      });
    }
  } catch (e) {
    console.error('Error fetching Greek API:', e);
  }
}

test();
