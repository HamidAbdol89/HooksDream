// Main search components
export { SearchBar } from './SearchBar';
export { SearchModal, SearchButton } from './SearchModal';
export { AdvancedSearch } from './AdvancedSearch';

// Internal components (used by AdvancedSearch)
export { SearchInput } from './SearchInput';
export { SearchFilters } from './SearchFilters';
export { SearchResults } from './SearchResults';
export { SearchSuggestions } from './SearchSuggestions';
export { TrendingHashtags } from './TrendingHashtags';

// Legacy component (for backward compatibility)
export { SearchUsers } from './SearchUsers';

// Pages
export { default as SearchPage } from '../../pages/SearchPage';
