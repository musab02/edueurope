/* ==========================================================================
   DAAD Degree Programs Explorer - App Logic
   ========================================================================== */

// App State
let programs = [];
let filteredPrograms = [];
let favorites = [];
let currentPage = 1;
const itemsPerPage = 24;
let viewMode = 'grid'; // 'grid' or 'list'

// DOM Elements
const elProgramsContainer = document.getElementById('programs-container');
const elSearchInput = document.getElementById('search-input');
const elBtnClearSearch = document.getElementById('btn-clear-search');
const elSelectSort = document.getElementById('select-sort');
const elCountryFilters = document.getElementById('country-filters');
const elDegreeFilters = document.getElementById('degree-filters');
const elLocationFilters = document.getElementById('location-filters');
const elLocationSearchInput = document.getElementById('location-search-input');
const elBtnClearLocationSearch = document.getElementById('btn-clear-location-search');
const elStudyModeFilters = document.getElementById('study-mode-filters');
const elFeeFilters = document.getElementById('fee-filters');
const elUniversitySearchInput = document.getElementById('university-search-input');
const elBtnClearUniversitySearch = document.getElementById('btn-clear-university-search');
const elUniversitySuggestions = document.getElementById('university-suggestions');
const elBtnResetFilters = document.getElementById('btn-reset-filters');
const elDisplayedCount = document.getElementById('displayed-count');
const elMatchingCount = document.getElementById('matching-count');
const elBtnViewGrid = document.getElementById('btn-view-grid');
const elBtnViewList = document.getElementById('btn-view-list');
const elPaginationControls = document.getElementById('pagination-controls');
const elCurrentPage = document.getElementById('current-page');
const elTotalPages = document.getElementById('total-pages');
const elBtnPrevPage = document.getElementById('btn-prev-page');
const elBtnNextPage = document.getElementById('btn-next-page');

// Drawer DOM Elements
const elDrawerOverlay = document.getElementById('drawer-overlay');
const elShortlistDrawer = document.getElementById('shortlist-drawer');
const elBtnBookmarkDrawerToggle = document.getElementById('btn-bookmark-drawer-toggle');
const elBtnCloseDrawer = document.getElementById('btn-close-drawer');
const elShortlistContainer = document.getElementById('shortlist-container');
const elShortlistCount = document.getElementById('shortlist-count');
const elBtnExportCSV = document.getElementById('btn-export-csv');
const elBtnCopyClipboard = document.getElementById('btn-copy-clipboard');
const elBtnClearFavorites = document.getElementById('btn-clear-favorites');
const elToastNotification = document.getElementById('toast-notification');

// Stats DOM Elements
const elStatTotalPrograms = document.getElementById('stat-total-programs');
const elStatTotalUniversities = document.getElementById('stat-total-universities');
const elStatTotalLocations = document.getElementById('stat-total-locations');
const elStatTotalCountries = document.getElementById('stat-total-countries');

// Decompress database keys if needed and parse fees
function inflatePrograms(data) {
  if (!Array.isArray(data)) return [];
  if (data.length > 0 && typeof data[0].i !== 'undefined') {
    return data.map(p => {
      const inflated = {
        id: p.i,
        title: p.t,
        university: p.u,
        degree: p.d,
        location: p.l,
        duration: p.du,
        studyMode: p.s,
        deadlines: p.dl || [],
        link: p.lk || '',
        logo: p.lo || '',
        country: p.c || '',
        tuitionFee: p.tf || '',
        semesterStart: p.ss || ''
      };
      const feeRange = parseFeeToEurRange(inflated.tuitionFee, inflated.country);
      inflated.feeCategory = getFeeCategory(feeRange);
      return inflated;
    });
  }
  return data.map(p => {
    if (!p.feeCategory) {
      const feeRange = parseFeeToEurRange(p.tuitionFee || '', p.country || '');
      p.feeCategory = getFeeCategory(feeRange);
    }
    return p;
  });
}

// Currency conversion rates to EUR for Tuition Fee filtering
const RATES = {
  EUR: 1.0,
  GBP: 1.18,
  USD: 0.93,
  SEK: 0.087,
  DKK: 0.134,
  CZK: 0.040,
  PLN: 0.23,
  HUF: 0.0026
};

// Parse raw tuition fee text to a EUR/year range
function parseFeeToEurRange(feeStr, country) {
  if (!feeStr) return { min: 0, max: 0, isFree: true, isVaries: false };
  
  const str = feeStr.toLowerCase().trim();
  
  if (str === 'free' || str === 'no fee' || str === 'free (public university)') {
    return { min: 0, max: 0, isFree: true, isVaries: false };
  }
  
  if (str === 'varies' || str === 'no information' || str === 'please enquire') {
    return { min: 0, max: 0, isFree: false, isVaries: true };
  }

  if (str.includes('low semester fee') || str.includes('low tuition fee') || (str.includes('public university') && str.includes('free'))) {
    if (!str.includes('non-eu') || str.includes('typically 100') || str.includes('~100-400')) {
      return { min: 0, max: 400, isFree: true, isVaries: false };
    }
  }

  let targetStr = str;
  const numRegex = /(?:[€£$]|sek|dkk|czk|pln|huf|eur|gbp|usd)?\s*(\d+(?:[,\s\.]\d{3})*(?:\.\d+)?)\s*(?:eur|gbp|usd|sek|dkk|czk|pln|huf|€|£|\$|per year|per semester|\/year|\/semester)?/gi;
  
  let match;
  const values = [];
  while ((match = numRegex.exec(targetStr)) !== null) {
    let cleanNumStr = match[1].replace(/\s/g, '');
    const commaCount = (cleanNumStr.match(/,/g) || []).length;
    const dotCount = (cleanNumStr.match(/\./g) || []).length;
    
    if (commaCount === 1 && dotCount === 0) {
      if (cleanNumStr.split(',')[1].length === 3) {
        cleanNumStr = cleanNumStr.replace(',', '');
      } else {
        cleanNumStr = cleanNumStr.replace(',', '.');
      }
    } else if (dotCount === 1 && commaCount === 0) {
      if (cleanNumStr.split('.')[1].length === 3) {
        cleanNumStr = cleanNumStr.replace('.', '');
      }
    } else if (commaCount > 0 || dotCount > 0) {
      cleanNumStr = cleanNumStr.replace(/,/g, '');
    }
    
    const num = parseFloat(cleanNumStr);
    if (!isNaN(num) && num > 10) {
      let currency = 'EUR';
      if (targetStr.includes('sek') || (targetStr.includes('kr') && country === 'Sweden')) currency = 'SEK';
      else if (targetStr.includes('dkk') || (targetStr.includes('kr') && country === 'Denmark')) currency = 'DKK';
      else if (targetStr.includes('czk') || targetStr.includes('kc')) currency = 'CZK';
      else if (targetStr.includes('pln') || targetStr.includes('zł')) currency = 'PLN';
      else if (targetStr.includes('gbp') || targetStr.includes('£')) currency = 'GBP';
      else if (targetStr.includes('usd') || targetStr.includes('$')) currency = 'USD';
      else if (targetStr.includes('huf') || targetStr.includes('ft')) currency = 'HUF';

      let eurValue = num * (RATES[currency] || 1.0);
      
      if (match[0].toLowerCase().includes('semester') || targetStr.includes('semester')) {
        if (!targetStr.includes('total') && !targetStr.includes('per year')) {
          eurValue *= 2;
        }
      }
      
      values.push(eurValue);
    }
  }

  if (values.length === 0) {
    if (str.includes('free') || str.includes('low')) {
      return { min: 0, max: 500, isFree: true, isVaries: false };
    }
    return { min: 0, max: 0, isFree: false, isVaries: true };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, isFree: false, isVaries: false };
}

// Convert EUR/year range to classification category tag
function getFeeCategory(range) {
  if (range.isFree && range.max <= 1000) return 'free-low';
  if (range.isVaries) return 'varies';
  
  if (range.max <= 1000) return 'free-low';
  if (range.min >= 15000) return 'high';
  if (range.min >= 5000) return 'medium';
  if (range.max <= 5000) return 'moderate';
  
  const mid = (range.min + range.max) / 2;
  if (mid <= 5000) return 'moderate';
  if (mid <= 15000) return 'medium';
  return 'high';
}


// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
  // Load data from global variable or fallback to fetch
  if (typeof PROGRAMS_DATA !== 'undefined' && Array.isArray(PROGRAMS_DATA)) {
    initApp(inflatePrograms(PROGRAMS_DATA));
  } else {
    // If not defined (e.g. scraper is still running or JS failed to load), try fetching JSON
    fetch('programs.json')
      .then(response => {
        if (!response.ok) throw new Error('Data file not ready.');
        return response.json();
      })
      .then(data => initApp(inflatePrograms(data)))
      .catch(err => {
        console.error(err);
        elProgramsContainer.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-triangle-exclamation empty-icon text-danger"></i>
            <h3>Database not ready yet</h3>
            <p>Please run the scraper script first using: <code>node scraper.js</code></p>
          </div>
        `;
      });
  }
});

function initApp(data) {
  programs = data;
  filteredPrograms = [...programs];
  
  // Load Favorites from LocalStorage
  const savedFavorites = localStorage.getItem('daad_shortlist');
  if (savedFavorites) {
    try {
      favorites = JSON.parse(savedFavorites);
    } catch (e) {
      favorites = [];
    }
  }

  // Populate UI Filters & Stats
  updateStats();
  populateFilters();
  setupEventListeners();
  
  // Initial Render
  applyFiltersAndSort();
  updateShortlistDrawer();
}

// 1. Calculate and Render Stats
function updateStats() {
  const unis = new Set(programs.map(p => p.university));
  const cities = new Set(programs.map(p => p.location));
  const countries = new Set(programs.map(p => p.country).filter(Boolean));

  elStatTotalPrograms.textContent = programs.length;
  elStatTotalUniversities.textContent = unis.size;
  elStatTotalLocations.textContent = cities.size;
  elStatTotalCountries.textContent = countries.size;
  elShortlistCount.textContent = favorites.length;
}

// 2. Populate Sidebar Filters Dynamically
function populateFilters() {
  // Extract distinct values
  const countries = [...new Set(programs.map(p => p.country).filter(Boolean))].sort();
  const degrees = [...new Set(programs.map(p => p.degree))].sort();
  const studyModes = [...new Set(programs.map(p => p.studyMode))].filter(m => m !== 'Unknown').sort();
  
  // Count programs by city to sort cities by popular first, then alphabetically
  const cityCounts = {};
  programs.forEach(p => {
    cityCounts[p.location] = (cityCounts[p.location] || 0) + 1;
  });
  const cities = Object.keys(cityCounts).sort((a, b) => {
    // Primary sort: count descending
    if (cityCounts[b] !== cityCounts[a]) {
      return cityCounts[b] - cityCounts[a];
    }
    // Secondary sort: alphabetical
    return a.localeCompare(b);
  });

  // Populate Country Filters
  elCountryFilters.innerHTML = countries.map(country => `
    <label class="checkbox-label" data-type="country">
      <input type="checkbox" value="${country}">
      <span>${country}</span>
    </label>
  `).join('');

  // Populate Degree Filters
  elDegreeFilters.innerHTML = degrees.map(degree => `
    <label class="checkbox-label" data-type="degree">
      <input type="checkbox" value="${degree}">
      <span>${degree}</span>
    </label>
  `).join('');

  // Populate Location Filters
  elLocationFilters.innerHTML = cities.map(city => `
    <label class="checkbox-label" data-type="location" data-search-value="${city.toLowerCase()}">
      <input type="checkbox" value="${city}">
      <span>${city} <small style="color: var(--text-muted)">(${cityCounts[city]})</small></span>
    </label>
  `).join('');

  // Populate Study Mode Filters
  elStudyModeFilters.innerHTML = studyModes.map(mode => `
    <label class="checkbox-label" data-type="studyMode">
      <input type="checkbox" value="${mode}">
      <span>${mode}</span>
    </label>
  `).join('');
}

// 3. Setup Interactive Event Listeners
function setupEventListeners() {
  // Search inputs
  elSearchInput.addEventListener('input', () => {
    elBtnClearSearch.style.display = elSearchInput.value ? 'block' : 'none';
    currentPage = 1;
    applyFiltersAndSort();
  });

  elBtnClearSearch.addEventListener('click', () => {
    elSearchInput.value = '';
    elBtnClearSearch.style.display = 'none';
    currentPage = 1;
    applyFiltersAndSort();
  });

  elLocationSearchInput.addEventListener('input', () => {
    const query = elLocationSearchInput.value.trim().toLowerCase();
    elBtnClearLocationSearch.style.display = query ? 'block' : 'none';
    
    // Hide city filter labels that do not match city search
    const labels = elLocationFilters.querySelectorAll('.checkbox-label');
    labels.forEach(label => {
      const cityVal = label.getAttribute('data-search-value');
      if (cityVal.includes(query)) {
        label.style.display = 'flex';
      } else {
        label.style.display = 'none';
      }
    });
  });

  elBtnClearLocationSearch.addEventListener('click', () => {
    elLocationSearchInput.value = '';
    elBtnClearLocationSearch.style.display = 'none';
    
    const labels = elLocationFilters.querySelectorAll('.checkbox-label');
    labels.forEach(label => label.style.display = 'flex');
  });

  // University Autocomplete Search
  let uniNames = [];

  elUniversitySearchInput.addEventListener('input', () => {
    if (uniNames.length === 0 && programs.length > 0) {
      uniNames = [...new Set(programs.map(p => p.university))].sort();
    }
    
    const query = elUniversitySearchInput.value.trim().toLowerCase();
    elBtnClearUniversitySearch.style.display = query ? 'block' : 'none';
    
    if (!query) {
      elUniversitySuggestions.style.display = 'none';
      elUniversitySuggestions.innerHTML = '';
      currentPage = 1;
      applyFiltersAndSort();
      return;
    }

    const matches = uniNames.filter(u => u.toLowerCase().includes(query)).slice(0, 10);
    
    if (matches.length > 0) {
      elUniversitySuggestions.innerHTML = matches.map(u => `
        <div class="suggestion-item" data-value="${u}">${u}</div>
      `).join('');
    } else {
      elUniversitySuggestions.innerHTML = `<div class="suggestion-item-no-results">No universities found</div>`;
    }
    elUniversitySuggestions.style.display = 'block';
  });

  elUniversitySuggestions.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (item) {
      const val = item.getAttribute('data-value');
      elUniversitySearchInput.value = val;
      elUniversitySuggestions.style.display = 'none';
      elBtnClearUniversitySearch.style.display = 'block';
      currentPage = 1;
      applyFiltersAndSort();
    }
  });

  elBtnClearUniversitySearch.addEventListener('click', () => {
    elUniversitySearchInput.value = '';
    elUniversitySuggestions.style.display = 'none';
    elBtnClearUniversitySearch.style.display = 'none';
    currentPage = 1;
    applyFiltersAndSort();
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#university-autocomplete-container')) {
      elUniversitySuggestions.style.display = 'none';
    }
  });

  // Sorting
  elSelectSort.addEventListener('change', () => {
    currentPage = 1;
    applyFiltersAndSort();
  });

  // Filter Checkbox changes
  [elCountryFilters, elDegreeFilters, elLocationFilters, elStudyModeFilters, elFeeFilters].forEach(container => {
    container.addEventListener('change', () => {
      currentPage = 1;
      applyFiltersAndSort();
    });
  });

  // Reset Filters button
  elBtnResetFilters.addEventListener('click', () => {
    elSearchInput.value = '';
    elBtnClearSearch.style.display = 'none';
    
    elLocationSearchInput.value = '';
    elBtnClearLocationSearch.style.display = 'none';
    
    elUniversitySearchInput.value = '';
    elBtnClearUniversitySearch.style.display = 'none';
    elUniversitySuggestions.style.display = 'none';
    
    // Reset city label displays
    const locationLabels = elLocationFilters.querySelectorAll('.checkbox-label');
    locationLabels.forEach(label => label.style.display = 'flex');

    // Uncheck all checkboxes
    document.querySelectorAll('.checkbox-label input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });

    elSelectSort.value = 'default';
    currentPage = 1;
    applyFiltersAndSort();
    showToast('Filters cleared');
  });

  // View Mode switches
  elBtnViewGrid.addEventListener('click', () => {
    viewMode = 'grid';
    elBtnViewGrid.classList.add('active');
    elBtnViewList.classList.remove('active');
    renderPrograms();
  });

  elBtnViewList.addEventListener('click', () => {
    viewMode = 'list';
    elBtnViewList.classList.add('active');
    elBtnViewGrid.classList.remove('active');
    renderPrograms();
  });

  // Pagination buttons
  elBtnPrevPage.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderPrograms();
      document.querySelector('.app-main').scrollIntoView({ behavior: 'smooth' });
    }
  });

  elBtnNextPage.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderPrograms();
      document.querySelector('.app-main').scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Shortlist Drawer toggles
  elBtnBookmarkDrawerToggle.addEventListener('click', () => {
    elShortlistDrawer.classList.add('open');
    elDrawerOverlay.classList.add('open');
  });

  const closeDrawer = () => {
    elShortlistDrawer.classList.remove('open');
    elDrawerOverlay.classList.remove('open');
  };

  elBtnCloseDrawer.addEventListener('click', closeDrawer);
  elDrawerOverlay.addEventListener('click', closeDrawer);

  // Shortlist Actions
  elBtnClearFavorites.addEventListener('click', () => {
    if (favorites.length === 0) return;
    if (confirm('Are you sure you want to clear your shortlist?')) {
      favorites = [];
      saveFavorites();
      updateShortlistDrawer();
      renderPrograms();
      showToast('Shortlist cleared');
    }
  });

  elBtnExportCSV.addEventListener('click', exportToCSV);
  elBtnCopyClipboard.addEventListener('click', copyToClipboard);
}

// 4. Filtering, Sorting, and Core Calculation
function applyFiltersAndSort() {
  const searchQuery = elSearchInput.value.trim().toLowerCase();
  const universityQuery = elUniversitySearchInput.value.trim().toLowerCase();

  // Get active filters
  const selectedCountries = Array.from(elCountryFilters.querySelectorAll('input:checked')).map(cb => cb.value);
  const selectedDegrees = Array.from(elDegreeFilters.querySelectorAll('input:checked')).map(cb => cb.value);
  const selectedLocations = Array.from(elLocationFilters.querySelectorAll('input:checked')).map(cb => cb.value);
  const selectedStudyModes = Array.from(elStudyModeFilters.querySelectorAll('input:checked')).map(cb => cb.value);
  const selectedFees = Array.from(elFeeFilters.querySelectorAll('input:checked')).map(cb => cb.value);

  // Apply filters
  filteredPrograms = programs.filter(prog => {
    // Search match
    const searchMatch = !searchQuery || 
      prog.title.toLowerCase().includes(searchQuery) ||
      prog.university.toLowerCase().includes(searchQuery) ||
      prog.location.toLowerCase().includes(searchQuery) ||
      (prog.country && prog.country.toLowerCase().includes(searchQuery));

    // Country match (OR within group)
    const countryMatch = selectedCountries.length === 0 || (prog.country && selectedCountries.includes(prog.country));

    // Degree level match (OR within the group)
    const degreeMatch = selectedDegrees.length === 0 || selectedDegrees.includes(prog.degree);

    // Location match (OR within group)
    const locationMatch = selectedLocations.length === 0 || selectedLocations.includes(prog.location);

    // Study Mode match (OR within group)
    const studyModeMatch = selectedStudyModes.length === 0 || selectedStudyModes.includes(prog.studyMode);

    // University Autocomplete match
    const universityMatch = !universityQuery || prog.university.toLowerCase().includes(universityQuery);

    // Tuition Fee match (OR within group)
    const feeMatch = selectedFees.length === 0 || selectedFees.includes(prog.feeCategory);

    return searchMatch && countryMatch && degreeMatch && locationMatch && studyModeMatch && universityMatch && feeMatch;
  });

  // Apply Sorting
  const sortVal = elSelectSort.value;
  if (sortVal === 'title-asc') {
    filteredPrograms.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortVal === 'title-desc') {
    filteredPrograms.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sortVal === 'uni-asc') {
    filteredPrograms.sort((a, b) => a.university.localeCompare(b.university));
  } else if (sortVal === 'uni-desc') {
    filteredPrograms.sort((a, b) => b.university.localeCompare(a.university));
  } else {
    // Reset to default parsed order
    const progMap = new Map(programs.map((p, idx) => [p.id, idx]));
    filteredPrograms.sort((a, b) => progMap.get(a.id) - progMap.get(b.id));
  }

  // Update counts
  elMatchingCount.textContent = filteredPrograms.length;
  
  // Render Programs and Pagination
  renderPrograms();
}

// 5. Render Programs Grid / List
function renderPrograms() {
  elProgramsContainer.innerHTML = '';
  
  if (filteredPrograms.length === 0) {
    elProgramsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open empty-icon"></i>
        <h3>No programs match your search</h3>
        <p>Try clearing some filters or adjustments to your search keywords.</p>
      </div>
    `;
    elPaginationControls.style.display = 'none';
    elDisplayedCount.textContent = '0';
    return;
  }

  // Handle pagination values
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  elCurrentPage.textContent = currentPage;
  elTotalPages.textContent = totalPages;
  elPaginationControls.style.display = totalPages > 1 ? 'flex' : 'none';

  elBtnPrevPage.disabled = currentPage === 1;
  elBtnNextPage.disabled = currentPage === totalPages;

  // Slice results for current page
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedItems = filteredPrograms.slice(startIdx, endIdx);

  elDisplayedCount.textContent = paginatedItems.length;

  // Toggle CSS layout class on container
  if (viewMode === 'list') {
    elProgramsContainer.className = 'programs-list-mode';
  } else {
    elProgramsContainer.className = 'programs-grid';
  }

  // Generate program cards
  paginatedItems.forEach(prog => {
    const isFav = favorites.includes(prog.id);
    const logoHtml = prog.logo ? `<img src="${prog.logo}" alt="${prog.university} logo" class="uni-logo" loading="lazy">` : '';
    
    // Format deadlines
    let deadlineHtml = '';
    if (prog.deadlines && prog.deadlines.length > 0) {
      deadlineHtml = `
        <div class="deadlines-container">
          <div class="deadlines-title">Deadlines</div>
          <ul class="deadlines-list">
            ${prog.deadlines.map(d => `<li class="deadline-item"><i class="fa-regular fa-clock"></i> ${d}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    const card = document.createElement('article');
    card.className = 'program-card';
    card.setAttribute('data-id', prog.id);
    
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <h3 class="program-title" title="${prog.title}">${prog.title}</h3>
          <span class="university-name">${prog.university}</span>
        </div>
        ${logoHtml}
      </div>

      <div class="metadata-grid">
        <span class="meta-pill pill-country"><i class="fa-solid fa-globe"></i> ${prog.country || 'Europe'}</span>
        <span class="meta-pill pill-degree"><i class="fa-solid fa-graduation-cap"></i> ${prog.degree}</span>
        <span class="meta-pill pill-location"><i class="fa-solid fa-location-dot"></i> ${prog.location}</span>
        <span class="meta-pill"><i class="fa-regular fa-calendar-days"></i> ${prog.duration}</span>
        <span class="meta-pill" title="${prog.studyMode}"><i class="fa-solid fa-book-open"></i> ${prog.studyMode.length > 20 ? prog.studyMode.slice(0, 18) + '...' : prog.studyMode}</span>
        <span class="meta-pill pill-fee fee-${prog.feeCategory || 'varies'}" title="Tuition Fee"><i class="fa-solid fa-tags"></i> ${prog.tuitionFee || 'Free / Low Tuition'}</span>
        <span class="meta-pill pill-start" title="Semester Start"><i class="fa-regular fa-calendar-check"></i> ${prog.semesterStart || 'Autumn / Spring'}</span>
      </div>

      ${deadlineHtml}

      <div class="card-actions">
        <button class="btn btn-secondary btn-bookmark ${isFav ? 'active' : ''}" data-action="fav" title="${isFav ? 'Remove from shortlist' : 'Add to shortlist'}">
          <i class="fa-${isFav ? 'solid' : 'regular'} fa-star"></i>
        </button>
        <a href="${prog.link}" target="_blank" class="btn btn-primary flex-1">
          View Program <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
      </div>
    `;

    // Add event listener to bookmark button
    const btnFav = card.querySelector('[data-action="fav"]');
    btnFav.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFavorite(prog.id);
    });

    elProgramsContainer.appendChild(card);
  });
}

// 6. Manage Selections & Shortlist Drawer
function toggleFavorite(id) {
  const index = favorites.indexOf(id);
  if (index > -1) {
    favorites.splice(index, 1);
    showToast('Removed from shortlist');
  } else {
    favorites.push(id);
    showToast('Added to shortlist!');
  }
  
  saveFavorites();
  updateShortlistDrawer();
  
  // Re-render only cards in display to update star classes
  const cards = elProgramsContainer.querySelectorAll('.program-card');
  cards.forEach(card => {
    const cardId = card.getAttribute('data-id');
    if (cardId === id) {
      const isFav = favorites.includes(id);
      const btn = card.querySelector('[data-action="fav"]');
      if (btn) {
        btn.classList.toggle('active', isFav);
        const icon = btn.querySelector('i');
        icon.className = `fa-${isFav ? 'solid' : 'regular'} fa-star`;
        btn.title = isFav ? 'Remove from shortlist' : 'Add to shortlist';
      }
    }
  });
}

function saveFavorites() {
  localStorage.setItem('daad_shortlist', JSON.stringify(favorites));
  elShortlistCount.textContent = favorites.length;
}

function updateShortlistDrawer() {
  elShortlistContainer.innerHTML = '';
  
  if (favorites.length === 0) {
    elShortlistContainer.innerHTML = `
      <div class="empty-shortlist">
        <i class="fa-regular fa-star star-placeholder"></i>
        <p>Your shortlist is empty</p>
        <span>Star programs from the main dashboard list to compare and export them here.</span>
      </div>
    `;
    return;
  }

  // Fetch program structures for favorite IDs
  favorites.forEach(favId => {
    const prog = programs.find(p => p.id === favId);
    if (!prog) return;

    const div = document.createElement('div');
    div.className = 'shortlist-card';
    div.innerHTML = `
      <div class="shortlist-card-content">
        <h4 class="shortlist-card-title">${prog.title}</h4>
        <div class="shortlist-card-uni">${prog.university}</div>
        <div class="shortlist-card-meta">
          <span><i class="fa-solid fa-globe"></i> ${prog.country || 'Europe'}</span>
          <span>&bull;</span>
          <span><i class="fa-solid fa-graduation-cap"></i> ${prog.degree}</span>
          <span>&bull;</span>
          <span><i class="fa-solid fa-location-dot"></i> ${prog.location}</span>
        </div>
      </div>
      <button class="btn-remove-favorite" data-action="remove" title="Remove program">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    // Add delete trigger
    div.querySelector('[data-action="remove"]').addEventListener('click', () => {
      toggleFavorite(favId);
    });

    elShortlistContainer.appendChild(div);
  });
}

// 7. Toast Alerts
function showToast(message) {
  elToastNotification.textContent = message;
  elToastNotification.classList.add('show');
  
  setTimeout(() => {
    elToastNotification.classList.remove('show');
  }, 2500);
}

// 8. Export CSV
function exportToCSV() {
  if (favorites.length === 0) {
    showToast('Add programs to shortlist first');
    return;
  }

  const selectedPrograms = favorites.map(id => programs.find(p => p.id === id)).filter(p => p !== undefined);
  
  // Define CSV headers
  const headers = ['Program ID', 'Country', 'Course Title', 'University', 'Degree Type', 'City/Location', 'Duration', 'Study Mode', 'Tuition Fee', 'Semester Start', 'Deadlines', 'Details Link'];
  
  // Generate CSV Rows
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const prog of selectedPrograms) {
    const deadlinesStr = (prog.deadlines || []).join(' | ');
    const values = [
      prog.id,
      prog.country || '',
      prog.title,
      prog.university,
      prog.degree,
      prog.location,
      prog.duration,
      prog.studyMode,
      prog.tuitionFee || 'Free / Low Tuition',
      prog.semesterStart || 'Autumn / Spring',
      deadlinesStr,
      prog.link
    ];
    
    // Clean string cell values (escape quotes and handle commas)
    const cleanedValues = values.map(val => {
      let cell = val === null || val === undefined ? '' : String(val);
      cell = cell.replace(/"/g, '""'); // Escape inner double quotes
      if (cell.search(/("|,|\n)/g) >= 0) {
        cell = `"${cell}"`; // Wrap in double quotes if commas or quotes exist
      }
      return cell;
    });

    csvRows.push(cleanedValues.join(','));
  }

  // Create Blob & Trigger Download
  const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel UTF-8 handling
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `european_english_programs_shortlist_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('Shortlist exported to CSV!');
}

// 9. Copy Summary to Clipboard
function copyToClipboard() {
  if (favorites.length === 0) {
    showToast('Add programs to shortlist first');
    return;
  }

  const selectedPrograms = favorites.map(id => programs.find(p => p.id === id)).filter(p => p !== undefined);
  
  let text = `### Shortlisted English-Taught Programs in Europe (${selectedPrograms.length})\n\n`;
  
  selectedPrograms.forEach((prog, index) => {
    const deadlines = (prog.deadlines && prog.deadlines.length > 0) ? prog.deadlines.join(', ') : 'Check website';
    text += `${index + 1}. **${prog.title}** - ${prog.university}\n`;
    text += `   - **Country**: ${prog.country || 'Europe'} | **Degree**: ${prog.degree} | **City**: ${prog.location} | **Duration**: ${prog.duration}\n`;
    text += `   - **Tuition Fee**: ${prog.tuitionFee || 'Free / Low Tuition'} | **Start**: ${prog.semesterStart || 'Autumn / Spring'}\n`;
    text += `   - **Study Mode**: ${prog.studyMode}\n`;
    text += `   - **Deadlines**: ${deadlines}\n`;
    text += `   - **More details**: ${prog.link}\n\n`;
  });

  navigator.clipboard.writeText(text)
    .then(() => {
      showToast('Summary copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
      showToast('Failed to copy. Try again.');
    });
}
