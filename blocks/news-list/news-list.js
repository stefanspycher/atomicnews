export default async function decorate(block) {
  // Create container for news articles
  const newsContainer = document.createElement('div');
  newsContainer.className = 'news-container';
  
  try {
    // Get the paths of all news articles
    const resp = await fetch(`${window.hlx.codeBasePath}/news/query-index.json`);
    if (!resp.ok) throw new Error(`Failed to fetch news index: ${resp.status}`);
    
    const json = await resp.json();
    const newsArticles = json.data;
    
    if (!newsArticles || newsArticles.length === 0) {
      newsContainer.innerHTML = '<p>No news articles found.</p>';
    } else {
      // Fetch and display each article
      for (const article of newsArticles) {
        const articleElement = document.createElement('div');
        articleElement.className = 'news-article';
        
        // Create article header with title
        const header = document.createElement('h2');
        header.className = 'article-title';
        header.textContent = article.title || 'Untitled Article';
        
        // Create article image if available
        let imageElement = '';
        if (article.image && article.image !== '') {
          const imagePath = article.image.startsWith('/') 
            ? `${window.hlx.codeBasePath}${article.image}` 
            : `/${window.hlx.codeBasePath}${article.image}`;
            
          imageElement = document.createElement('div');
          imageElement.className = 'article-image';
          imageElement.innerHTML = `<img src="${imagePath}" alt="${article.title || 'News image'}">`;
        }
        
        // Create container for article content
        const contentElement = document.createElement('div');
        contentElement.className = 'article-content';
        
        // Fetch the article content
        const articleResp = await fetch(`${article.path}.plain.html`);
        if (articleResp.ok) {
          const articleHTML = await articleResp.text();
          contentElement.innerHTML = articleHTML;
        } else {
          contentElement.innerHTML = '<p>Unable to load article content.</p>';
        }
        
        // Add date if available
        if (article.date) {
          const dateElement = document.createElement('div');
          dateElement.className = 'article-date';
          dateElement.textContent = new Date(article.date).toLocaleDateString();
          articleElement.appendChild(dateElement);
        }
        
        // Assemble article
        articleElement.appendChild(header);
        if (imageElement) articleElement.appendChild(imageElement);
        articleElement.appendChild(contentElement);
        
        // Add read more link
        const readMoreLink = document.createElement('a');
        readMoreLink.href = article.path;
        readMoreLink.className = 'read-more';
        readMoreLink.textContent = 'Read full article';
        articleElement.appendChild(readMoreLink);
        
        // Add article to container
        newsContainer.appendChild(articleElement);
      }
    }
  } catch (error) {
    console.error('Error loading news articles:', error);
    newsContainer.innerHTML = `<p>Error loading news articles: ${error.message}</p>`;
  }
  
  // Replace block content with our news container
  block.textContent = '';
  block.appendChild(newsContainer);
}