import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunk لإرسال تذكرة دعم مع جميع الحقول
export const createSupportTicket = createAsyncThunk(
  'support/createSupportTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      // إرسال البيانات كاملة كما هي
      const response = await api.post('/support/tickets/', ticketData);
      // إعادة البيانات أو الـ id للنجاح
      return response.data.data || response.data;
    } catch (error) {
      // إرجاع الخطأ كما هو من السيرفر
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  success: false,
  ticketId: null,
  lastTicketData: null, // حفظ آخر بيانات أرسلت في حال تريد عرضها لاحقاً
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.ticketId = null;
      state.lastTicketData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Pending
      .addCase(createSupportTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      // Fulfilled
      .addCase(createSupportTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // استخدام id من السيرفر إذا متوفر
        state.ticketId = action.payload?.id || action.payload?.ticket_id || null;
        // حفظ البيانات المرسلة (اختياري)
        state.lastTicketData = action.meta.arg;
      })
      // Rejected
      .addCase(createSupportTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'حدث خطأ غير معروف';
        state.success = false;
      });
  },
});

export const { clearError, clearSuccess } = supportSlice.actions;
export default supportSlice.reducer;



