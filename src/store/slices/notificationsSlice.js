import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications/', { params });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchNotificationById = createAsyncThunk(
  'notifications/fetchNotificationById',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/notifications/${notificationId}/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/`, {
        is_read: true,
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateNotificationStatus = createAsyncThunk(
  'notifications/updateStatus',
  async ({ notificationId, status, response_message }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/`, {
        status,
        response_message,
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      // إذا كان API يدعم mark all as read endpoint
      // وإلا سنقوم بذلك من خلال تحديث كل إشعار على حدة
      const response = await api.post('/notifications/mark-all-read/');
      return response.data.data || response.data;
    } catch (error) {
      // إذا لم يكن الـ endpoint موجود، نعيد null وسنقوم بمعالجته في reducer
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  notifications: [],
  currentNotification: null,
  unreadCount: 0,
  loading: false,
  error: null,
  pagination: {
    count: 0,
    next: null,
    previous: null,
  },
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearCurrentNotification: (state) => {
      state.currentNotification = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        // إذا كانت الاستجابة paginated
        if (action.payload.results) {
          state.notifications = action.payload.results;
          state.pagination = {
            count: action.payload.count || 0,
            next: action.payload.next,
            previous: action.payload.previous,
          };
        } else {
          // إذا كانت قائمة عادية
          state.notifications = Array.isArray(action.payload) ? action.payload : [];
        }
        // حساب عدد غير المقروء
        state.unreadCount = state.notifications.filter((n) => !n.is_read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Notification By ID
      .addCase(fetchNotificationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentNotification = action.payload;
      })
      .addCase(fetchNotificationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark As Read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          const wasUnread = !state.notifications[index].is_read;
          state.notifications[index] = action.payload;
          // إذا كان الإشعار غير مقروء سابقاً وأصبح مقروءاً الآن، قلل العدد
          if (wasUnread && action.payload.is_read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
        if (state.currentNotification?.id === action.payload.id) {
          state.currentNotification = action.payload;
        }
      })
      // Update Status
      .addCase(updateNotificationStatus.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
        }
        if (state.currentNotification?.id === action.payload.id) {
          state.currentNotification = action.payload;
        }
      })
      // Mark All As Read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          is_read: true,
        }));
        state.unreadCount = 0;
      });
  },
});

export const {
  clearCurrentNotification,
  clearError,
  incrementUnreadCount,
  decrementUnreadCount,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
