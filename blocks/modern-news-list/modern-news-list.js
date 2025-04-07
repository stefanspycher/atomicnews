import { createTag } from '../../scripts/scripts.js';

const NUM_CARDS_SHOWN_AT_A_TIME = 6;
let loadMoreElement;

/**
 * Fetches and transforms data from news articles JSON file
 * @returns {Promise<Array>} - A promise resolving to the transformed data array
 */
async function loadNewsArticles() {
  try {
    const resp = await fetch(`${window.hlx.codeBasePath}/news/query-index.json`);
    if (!resp.ok) throw new Error(`Failed to fetch news index: ${resp.status}`);
    
    const json = await resp.json();
    const articles = json.data;
    
    // Extract metadata for filters
    const teams = new Set();
    const authors = new Set();
    const months = new Set();
    const tags = new Set();
    
    // Process articles and extract metadata
    articles.forEach(article => {
      if (article.team) teams.add(article.team);
      if (article.author) authors.add(article.author);
      if (article.tags) {
        const articleTags = Array.isArray(article.tags) 
          ? article.tags 
          : article.tags.split(',').map(tag => tag.trim());
        articleTags.forEach(tag => tags.add(tag));
      }
      
      if (article.publishdate) {
        try {
          const date = new Date(article.publishdate);
          if (!isNaN(date.getTime())) {
            const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
            months.add(monthYear);
          }
        } catch (e) {
          console.error(`Error parsing date: ${article.publishdate}`, e);
        }
      }
    });
    
    // Sort months chronologically (most recent first)
    const sortedMonths = Array.from(months).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB - dateA;
    });
    
    return {
      articles,
      metadata: {
        teams: Array.from(teams).sort(),
        authors: Array.from(authors).sort(),
        tags: Array.from(tags).sort(),
        months: sortedMonths
      }
    };
  } catch (error) {
    console.error('Error loading news articles:', error);
    return { articles: [], metadata: { teams: [], authors: [], tags: [], months: [] }};
  }
}

/**
 * Creates a multi-select filter dropdown
 * @param {string} id - Filter ID
 * @param {string} label - Filter label
 * @param {Array} options - Filter options
 * @returns {Element} The filter container
 */
function createFilterDropdown(id, label, options) {
  const filterContainer = createTag('div', { class: 'filter-dropdown-container' });
  
  const filterLabel = createTag('label', { for: id, class: 'filter-label' });
  filterLabel.textContent = label;
  filterContainer.appendChild(filterLabel);
  
  const dropdown = createTag('div', { 
    id,
    class: 'filter-dropdown',
    role: 'combobox',
    'aria-expanded': 'false'
  });
  
  const selectedDisplay = createTag('div', { class: 'selected-display' });
  const placeholder = createTag('span', { class: 'placeholder' });
  placeholder.textContent = `All ${label}`;
  selectedDisplay.appendChild(placeholder);
  
  const chevron = createTag('div', { class: 'dropdown-chevron' });
  chevron.innerHTML = '<i class="fa fa-chevron-down" aria-hidden="true"></i>';
  
  dropdown.appendChild(selectedDisplay);
  dropdown.appendChild(chevron);
  
  const dropdownMenu = createTag('div', { class: 'dropdown-menu' });
  
  // Create "All" option
  const allOption = createTag('div', { 
    class: 'dropdown-option select-all',
    'data-value': '*'
  });
  
  const allCheckbox = createTag('input', { 
    type: 'checkbox',
    checked: true
  });
  
  const allLabel = createTag('span', {});
  allLabel.textContent = `All ${label}`;
  
  allOption.appendChild(allCheckbox);
  allOption.appendChild(allLabel);
  dropdownMenu.appendChild(allOption);
  
  // Create options
  options.forEach(option => {
    const optionElement = createTag('div', { 
      class: 'dropdown-option',
      'data-value': option
    });
    
    const checkbox = createTag('input', { 
      type: 'checkbox'
    });
    
    const optionLabel = createTag('span', {});
    optionLabel.textContent = option;
    
    optionElement.appendChild(checkbox);
    optionElement.appendChild(optionLabel);
    dropdownMenu.appendChild(optionElement);
  });
  
  dropdown.appendChild(dropdownMenu);
  filterContainer.appendChild(dropdown);
  
  // Store selected values
  dropdown.selectedValues = [];
  
  return filterContainer;
}

/**
 * Sets up the filter dropdown event listeners
 * @param {Element} dropdown - The dropdown element
 * @param {Function} onFilterChange - Callback when filter changes
 */
function setupFilterEvents(dropdown, onFilterChange) {
  const dropdownMenu = dropdown.querySelector('.dropdown-menu');
  const selectedDisplay = dropdown.querySelector('.selected-display');
  const placeholder = dropdown.querySelector('.placeholder');
  const options = dropdown.querySelectorAll('.dropdown-option:not(.select-all)');
  const selectAll = dropdown.querySelector('.dropdown-option.select-all');
  const selectAllCheckbox = selectAll?.querySelector('input[type="checkbox"]');
  
  // Toggle dropdown on click
  dropdown.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-option')) {
      const expanded = dropdown.getAttribute('aria-expanded') === 'true';
      dropdown.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Select all option
  if (selectAll) {
    selectAll.addEventListener('click', () => {
      const newChecked = !selectAllCheckbox.checked;
      selectAllCheckbox.checked = newChecked;
      
      options.forEach(option => {
        option.querySelector('input').checked = false;
      });
      
      if (newChecked) {
        dropdown.selectedValues = [];
        updateSelectedDisplay();
      }
      
      onFilterChange();
    });
  }
  
  // Individual options
  options.forEach(option => {
    const checkbox = option.querySelector('input');
    const value = option.dataset.value;
    
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      checkbox.checked = !checkbox.checked;
      
      if (checkbox.checked) {
        selectAllCheckbox.checked = false;
        if (!dropdown.selectedValues.includes(value)) {
          dropdown.selectedValues.push(value);
        }
      } else {
        dropdown.selectedValues = dropdown.selectedValues.filter(v => v !== value);
        if (dropdown.selectedValues.length === 0) {
          selectAllCheckbox.checked = true;
        }
      }
      
      updateSelectedDisplay();
      onFilterChange();
    });
  });
  
  // Update selected display
  function updateSelectedDisplay() {
    selectedDisplay.querySelectorAll('.selected-tag').forEach(tag => tag.remove());
    
    if (dropdown.selectedValues.length === 0) {
      placeholder.style.display = '';
    } else {
      placeholder.style.display = 'none';
      
      dropdown.selectedValues.forEach(value => {
        const tag = createTag('span', { class: 'selected-tag' });
        
        const tagText = createTag('span', { class: 'tag-text' });
        tagText.textContent = value;
        
        const removeBtn = createTag('span', { class: 'remove-tag' });
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Find and uncheck the corresponding option
          const option = Array.from(options).find(opt => opt.dataset.value === value);
          if (option) {
            option.querySelector('input').checked = false;
          }
          
          dropdown.selectedValues = dropdown.selectedValues.filter(v => v !== value);
          
          if (dropdown.selectedValues.length === 0) {
            selectAllCheckbox.checked = true;
          }
          
          updateSelectedDisplay();
          onFilterChange();
        });
        
        tag.appendChild(tagText);
        tag.appendChild(removeBtn);
        selectedDisplay.appendChild(tag);
      });
    }
  }
}

/**
 * Creates a checkbox filter
 * @param {string} id - Filter ID
 * @param {string} label - Filter label
 * @returns {Element} The checkbox container
 */
function createCheckboxFilter(id, label) {
  const container = createTag('div', { class: 'checkbox-filter' });
  
  const checkbox = createTag('input', {
    type: 'checkbox',
    id
  });
  
  const checkboxLabel = createTag('label', { for: id });
  checkboxLabel.textContent = label;
  
  container.appendChild(checkbox);
  container.appendChild(checkboxLabel);
  
  return container;
}

/**
 * Creates filter section
 * @param {Object} newsData - News data and metadata
 * @param {Function} onFilterChange - Callback when filters change
 * @returns {Element} The filter container
 */
function createFilters(newsData, onFilterChange) {
  const filterSection = createTag('div', { class: 'filter-section' });
  
  const filtersGrid = createTag('div', { class: 'filters-grid' });
  
  // Team filter
  const teamFilter = createFilterDropdown('teamFilter', 'Team', newsData.metadata.teams);
  filtersGrid.appendChild(teamFilter);
  
  // Author filter
  const authorFilter = createFilterDropdown('authorFilter', 'Author', newsData.metadata.authors);
  filtersGrid.appendChild(authorFilter);
  
  // Date filter
  const dateFilter = createFilterDropdown('dateFilter', 'Date', newsData.metadata.months);
  filtersGrid.appendChild(dateFilter);
  
  // Uplevel filter
  const uplevelFilter = createCheckboxFilter('uplevelFilter', 'Show Only Uplevel Content');
  filtersGrid.appendChild(uplevelFilter);
  
  filterSection.appendChild(filtersGrid);
  
  // Clear filters button
  const clearFiltersContainer = createTag('div', { class: 'clear-filters-container' });
  const clearFiltersBtn = createTag('button', { class: 'clear-filters-btn' });
  clearFiltersBtn.textContent = 'Clear All Filters';
  clearFiltersContainer.appendChild(clearFiltersBtn);
  filterSection.appendChild(clearFiltersContainer);
  
  // Setup filter events
  setupFilterEvents(teamFilter.querySelector('.filter-dropdown'), onFilterChange);
  setupFilterEvents(authorFilter.querySelector('.filter-dropdown'), onFilterChange);
  setupFilterEvents(dateFilter.querySelector('.filter-dropdown'), onFilterChange);
  
  uplevelFilter.querySelector('input').addEventListener('change', onFilterChange);
  
  clearFiltersBtn.addEventListener('click', () => {
    // Reset team filter
    const teamDropdown = teamFilter.querySelector('.filter-dropdown');
    teamDropdown.selectedValues = [];
    teamDropdown.querySelector('.select-all input').checked = true;
    teamDropdown.querySelectorAll('.dropdown-option:not(.select-all) input').forEach(input => {
      input.checked = false;
    });
    teamDropdown.querySelector('.selected-display').innerHTML = '';
    teamDropdown.querySelector('.selected-display').appendChild(
      teamDropdown.querySelector('.placeholder').cloneNode(true)
    );
    
    // Reset author filter
    const authorDropdown = authorFilter.querySelector('.filter-dropdown');
    authorDropdown.selectedValues = [];
    authorDropdown.querySelector('.select-all input').checked = true;
    authorDropdown.querySelectorAll('.dropdown-option:not(.select-all) input').forEach(input => {
      input.checked = false;
    });
    authorDropdown.querySelector('.selected-display').innerHTML = '';
    authorDropdown.querySelector('.selected-display').appendChild(
      authorDropdown.querySelector('.placeholder').cloneNode(true)
    );
    
    // Reset date filter
    const dateDropdown = dateFilter.querySelector('.filter-dropdown');
    dateDropdown.selectedValues = [];
    dateDropdown.querySelector('.select-all input').checked = true;
    dateDropdown.querySelectorAll('.dropdown-option:not(.select-all) input').forEach(input => {
      input.checked = false;
    });
    dateDropdown.querySelector('.selected-display').innerHTML = '';
    dateDropdown.querySelector('.selected-display').appendChild(
      dateDropdown.querySelector('.placeholder').cloneNode(true)
    );
    
    // Reset uplevel filter
    uplevelFilter.querySelector('input').checked = false;
    
    onFilterChange();
  });
  
  return filterSection;
}

/**
 * Creates the layout toggle buttons
 * @param {Object} handlers - Event handlers for each view type
 * @returns {Element} The toggle container
 */
function createLayoutToggle(handlers) {
  const toggleContainer = createTag('div', { class: 'layout-toggle' });
  
  const gridButton = createTag('button', { class: 'grid-view-btn active' });
  gridButton.innerHTML = '<i class="fa fa-th-large"></i> Cards';
  
  const listButton = createTag('button', { class: 'list-view-btn' });
  listButton.innerHTML = '<i class="fa fa-list"></i> List';
  
  const newsletterButton = createTag('button', { class: 'newsletter-view-btn' });
  newsletterButton.innerHTML = '<i class="fa fa-newspaper"></i> Newsletter';
  
  gridButton.addEventListener('click', () => {
    gridButton.classList.add('active');
    listButton.classList.remove('active');
    newsletterButton.classList.remove('active');
    handlers.onGridView();
  });
  
  listButton.addEventListener('click', () => {
    gridButton.classList.remove('active');
    listButton.classList.add('active');
    newsletterButton.classList.remove('active');
    handlers.onListView();
  });
  
  newsletterButton.addEventListener('click', () => {
    gridButton.classList.remove('active');
    listButton.classList.remove('active');
    newsletterButton.classList.add('active');
    handlers.onNewsletterView();
  });
  
  toggleContainer.appendChild(gridButton);
  toggleContainer.appendChild(listButton);
  toggleContainer.appendChild(newsletterButton);
  
  return toggleContainer;
}

/**
 * Creates an article card for grid view
 * @param {Object} article - Article data
 * @returns {Element} The article card
 */
function createArticleCard(article) {
  const card = createTag('div', { 
    class: 'article-card',
    'data-team': article.team || '',
    'data-author': article.author || '',
    'data-uplevel': article.uplevel === 'true' ? 'true' : 'false',
    'data-path': article.path
  });
  
  // Format publish date
  let formattedDate = '';
  if (article.publishdate) {
    try {
      const date = new Date(article.publishdate);
      formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      formattedDate = article.publishdate;
    }
  }
  
  // Image handling
  const imageUrl = article.image && article.image !== '0'
    ? article.image.startsWith('/') 
      ? `${window.hlx.codeBasePath}${article.image}` 
      : `/${window.hlx.codeBasePath}${article.image}`
    : '/styles/default-images/default-card-image-1.png';
  
  // Extract preview from description or content
  const preview = article.description || 'No description available';
  
  card.innerHTML = `
    <div class="card-image">
      <img src="${imageUrl}" alt="${article.title || 'News article'}">
    </div>
    <div class="card-content">
      <h3 class="card-title">${article.title || 'Untitled Article'}</h3>
      <p class="card-meta">
        ${article.author ? `By ${article.author}` : ''}
        ${article.author && formattedDate ? ' | ' : ''}
        ${formattedDate}
      </p>
      <p class="card-preview">${preview}</p>
      <div class="card-tags">
        ${article.team ? `<span class="card-tag card-team">${article.team}</span>` : ''}
        ${article.uplevel === 'true' ? '<span class="card-tag card-uplevel">Uplevel</span>' : ''}
      </div>
      <button class="read-more-btn">Read More →</button>
    </div>
  `;
  
  // Make card clickable
  card.addEventListener('click', (e) => {
    if (!e.target.classList.contains('read-more-btn')) {
      window.location.href = article.path;
    }
  });
  
  card.querySelector('.read-more-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = article.path;
  });
  
  return card;
}

/**
 * Creates an article element for list view
 * @param {Object} article - Article data
 * @returns {Element} The article element
 */
function createArticleListItem(article) {
  const listItem = createTag('article', { 
    class: 'article-list-item',
    'data-team': article.team || '',
    'data-author': article.author || '',
    'data-uplevel': article.uplevel === 'true' ? 'true' : 'false',
    'data-path': article.path
  });
  
  // Format publish date
  let formattedDate = '';
  if (article.publishdate) {
    try {
      const date = new Date(article.publishdate);
      formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      formattedDate = article.publishdate;
    }
  }
  
  // Image handling
  const imageUrl = article.image && article.image !== '0'
    ? article.image.startsWith('/') 
      ? `${window.hlx.codeBasePath}${article.image}` 
      : `/${window.hlx.codeBasePath}${article.image}`
    : '/styles/default-images/default-card-image-1.png';
  
  // Extract preview from description or content
  const preview = article.description || 'No description available';
  
  listItem.innerHTML = `
    <div class="list-item-content">
      <header class="list-item-header">
        <h3 class="list-item-title">${article.title || 'Untitled Article'}</h3>
        <div class="list-item-meta">
          ${article.author ? `<span>By ${article.author}</span>` : ''}
          ${article.author ? '<span class="meta-divider">•</span>' : ''}
          ${formattedDate ? `<span>${formattedDate}</span>` : ''}
          ${formattedDate ? '<span class="meta-divider">•</span>' : ''}
          <span>${article.team || ''}</span>
          ${article.uplevel === 'true' ? '<span class="meta-divider">•</span><span class="list-item-uplevel">Uplevel</span>' : ''}
        </div>
      </header>
      
      <div class="list-item-body">
        <div class="list-item-image">
          <img src="${imageUrl}" alt="${article.title || 'News article'}">
        </div>
        <div class="list-item-text">
          <p>${preview}</p>
          <button class="read-more-btn">Read More →</button>
        </div>
      </div>
    </div>
  `;
  
  // Make list item clickable
  listItem.addEventListener('click', (e) => {
    if (!e.target.classList.contains('read-more-btn')) {
      window.location.href = article.path;
    }
  });
  
  listItem.querySelector('.read-more-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = article.path;
  });
  
  return listItem;
}

/**
 * Creates a newsletter article section
 * @param {Object} article - Article data
 * @returns {Element} The newsletter article
 */
function createNewsletterArticle(article) {
  const newsletterArticle = createTag('div', { class: 'newsletter-article' });
  
  // Format publish date
  let formattedDate = '';
  if (article.publishdate) {
    try {
      const date = new Date(article.publishdate);
      formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      formattedDate = article.publishdate;
    }
  }
  
  // Image handling
  const imageUrl = article.image && article.image !== '0'
    ? article.image.startsWith('/') 
      ? `${window.hlx.codeBasePath}${article.image}` 
      : `/${window.hlx.codeBasePath}${article.image}`
    : '/styles/default-images/default-card-image-1.png';
  
  // Extract preview from description or content
  const preview = article.description || 'No description available';
  
  newsletterArticle.innerHTML = `
    <h3 class="newsletter-article-title">${article.title || 'Untitled Article'}</h3>
    <p class="newsletter-article-meta">
      ${article.author ? `By ${article.author}` : ''}
      ${article.author && formattedDate ? ' | ' : ''}
      ${formattedDate}
      ${(article.author || formattedDate) && article.team ? ' | ' : ''}
      ${article.team || ''}
    </p>
    <div class="newsletter-article-content">
      <div class="newsletter-article-image">
        <img src="${imageUrl}" alt="${article.title || 'News article'}">
      </div>
      <div class="newsletter-article-text">
        <p>${preview}</p>
      </div>
    </div>
  `;
  
  return newsletterArticle;
}

/**
 * Create view container for different layouts
 * @returns {Object} Object containing view containers
 */
function createViewContainers() {
  const containers = {};
  
  containers.grid = createTag('div', { id: 'gridView', class: 'grid-view' });
  containers.list = createTag('div', { id: 'listView', class: 'list-view hidden' });
  containers.newsletter = createTag('div', { id: 'newsletterView', class: 'newsletter-view hidden' });
  
  // Create newsletter sections
  const newsletterHeader = createTag('div', { class: 'newsletter-header' });
  newsletterHeader.innerHTML = `
    <h1>Weekly Newsletter</h1>
    <p>Your curated news digest</p>
  `;
  containers.newsletter.appendChild(newsletterHeader);
  
  // Create sections
  const sections = [
    { id: 'section1', title: 'Section 1: Featured News' },
    { id: 'section2', title: 'Section 2: Team Updates' },
    { id: 'section3', title: 'Section 3: Industry Insights' },
    { id: 'section4', title: 'Section 4: Professional Development' }
  ];
  
  sections.forEach(section => {
    const sectionElement = createTag('section', { 
      id: section.id,
      class: 'newsletter-section'
    });
    
    const sectionHeader = createTag('h2', { class: 'newsletter-section-title' });
    sectionHeader.textContent = section.title;
    
    const sectionContent = createTag('div', { class: 'newsletter-section-content' });
    
    sectionElement.appendChild(sectionHeader);
    sectionElement.appendChild(sectionContent);
    
    containers.newsletter.appendChild(sectionElement);
  });
  
  // Create "Load More" button
  loadMoreElement = createTag('button', { class: 'load-more-btn' });
  loadMoreElement.textContent = 'Load More';
  loadMoreElement.addEventListener('click', loadMoreCards);
  
  return containers;
}

/**
 * Load more cards
 */
function loadMoreCards() {
  const hiddenCards = document.querySelectorAll('.article-card[data-visible="false"]');
  
  if (hiddenCards.length > 0) {
    const cardsToShow = Math.min(hiddenCards.length, NUM_CARDS_SHOWN_AT_A_TIME);
    
    for (let i = 0; i < cardsToShow; i++) {
      hiddenCards[i].setAttribute('data-visible', 'true');
    }
    
    updateLoadMoreButton(hiddenCards.length - cardsToShow);
  }
}

/**
 * Update the Load More button
 * @param {number} remainingCards - Number of cards still hidden
 */
function updateLoadMoreButton(remainingCards) {
  if (remainingCards > 0) {
    loadMoreElement.textContent = `Load More (${remainingCards})`;
    loadMoreElement.style.display = 'block';
  } else {
    loadMoreElement.style.display = 'none';
  }
}

/**
 * Apply filters to articles
 * @param {Array} articles - Array of all articles
 * @param {Object} filterState - Current filter state
 * @returns {Array} Filtered articles
 */
function applyFilters(articles, filterState) {
  return articles.filter(article => {
    // Team filter
    if (filterState.teams.length > 0 && !filterState.teams.includes(article.team)) {
      return false;
    }
    
    // Author filter
    if (filterState.authors.length > 0 && !filterState.authors.includes(article.author)) {
      return false;
    }
    
    // Date filter - check if the month+year from publishdate matches any selected month
    if (filterState.dates.length > 0 && article.publishdate) {
      try {
        const date = new Date(article.publishdate);
        if (!isNaN(date.getTime())) {
          const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
          if (!filterState.dates.includes(monthYear)) {
            return false;
          }
        } else {
          return false;
        }
      } catch (e) {
        return false;
      }
    }
    
    // Uplevel filter
    if (filterState.uplevelOnly && article.uplevel !== 'true') {
      return false;
    }
    
    return true;
  });
}

/**
 * Render grid view
 * @param {Array} articles - Articles to render
 */
function renderGridView(articles) {
  const gridView = document.getElementById('gridView');
  gridView.innerHTML = '';
  
  if (articles.length === 0) {
    const noResults = createTag('div', { class: 'no-results' });
    noResults.innerHTML = '<h3>No matching articles found</h3><p>Try adjusting your filter criteria</p>';
    gridView.appendChild(noResults);
    loadMoreElement.style.display = 'none';
    return;
  }
  
  // Create and append cards
  articles.forEach((article, index) => {
    const card = createArticleCard(article);
    
    // Set visibility for initial load
    if (index < NUM_CARDS_SHOWN_AT_A_TIME) {
      card.setAttribute('data-visible', 'true');
    } else {
      card.setAttribute('data-visible', 'false');
    }
    
    gridView.appendChild(card);
  });
  
  // Update load more button
  const hiddenCards = articles.length - Math.min(articles.length, NUM_CARDS_SHOWN_AT_A_TIME);
  updateLoadMoreButton(hiddenCards);
}

/**
 * Render list view
 * @param {Array} articles - Articles to render
 */
function renderListView(articles) {
  const listView = document.getElementById('listView');
  listView.innerHTML = '';
  
  if (articles.length === 0) {
    const noResults = createTag('div', { class: 'no-results' });
    noResults.innerHTML = '<h3>No matching articles found</h3><p>Try adjusting your filter criteria</p>';
    listView.appendChild(noResults);
    return;
  }
  
  // Create and append list items
  articles.forEach(article => {
    const listItem = createArticleListItem(article);
    listView.appendChild(listItem);
  });
}

/**
 * Render newsletter view
 * @param {Array} articles - Articles to render
 */
function renderNewsletterView(articles) {
  // Clear previous newsletter content
  document.querySelectorAll('.newsletter-section-content').forEach(section => {
    section.innerHTML = '';
  });
  
  if (articles.length === 0) {
    const noResults = createTag('div', { class: 'no-results' });
    noResults.innerHTML = '<h3>No matching articles found</h3><p>Try adjusting your filter criteria</p>';
    document.querySelector('#section1 .newsletter-section-content').appendChild(noResults);
    return;
  }
  
  // Assign articles to sections based on index (for demo purposes)
  // In a real implementation, you might have a specific field to determine section
  const articlesBySections = [
    articles.slice(0, Math.ceil(articles.length * 0.25)),
    articles.slice(Math.ceil(articles.length * 0.25), Math.ceil(articles.length * 0.5)),
    articles.slice(Math.ceil(articles.length * 0.5), Math.ceil(articles.length * 0.75)),
    articles.slice(Math.ceil(articles.length * 0.75))
  ];
  
  // Render each section
  articlesBySections.forEach((sectionArticles, index) => {
    const sectionId = `section${index + 1}`;
    const sectionContent = document.querySelector(`#${sectionId} .newsletter-section-content`);
    
    if (sectionArticles.length === 0) {
      const noResults = createTag('div', { class: 'no-section-results' });
      noResults.textContent = 'No articles in this section match your filter criteria.';
      sectionContent.appendChild(noResults);
      return;
    }
    
    sectionArticles.forEach(article => {
      const newsletterArticle = createNewsletterArticle(article);
      sectionContent.appendChild(newsletterArticle);
    });
  });
}