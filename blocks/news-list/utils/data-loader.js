export async function loadNewsArticles() {
    const resp = await fetch(`${window.hlx.codeBasePath}/news/query-index.json`);
    if (!resp.ok) throw new Error(`Failed to fetch news index: ${resp.status}`);
    
    const json = await resp.json();
    const articles = json.data;
    
    // Extract metadata for filters
    const teams = new Set();
    const tags = new Set();
    const months = new Set();
    
    // Process articles and extract metadata
    articles.forEach(article => {
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
      
      if (article.publishdate) {
        try {
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
    
    // Sort months chronologically (most recent first)
    const sortedMonths = Array.from(months).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB - dateA;
    });
    
    return {
      articles,
      metadata: {
        teams: Array.from(teams).sort(),
        tags: Array.from(tags).sort(),
        months: sortedMonths
      }
    };
  }
  
  export async function loadArticleContent(path) {
    const response = await fetch(`${path}.plain.html`);
    if (!response.ok) throw new Error('Failed to load article content');
    
    const html = await response.text();
    
    // Parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove h1 title
    const h1 = tempDiv.querySelector('h1');
    if (h1) h1.remove();
    
    // Remove metadata table
    const table = tempDiv.querySelector('table');
    if (table) table.remove();
    
    return {
      fullContent: tempDiv.innerHTML,
      firstParagraph: tempDiv.querySelector('p')?.outerHTML || '<p>No content available.</p>'
    };
  }