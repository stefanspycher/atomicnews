import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  // Restructure the block content
  const rows = [...block.children];
  
  // Assume first row contains metadata
  const metadataRow = rows[0];
  if (metadataRow) {
    const metadataDiv = document.createElement('div');
    metadataDiv.className = 'news-metadata';
    
    // Extract metadata from the row
    const metadataCells = [...metadataRow.children];
    if (metadataCells.length >= 2) {
      const publishDate = metadataCells[0].textContent.trim();
      const author = metadataCells[1].textContent.trim();
      
      // Format date
      const date = new Date(publishDate);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      metadataDiv.innerHTML = `
        <span class="news-date">${formattedDate}</span>
        <span class="news-author">By: ${author}</span>
      `;
      
      // Add team if available
      if (metadataCells.length >= 3) {
        const team = metadataCells[2].textContent.trim();
        if (team) {
          const teamSpan = document.createElement('span');
          teamSpan.className = 'news-team';
          teamSpan.textContent = team;
          metadataDiv.appendChild(teamSpan);
        }
      }
      
      // Add tags if available
      if (metadataCells.length >= 4) {
        const tagsText = metadataCells[3].textContent.trim();
        if (tagsText) {
          const tags = tagsText.split(',').map(tag => tag.trim());
          
          const tagsContainer = document.createElement('div');
          tagsContainer.className = 'news-tags';
          
          tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'news-tag';
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
          });
          
          metadataDiv.appendChild(tagsContainer);
        }
      }
    }
    
    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'news-content';
    
    // Move remaining rows to content
    rows.slice(1).forEach(row => {
      contentDiv.appendChild(row);
    });
    
    // Clear block and add restructured content
    block.innerHTML = '';
    block.appendChild(metadataDiv);
    block.appendChild(contentDiv);
    
    // Look for images and optimize them
    block.querySelectorAll('img').forEach(img => {
      const optimizedImage = createOptimizedPicture(img.src, img.alt, false);
      img.parentElement.replaceChild(optimizedImage, img);
    });
  }
}