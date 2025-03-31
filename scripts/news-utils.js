/**
 * Utility functions for news article processing
 */

/**
 * Processes a news article document from the Google Drive template
 * @param {Document} doc The raw document HTML
 * @returns {Object} Structured news article object with metadata
 */
export function processNewsArticle(doc) {
    // Extract the title (formatted as <Title>)
    const titleElement = doc.querySelector('h1');
    const title = titleElement ? titleElement.textContent : 'Untitled';
    
    // Get main content (everything before the ---)
    const content = [];
    let element = titleElement ? titleElement.nextElementSibling : doc.body.firstElementChild;
    let metadataSection = false;
    
    while (element && !metadataSection) {
      // Check for metadata separator
      if (element.textContent.trim() === '---') {
        metadataSection = true;
        break;
      }
      
      // Add to content if not an image (we'll handle images separately)
      if (element.tagName !== 'IMG' && element.tagName !== 'PICTURE') {
        content.push(element.outerHTML);
      }
      
      element = element.nextElementSibling;
    }
    
    // Extract images (the two images following content)
    const images = [];
    let imageCount = 0;
    element = titleElement ? titleElement.nextElementSibling : doc.body.firstElementChild;
    
    while (element && imageCount < 2) {
      if (element.tagName === 'IMG' || element.querySelector('img')) {
        const img = element.tagName === 'IMG' ? element : element.querySelector('img');
        images.push(img.src);
        imageCount++;
      }
      element = element.nextElementSibling;
    }
    
    // Parse metadata table
    const metadata = {};
    if (metadataSection) {
      let metadataTable = element.nextElementSibling;
      if (metadataTable && metadataTable.tagName === 'TABLE') {
        const rows = metadataTable.querySelectorAll('tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const key = cells[0].textContent.trim();
            const value = cells[1].textContent.trim();
            
            // Process specific metadata types
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
    }
    
    return {
      title,
      content: content.join(''),
      images,
      metadata
    };
  }
  
  /**
   * Generates a news index from all news articles
   * @param {Array} newsArticles Array of processed news articles
   * @returns {Object} Structured index with filtering capabilities
   */
  export function generateNewsIndex(newsArticles) {
    const index = {
      articles: newsArticles.map(article => ({
        title: article.title,
        path: article.path,
        publishDate: article.metadata.publishDate,
        author: article.metadata.author,
        team: article.metadata.team,
        uplevel: article.metadata.uplevel,
        tags: article.metadata.tags,
        thumbnail: article.images[0] || null,
      })),
      
      // Generate tag index for filtering
      tags: {},
      
      // Generate team index
      teams: {},
      
      // Generate date range
      dateRange: {
        earliest: null,
        latest: null
      }
    };
    
    // Populate tag index
    newsArticles.forEach(article => {
      if (article.metadata.tags) {
        article.metadata.tags.forEach(tag => {
          if (!index.tags[tag]) {
            index.tags[tag] = 0;
          }
          index.tags[tag]++;
        });
      }
      
      // Populate team index
      if (article.metadata.team) {
        const team = article.metadata.team;
        if (!index.teams[team]) {
          index.teams[team] = 0;
        }
        index.teams[team]++;
      }
      
      // Update date range
      if (article.metadata.publishDate) {
        const date = new Date(article.metadata.publishDate);
        if (!index.dateRange.earliest || date < index.dateRange.earliest) {
          index.dateRange.earliest = date;
        }
        if (!index.dateRange.latest || date > index.dateRange.latest) {
          index.dateRange.latest = date;
        }
      }
    });
    
    return index;
  }