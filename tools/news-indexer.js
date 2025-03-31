import fs from 'fs';
import path from 'path';
import { processNewsArticle, generateNewsIndex } from '../scripts/news-utils.js';

// Configuration
const NEWS_FOLDER = 'content/news';
const OUTPUT_FILE = 'news-index.json';

async function buildNewsIndex() {
  console.log('Building news index...');
  
  try {
    // Get all news files
    const files = fs.readdirSync(NEWS_FOLDER);
    const newsArticles = [];
    
    // Process each news file
    for (const file of files) {
      if (file.endsWith('.html')) {
        const filePath = path.join(NEWS_FOLDER, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        // Process the article
        const article = processNewsArticle(doc);
        article.path = `/news/${file.replace('.html', '')}`;
        
        newsArticles.push(article);
      }
    }
    
    // Generate the index
    const index = generateNewsIndex(newsArticles);
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
    
    console.log(`News index created with ${newsArticles.length} articles.`);
  } catch (error) {
    console.error('Error building news index:', error);
  }
}

// Run the indexer
buildNewsIndex();