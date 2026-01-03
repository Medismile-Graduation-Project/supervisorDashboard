import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axios';

// Async Thunk لإرسال تذكرة دعم
export const createSupportTicket = createAsyncThunk(
  'support/createSupportTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const response = await api.post('/support/tickets/', ticketData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  success: false,
  ticketId: null,
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
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Support Ticket
      .addCase(createSupportTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createSupportTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.ticketId = action.payload?.id || action.payload?.ticket_id || null;
      })
      .addCase(createSupportTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { clearError, clearSuccess } = supportSlice.actions;
export default supportSlice.reducer;

