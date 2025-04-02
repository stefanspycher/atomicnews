import { createElement, formatMonthYear, createNoResultsMessage } from '../utils/dom-utils.js';
import { createNewsletterArticle } from '../components/article-renderer.js';

// Newsletter section definitions
const NEWSLETTER_SECTIONS = [
  { id: 'intro', title: 'Introduction', sectionValue: 'introduction' },
  { id: 'customer-focus', title: 'Customer Focus', sectionValue: 'customer-focus' },
  { id: 'highlights', title: 'Highlights', sectionValue: 'highlight', groupBy: 'team' },
  { id: 'events', title: 'Events', sectionValue: 'events' }
];

/**
 * Applies filters to articles for display, same as other views
 * @param {Array} articles - All articles
 * @param {Object} filterState - Current filter state
 * @returns {Array} Filtered articles
 */
function applyFilters(articles, filterState) {
  if (filterState.showAll) return articles;
  
  return articles.filter(article => {
    // Check team filter
    const teamMatch = !filterState.team || article.team === filterState.team;
    
    // Check tag filter
    let tagMatch = !filterState.tag;
    if (filterState.tag && article.tags) {
      let articleTags = [];
      try {
        articleTags = JSON.parse(article.tags);
      } catch (e) {
        articleTags = article.tags.split(',').map(tag => tag.trim());
      }
      tagMatch = articleTags.includes(filterState.tag);
    }
    
    // Check date filter using publishdate
    let dateMatch = !filterState.date;
    if (filterState.date && article.publishdate) {
      try {
        const date = new Date(article.publishdate);
        if (!isNaN(date.getTime())) {
          const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
          dateMatch = monthYear === filterState.date;
        }
      } catch (e) {
        console.error(`Error comparing dates for article ${article.path}`, e);
      }
    }
    
    // Only show article if it matches all selected filters
    return teamMatch && tagMatch && dateMatch;
  });
}

/**
 * Creates the newsletter structure
 * @param {Element} container - The container element
 */
function createNewsletterStructure(container) {
  // Clear existing content
  container.innerHTML = '';
  
  // Build newsletter container structure
  NEWSLETTER_SECTIONS.forEach(section => {
    const sectionEl = createElement('div', { 
      className: `newsletter-section ${section.id}`,
      id: section.id
    });
    
    const titleEl = createElement('h2', {}, section.title);
    sectionEl.appendChild(titleEl);
    
    const contentEl = createElement('div', { className: 'section-content' });
    sectionEl.appendChild(contentEl);
    
    container.appendChild(sectionEl);
  });
}

/**
 * Renders articles for a specific newsletter section
 * @param {Element} sectionContainer - Section container element
 * @param {Array} articles - Articles for this section 
 * @param {Object} sectionConfig - Section configuration
 */
async function renderNewsletterSection(sectionContainer, articles, sectionConfig) {
  // Clear the section
  sectionContainer.innerHTML = '';
  
  if (articles.length === 0) {
    sectionContainer.innerHTML = '<p>No articles found for this section.</p>';
    return;
  }
  
  // If groupBy is specified, organize articles by that property
  if (sectionConfig.groupBy) {
    // Group articles by the specified property
    const groupedArticles = {};
    articles.forEach(article => {
      const groupValue = article[sectionConfig.groupBy] || 'Other';
      if (!groupedArticles[groupValue]) {
        groupedArticles[groupValue] = [];
      }
      groupedArticles[groupValue].push(article);
    });
    
    // Create groups
    for (const [groupName, groupArticles] of Object.entries(groupedArticles)) {
      const groupEl = createElement('div', { className: 'newsletter-group' });
      
      const groupTitleEl = createElement('h3', {}, groupName);
      groupEl.appendChild(groupTitleEl);
      
      const groupContentEl = createElement('div', { className: 'group-content' });
      
      for (const article of groupArticles) {
        try {
          const articleEl = await createNewsletterArticle(article);
          groupContentEl.appendChild(articleEl);
        } catch (error) {
          console.error(`Error rendering article ${article.path}:`, error);
          groupContentEl.appendChild(createElement('p', { className: 'error' }, 
            `Error rendering article: ${article.title || 'Unknown article'}`));
        }
      }
      
      groupEl.appendChild(groupContentEl);
      sectionContainer.appendChild(groupEl);
    }
  } else {
    // No grouping needed, just add articles
    for (const article of articles) {
      try {
        const articleEl = await createNewsletterArticle(article);
        sectionContainer.appendChild(articleEl);
      } catch (error) {
        console.error(`Error rendering article ${article.path}:`, error);
        sectionContainer.appendChild(createElement('p', { className: 'error' }, 
          `Error rendering article: ${article.title || 'Unknown article'}`));
      }
    }
  }
}

/**
 * Renders the newsletter view
 * @param {Element} container - Newsletter container
 * @param {Object} newsData - News data including articles and metadata
 * @param {Object} filters - Filter controls
 */
export async function renderNewsletterView(container, newsData, filters) {
  // Create newsletter structure
  createNewsletterStructure(container);
  
  // Set up filter change handler
  filters.setOnChange(async (filterState) => {
    await renderNewsletterView(container, newsData, filters);
  });
  
  // Apply the same filters as other views
  const filteredArticles = applyFilters(newsData.articles, filters.state);
  
  if (filteredArticles.length === 0) {
    container.querySelector(`#${NEWSLETTER_SECTIONS[0].id} .section-content`)
      .appendChild(createNoResultsMessage());
    return;
  }
  
  // Add a diagnostic display for debugging
  const diagnosticInfo = document.createElement('div');
  diagnosticInfo.className = 'newsletter-diagnostic';
  diagnosticInfo.style.display = 'none'; // Hidden by default
  diagnosticInfo.innerHTML = `
    <h3>Diagnostic Information (click to toggle)</h3>
    <div class="diagnostic-content" style="display:none;">
      <p>Total articles after filtering: ${filteredArticles.length}</p>
      <ul>
        ${filteredArticles.map(article => 
          `<li>${article.title} - newsletter-section: "${article['newsletter-section'] || 'MISSING'}"</li>`
        ).join('')}
      </ul>
    </div>
  `;
  
  // Toggle diagnostic display on click
  diagnosticInfo.querySelector('h3').addEventListener('click', () => {
    const content = diagnosticInfo.querySelector('.diagnostic-content');
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
  });
  
  container.appendChild(diagnosticInfo);
  
  // Process each section
  for (const section of NEWSLETTER_SECTIONS) {
    const sectionEl = container.querySelector(`#${section.id} .section-content`);
    
    // Filter articles for this section
    const sectionArticles = filteredArticles.filter(article => {
      return article['newsletter-section'] === section.sectionValue;
    });
    
    // Render section content
    await renderNewsletterSection(sectionEl, sectionArticles, section);
  }
}