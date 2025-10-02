// Simple custom search client
export const createSimpleSearchClient = () => {
  return {
    search: async (requests: any[]) => {
      
      const results = await Promise.all(
        requests.map(async (request) => {
          const { query } = request;
          
          if (!query || query.trim() === '') {
            return {
              hits: [],
              nbHits: 0,
              page: 0,
              nbPages: 0,
              hitsPerPage: 20,
              processingTimeMS: 0,
              exhaustiveNbHits: true,
              query: query || '',
              params: ''
            };
          }
          
          try {
            // Direct fetch to backend
            const url = `http://localhost:5000/api/search?q=${encodeURIComponent(query.trim())}&type=all&limit=10`;
            const response = await fetch(url);
            const data = await response.json();
            
            
            if (!data.success) {
              throw new Error('Search failed');
            }
            
            const { users = [], posts = [] } = data.data;
            const hits: any[] = [];
            
            // Add users
            users.forEach((user: any) => {
              hits.push({
                ...user,
                objectID: `user_${user._id}`,
                _type: 'user'
              });
            });
            
            // Add posts
            posts.forEach((post: any) => {
              if (post._id && post.content) {
                hits.push({
                  _id: post._id,
                  objectID: `post_${post._id}`,
                  _type: 'post',
                  content: post.content,
                  userId: post.userId,
                  likeCount: post.likeCount || 0,
                  commentCount: post.commentCount || 0,
                  shareCount: post.shareCount || 0,
                  images: post.images || [],
                  hashtags: post.hashtags || [],
                  createdAt: post.createdAt,
                  type: post.type || 'text',
                  visibility: post.visibility || 'public'
                });
              }
            });
            
            
            return {
              hits,
              nbHits: hits.length,
              page: 0,
              nbPages: 1,
              hitsPerPage: 20,
              processingTimeMS: 10,
              exhaustiveNbHits: true,
              query,
              params: ''
            };
            
          } catch (error) {
            return {
              hits: [],
              nbHits: 0,
              page: 0,
              nbPages: 0,
              hitsPerPage: 20,
              processingTimeMS: 0,
              exhaustiveNbHits: true,
              query,
              params: ''
            };
          }
        })
      );
      
      return { results };
    },
    
    searchForFacetValues: async () => ({ 
      facetHits: [],
      exhaustiveFacetsCount: true,
      processingTimeMS: 0
    }),
    
    addAlgoliaAgent: () => {},
    clearCache: () => {}
  };
};


// Use test client with real data for debugging
export const testSearchClientWithRealData = {
  search: async (requests: any[]) => {
    console.log('🔍 TEST client with real data called!', requests);
    
    return {
      results: requests.map((request) => ({
        hits: [
          {
            objectID: 'post_68d8b4ebedee2974b005f6b6',
            _type: 'post',
            _id: '68d8b4ebedee2974b005f6b6',
            content: 'xin chào, dù thế nào mình vẫn mong giữ được những',
            userId: {
              _id: '110933156900372701696',
              username: 'iwrotetoearendel',
              displayName: 'sternenhimmel',
              avatar: 'https://res.cloudinary.com/digjnxtut/image/upload/v1759029650/uploads/images/avatar_110933156900372701696_1759029649400.jpg',
              isVerified: false
            },
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            images: [],
            hashtags: [],
            createdAt: new Date().toISOString(),
            type: 'text',
            visibility: 'public'
          }
        ],
        nbHits: 1,
        page: 0,
        nbPages: 1,
        hitsPerPage: 20,
        processingTimeMS: 10,
        exhaustiveNbHits: true,
        query: request.query || '',
        params: ''
      }))
    };
  },
  
  searchForFacetValues: async () => ({ 
    facetHits: [],
    exhaustiveFacetsCount: true,
    processingTimeMS: 0
  }),
  
  addAlgoliaAgent: () => {},
  clearCache: () => {},
};

// Use simple search client
export const searchClient = createSimpleSearchClient();

// Index configuration
export const SEARCH_CONFIG = {
  indexName: 'hooksdream_search', // Virtual index name
  searchParameters: {
    hitsPerPage: 20,
    attributesToRetrieve: ['*'],
    attributesToHighlight: ['displayName', 'username', 'content'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
  }
};

// Get trending hashtags for suggestions
export const getTrendingHashtags = async () => {
  try {
    // Direct fetch to backend
    const url = `http://localhost:5000/api/search/trending?limit=10`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return data.data.map((item: any) => ({
        hashtag: item.hashtag,
        count: item.count,
        label: `#${item.hashtag}`,
        value: item.hashtag
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
};

// Get search suggestions
export const getSearchSuggestions = async (query: string) => {
  try {
    if (query.length < 2) return { users: [], hashtags: [] };
    
    // Direct fetch to backend
    const url = `http://localhost:5000/api/search/suggestions?q=${encodeURIComponent(query)}&limit=5`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return {
        users: data.data.users || [],
        hashtags: data.data.hashtags || []
      };
    }
    return { users: [], hashtags: [] };
  } catch (error) {
    return { users: [], hashtags: [] };
  }
};
