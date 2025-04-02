import { createNoResultsMessage } from '../utils/dom-utils.js';
import { createArticleElement } from '../components/article-renderer.js';

/**
 * Applies filters to articles for display
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
 * Renders articles in list view
 * @param {Element} container - Container to render articles in
 * @param {Array} articles - Articles to render
 * @param {Object} filters - Filter controls and state
 */
export async function renderListView(container, articles, filters) {
  // Clear container
  container.innerHTML = '';
  
  // Set up filter change handler
  filters.setOnChange(async (filterState) => {
    await renderListView(container, articles, filters);
  });
  
  // Apply filters
  const filteredArticles = applyFilters(articles, filters.state);
  
  if (filteredArticles.length === 0) {
    container.appendChild(createNoResultsMessage());
    return;
  }
  
  // Render articles
  for (const article of filteredArticles) {
    const articleElement = await createArticleElement(article, 'list');
    container.appendChild(articleElement);
  }
}