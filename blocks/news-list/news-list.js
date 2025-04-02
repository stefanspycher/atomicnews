import { createLayoutToggle } from './components/layout-toggle.js';
import { createFilters } from './components/filters.js';
import { loadNewsArticles } from './utils/data-loader.js';
import { renderGridView } from './views/grid-view.js';
import { renderListView } from './views/list-view.js';
import { renderNewsletterView } from './views/newsletter-view.js';

export default async function decorate(block) {
  // Create UI containers
  const newsContainer = document.createElement('div');
  newsContainer.className = 'news-container grid-view';
  
  const newsletterContainer = document.createElement('div');
  newsletterContainer.className = 'newsletter-container';
  newsletterContainer.style.display = 'none';
  
  // Get news collection title if exists
  const newsTitle = block.querySelector('h2, h1');
  const titleToKeep = newsTitle ? newsTitle.cloneNode(true) : null;
  
  // Clear original block content
  block.textContent = '';
  
  // Add title back if it existed
  if (titleToKeep) {
    block.appendChild(titleToKeep);
  }
  
  try {
    // Load news data
    const newsData = await loadNewsArticles();
    
    if (!newsData.articles || newsData.articles.length === 0) {
      newsContainer.innerHTML = '<p>No news articles found.</p>';
    } else {
      // Create filters component
      const { filtersContainer, filters } = createFilters(newsData);
      block.appendChild(filtersContainer);
      
      // Create layout toggle and add event handlers
      const toggleContainer = createLayoutToggle({
        onGridView: () => {
          newsContainer.className = 'news-container grid-view';
          newsContainer.style.display = '';
          newsletterContainer.style.display = 'none';
          renderGridView(newsContainer, newsData.articles, filters);
        },
        onListView: () => {
          newsContainer.className = 'news-container list-view';
          newsContainer.style.display = '';
          newsletterContainer.style.display = 'none';
          renderListView(newsContainer, newsData.articles, filters);
        },
        onNewsletterView: () => {
          newsContainer.style.display = 'none';
          newsletterContainer.style.display = '';
          
          // Only render newsletter if not already loaded
          if (!newsletterContainer.dataset.loaded) {
            renderNewsletterView(newsletterContainer, newsData, filters);
            newsletterContainer.dataset.loaded = 'true';
          }
        }
      });
      
      // Add components to the block
      block.appendChild(toggleContainer);
      block.appendChild(newsContainer);
      block.appendChild(newsletterContainer);
      
      // Initial view: Grid
      renderGridView(newsContainer, newsData.articles, filters);
    }
  } catch (error) {
    console.error('Error loading news articles:', error);
    newsContainer.innerHTML = `<p>Error loading news articles: ${error.message}</p>`;
    block.appendChild(newsContainer);
  }
}