import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Fetches all news articles from the content directory
 */
async function fetchNewsArticles() {
  try {
    // Get the index of news articles
    const resp = await fetch('/news.json');
    if (!resp.ok) {
      console.log('News index not available. Make sure you have news articles in your Google Drive /news folder.');
      return [];
    }
    
    const json = await resp.json();
    
    // Process each news article
    const articles = await Promise.all(json.data.map(async (item) => {
      try {
        // Get the full news article content
        const articleResp = await fetch(`${item.path}.json`);
        if (!articleResp.ok) return null;
        
        const article = await articleResp.json();
        
        // Extract metadata from the article
        const metadata = {};
        
        // Find the metadata table
        let metadataTable = null;
        if (article.data) {
          for (const section of article.data) {
            if (section.type === 'table') {
              metadataTable = section;
              break;
            }
          }
        }
        
        if (metadataTable && metadataTable.data) {
          metadataTable.data.forEach(row => {
            if (row.length >= 2) {
              const key = row[0].trim();
              const value = row[1].trim();
              
              if (key === 'PublishDate') {
                metadata.publishDate = new Date(value);
              } else if (key === 'Tags') {
                metadata.tags = value.split(',').map(tag => tag.trim());
              } else if (key === 'Uplevel') {
                metadata.uplevel = value.toLowerCase() === 'yes';
              } else {
                metadata[key.toLowerCase()] = value;
              }
            }
          });
        }
        
        // Get the article title and images
        const title = article.title || item.title;
        const images = article.images || [];
        
        return {
          title,
          path: item.path,
          publishDate: metadata.publishDate,
          author: metadata.author,
          team: metadata.team,
          uplevel: metadata.uplevel,
          tags: metadata.tags,
          thumbnail: images.length > 0 ? images[0] : null
        };
      } catch (error) {
        console.error(`Error processing article ${item.path}:`, error);
        return null;
      }
    }));
    
    // Filter out null values (failed fetches)
    return articles.filter(Boolean);
  } catch (error) {
    console.error('Error fetching news articles:', error);
    return [];
  }
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
  if (earliest) {
    startDate.min = earliest.toISOString().split('T')[0];
    startDate.max = latest.toISOString().split('T')[0];
  }
  
  // Create end date input
  const endLabel = document.createElement('label');
  endLabel.textContent = 'To: ';
  const endDate = document.createElement('input');
  endDate.type = 'date';
  endDate.id = 'filter-end-date';
  if (latest) {
    endDate.min = earliest.toISOString().split('T')[0];
    endDate.max = latest.toISOString().split('T')[0];
    endDate.value = latest.toISOString().split('T')[0];
  }
  
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
    if (filters.startDate && article.publishDate && new Date(article.publishDate) < filters.startDate) {
      return false;
    }
    if (filters.endDate && article.publishDate && new Date(article.publishDate) > filters.endDate) {
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
  let formattedDate = 'No date';
  if (article.publishDate) {
    const date = new Date(article.publishDate);
    formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
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
  // Fetch news articles in real-time
  const articles = await fetchNewsArticles();
  
  // If no articles are available, show a message
  if (articles.length === 0) {
    const noArticles = document.createElement('div');
    noArticles.className = 'no-articles';
    noArticles.innerHTML = `
      <h3>No News Articles Available</h3>
      <p>There are currently no news articles to display. News articles placed in the Google Drive 'news' folder will appear here automatically.</p>
    `;
    block.appendChild(noArticles);
    return;
  }
  
  // Extract unique tags and teams
  const tags = {};
  const teams = {};
  let earliest = null;
  let latest = null;
  
  articles.forEach(article => {
    // Process tags
    if (article.tags) {
      article.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    }
    
    // Process teams
    if (article.team) {
      teams[article.team] = (teams[article.team] || 0) + 1;
    }
    
    // Process dates
    if (article.publishDate) {
      const date = new Date(article.publishDate);
      if (!earliest || date < earliest) earliest = date;
      if (!latest || date > latest) latest = date;
    }
  });
  
  // Create filter container
  const filterContainer = document.createElement('div');
  filterContainer.className = 'news-filters';
  
  // Create individual filters
  const dateInputs = earliest && latest ? 
    createDateFilter(earliest, latest, filterContainer) : 
    { startDate: null, endDate: null };
    
  const tagSelect = Object.keys(tags).length > 0 ?
    createTagFilter(tags, filterContainer) :
    null;
    
  const teamSelect = Object.keys(teams).length > 0 ?
    createTeamFilter(teams, filterContainer) :
    null;
    
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
    endDate: latest || null,
    team: '',
    tags: [],
    uplevelOnly: false
  };
  
  function applyFilters() {
    // Update current filters
    currentFilters = {
      startDate: dateInputs.startDate && dateInputs.startDate.value ? 
        new Date(dateInputs.startDate.value) : null,
      endDate: dateInputs.endDate && dateInputs.endDate.value ? 
        new Date(dateInputs.endDate.value) : null,
      team: teamSelect ? teamSelect.value : '',
      tags: tagSelect ? 
        Array.from(tagSelect.selectedOptions).map(option => option.value).filter(Boolean) : 
        [],
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
      filteredArticles.sort((a, b) => {
        if (!a.publishDate) return 1;
        if (!b.publishDate) return -1;
        return new Date(b.publishDate) - new Date(a.publishDate);
      });
      
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