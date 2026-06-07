const CATEGORY_SLUGS = [
  "agriculture--forestry--fisheries-and-veterinary",
  "arts-and-humanities",
  "business--administration-and-law",
  "education",
  "engineering--manufacturing-and-construction",
  "field-unknown",
  "generic-programmes-and-qualifications",
  "health-and-welfare",
  "information-and-communication-technologies--icts-",
  "natural-sciences--mathematics-and-statistics",
  "services",
  "social-sciences--journalism-and-information"
];

async function countAll() {
  let totalPrograms = 0;
  for (const slug of CATEGORY_SLUGS) {
    try {
      const res = await fetch(`https://portal.studyin.cz/en/find-your-study-programme/get-data/${slug}`);
      if (!res.ok) continue;
      const json = await res.json();
      const programs = Object.values(json.StudyProgramme || {});
      const englishDegreePrograms = programs.filter(p => p.IDTypeOfStudy === "1" && p.LanguageOfTeachingFilter.includes("i00000000002"));
      console.log(`${slug}: found ${englishDegreePrograms.length} English degree programs (out of ${programs.length} total)`);
      totalPrograms += englishDegreePrograms.length;
    } catch (e) {
      console.error(slug, e);
    }
  }
  console.log('Total English degree programs in Czechia:', totalPrograms);
}
countAll();
