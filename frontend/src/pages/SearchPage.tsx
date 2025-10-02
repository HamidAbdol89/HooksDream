import React from 'react';
import { motion } from 'framer-motion';

const SimpleSearch = React.lazy(() => import('@/components/search/SimpleSearchRQ'));

export const SearchPage: React.FC = () => {
  return (
    <div className="h-full">
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      }>
        <SimpleSearch />
      </React.Suspense>
    </div>
  );
};

export default SearchPage;
