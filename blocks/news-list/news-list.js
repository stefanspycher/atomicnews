export default async function decorate(block) {
  // Create layout toggle
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'layout-toggle';
  
  const gridButton = document.createElement('button');
  gridButton.className = 'grid-view-btn active';
  gridButton.innerHTML = '<span>Grid View</span>';
  
  const listButton = document.createElement('button');
  listButton.className = 'list-view-btn';
  listButton.innerHTML = '<span>List View</span>';
  
  toggleContainer.appendChild(gridButton);
  toggleContainer.appendChild(listButton);
  
  // Create container for news articles
  const newsContainer = document.createElement('div');
  newsContainer.className = 'news-container grid-view';
  
  // Add event listeners for the toggle buttons
  gridButton.addEventListener('click', () => {
    newsContainer.className = 'news-container grid-view';
    gridButton.className = 'grid-view-btn active';
    listButton.className = 'list-view-btn';
  });
  
  listButton.addEventListener('click', () => {
    newsContainer.className = 'news-container list-view';
    listButton.className = 'list-view-btn active';
    gridButton.className = 'grid-view-btn';
  });
  
  // Create container for filters
  const filtersContainer = document.createElement('div');
  filtersContainer.className = 'news-filters';
  
  // Create "All" filter button - create this outside the fetch so we can reference it in applyFilters
  const allFilter = document.createElement('button');
  allFilter.className = 'filter-btn all-filter active';
  allFilter.textContent = 'All';
  filtersContainer.appendChild(allFilter);
  
  try {
    // Get the paths of all news articles
    const resp = await fetch(`${window.hlx.codeBasePath}/news/query-index.json`);
    if (!resp.ok) throw new Error(`Failed to fetch news index: ${resp.status}`);
    
    const json = await resp.json();
    const newsArticles = json.data;
    
    if (!newsArticles || newsArticles.length === 0) {
      newsContainer.innerHTML = '<p>No news articles found.</p>';
    } else {
      // Store rendered articles to avoid re-fetching content
      const renderedArticles = new Map();
      
      // Extract unique teams and tags for filters
      const teams = new Set();
      const tags = new Set();
      const months = new Set();
      
      newsArticles.forEach(article => {
        if (article.team) teams.add(article.team);
        
        if (article.tags) {
          let articleTags = [];
          try {
            articleTags = JSON.parse(article.tags);
          } catch (e) {
            articleTags = article.tags.split(',').map(tag => tag.trim());
          }
          articleTags.forEach(tag => tags.add(tag));
        }
        
        // Use publishdate for the date filter
        if (article.publishdate) {
          try {
            // Try to parse the date string
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
      
      // Create team filter
      let teamFilter = null;
      if (teams.size > 0) {
        teamFilter = document.createElement('select');
        teamFilter.className = 'filter-select team-filter';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Team: Any';
        defaultOption.selected = true;
        teamFilter.appendChild(defaultOption);
        
        Array.from(teams).sort().forEach(team => {
          const option = document.createElement('option');
          option.value = team;
          option.textContent = team;
          teamFilter.appendChild(option);
        });
        
        filtersContainer.appendChild(teamFilter);
      }
      
      // Create tag filter
      let tagFilter = null;
      if (tags.size > 0) {
        tagFilter = document.createElement('select');
        tagFilter.className = 'filter-select tag-filter';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Tag: Any';
        defaultOption.selected = true;
        tagFilter.appendChild(defaultOption);
        
        Array.from(tags).sort().forEach(tag => {
          const option = document.createElement('option');
          option.value = tag;
          option.textContent = tag;
          tagFilter.appendChild(option);
        });
        
        filtersContainer.appendChild(tagFilter);
      }
      
      // Create date filter
      let dateFilter = null;
      if (months.size > 0) {
        dateFilter = document.createElement('select');
        dateFilter.className = 'filter-select date-filter';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Date: Any';
        defaultOption.selected = true;
        dateFilter.appendChild(defaultOption);
        
        // Sort months chronologically
        const sortedMonths = Array.from(months).sort((a, b) => {
          const dateA = new Date(a);
          const dateB = new Date(b);
          return dateB - dateA; // Most recent first
        });
        
        sortedMonths.forEach(month => {
          const option = document.createElement('option');
          option.value = month;
          option.textContent = month;
          dateFilter.appendChild(option);
        });
        
        filtersContainer.appendChild(dateFilter);
      }
      
      // Function to apply filters
      function applyFilters() {
        const selectedTeam = teamFilter ? teamFilter.value : '';
        const selectedTag = tagFilter ? tagFilter.value : '';
        const selectedDate = dateFilter ? dateFilter.value : '';
        const showAll = allFilter.classList.contains('active');
        
        let visibleCount = 0;
        
        // Clear the news container
        newsContainer.innerHTML = '';
        
        // Filter and display articles
        for (const article of newsArticles) {
          // If "All" is selected, show all articles
          if (showAll) {
            renderArticle(article);
            visibleCount++;
            continue;
          }
          
          // Check team filter
          const teamMatch = !selectedTeam || article.team === selectedTeam;
          
          // Check tag filter
          let tagMatch = !selectedTag;
          if (selectedTag && article.tags) {
            let articleTags = [];
            try {
              articleTags = JSON.parse(article.tags);
            } catch (e) {
              articleTags = article.tags.split(',').map(tag => tag.trim());
            }
            tagMatch = articleTags.includes(selectedTag);
          }
          
          // Check date filter using publishdate
          let dateMatch = !selectedDate;
          if (selectedDate && article.publishdate) {
            try {
              const date = new Date(article.publishdate);
              if (!isNaN(date.getTime())) {
                const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
                dateMatch = monthYear === selectedDate;
              }
            } catch (e) {
              console.error(`Error comparing dates for article ${article.path}`, e);
            }
          }
          
          // Only show article if it matches all selected filters
          if (teamMatch && tagMatch && dateMatch) {
            renderArticle(article);
            visibleCount++;
          }
        }
        
        // Show message if no articles match filters
        if (visibleCount === 0) {
          const noResults = document.createElement('div');
          noResults.className = 'no-results';
          noResults.innerHTML = '<h3>No matching articles found</h3><p>Try adjusting your filters to see more results.</p>';
          newsContainer.appendChild(noResults);
        }
      }
      
      // Function to render an article
      function renderArticle(article) {
        // Check if we already rendered this article
        if (renderedArticles.has(article.path)) {
          const cachedArticle = renderedArticles.get(article.path).cloneNode(true);
          newsContainer.appendChild(cachedArticle);
          return;
        }
        
        const articleElement = document.createElement('div');
        articleElement.className = 'news-article';
        articleElement.dataset.path = article.path;
        
        // Create article image if available
        if (article.image && article.image !== '') {
          const imagePath = article.image.startsWith('/') 
            ? `${window.hlx.codeBasePath}${article.image}` 
            : `/${window.hlx.codeBasePath}${article.image}`;
            
          const imageElement = document.createElement('div');
          imageElement.className = 'article-image';
          imageElement.innerHTML = `<img src="${imagePath}" alt="${article.title || 'News image'}">`;
          articleElement.appendChild(imageElement);
        }
        
        // Create container for article content
        const contentElement = document.createElement('div');
        contentElement.className = 'article-content';
        
        // Add title and basic metadata immediately
        const titleElement = document.createElement('h2');
        titleElement.className = 'article-title';
        titleElement.textContent = article.title || 'Untitled Article';
        contentElement.appendChild(titleElement);
        
        // Add metadata display
        const metadataDisplay = document.createElement('div');
        metadataDisplay.className = 'article-meta-display';
        
        // Create metadata content
        let metadataHTML = '';
        
        // Author and team
        if (article.author || article.team) {
          metadataHTML += `<span class="meta-author-team">${article.author || ''}${article.author && article.team ? ' / ' : ''}${article.team || ''}</span>`;
        }
        
        // Publish date
        if (article.publishdate) {
          metadataHTML += `<span class="meta-date">${article.publishdate}</span>`;
        }
        
        // Tags
        if (article.tags) {
          let tags = [];
          try {
            tags = JSON.parse(article.tags);
          } catch (e) {
            tags = article.tags.split(',').map(tag => tag.trim());
          }
          
          if (tags.length > 0) {
            metadataHTML += '<span class="meta-tags">';
            tags.forEach(tag => {
              metadataHTML += `<span class="meta-tag-pill">${tag}</span>`;
            });
            metadataHTML += '</span>';
          }
        }
        
        metadataDisplay.innerHTML = metadataHTML;
        contentElement.appendChild(metadataDisplay);
        
        // Create placeholder for article text
        const textElement = document.createElement('div');
        textElement.className = 'article-text';
        textElement.innerHTML = '<p>Loading content...</p>';
        contentElement.appendChild(textElement);
        
        // Append content to article
        articleElement.appendChild(contentElement);
        
        // Make article clickable
        articleElement.addEventListener('click', () => {
          window.location.href = article.path;
        });
        
        // Add article to container now so user sees something
        newsContainer.appendChild(articleElement);
        
        // Start loading the full content
        fetch(`${article.path}.plain.html`)
          .then(response => {
            if (response.ok) return response.text();
            throw new Error('Failed to load article content');
          })
          .then(html => {
            // Create a temporary element to parse the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Remove h1 title (we've already added the title)
            const h1 = tempDiv.querySelector('h1');
            if (h1) h1.remove();
            
            // Remove metadata table if it exists
            const table = tempDiv.querySelector('table');
            if (table) table.remove();
            
            // Replace placeholder with actual content
            textElement.innerHTML = tempDiv.innerHTML;
            
            // Store the rendered article for future use
            renderedArticles.set(article.path, articleElement.cloneNode(true));
          })
          .catch(error => {
            console.error(`Error loading content for ${article.path}:`, error);
            textElement.innerHTML = '<p>Unable to load article content.</p>';
          });
      }
      
      // Add event listeners for filters
      allFilter.addEventListener('click', () => {
        // Toggle active state
        if (!allFilter.classList.contains('active')) {
          allFilter.classList.add('active');
          
          // Reset other filters
          if (teamFilter) teamFilter.value = '';
          if (tagFilter) tagFilter.value = '';
          if (dateFilter) dateFilter.value = '';
          
          applyFilters();
        }
      });
      
      // Event listeners for select filters
      [teamFilter, tagFilter, dateFilter].forEach(filter => {
        if (filter) {
          filter.addEventListener('change', () => {
            // If any filter is selected, deactivate "All" filter
            if (filter.value) {
              allFilter.classList.remove('active');
            } else {
              // Check if all filters are empty, if so activate "All"
              const hasActiveFilter = [teamFilter, tagFilter, dateFilter]
                .filter(f => f !== null)
                .some(f => f.value !== '');
                
              if (!hasActiveFilter) {
                allFilter.classList.add('active');
              }
            }
            
            // Apply filters immediately on change
            applyFilters();
          });
        }
      });
      
      // Initial application of filters - show all by default
      applyFilters();
    }
  } catch (error) {
    console.error('Error loading news articles:', error);
    newsContainer.innerHTML = `<p>Error loading news articles: ${error.message}</p>`;
  }
  
  // Get the news collection title if it exists (h2 in the block)
  const newsTitle = block.querySelector('h2, h1');
  
  // Clear the original block content, but keep the title if it exists
  const titleToKeep = newsTitle ? newsTitle.cloneNode(true) : null;
  block.textContent = '';
  
  // Add elements back in the correct order
  if (titleToKeep) {
    block.appendChild(titleToKeep);
  }
  
  // Add filters right after the title
  block.appendChild(filtersContainer);
  
  // Add layout toggle and news container
  block.appendChild(toggleContainer);
  block.appendChild(newsContainer);
}