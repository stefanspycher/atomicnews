import { createOptimizedPicture } from '../../scripts/aem.js';

async function fetchNewsIndex() {
  const response = await fetch('/news-index.json');
  return response.json();
}

function createDateFilter(earliest, latest, container) {
  const dateFilter = document.createElement('div');
  dateFilter.className = 'date-filter';
  
  // Create start date input
  const startLabel = document.createElement('label');
  startLabel.textContent = 'From: ';
  const startDate = document.createElement('input');
  startDate.type = 'date';
  startDate.id = 'filter-start-date';
  startDate.min = earliest.toISOString().split('T')[0];
  startDate.max = latest.toISOString().split('T')[0];
  
  // Create end date input
  const endLabel = document.createElement('label');
  endLabel.textContent = 'To: ';
  const endDate = document.createElement('input');
  endDate.type = 'date';
  endDate.id = 'filter-end-date';
  endDate.min = earliest.toISOString().split('T')[0];
  endDate.max = latest.toISOString().split('T')[0];
  endDate.value = latest.toISOString().split('T')[0];
  
  dateFilter.appendChild(startLabel);
  dateFilter.appendChild(startDate);
  dateFilter.appendChild(endLabel);
  dateFilter.appendChild(endDate);
  
  container.appendChild(dateFilter);
  
  return { startDate, endDate };
}

function createTagFilter(tags, container) {
  const tagFilter = document.createElement('div');
  tagFilter.className = 'tag-filter';
  
  const label = document.createElement('label');
  label.textContent = 'Tags: ';
  tagFilter.appendChild(label);
  
  const select = document.createElement('select');
  select.id = 'filter-tags';
  select.multiple = true;
  
  // Add "All Tags" option
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All Tags';
  select.appendChild(allOption);
  
  // Add options for each tag
  Object.keys(tags).sort().forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = `${tag} (${tags[tag]})`;
    select.appendChild(option);
  });
  
  tagFilter.appendChild(select);
  container.appendChild(tagFilter);
  
  return select;
}

function createTeamFilter(teams, container) {
  const teamFilter = document.createElement('div');
  teamFilter.className = 'team-filter';
  
  const label = document.createElement('label');
  label.textContent = 'Team: ';
  teamFilter.appendChild(label);
  
  const select = document.createElement('select');
  select.id = 'filter-team';
  
  // Add "All Teams" option
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All Teams';
  select.appendChild(allOption);
  
  // Add options for each team
  Object.keys(teams).sort().forEach(team => {
    const option = document.createElement('option');
    option.value = team;
    option.textContent = team;
    select.appendChild(option);
  });
  
  teamFilter.appendChild(select);
  container.appendChild(teamFilter);
  
  return select;
}

function createUplevelFilter(container) {
  const uplevelFilter = document.createElement('div');
  uplevelFilter.className = 'uplevel-filter';
  
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'filter-uplevel';
  
  const label = document.createElement('label');
  label.htmlFor = 'filter-uplevel';
  label.textContent = 'Leadership updates only';
  
  uplevelFilter.appendChild(checkbox);
  uplevelFilter.appendChild(label);
  container.appendChild(uplevelFilter);
  
  return checkbox;
}

function filterArticles(articles, filters) {
  return articles.filter(article => {
    // Filter by date range
    if (filters.startDate && new Date(article.publishDate) < filters.startDate) {
      return false;
    }
    if (filters.endDate && new Date(article.publishDate) > filters.endDate) {
      return false;
    }
    
    // Filter by team
    if (filters.team && article.team !== filters.team) {
      return false;
    }
    
    // Filter by tags (any match)
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = filters.tags.some(tag => 
        article.tags && article.tags.includes(tag)
      );
      if (!hasTag) return false;
    }
    
    // Filter by uplevel
    if (filters.uplevelOnly && !article.uplevel) {
      return false;
    }
    
    return true;
  });
}

function renderNewsCard(article) {
  const card = document.createElement('div');
  card.className = 'news-card';
  
  // Add thumbnail
  if (article.thumbnail) {
    const picture = createOptimizedPicture(article.thumbnail, article.title, false);
    card.appendChild(picture);
  }
  
  // Add content
  const content = document.createElement('div');
  content.className = 'news-card-content';
  
  const title = document.createElement('h3');
  title.textContent = article.title;
  content.appendChild(title);
  
  const metadata = document.createElement('div');
  metadata.className = 'news-metadata';
  
  // Format date
  const date = new Date(article.publishDate);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  metadata.innerHTML = `
    <span class="news-date">${formattedDate}</span>
    <span class="news-author">By: ${article.author || 'Unknown'}</span>
    ${article.team ? `<span class="news-team">${article.team}</span>` : ''}
  `;
  
  content.appendChild(metadata);
  
  // Add tags
  if (article.tags && article.tags.length > 0) {
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'news-tags';
    
    article.tags.forEach(tag => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'news-tag';
      tagSpan.textContent = tag;
      tagsContainer.appendChild(tagSpan);
    });
    
    content.appendChild(tagsContainer);
  }
  
  card.appendChild(content);
  
  // Make the entire card clickable
  card.addEventListener('click', () => {
    window.location.href = article.path;
  });
  
  return card;
}

export default async function decorate(block) {
  // Fetch news index
  const newsIndex = await fetchNewsIndex();
  const { articles, tags, teams, dateRange } = newsIndex;
  
  // Create filter container
  const filterContainer = document.createElement('div');
  filterContainer.className = 'news-filters';
  
  // Create individual filters
  const dateInputs = createDateFilter(
    new Date(dateRange.earliest), 
    new Date(dateRange.latest),
    filterContainer
  );
  const tagSelect = createTagFilter(tags, filterContainer);
  const teamSelect = createTeamFilter(teams, filterContainer);
  const uplevelCheckbox = createUplevelFilter(filterContainer);
  
  // Add filter button
  const filterButton = document.createElement('button');
  filterButton.textContent = 'Apply Filters';
  filterButton.className = 'filter-button';
  filterContainer.appendChild(filterButton);
  
  // Create news container
  const newsContainer = document.createElement('div');
  newsContainer.className = 'news-container';
  
  // Initial rendering with no filters
  let currentFilters = {
    startDate: null,
    endDate: new Date(dateRange.latest),
    team: '',
    tags: [],
    uplevelOnly: false
  };
  
  function applyFilters() {
    // Update current filters
    currentFilters = {
      startDate: dateInputs.startDate.value ? new Date(dateInputs.startDate.value) : null,
      endDate: dateInputs.endDate.value ? new Date(dateInputs.endDate.value) : null,
      team: teamSelect.value,
      tags: Array.from(tagSelect.selectedOptions).map(option => option.value).filter(Boolean),
      uplevelOnly: uplevelCheckbox.checked
    };
    
    // Clear container
    newsContainer.innerHTML = '';
    
    // Apply filters and render
    const filteredArticles = filterArticles(articles, currentFilters);
    
    if (filteredArticles.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = 'No news articles match your filters.';
      newsContainer.appendChild(noResults);
    } else {
      // Sort by publish date (newest first)
      filteredArticles.sort((a, b) => 
        new Date(b.publishDate) - new Date(a.publishDate)
      );
      
      filteredArticles.forEach(article => {
        newsContainer.appendChild(renderNewsCard(article));
      });
    }
  }
  
  // Add event listener to filter button
  filterButton.addEventListener('click', applyFilters);
  
  // Initial render
  applyFilters();
  
  // Append everything to the block
  block.appendChild(filterContainer);
  block.appendChild(newsContainer);
}