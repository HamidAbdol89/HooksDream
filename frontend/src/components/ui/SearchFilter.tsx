// src/components/ui/SearchFilter.tsx - Advanced Search Filter Component
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, X, MapPin, Users, Calendar, TrendingUp, 
  Heart, Clock, Settings2, Check
} from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface SearchFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  sortBy: 'relevance' | 'followers' | 'recent' | 'engagement';
  location: string;
  minFollowers: number;
  maxFollowers: number;
  isOnline: boolean;
  hasInterests: string[];
  joinedWithin: 'week' | 'month' | 'year' | 'all';
}

const sortOptions: FilterOption[] = [
  { id: 'relevance', label: 'Most Relevant', icon: <Heart className="h-4 w-4" /> },
  { id: 'followers', label: 'Most Followers', icon: <Users className="h-4 w-4" /> },
  { id: 'recent', label: 'Recently Joined', icon: <Calendar className="h-4 w-4" /> },
  { id: 'engagement', label: 'Most Active', icon: <TrendingUp className="h-4 w-4" /> },
];

const joinedOptions: FilterOption[] = [
  { id: 'week', label: 'This Week', icon: <Clock className="h-4 w-4" /> },
  { id: 'month', label: 'This Month', icon: <Calendar className="h-4 w-4" /> },
  { id: 'year', label: 'This Year', icon: <Calendar className="h-4 w-4" /> },
  { id: 'all', label: 'All Time', icon: <Calendar className="h-4 w-4" /> },
];

const popularInterests = [
  'Technology', 'Design', 'Photography', 'Travel', 'Music',
  'Art', 'Sports', 'Gaming', 'Food', 'Fashion', 'Business', 'Science'
];

const SearchFilter: React.FC<SearchFilterProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters
}) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      sortBy: 'relevance',
      location: '',
      minFollowers: 0,
      maxFollowers: 10000,
      isOnline: false,
      hasInterests: [],
      joinedWithin: 'all'
    };
    setFilters(resetFilters);
  };

  const toggleInterest = (interest: string) => {
    setFilters(prev => ({
      ...prev,
      hasInterests: prev.hasInterests.includes(interest)
        ? prev.hasInterests.filter(i => i !== interest)
        : [...prev.hasInterests, interest]
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Filter Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[80vh] overflow-hidden border-t border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Search Filters</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-accent active:scale-95 transition-all"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-6">
              {/* Sort By */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Sort By</h3>
                <div className="grid grid-cols-2 gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: option.id as any }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                        filters.sortBy === option.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-foreground border-border hover:bg-accent'
                      }`}
                    >
                      {option.icon}
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Location</h3>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter city or region"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-muted rounded-2xl border-0 focus:bg-card focus:ring-2 focus:ring-ring transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Followers Range */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Followers</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Min</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minFollowers || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, minFollowers: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-muted rounded-xl border-0 focus:bg-card focus:ring-2 focus:ring-ring transition-all text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Max</label>
                    <input
                      type="number"
                      placeholder="10000"
                      value={filters.maxFollowers || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxFollowers: parseInt(e.target.value) || 10000 }))}
                      className="w-full px-3 py-2 bg-muted rounded-xl border-0 focus:bg-card focus:ring-2 focus:ring-ring transition-all text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Online Status */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.isOnline}
                    onChange={(e) => setFilters(prev => ({ ...prev, isOnline: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    filters.isOnline ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {filters.isOnline && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">Show only online users</span>
                </label>
              </div>

              {/* Joined Within */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Joined</h3>
                <div className="grid grid-cols-2 gap-2">
                  {joinedOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFilters(prev => ({ ...prev, joinedWithin: option.id as any }))}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all ${
                        filters.joinedWithin === option.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-foreground border-border hover:bg-accent'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {popularInterests.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filters.hasInterests.includes(interest)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted">
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 bg-card border border-border rounded-xl font-medium text-foreground hover:bg-accent active:scale-95 transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchFilter;
