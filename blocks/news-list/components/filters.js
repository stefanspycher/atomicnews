export function createFilters({ metadata }) {
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'news-filters';
    
    // Create "All" filter button
    const allFilter = document.createElement('button');
    allFilter.className = 'filter-btn all-filter active';
    allFilter.textContent = 'All';
    filtersContainer.appendChild(allFilter);
    
    // Create team filter
    const teamFilter = createSelectFilter('team', 'Team: Any', metadata.teams);
    
    // Create tag filter
    const tagFilter = createSelectFilter('tag', 'Tag: Any', metadata.tags);
    
    // Create date filter
    const dateFilter = createSelectFilter('date', 'Date: Any', metadata.months);
    
    // Add filters to container
    if (teamFilter) filtersContainer.appendChild(teamFilter);
    if (tagFilter) filtersContainer.appendChild(tagFilter);
    if (dateFilter) filtersContainer.appendChild(dateFilter);
    
    // Store filter state and callbacks
    const state = {
      showAll: true,
      team: '',
      tag: '',
      date: ''
    };
    
    // Add event listeners
    allFilter.addEventListener('click', () => {
      if (!allFilter.classList.contains('active')) {
        allFilter.classList.add('active');
        state.showAll = true;
        
        // Reset other filters
        if (teamFilter) teamFilter.querySelector('select').value = '';
        if (tagFilter) tagFilter.querySelector('select').value = '';
        if (dateFilter) dateFilter.querySelector('select').value = '';
        
        state.team = '';
        state.tag = '';
        state.date = '';
        
        if (state.onChange) state.onChange(state);
      }
    });
    
    // Add change handlers to select filters
    [teamFilter, tagFilter, dateFilter].forEach((filter, index) => {
      if (!filter) return;
      
      const select = filter.querySelector('select');
      const filterType = ['team', 'tag', 'date'][index];
      
      select.addEventListener('change', () => {
        if (select.value) {
          allFilter.classList.remove('active');
          state.showAll = false;
        } else {
          // Check if all filters are empty, if so activate "All"
          const hasActiveFilter = [
            teamFilter?.querySelector('select').value, 
            tagFilter?.querySelector('select').value, 
            dateFilter?.querySelector('select').value
          ].some(val => val !== '' && val !== undefined);
          
          if (!hasActiveFilter) {
            allFilter.classList.add('active');
            state.showAll = true;
          }
        }
        
        // Update state
        state[filterType] = select.value;
        
        // Trigger onChange callback if set
        if (state.onChange) state.onChange(state);
      });
    });
    
    function createSelectFilter(type, defaultLabel, options) {
      if (!options || options.length === 0) return null;
      
      const container = document.createElement('div');
      container.className = `filter-select-container ${type}-filter-container`;
      
      const select = document.createElement('select');
      select.className = `filter-select ${type}-filter`;
      
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = defaultLabel;
      defaultOption.selected = true;
      select.appendChild(defaultOption);
      
      options.forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option;
        optionEl.textContent = option;
        select.appendChild(optionEl);
      });
      
      container.appendChild(select);
      return container;
    }
    
    return {
      filtersContainer,
      filters: {
        elements: {
          allFilter,
          teamFilterElement: teamFilter?.querySelector('select'),
          tagFilterElement: tagFilter?.querySelector('select'),
          dateFilterElement: dateFilter?.querySelector('select')
        },
        state,
        setOnChange: (callback) => { state.onChange = callback; },
        // Method to set filter values programmatically
        setValues: ({ team, tag, date, showAll }) => {
          if (team !== undefined) {
            state.team = team;
            if (teamFilter) teamFilter.querySelector('select').value = team;
          }
          
          if (tag !== undefined) {
            state.tag = tag;
            if (tagFilter) tagFilter.querySelector('select').value = tag;
          }
          
          if (date !== undefined) {
            state.date = date;
            if (dateFilter) dateFilter.querySelector('select').value = date;
          }
          
          if (showAll !== undefined) {
            state.showAll = showAll;
            if (showAll) {
              allFilter.classList.add('active');
            } else {
              allFilter.classList.remove('active');
            }
          }
        }
      }
    };
  }