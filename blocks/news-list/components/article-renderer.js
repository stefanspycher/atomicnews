import { createElement, parseArticleTags } from '../utils/dom-utils.js';
import { loadArticleContent } from '../utils/data-loader.js';

// Cache for rendered articles
const articleCache = new Map();

/**
 * Creates article metadata display element
 * @param {Object} article - Article data
 * @returns {Element} Metadata display element
 */
export function createArticleMetadata(article) {
  const metadataDisplay = createElement('div', { className: 'article-meta-display' });
  
  // Author and team
  if (article.author || article.team) {
    const authorTeam = createElement('span', { className: 'meta-author-team' }, 
      `${article.author || ''}${article.author && article.team ? ' / ' : ''}${article.team || ''}`);
    metadataDisplay.appendChild(authorTeam);
  }
  
  // Publish date
  if (article.publishdate) {
    const dateEl = createElement('span', { className: 'meta-date' }, article.publishdate);
    metadataDisplay.appendChild(dateEl);
  }
  
  // Tags
  const tags = parseArticleTags(article);
  if (tags.length > 0) {
    const tagsContainer = createElement('span', { className: 'meta-tags' });
    
    tags.forEach(tag => {
      tagsContainer.appendChild(createElement('span', { className: 'meta-tag-pill' }, tag));
    });
    
    metadataDisplay.appendChild(tagsContainer);
  }
  
  return metadataDisplay;
}

/**
 * Creates an article element for grid or list view
 * @param {Object} article - Article data
 * @param {string} view - View type ('grid' or 'list')
 * @returns {Element} Article element
 */
export async function createArticleElement(article, view = 'grid') {
  // Check cache first
  const cacheKey = `${article.path}-${view}`;
  if (articleCache.has(cacheKey)) {
    return articleCache.get(cacheKey).cloneNode(true);
  }
  
  // Create article element
  const articleElement = createElement('div', { 
    className: 'news-article',
    'data-path': article.path 
  });
  
  // Add image if available
  if (article.image && article.image !== '') {
    const imagePath = article.image.startsWith('/') 
      ? `${window.hlx.codeBasePath}${article.image}` 
      : `/${window.hlx.codeBasePath}${article.image}`;
      
    const imageElement = createElement('div', { className: 'article-image' });
    imageElement.innerHTML = `<img src="${imagePath}" alt="${article.title || 'News image'}">`;
    articleElement.appendChild(imageElement);
  }
  
  // Create content container
  const contentElement = createElement('div', { className: 'article-content' });
  
  // Add title
  const titleElement = createElement('h2', { className: 'article-title' }, article.title || 'Untitled Article');
  contentElement.appendChild(titleElement);
  
  // Add metadata
  contentElement.appendChild(createArticleMetadata(article));
  
  // Create placeholder for article text
  const textElement = createElement('div', { className: 'article-text' }, '<p>Loading content...</p>');
  contentElement.appendChild(textElement);
  
  // Add content to article
  articleElement.appendChild(contentElement);
  
  // Make article clickable
  articleElement.addEventListener('click', () => {
    window.location.href = article.path;
  });
  
  // Load the article content
  try {
    const content = await loadArticleContent(article.path);
    textElement.innerHTML = content.fullContent;
    
    // Cache the article
    articleCache.set(cacheKey, articleElement.cloneNode(true));
  } catch (error) {
    console.error(`Error loading content for ${article.path}:`, error);
    textElement.innerHTML = '<p>Unable to load article content.</p>';
  }
  
  return articleElement;
}

/**
 * Creates a simplified article element for newsletter view
 * @param {Object} article - Article data
 * @returns {Element} Newsletter article element
 */
export async function createNewsletterArticle(article) {
  const articleEl = createElement('div', { className: 'newsletter-article' });
  
  // Add title
  //articleEl.appendChild(createElement('h4', {}, article.title || 'Untitled Article'));
  
  // Add metadata
  //articleEl.appendChild(createArticleMetadata(article));
  
  // Add content container
  const contentEl = createElement('div', { className: 'newsletter-article-content' }, '<p>Loading content...</p>');
  articleEl.appendChild(contentEl);
   
  // Load article content
  try {
    const content = await loadArticleContent(article.path);
    contentEl.innerHTML = content.firstParagraph;
  } catch (error) {
    console.error(`Error loading content for ${article.path}:`, error);
    contentEl.innerHTML = '<p>Unable to load article content.</p>';
  }
  
  return articleEl;
}