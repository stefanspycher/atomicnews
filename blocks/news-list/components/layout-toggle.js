// blocks/news-list/components/layout-toggle.js
export function createLayoutToggle({ onGridView, onListView, onNewsletterView }) {
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'layout-toggle toggle-group';
  
  const gridButton = document.createElement('button');
  gridButton.className = 'grid-view-btn active';
  gridButton.innerHTML = '<span>Grid View</span>';
  
  const listButton = document.createElement('button');
  listButton.className = 'list-view-btn';
  listButton.innerHTML = '<span>List View</span>';
  
  const newsletterButton = document.createElement('button');
  newsletterButton.className = 'newsletter-view-btn';
  newsletterButton.innerHTML = '<span>Newsletter</span>';
  
  // Add event listeners
  gridButton.addEventListener('click', () => {
    gridButton.className = 'grid-view-btn active';
    listButton.className = 'list-view-btn';
    newsletterButton.className = 'newsletter-view-btn';
    onGridView();
  });
  
  listButton.addEventListener('click', () => {
    listButton.className = 'list-view-btn active';
    gridButton.className = 'grid-view-btn';
    newsletterButton.className = 'newsletter-view-btn';
    onListView();
  });
  
  newsletterButton.addEventListener('click', () => {
    newsletterButton.className = 'newsletter-view-btn active';
    gridButton.className = 'grid-view-btn';
    listButton.className = 'list-view-btn';
    onNewsletterView();
  });
  
  toggleContainer.appendChild(gridButton);
  toggleContainer.appendChild(listButton);
  toggleContainer.appendChild(newsletterButton);
  
  return toggleContainer;
}