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

// Chart instances
let chartFee = null;
let chartDegree = null;
let chartCountry = null;
let chartStudyMode = null;

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

// Phase 6 Filters & Panel Tabs Elements
const elDurationFilters = document.getElementById('duration-filters');
const elStartFilters = document.getElementById('start-filters');
const elTabBtnExplore = document.getElementById('tab-btn-explore');
const elTabBtnAnalytics = document.getElementById('tab-btn-analytics');
const elExplorePanel = document.getElementById('explore-panel');
const elAnalyticsPanel = document.getElementById('analytics-panel');

// Drawer DOM Elements
const elDrawerOverlay = document.getElementById('drawer-overlay');
const elShortlistDrawer = document.getElementById('shortlist-drawer');
const elBtnBookmarkDrawerToggle = document.getElementById('btn-bookmark-drawer-toggle');
const elBtnCloseDrawer = document.getElementById('btn-close-drawer');
const elShortlistContainer = document.getElementById('shortlist-container');
const elShortlistCount = document.getElementById('shortlist-count');
const elBtnComparePrograms = document.getElementById('btn-compare-programs');
const elBtnExportCSV = document.getElementById('btn-export-csv');
const elBtnCopyClipboard = document.getElementById('btn-copy-clipboard');
const elBtnClearFavorites = document.getElementById('btn-clear-favorites');
const elToastNotification = document.getElementById('toast-notification');

// Comparison Modal Elements
const elComparisonModal = document.getElementById('comparison-modal');
const elComparisonModalOverlay = document.getElementById('comparison-modal-overlay');
const elBtnCloseComparisonModal = document.getElementById('btn-close-comparison-modal');
const elComparisonTableWrapper = document.getElementById('comparison-table-wrapper');

// Stats DOM Elements
const elStatTotalPrograms = document.getElementById('stat-total-programs');
const elStatTotalUniversities = document.getElementById('stat-total-universities');
const elStatTotalLocations = document.getElementById('stat-total-locations');
const elStatTotalCountries = document.getElementById('stat-total-countries');

// Convert raw duration text to standard category
function getDurationCategory(durationStr) {
  if (!durationStr || durationStr.toLowerCase() === 'unknown' || durationStr.toLowerCase().includes('varies')) {
    return 'varies';
  }
  const str = durationStr.toLowerCase().trim();
  
  // Try to match standard time units
  const match = str.match(/(\d+(?:\.\d+)?)\s*(semester|month|year|trimester|wk|week)/i);
  if (!match) {
    const numMatch = str.match(/(\d+(?:\.\d+)?)/);
    if (!numMatch) return 'varies';
    const num = parseFloat(numMatch[1]);
    if (str.includes('year') || str.includes('yr')) {
      return num <= 1.0 ? 'short' : (num <= 1.5 ? 'medium' : (num <= 2.0 ? 'long' : 'very-long'));
    }
    if (str.includes('semester') || str.includes('sem')) {
      return num <= 2 ? 'short' : (num <= 3 ? 'medium' : (num <= 4 ? 'long' : 'very-long'));
    }
    if (str.includes('month') || str.includes('mo')) {
      return num <= 12 ? 'short' : (num <= 18 ? 'medium' : (num <= 24 ? 'long' : 'very-long'));
    }
    return 'varies';
  }
  
  const num = parseFloat(match[1]);
  const unit = match[2];
  
  let months = 0;
  if (unit.startsWith('month')) {
    months = num;
  } else if (unit.startsWith('semester')) {
    months = num * 6;
  } else if (unit.startsWith('year')) {
    months = num * 12;
  } else if (unit.startsWith('trimester')) {
    months = num * 4;
  } else if (unit.startsWith('week') || unit.startsWith('wk')) {
    months = num / 4.33;
  } else {
    months = num;
  }
  
  if (months <= 12) return 'short';
  if (months <= 18) return 'medium';
  if (months <= 24) return 'long';
  return 'very-long';
}

// Convert raw semester start text to an array of standard categories (winter, summer, rolling)
function getSemesterStartCategory(startStr) {
  if (!startStr) return ['rolling'];
  const str = startStr.toLowerCase();
  
  const hasWinter = str.includes('winter') || str.includes('october') || str.includes('november') || str.includes('september') || str.includes('autumn') || str.includes('fall') || str.includes('sept') || str.includes('oct') || str.includes('nov');
  const hasSummer = str.includes('summer') || str.includes('april') || str.includes('march') || str.includes('may') || str.includes('spring') || str.includes('apr') || str.includes('mar');
  
  if (str.includes('rolling') || str.includes('anytime') || str.includes('enquire') || str.includes('flexible')) {
    return ['rolling'];
  }
  
  const categories = [];
  if (hasWinter) categories.push('winter');
  if (hasSummer) categories.push('summer');
  
  if (categories.length === 0) {
    categories.push('rolling');
  }
  return categories;
}

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
      inflated.durationCategory = getDurationCategory(inflated.duration);
      inflated.startCategories = getSemesterStartCategory(inflated.semesterStart);
      return inflated;
    });
  }
  return data.map(p => {
    if (!p.feeCategory) {
      const feeRange = parseFeeToEurRange(p.tuitionFee || '', p.country || '');
      p.feeCategory = getFeeCategory(feeRange);
    }
    if (!p.durationCategory) {
      p.durationCategory = getDurationCategory(p.duration);
    }
    if (!p.startCategories) {
      p.startCategories = getSemesterStartCategory(p.semesterStart);
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
  [elCountryFilters, elDegreeFilters, elLocationFilters, elStudyModeFilters, elFeeFilters, elDurationFilters, elStartFilters].forEach(container => {
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

  // Tab switching event listeners
  elTabBtnExplore.addEventListener('click', () => {
    elTabBtnExplore.classList.add('active');
    elTabBtnAnalytics.classList.remove('active');
    elExplorePanel.classList.add('active');
    elAnalyticsPanel.classList.remove('active');
    elExplorePanel.style.display = 'block';
    elAnalyticsPanel.style.display = 'none';
  });

  elTabBtnAnalytics.addEventListener('click', () => {
    elTabBtnAnalytics.classList.add('active');
    elTabBtnExplore.classList.remove('active');
    elAnalyticsPanel.classList.add('active');
    elExplorePanel.classList.remove('active');
    elAnalyticsPanel.style.display = 'block';
    elExplorePanel.style.display = 'none';
    updateCharts();
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

  // Mobile Sidebar toggle
  const elSidebar = document.getElementById('sidebar-filters');
  const elMobileFilterToggle = document.getElementById('btn-mobile-filter-toggle');
  const elBtnCloseSidebar = document.getElementById('btn-close-sidebar');
  const elMobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');

  const openMobileSidebar = () => {
    elSidebar.classList.add('mobile-open');
    elMobileSidebarOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeMobileSidebar = () => {
    elSidebar.classList.remove('mobile-open');
    elMobileSidebarOverlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  elMobileFilterToggle.addEventListener('click', openMobileSidebar);
  elBtnCloseSidebar.addEventListener('click', closeMobileSidebar);
  elMobileSidebarOverlay.addEventListener('click', closeMobileSidebar);

  // Compare Selected Button
  elBtnComparePrograms.addEventListener('click', () => {
    if (favorites.length === 0) {
      showToast('Add programs to shortlist first');
      return;
    }
    renderComparisonTable();
    elComparisonModal.style.display = 'flex';
    elComparisonModalOverlay.style.display = 'block';
    setTimeout(() => {
      elComparisonModal.classList.add('open');
      elComparisonModalOverlay.classList.add('open');
    }, 10);
  });

  const closeComparisonModal = () => {
    elComparisonModal.classList.remove('open');
    elComparisonModalOverlay.classList.remove('open');
    setTimeout(() => {
      elComparisonModal.style.display = 'none';
      elComparisonModalOverlay.style.display = 'none';
    }, 300);
  };

  elBtnCloseComparisonModal.addEventListener('click', closeComparisonModal);
  elComparisonModalOverlay.addEventListener('click', closeComparisonModal);

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

  // iCal / Calendar export for whole shortlist
  const elBtnExportIcal = document.getElementById('btn-export-ical');
  if (elBtnExportIcal) {
    elBtnExportIcal.addEventListener('click', downloadShortlistICS);
  }
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
  const selectedDurations = Array.from(elDurationFilters.querySelectorAll('input:checked')).map(cb => cb.value);
  const selectedStarts = Array.from(elStartFilters.querySelectorAll('input:checked')).map(cb => cb.value);

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

    // Duration match (OR within group)
    const durationMatch = selectedDurations.length === 0 || selectedDurations.includes(prog.durationCategory);

    // Semester Start match (OR within group - match any of the start categories)
    const startMatch = selectedStarts.length === 0 || 
      (prog.startCategories && prog.startCategories.some(cat => selectedStarts.includes(cat)));

    return searchMatch && countryMatch && degreeMatch && locationMatch && studyModeMatch && universityMatch && feeMatch && durationMatch && startMatch;
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
  
  // If visual insights panel is currently active, update charts immediately
  if (elAnalyticsPanel && elAnalyticsPanel.classList.contains('active')) {
    updateCharts();
  }

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
        ${prog.deadlines && prog.deadlines.length > 0 ? `
        <button class="btn btn-secondary btn-cal" data-action="cal" title="Add deadline to calendar">
          <i class="fa-regular fa-calendar-plus"></i>
        </button>` : ''}
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

    // Add event listener to calendar button (if exists)
    const btnCal = card.querySelector('[data-action="cal"]');
    if (btnCal) {
      btnCal.addEventListener('click', (e) => {
        e.preventDefault();
        downloadICS(prog);
      });
    }

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

// 10. Visual Analytics / Insights Chart Redrawing
function updateAnalyticsMetrics() {
  const matchingPrograms = filteredPrograms.length;
  const unis = new Set(filteredPrograms.map(p => p.university));
  const cities = new Set(filteredPrograms.map(p => p.location));
  const countries = new Set(filteredPrograms.map(p => p.country).filter(Boolean));

  document.getElementById('metric-programs').textContent = matchingPrograms.toLocaleString();
  document.getElementById('metric-unis').textContent = unis.size.toLocaleString();
  document.getElementById('metric-cities').textContent = cities.size.toLocaleString();
  document.getElementById('metric-countries').textContent = countries.size.toLocaleString();
}

function updateCharts() {
  updateAnalyticsMetrics();

  // 1. Tuition Fee Distribution
  const feeCounts = {
    'free-low': 0,
    'moderate': 0,
    'medium': 0,
    'high': 0,
    'varies': 0
  };
  
  // 2. Degree Distribution
  const degreeCounts = {
    'Bachelor': 0,
    'Master': 0,
    'PhD': 0,
    'Certificate': 0
  };
  
  // 3. Country Distribution
  const countryCounts = {};
  
  // 4. Study Mode Distribution
  const studyModeCounts = {
    'In-Person': 0,
    'Hybrid': 0,
    'Online': 0
  };

  filteredPrograms.forEach(p => {
    // Fee
    if (feeCounts[p.feeCategory] !== undefined) {
      feeCounts[p.feeCategory]++;
    } else {
      feeCounts['varies']++;
    }
    
    // Degree
    if (degreeCounts[p.degree] !== undefined) {
      degreeCounts[p.degree]++;
    }
    
    // Country
    if (p.country) {
      countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
    }
    
    // Study Mode
    if (studyModeCounts[p.studyMode] !== undefined) {
      studyModeCounts[p.studyMode]++;
    }
  });

  // Setup common chart options
  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: '#3b82f6',
        borderWidth: 1
      }
    }
  };

  // --- 1. Fee Chart (Doughnut) ---
  if (chartFee) chartFee.destroy();
  const ctxFee = document.getElementById('chart-fee').getContext('2d');
  chartFee = new Chart(ctxFee, {
    type: 'doughnut',
    data: {
      labels: ['Free / Low (<€1k)', 'Moderate (€1k-€5k)', 'Medium (€5k-€15k)', 'High (>€15k)', 'Varies / Unknown'],
      datasets: [{
        data: [
          feeCounts['free-low'],
          feeCounts['moderate'],
          feeCounts['medium'],
          feeCounts['high'],
          feeCounts['varies']
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#64748b'],
        borderWidth: 1,
        borderColor: '#151e2e'
      }]
    },
    options: baseChartOptions
  });

  // --- 2. Degree Chart (Doughnut) ---
  if (chartDegree) chartDegree.destroy();
  const ctxDegree = document.getElementById('chart-degree').getContext('2d');
  chartDegree = new Chart(ctxDegree, {
    type: 'doughnut',
    data: {
      labels: ['Bachelor', 'Master', 'PhD', 'Certificate'],
      datasets: [{
        data: [
          degreeCounts['Bachelor'],
          degreeCounts['Master'],
          degreeCounts['PhD'],
          degreeCounts['Certificate']
        ],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'],
        borderWidth: 1,
        borderColor: '#151e2e'
      }]
    },
    options: baseChartOptions
  });

  // --- 3. Country Chart (Horizontal Bar) ---
  const sortedCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
    
  if (chartCountry) chartCountry.destroy();
  const ctxCountry = document.getElementById('chart-country').getContext('2d');
  chartCountry = new Chart(ctxCountry, {
    type: 'bar',
    data: {
      labels: sortedCountries.map(x => x[0]),
      datasets: [{
        label: 'Programs',
        data: sortedCountries.map(x => x[1]),
        backgroundColor: 'rgba(59, 130, 246, 0.75)',
        borderColor: '#3b82f6',
        borderWidth: 1
      }]
    },
    options: {
      ...baseChartOptions,
      indexAxis: 'y',
      plugins: {
        ...baseChartOptions.plugins,
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: '#26354a' },
          ticks: { color: '#94a3b8', font: { family: 'Inter' } }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { family: 'Inter' } }
        }
      }
    }
  });

  // --- 4. Study Mode Chart (Bar) ---
  if (chartStudyMode) chartStudyMode.destroy();
  const ctxStudyMode = document.getElementById('chart-study-mode').getContext('2d');
  chartStudyMode = new Chart(ctxStudyMode, {
    type: 'bar',
    data: {
      labels: ['In-Person', 'Hybrid', 'Online'],
      datasets: [{
        label: 'Programs',
        data: [
          studyModeCounts['In-Person'],
          studyModeCounts['Hybrid'],
          studyModeCounts['Online']
        ],
        backgroundColor: ['rgba(59, 130, 246, 0.75)', 'rgba(245, 158, 11, 0.75)', 'rgba(16, 185, 129, 0.75)'],
        borderColor: ['#3b82f6', '#f59e0b', '#10b981'],
        borderWidth: 1
      }]
    },
    options: baseChartOptions
  });
}

// 11. Shortlist Comparison Table Rendering
function renderComparisonTable() {
  if (favorites.length === 0) {
    elComparisonTableWrapper.innerHTML = `
      <div class="empty-shortlist">
        <i class="fa-solid fa-scale-balanced star-placeholder"></i>
        <p>No programs selected to compare</p>
        <span>Add programs to your shortlist first.</span>
      </div>
    `;
    return;
  }

  const comparedPrograms = favorites.map(id => programs.find(p => p.id === id)).filter(Boolean);

  let html = `<table class="comparison-table">`;
  
  // Table Head
  html += `<thead><tr><th class="empty-corner">Property</th>`;
  comparedPrograms.forEach(p => {
    html += `
      <th>
        <div class="compare-title-cell">
          <h4 title="${p.title}">${p.title.length > 50 ? p.title.slice(0, 47) + '...' : p.title}</h4>
          <span>${p.university}</span>
          <button class="compare-remove-btn" data-remove-id="${p.id}"><i class="fa-solid fa-trash-can"></i> Remove</button>
        </div>
      </th>
    `;
  });
  html += `</tr></thead>`;

  // Table Body
  const properties = [
    { label: 'Country', key: 'country' },
    { label: 'Degree Type', key: 'degree' },
    { label: 'City/Location', key: 'location' },
    { label: 'Duration', key: 'duration' },
    { label: 'Tuition Fee', key: 'tuitionFee' },
    { label: 'Study Mode', key: 'studyMode' },
    { label: 'Semester Start', key: 'semesterStart' },
    {
      label: 'Deadlines',
      fn: p => p.deadlines && p.deadlines.length > 0 
        ? `<ul style="list-style:none;padding:0;margin:0;font-size:0.8rem;">${p.deadlines.map(d => `<li><i class="fa-regular fa-clock text-warning"></i> ${d}</li>`).join('')}</ul>` 
        : 'Check website'
    },
    {
      label: 'Details Link',
      fn: p => `<a href="${p.link}" target="_blank" class="btn btn-secondary btn-sm" style="padding:0.4rem 0.75rem;font-size:0.8rem;">Apply <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
    }
  ];

  html += `<tbody>`;
  properties.forEach(prop => {
    html += `<tr><td class="property-label">${prop.label}</td>`;
    comparedPrograms.forEach(p => {
      let val = '';
      if (prop.fn) {
        val = prop.fn(p);
      } else {
        val = p[prop.key] || 'Varies / Unknown';
      }
      html += `<td>${val}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;

  elComparisonTableWrapper.innerHTML = html;

  // Add click handlers for remove buttons
  elComparisonTableWrapper.querySelectorAll('.compare-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-remove-id');
      toggleFavorite(id);
      renderComparisonTable();
    });
  });
}

// ============================================================
// 12. iCal Deadline Export
// ============================================================

/**
 * Try to parse a deadline string like "15 October 2025", "Oct 15, 2025",
 * "2025-10-15" etc. into a YYYYMMDD string for iCal DTSTART/DTEND.
 * Falls back to today + 30 days if unparseable.
 */
function parseDateToICS(dateStr) {
  if (!dateStr) return null;

  // Already ISO: 2025-10-15
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`;
  }

  // Common English formats: "15 October 2025" or "October 15, 2025" or "Oct 15, 2025"
  const MONTHS = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };

  const parts = dateStr.replace(',', '').toLowerCase().split(/\s+/);
  let year, month, day;

  for (const part of parts) {
    if (MONTHS[part]) month = MONTHS[part];
    else if (/^\d{4}$/.test(part)) year = part;
    else if (/^\d{1,2}$/.test(part)) day = part.padStart(2, '0');
  }

  if (year && month && day) return `${year}${month}${day}`;

  // Fallback: today + 30 days
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);
  return fallback.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Build a VCALENDAR string with one VEVENT per deadline for the program.
 */
function generateICSContent(prog) {
  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const uid = `edubridge-${prog.id}-${Date.now()}`;

  const deadlines = prog.deadlines && prog.deadlines.length > 0
    ? prog.deadlines
    : ['Application Deadline'];

  const events = deadlines.map((dl, idx) => {
    const dtstart = parseDateToICS(dl) || parseDateToICS('');
    // End = same day (all-day event)
    const dtend = dtstart;

    // Escape special chars for iCal
    const safeDl = dl.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
    const safeTitle = prog.title.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
    const safeUni = prog.university.replace(/[\\;,]/g, (c) => `\\${c}`);

    return [
      'BEGIN:VEVENT',
      `UID:${uid}-${idx}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:📅 ${safeTitle} – ${safeUni} Deadline`,
      `DESCRIPTION:Program: ${safeTitle}\\nUniversity: ${safeUni}\\nCountry: ${prog.country}\\nDeadline: ${safeDl}\\nLink: ${prog.link}`,
      `URL:${prog.link}`,
      `CATEGORIES:EDUCATION,DEADLINE`,
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduBridge Europe//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    events,
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Trigger browser download of a .ics file for the given program.
 */
function downloadICS(prog) {
  const content = generateICSContent(prog);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `edubridge_deadline_${prog.id}.ics`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Calendar event downloaded!');
}

/**
 * Export ALL shortlisted programs as a single .ics multi-event file.
 */
function downloadShortlistICS() {
  if (favorites.length === 0) {
    showToast('Add programs to shortlist first');
    return;
  }

  const selectedPrograms = favorites.map(id => programs.find(p => p.id === id)).filter(Boolean);
  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const allEvents = selectedPrograms.flatMap(prog => {
    const deadlines = prog.deadlines && prog.deadlines.length > 0
      ? prog.deadlines : ['Application Deadline'];

    return deadlines.map((dl, idx) => {
      const dtstart = parseDateToICS(dl);
      const safeDl = dl.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
      const safeTitle = prog.title.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
      const safeUni = prog.university.replace(/[\\;,]/g, (c) => `\\${c}`);

      return [
        'BEGIN:VEVENT',
        `UID:edubridge-${prog.id}-${idx}-${Date.now()}`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${dtstart}`,
        `DTEND;VALUE=DATE:${dtstart}`,
        `SUMMARY:📅 ${safeTitle} Deadline`,
        `DESCRIPTION:University: ${safeUni}\\nCountry: ${prog.country}\\nDeadline: ${safeDl}\\nLink: ${prog.link}`,
        `URL:${prog.link}`,
        'CATEGORIES:EDUCATION,DEADLINE',
        'END:VEVENT'
      ].join('\r\n');
    });
  }).join('\r\n');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduBridge Europe//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    allEvents,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `edubridge_all_deadlines_${new Date().toISOString().slice(0,10)}.ics`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('All deadlines exported to calendar!');
}

