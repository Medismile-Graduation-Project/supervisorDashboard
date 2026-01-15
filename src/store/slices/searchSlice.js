import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ===== IR (Information Retrieval) System =====

// Helper function to calculate relevance score for a text field
const calculateFieldScore = (text, query, weight = 1) => {
  if (!text || !query) return 0;
  
  try {
    const textLower = text.toString().toLowerCase().trim();
    const queryLower = query.toLowerCase().trim();
    
    if (!textLower || !queryLower) return 0;
    
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    if (queryWords.length === 0) return 0;
    
    let score = 0;
    
    // Exact match bonus (highest priority)
    if (textLower === queryLower) {
      score += 100 * weight;
      return score;
    }
    
    // Starts with query (high priority)
    if (textLower.startsWith(queryLower)) {
      score += 50 * weight;
    }
    // Contains exact phrase
    else if (textLower.includes(queryLower)) {
      score += 30 * weight;
    }
    
    // Word-level matching
    let matchedWords = 0;
    queryWords.forEach(word => {
      if (textLower.includes(word)) {
        matchedWords++;
        // Position bonus: matches at the beginning get higher score
        const position = textLower.indexOf(word);
        const positionBonus = position < 20 ? 10 : position < 50 ? 5 : 2;
        score += positionBonus * weight;
      }
    });
    
    // If no words matched, return 0
    if (matchedWords === 0) {
      return 0;
    }
    
    // Bonus for matching all words
    if (matchedWords === queryWords.length && queryWords.length > 1) {
      score += 20 * weight;
    }
    
    // Frequency bonus: more occurrences = higher score
    try {
      const occurrences = (textLower.match(new RegExp(queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      score += occurrences * 5 * weight;
    } catch (e) {
      // If regex fails, skip frequency bonus
    }
    
    return score;
  } catch (error) {
    // Fallback to simple includes check
    try {
      if (text.toString().toLowerCase().includes(query.toLowerCase())) {
        return 10 * weight; // Minimum score for any match
      }
    } catch {
      return 0;
    }
    return 0;
  }
};

// Calculate relevance score for an item based on multiple fields
const calculateRelevanceScore = (item, query, fieldWeights) => {
  let totalScore = 0;
  const queryLower = query.toLowerCase();
  
  // Score each field with its weight
  Object.entries(fieldWeights).forEach(([fieldPath, weight]) => {
    const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], item);
    if (value) {
      totalScore += calculateFieldScore(value, queryLower, weight);
    }
  });
  
  return totalScore;
};

// Calculate date recency score (newer items get higher score)
const calculateDateScore = (dateString, maxDays = 90) => {
  if (!dateString) return 0;
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 30; // Last week
    if (diffDays <= 30) return 20; // Last month
    if (diffDays <= maxDays) return 10; // Last 3 months
    return 0; // Older
  } catch {
    return 0;
  }
};

// Calculate status priority score
const calculateStatusScore = (status) => {
  const statusPriorities = {
    'approved': 20,
    'in_progress': 15,
    'pending': 10,
    'completed': 5,
    'active': 15,
    'closed': 0,
    'rejected': 0,
  };
  return statusPriorities[status] || 0;
};

// Field weights for different content types
const FIELD_WEIGHTS = {
  cases: {
    'title': 10,
    'description': 5,
    'patient.first_name': 8,
    'patient.last_name': 8,
    'status': 3,
    'priority': 3,
  },
  sessions: {
    'notes': 8,
    'case.title': 10,
    'student.first_name': 6,
    'student.last_name': 6,
    'status': 3,
  },
  appointments: {
    'notes': 6,
    'case.title': 10,
    'patient.first_name': 7,
    'patient.last_name': 7,
    'location': 5,
    'status': 3,
  },
  messages: {
    'case_id': 8,
    'last_message.content': 10,
    'participant_student.first_name': 6,
    'participant_student.last_name': 6,
    'participant_patient.first_name': 6,
    'participant_patient.last_name': 6,
  },
  notifications: {
    'title': 10,
    'message': 7,
    'type': 3,
  },
  reports: {
    'title': 10,
    'description': 7,
    'report_type': 5,
    'status': 3,
  },
  evaluations: {
    'comment': 10,
    'status': 3,
    'target_type': 5,
  },
  content: {
    'title': 10,
    'description': 7,
    'content': 8,
    'author_name': 4,
    'university_name': 3,
    'author.first_name': 4,
    'author.last_name': 4,
  },
};

// Helper function to search in text fields (backward compatibility)
const searchInText = (text, query) => {
  if (!text || !query) return false;
  return text.toString().toLowerCase().includes(query.toLowerCase());
};

// Async thunk for searching across all resources
export const searchAcrossAll = createAsyncThunk(
  'search/searchAcrossAll',
  async (query, { getState, rejectWithValue }) => {
    try {
      if (!query || query.trim().length < 2) {
        return {
          cases: [],
          sessions: [],
          appointments: [],
          messages: [],
          notifications: [],
          reports: [],
          evaluations: [],
          content: [],
          total: 0,
        };
      }

      const state = getState();
      const searchQuery = query.trim().toLowerCase();

      // Simple search check (fallback if IR scoring is too strict)
      const simpleMatch = (item, fieldWeights, query) => {
        const queryLower = query.toLowerCase();
        return Object.keys(fieldWeights).some((fieldPath) => {
          const value = fieldPath.split('.').reduce((obj, key) => obj?.[key], item);
          if (value && typeof value === 'string') {
            return value.toLowerCase().includes(queryLower);
          }
          return false;
        });
      };

      // IR Search with Relevance Scoring and Ranking
      const searchWithScoring = (items, fieldWeights, query) => {
        return items
          .map((item) => {
            // Calculate relevance score
            const relevanceScore = calculateRelevanceScore(item, query, fieldWeights);
            
            // Fallback: if IR scoring returns 0, check with simple match
            // This ensures we don't miss results due to strict scoring
            if (relevanceScore === 0) {
              if (!simpleMatch(item, fieldWeights, query)) {
                return null;
              }
              // If simple match found, give it a minimum score
              const minRelevanceScore = 5;
              
              // Calculate additional scores
              const dateScore = calculateDateScore(item.created_at || item.updated_at);
              const statusScore = calculateStatusScore(item.status);
              
              // Total score = min relevance (70%) + date (20%) + status (10%)
              const totalScore = minRelevanceScore * 0.7 + dateScore * 0.2 + statusScore * 0.1;
              
              return {
                ...item,
                _relevanceScore: Math.round(totalScore * 100) / 100,
                _relevanceBreakdown: {
                  relevance: minRelevanceScore,
                  date: dateScore,
                  status: statusScore,
                },
              };
            }
            
            // Calculate additional scores
            const dateScore = calculateDateScore(item.created_at || item.updated_at);
            const statusScore = calculateStatusScore(item.status);
            
            // Total score = relevance (70%) + date (20%) + status (10%)
            const totalScore = relevanceScore * 0.7 + dateScore * 0.2 + statusScore * 0.1;
            
            return {
              ...item,
              _relevanceScore: Math.round(totalScore * 100) / 100,
              _relevanceBreakdown: {
                relevance: Math.round(relevanceScore * 100) / 100,
                date: dateScore,
                status: statusScore,
              },
            };
          })
          .filter(item => item !== null)
          .sort((a, b) => b._relevanceScore - a._relevanceScore); // Sort by relevance (highest first)
      };

      // Search in Cases with IR
      const casesScored = searchWithScoring(
        state.cases?.cases || [],
        FIELD_WEIGHTS.cases,
        searchQuery
      );

      // Search in Sessions with IR
      const sessionsScored = searchWithScoring(
        state.sessions?.sessionsNeedingReview || [],
        FIELD_WEIGHTS.sessions,
        searchQuery
      );

      // Search in Appointments with IR
      const appointmentsScored = searchWithScoring(
        state.appointments?.appointments || [],
        FIELD_WEIGHTS.appointments,
        searchQuery
      );

      // Search in Messages/Threads with IR
      const messagesScored = searchWithScoring(
        state.messaging?.threads || [],
        FIELD_WEIGHTS.messages,
        searchQuery
      );

      // Search in Notifications with IR
      const notificationsScored = searchWithScoring(
        state.notifications?.notifications || [],
        FIELD_WEIGHTS.notifications,
        searchQuery
      );

      // Search in Reports with IR
      const reportsScored = searchWithScoring(
        state.reports?.reports || [],
        FIELD_WEIGHTS.reports,
        searchQuery
      );

      // Search in Evaluations with IR
      const evaluationsScored = searchWithScoring(
        state.evaluations?.evaluations || [],
        FIELD_WEIGHTS.evaluations,
        searchQuery
      );

      // Search in Content with IR (include both pending and approved)
      const allContent = [
        ...(state.content?.pendingContent || []),
        ...(state.content?.approvedContent || []),
      ];
      const contentScored = searchWithScoring(
        allContent,
        FIELD_WEIGHTS.content,
        searchQuery
      );

      const total = casesScored.length + sessionsScored.length + appointmentsScored.length + 
                   messagesScored.length + notificationsScored.length + reportsScored.length + 
                   evaluationsScored.length + contentScored.length;

      return {
        cases: casesScored.slice(0, 10), // Top 10 results by relevance
        sessions: sessionsScored.slice(0, 10),
        appointments: appointmentsScored.slice(0, 10),
        messages: messagesScored.slice(0, 10),
        notifications: notificationsScored.slice(0, 10),
        reports: reportsScored.slice(0, 10),
        evaluations: evaluationsScored.slice(0, 10),
        content: contentScored.slice(0, 10),
        total,
        query: searchQuery,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  query: '',
  results: {
    cases: [],
    sessions: [],
    appointments: [],
    messages: [],
    notifications: [],
    reports: [],
    evaluations: [],
    content: [],
    total: 0,
  },
  loading: false,
  error: null,
  recentSearches: [],
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    clearSearch: (state) => {
      state.query = '';
      state.results = {
        cases: [],
        sessions: [],
        appointments: [],
        messages: [],
        notifications: [],
        reports: [],
        evaluations: [],
        content: [],
        total: 0,
      };
      state.error = null;
    },
    addRecentSearch: (state, action) => {
      const query = action.payload.trim();
      if (query && query.length >= 2) {
        // Remove if already exists
        state.recentSearches = state.recentSearches.filter(s => s !== query);
        // Add to beginning
        state.recentSearches.unshift(query);
        // Keep only last 10
        state.recentSearches = state.recentSearches.slice(0, 10);
      }
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchAcrossAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchAcrossAll.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
        // Add to recent searches
        if (action.payload.query && action.payload.total > 0) {
          const query = action.payload.query;
          state.recentSearches = state.recentSearches.filter(s => s !== query);
          state.recentSearches.unshift(query);
          state.recentSearches = state.recentSearches.slice(0, 10);
        }
      })
      .addCase(searchAcrossAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ===== Highlighting Utility =====
// Function to highlight matched text in search results
export const highlightMatches = (text, query) => {
  if (!text || !query) return text;
  
  const textStr = text.toString();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  
  // Escape special regex characters
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create regex pattern for all query words
  const pattern = queryWords.map(word => escapeRegex(word)).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  
  // Split text by matches and wrap matches in highlight span
  const parts = textStr.split(regex);
  
  return parts.map((part, index) => {
    const isMatch = queryWords.some(word => 
      part.toLowerCase() === word.toLowerCase()
    );
    
    if (isMatch) {
      return `<mark class="bg-yellow-200 font-semibold">${part}</mark>`;
    }
    return part;
  }).join('');
};

export const { setQuery, clearSearch, addRecentSearch, clearRecentSearches } = searchSlice.actions;
export default searchSlice.reducer;

