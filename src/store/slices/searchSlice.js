import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Helper function to search in text fields
const searchInText = (text, query) => {
  if (!text || !query) return false;
  return text.toString().toLowerCase().includes(query.toLowerCase());
};

// Helper function to search in object with multiple fields
const searchInObject = (obj, fields, query) => {
  return fields.some(field => {
    const value = field.split('.').reduce((o, key) => o?.[key], obj);
    return searchInText(value, query);
  });
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

      // Search in Cases
      const cases = (state.cases?.cases || []).filter((caseItem) => {
        return (
          searchInText(caseItem.title, searchQuery) ||
          searchInText(caseItem.description, searchQuery) ||
          searchInText(caseItem.patient?.first_name, searchQuery) ||
          searchInText(caseItem.patient?.last_name, searchQuery) ||
          searchInText(caseItem.status, searchQuery) ||
          searchInText(caseItem.priority, searchQuery)
        );
      });

      // Search in Sessions
      const sessions = (state.sessions?.sessionsNeedingReview || []).filter((session) => {
        return (
          searchInText(session.notes, searchQuery) ||
          searchInText(session.case?.title, searchQuery) ||
          searchInText(session.student?.first_name, searchQuery) ||
          searchInText(session.student?.last_name, searchQuery) ||
          searchInText(session.status, searchQuery)
        );
      });

      // Search in Appointments
      const appointments = (state.appointments?.appointments || []).filter((appointment) => {
        return (
          searchInText(appointment.notes, searchQuery) ||
          searchInText(appointment.case?.title, searchQuery) ||
          searchInText(appointment.patient?.first_name, searchQuery) ||
          searchInText(appointment.patient?.last_name, searchQuery) ||
          searchInText(appointment.location, searchQuery) ||
          searchInText(appointment.status, searchQuery)
        );
      });

      // Search in Messages/Threads
      const messages = (state.messaging?.threads || []).filter((thread) => {
        return (
          searchInText(thread.case_id, searchQuery) ||
          searchInText(thread.participant_student?.first_name, searchQuery) ||
          searchInText(thread.participant_student?.last_name, searchQuery) ||
          searchInText(thread.participant_patient?.first_name, searchQuery) ||
          searchInText(thread.participant_patient?.last_name, searchQuery) ||
          searchInText(thread.last_message?.content, searchQuery)
        );
      });

      // Search in Notifications
      const notifications = (state.notifications?.notifications || []).filter((notification) => {
        return (
          searchInText(notification.title, searchQuery) ||
          searchInText(notification.message, searchQuery) ||
          searchInText(notification.type, searchQuery)
        );
      });

      // Search in Reports
      const reports = (state.reports?.reports || []).filter((report) => {
        return (
          searchInText(report.title, searchQuery) ||
          searchInText(report.description, searchQuery) ||
          searchInText(report.report_type, searchQuery) ||
          searchInText(report.status, searchQuery)
        );
      });

      // Search in Evaluations
      const evaluations = (state.evaluations?.evaluations || []).filter((evaluation) => {
        return (
          searchInText(evaluation.comment, searchQuery) ||
          searchInText(evaluation.status, searchQuery) ||
          searchInText(evaluation.target_type, searchQuery)
        );
      });

      // Search in Content
      const content = (state.content?.pendingContent || []).filter((contentItem) => {
        return (
          searchInText(contentItem.title, searchQuery) ||
          searchInText(contentItem.description, searchQuery) ||
          searchInText(contentItem.content, searchQuery) ||
          searchInText(contentItem.author_name, searchQuery) ||
          searchInText(contentItem.university_name, searchQuery) ||
          searchInText(contentItem.author?.first_name, searchQuery) ||
          searchInText(contentItem.author?.last_name, searchQuery)
        );
      });

      const total = cases.length + sessions.length + appointments.length + 
                   messages.length + notifications.length + reports.length + 
                   evaluations.length + content.length;

      return {
        cases: cases.slice(0, 10), // Limit to 10 results per category
        sessions: sessions.slice(0, 10),
        appointments: appointments.slice(0, 10),
        messages: messages.slice(0, 10),
        notifications: notifications.slice(0, 10),
        reports: reports.slice(0, 10),
        evaluations: evaluations.slice(0, 10),
        content: content.slice(0, 10),
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

export const { setQuery, clearSearch, addRecentSearch, clearRecentSearches } = searchSlice.actions;
export default searchSlice.reducer;

