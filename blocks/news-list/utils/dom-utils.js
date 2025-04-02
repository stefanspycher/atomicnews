/**
 * Creates an element with specified attributes and content
 * @param {string} tag - Element tag name
 * @param {Object} attributes - Element attributes
 * @param {string|Element|Array} content - Element content
 * @returns {Element} The created element
 */
export function createElement(tag, attributes = {}, content = null) {
    const element = document.createElement(tag);
    
    // Add attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Add content
    if (content) {
      if (typeof content === 'string') {
        element.innerHTML = content;
      } else if (content instanceof Element) {
        element.appendChild(content);
      } else if (Array.isArray(content)) {
        content.forEach((item) => {
          if (typeof item === 'string') {
            element.innerHTML += item;
          } else if (item instanceof Element) {
            element.appendChild(item);
          }
        });
      }
    }
    
    return element;
  }
  
  /**
   * Creates a no results message element
   * @param {string} title - Message title
   * @param {string} message - Message content
   * @returns {Element} The message element
   */
  export function createNoResultsMessage(title = 'No matching articles found', message = 'Try adjusting your filters to see more results.') {
    const container = createElement('div', { className: 'no-results' });
    container.appendChild(createElement('h3', {}, title));
    container.appendChild(createElement('p', {}, message));
    return container;
  }
  
  /**
   * Parses tags from an article
   * @param {Object} article - Article object
   * @returns {Array} Array of tags
   */
  export function parseArticleTags(article) {
    if (!article.tags) return [];
    
    try {
      if (typeof article.tags === 'string') {
        try {
          return JSON.parse(article.tags);
        } catch (e) {
          return article.tags.split(',').map(tag => tag.trim());
        }
      }
      return article.tags;
    } catch (e) {
      console.error('Error parsing tags', e);
      return [];
    }
  }
  
  /**
   * Formats a date into a month-year string
   * @param {string} dateString - Date string to format
   * @returns {string|null} Formatted month-year or null if invalid
   */
  export function formatMonthYear(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    } catch (e) {
      console.error('Error formatting date', e);
      return null;
    }
  }