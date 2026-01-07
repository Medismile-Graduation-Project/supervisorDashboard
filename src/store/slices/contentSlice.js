import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunks
export const fetchPendingContent = createAsyncThunk(
  'content/fetchPendingContent',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/community/posts/pending/', { params });
      return response.data.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchApprovedContent = createAsyncThunk(
  'content/fetchApprovedContent',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      // جلب المنشورات الموافق عليها - endpoint يعيد فقط المنشورات الموافق عليها
      const state = getState();
      const user = state.auth.user;
      
      const queryParams = {
        ...params,
      };
      
      // إضافة university_id للفلترة إذا كان متوفراً
      if (user?.university) {
        queryParams.university_id = user.university;
      }
      
      const response = await api.get('/community/posts/', { params: queryParams });
      return response.data.data || response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const approveContent = createAsyncThunk(
  'content/approveContent',
  async (contentId, { rejectWithValue }) => {
    try {
      // الموافقة على المنشور - لا يحتاج body
      const response = await api.post(`/community/posts/${contentId}/approve/`);
      return response.data.data || response.data;
    } catch (error) {
      // تحسين معالجة الخطأ لعرض errors بشكل صحيح
      const errorData = error.response?.data || {};
      return rejectWithValue({
        message: errorData.message || error.message,
        error: errorData.error || error.message,
        errors: errorData.errors || (typeof errorData.errors === 'string' ? errorData.errors : null),
        ...errorData,
      });
    }
  }
);

export const rejectContent = createAsyncThunk(
  'content/rejectContent',
  async ({ contentId, reason }, { rejectWithValue }) => {
    try {
      // رفض المنشور - يحتاج reason في body
      const response = await api.post(`/community/posts/${contentId}/reject/`, {
        reason: reason || '',
      });
      return response.data.data || response.data;
    } catch (error) {
      // تحسين معالجة الخطأ لعرض errors بشكل صحيح
      const errorData = error.response?.data || {};
      return rejectWithValue({
        message: errorData.message || error.message,
        error: errorData.error || error.message,
        errors: errorData.errors || (typeof errorData.errors === 'string' ? errorData.errors : null),
        ...errorData,
      });
    }
  }
);

// إضافة وظائف جديدة
export const reactToPost = createAsyncThunk(
  'content/reactToPost',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/community/posts/${postId}/react/`);
      return { postId, ...response.data.data || response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPostComments = createAsyncThunk(
  'content/fetchPostComments',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/community/posts/${postId}/comments/`);
      return { postId, comments: response.data.data || response.data || [] };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addComment = createAsyncThunk(
  'content/addComment',
  async ({ postId, text }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/community/posts/${postId}/comments/`, {
        text: text || '',
      });
      return { postId, comment: response.data.data || response.data };
    } catch (error) {
      const errorData = error.response?.data || {};
      return rejectWithValue({
        message: errorData.message || error.message,
        error: errorData.error || error.message,
        errors: errorData.errors || (typeof errorData.errors === 'string' ? errorData.errors : null),
        ...errorData,
      });
    }
  }
);

const initialState = {
  pendingContent: [],
  approvedContent: [], // المنشورات الموافق عليها
  loading: false,
  error: null,
  likedPosts: {}, // لتتبع المنشورات المعجبة { postId: true/false }
};

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Pending Content
      .addCase(fetchPendingContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingContent.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingContent = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchPendingContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Approved Content
      .addCase(fetchApprovedContent.pending, (state) => {
        // لا نغير loading هنا لأن fetchPendingContent قد يكون نشطاً
        state.error = null;
      })
      .addCase(fetchApprovedContent.fulfilled, (state, action) => {
        state.approvedContent = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchApprovedContent.rejected, (state, action) => {
        state.error = action.payload;
        // في حالة الخطأ، نترك approvedContent فارغاً
        state.approvedContent = [];
      })
      // Approve Content
      .addCase(approveContent.fulfilled, (state, action) => {
        state.pendingContent = state.pendingContent.filter(
          (c) => c.id !== action.payload.id
        );
      })
      // Reject Content
      .addCase(rejectContent.fulfilled, (state, action) => {
        state.pendingContent = state.pendingContent.filter(
          (c) => c.id !== action.payload.id
        );
      })
      // React to Post
      .addCase(reactToPost.fulfilled, (state, action) => {
        const { postId, liked } = action.payload;
        if (postId) {
          state.likedPosts[postId] = liked;
          // تحديث حالة الإعجاب في المنشور إذا كان موجوداً (في pending أو approved)
          const pendingPost = state.pendingContent.find((p) => p.id === postId);
          const approvedPost = state.approvedContent.find((p) => p.id === postId);
          const post = pendingPost || approvedPost;
          if (post) {
            post.liked = liked;
            post.likes_count = liked 
              ? (post.likes_count || 0) + 1 
              : Math.max(0, (post.likes_count || 0) - 1);
          }
        }
      })
      // Fetch Post Comments
      .addCase(fetchPostComments.fulfilled, (state, action) => {
        const { postId, comments } = action.payload;
        // تحديث التعليقات في المنشور (في pending أو approved)
        const pendingPost = state.pendingContent.find((p) => p.id === postId);
        const approvedPost = state.approvedContent.find((p) => p.id === postId);
        const post = pendingPost || approvedPost;
        if (post) {
          post.comments = Array.isArray(comments) ? comments : [];
          post.comments_count = post.comments.length;
        }
      })
      // Add Comment
      .addCase(addComment.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        // تحديث المنشور بإضافة التعليق الجديد (في pending أو approved)
        const pendingPost = state.pendingContent.find((p) => p.id === postId);
        const approvedPost = state.approvedContent.find((p) => p.id === postId);
        const post = pendingPost || approvedPost;
        if (post) {
          if (!post.comments) {
            post.comments = [];
          }
          post.comments.push(comment);
          post.comments_count = (post.comments_count || 0) + 1;
        }
      });
  },
});

export const { clearError } = contentSlice.actions;
export default contentSlice.reducer;


