import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const fetchThreads = createAsyncThunk(
  'messaging/fetchThreads',
  async (params = {}, { rejectWithValue }) => {
    try {
      // إزالة فرض thread_type (API يجيب thread_type: 'case')
      const filteredParams = {
        ...params,
      };
      
      const response = await api.get('/messaging/threads/', { params: filteredParams });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchThreadById = createAsyncThunk(
  'messaging/fetchThreadById',
  async (threadId, { rejectWithValue }) => {
    try {
      // جلب معلومات الـ thread فقط (بدون params للرسائل)
      const response = await api.get(`/messaging/threads/${threadId}/`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// جلب الرسائل بشكل منفصل مع pagination أفضل
export const fetchMessages = createAsyncThunk(
  'messaging/fetchMessages',
  async ({ threadId, limit = 20, cursor = null }, { rejectWithValue }) => {
    try {
      const params = { limit };
      if (cursor) {
        params.cursor = cursor;
      }
      
      const response = await api.get(`/messaging/threads/${threadId}/messages/`, { params });
      return {
        data: response.data.data || response.data,
        threadId,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async ({ threadId, content, message_type = 'text' }, { rejectWithValue }) => {
    try {
      const payload = {
        content: content.trim(),
        message_type,
      };
      
      const response = await api.post(`/messaging/threads/${threadId}/messages/`, payload);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  'messaging/markMessageAsRead',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/messaging/messages/${messageId}/read/`, {
        is_read: true,
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  threads: [],
  currentThread: null,
  messages: [],
  messagesCursor: null,
  messagesCount: 0,
  totalUnreadCount: 0, // العدد الإجمالي للرسائل غير المقروءة
  loading: false,
  sending: false,
  error: null,
};

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    clearCurrentThread: (state) => {
      state.currentThread = null;
      state.messages = [];
      state.messagesCursor = null;
      state.messagesCount = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
    addMessage: (state, action) => {
      // إضافة رسالة جديدة في نهاية القائمة (الأحدث في الأسفل)
      state.messages.push(action.payload);
      state.messagesCount += 1;
    },
    updateMessageReadStatus: (state, action) => {
      const message = state.messages.find((m) => m.id === action.payload.id);
      if (message) {
        message.is_read = action.payload.is_read;
        message.read_at = action.payload.read_at;
      }
    },
    // WebSocket actions
    websocketMessageReceived: (state, action) => {
      const { event, data: messageData } = action.payload;
      
      if (event === 'message.created') {
        // استخراج بيانات الرسالة (قد تكون في data أو message)
        const message = messageData.message || messageData.data || messageData;
        const threadId = message.thread_id || messageData.thread_id;
        
        if (!message.id || !threadId) return;
        
        // إضافة رسالة جديدة إلى المحادثة المفتوحة
        const messageExists = state.messages.some(msg => msg.id === message.id);
        if (!messageExists && threadId === state.currentThread?.id) {
          state.messages.push(message);
          state.messagesCount += 1;
        }
        
        // تحديث last_message في جميع threads
        state.threads.forEach(thread => {
          if (thread.id === threadId) {
            thread.last_message = message;
            // إذا لم تكن المحادثة المفتوحة حالياً، زيادة unread_count
            if (thread.id !== state.currentThread?.id) {
              thread.unread_count = (thread.unread_count || 0) + 1;
            }
          }
        });
        
        // تحديث totalUnreadCount
        state.totalUnreadCount = state.threads.reduce((total, t) => {
          return total + (t.unread_count || 0);
        }, 0);
      } else if (event === 'message.read') {
        // استخراج بيانات القراءة
        const messageId = messageData.message_id || messageData.id;
        const threadId = messageData.thread_id;
        const readAt = messageData.read_at;
        
        if (!messageId || !threadId) return;
        
        // تحديث حالة القراءة في الرسالة
        const message = state.messages.find((m) => m.id === messageId);
        if (message) {
          message.is_read = true;
          if (readAt) {
            message.read_at = readAt;
          }
        }
        
        // تحديث unread_count في thread
        const thread = state.threads.find(t => t.id === threadId);
        if (thread && thread.unread_count > 0) {
          thread.unread_count = Math.max(0, thread.unread_count - 1);
        }
        
        // تحديث totalUnreadCount
        state.totalUnreadCount = state.threads.reduce((total, t) => {
          return total + (t.unread_count || 0);
        }, 0);
      } else if (event === 'thread.closed') {
        // استخراج thread_id
        const threadId = messageData.thread_id || messageData.id;
        
        if (!threadId) return;
        
        // تحديث حالة thread
        const thread = state.threads.find(t => t.id === threadId);
        if (thread) {
          thread.is_closed = true;
        }
        if (state.currentThread?.id === threadId) {
          state.currentThread.is_closed = true;
        }
      }
    },
    updateThreadLastMessage: (state, action) => {
      const { threadId, message } = action.payload;
      const thread = state.threads.find(t => t.id === threadId);
      if (thread) {
        thread.last_message = message;
        thread.last_message.created_at = message.created_at;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Threads
      .addCase(fetchThreads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreads.fulfilled, (state, action) => {
        state.loading = false;
        // معالجة pagination response: { count, next_cursor, results }
        if (action.payload.results) {
          state.threads = action.payload.results;
        } else if (Array.isArray(action.payload)) {
          state.threads = action.payload;
        } else {
          state.threads = [];
        }
        // حساب العدد الإجمالي للرسائل غير المقروءة
        // إذا كان API يعيد unread_count، نستخدمه، وإلا نحسبه من الرسائل
        state.totalUnreadCount = state.threads.reduce((total, thread) => {
          if (thread.unread_count !== undefined && thread.unread_count !== null) {
            return total + thread.unread_count;
          }
          // إذا لم يكن unread_count موجوداً، نحسبه من الرسائل (إذا كانت موجودة)
          // لكن عادة API يجب أن يعيد unread_count
          return total;
        }, 0);
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Thread By ID
      .addCase(fetchThreadById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThreadById.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        
        // حسب التوثيق: GET /threads/{id}/ يعيد { thread: Thread, messages: {...} }
        if (payload.thread) {
          state.currentThread = payload.thread;
          // معالجة messages إذا كانت موجودة (للتوافق مع API)
          if (payload.messages) {
            state.messages = payload.messages.results || [];
            state.messagesCursor = payload.messages.next_cursor || null;
            state.messagesCount = payload.messages.count || 0;
          }
        } else {
          // fallback: إذا كان response مباشر (Thread object)
          state.currentThread = payload;
        }
      })
      .addCase(fetchThreadById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Messages
      .addCase(fetchMessages.pending, (state, action) => {
        // إذا كان هناك cursor، فهذا يعني تحميل المزيد (لا نعيد تعيين loading)
        if (!action.meta.arg.cursor) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload.data;
        const hasCursor = action.meta.arg.cursor;
        const newMessages = payload.results || [];
        
        if (hasCursor) {
          // تحميل المزيد: دمج الرسائل القديمة في البداية (الأقدم أولاً)
          state.messages = [...newMessages, ...state.messages];
        } else {
          // تحميل أولي أو تحديث: دمج الرسائل الجديدة مع الحالية (تجنب التكرار)
          const existingIds = new Set(state.messages.map(msg => msg.id));
          const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
          
          if (uniqueNewMessages.length > 0) {
            // إضافة الرسائل الجديدة في النهاية (الأحدث في الأسفل)
            state.messages = [...state.messages, ...uniqueNewMessages];
            // ترتيب الرسائل حسب التاريخ
            state.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          } else if (state.messages.length === 0) {
            // إذا لم تكن هناك رسائل، نستخدم الرسائل الجديدة
            state.messages = newMessages;
          }
        }
        
        state.messagesCursor = payload.next_cursor || null;
        state.messagesCount = payload.count || 0;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        // إضافة الرسالة الجديدة في نهاية القائمة (الأحدث في الأسفل)
        // التحقق من عدم وجود الرسالة مسبقاً (لتجنب التكرار)
        const messageExists = state.messages.some(msg => msg.id === action.payload.id);
        if (!messageExists) {
          state.messages.push(action.payload);
          state.messagesCount += 1;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload;
      })
      // Mark Message As Read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const message = state.messages.find((m) => m.id === action.payload.id);
        if (message) {
          message.is_read = action.payload.is_read;
          message.read_at = action.payload.read_at;
        }
        // تحديث العدد الإجمالي للرسائل غير المقروءة
        if (action.payload.is_read && state.currentThread) {
          const thread = state.threads.find(t => t.id === state.currentThread.id);
          if (thread && thread.unread_count > 0) {
            thread.unread_count = Math.max(0, thread.unread_count - 1);
            state.totalUnreadCount = state.threads.reduce((total, t) => {
              return total + (t.unread_count || 0);
            }, 0);
          }
        }
      });
  },
});

export const { 
  clearCurrentThread, 
  clearError, 
  addMessage, 
  updateMessageReadStatus,
  websocketMessageReceived,
  updateThreadLastMessage,
} = messagingSlice.actions;
export default messagingSlice.reducer;

