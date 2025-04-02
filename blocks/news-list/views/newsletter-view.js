import { createElement, formatMonthYear } from '../utils/dom-utils.js';
import { createNewsletterArticle } from '../components/article-renderer.js';

// Newsletter section definitions
const NEWSLETTER_SECTIONS = [
  { id: 'intro', title: 'Introduction', sectionValue: 'introduction' },
  { id: 'customer-focus', title: 'Customer Focus', sectionValue: 'CustomerFocus' },
  { id: 'highlights', title: 'Highlights', sectionValue: 'highlight', groupBy: 'team' },
  { id: 'events', title: 'Events', sectionValue: 'events' }
];

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
        const articleEl = await createNewsletterArticle(article);
        groupContentEl.appendChild(articleEl);
      }
      
      groupEl.appendChild(groupContentEl);
      sectionContainer.appendChild(groupEl);
    }
  } else {
    // No grouping needed, just add articles
    for (const article of articles) {
      const articleEl = await createNewsletterArticle(article);
      sectionContainer.appendChild(articleEl);
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
  
  // Get the most recent month from sortedMonths
  const mostRecentMonth = newsData.metadata.months[0] || null;
  
  // Set date filter to most recent month
  if (mostRecentMonth && filters.elements.dateFilterElement) {
    filters.setValues({
      date: mostRecentMonth,
      showAll: false
    });
  }
  
  // Process each section
  for (const section of NEWSLETTER_SECTIONS) {
    const sectionEl = container.querySelector(`#${section.id} .section-content`);
    
    // Filter articles for this section and date
    const sectionArticles = newsData.articles.filter(article => {
      // Check if article has the correct newsletter-section value
      const sectionMatch = article['newsletter-section'] === section.sectionValue;
      
      // Check date if we have a selected month
      let dateMatch = true;
      if (mostRecentMonth && article.publishdate) {
        const articleMonthYear = formatMonthYear(article.publishdate);
        dateMatch = articleMonthYear === mostRecentMonth;
      }
      
      return sectionMatch && dateMatch;
    });
    
    // Render section content
    await renderNewsletterSection(sectionEl, sectionArticles, section);
  }
}