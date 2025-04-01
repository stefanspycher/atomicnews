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
        
        // Create container for metadata
        const metadataElement = document.createElement('div');
        metadataElement.className = 'article-metadata';
        
        // Fetch the article content
        const articleResp = await fetch(`${article.path}.plain.html`);
        if (articleResp.ok) {
          const articleHTML = await articleResp.text();
          
          // Create a temporary element to parse the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = articleHTML;
          
          // Change the h1 element to h2 and add the article-title class
          const h1 = tempDiv.querySelector('h1');
          if (h1) {
            const h2 = document.createElement('h2');
            h2.innerHTML = h1.innerHTML;
            h2.id = h1.id;
            h2.className = 'article-title';
            h1.parentNode.replaceChild(h2, h1);
          }
          
          // Extract the metadata table if it exists
          const table = tempDiv.querySelector('table');
          if (table) {
            // Move table to the metadata element
            metadataElement.appendChild(table);
            
            // Add a class to style the table
            table.className = 'metadata-table';
          }
          
          // Set the processed content
          contentElement.innerHTML = tempDiv.innerHTML;
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
        if (imageElement) articleElement.appendChild(imageElement);
        articleElement.appendChild(contentElement);
        
        // Add metadata if it contains content
        if (metadataElement.children.length > 0) {
          articleElement.appendChild(metadataElement);
        }
        
        // Add article to container
        newsContainer.appendChild(articleElement);
      }
    }
  } catch (error) {
    console.error('Error loading news articles:', error);
    newsContainer.innerHTML = `<p>Error loading news articles: ${error.message}</p>`;
  }
  
  // Replace block content with our toggle and news container
  block.textContent = '';
  block.appendChild(toggleContainer);
  block.appendChild(newsContainer);
}