import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import casesSlice from './slices/casesSlice';
import sessionsSlice from './slices/sessionsSlice';
import appointmentsSlice from './slices/appointmentsSlice';
import evaluationsSlice from './slices/evaluationsSlice';
import contentSlice from './slices/contentSlice';
import reportsSlice from './slices/reportsSlice';
import notificationsSlice from './slices/notificationsSlice';
import supportSlice from './slices/supportSlice';
import messagingSlice from './slices/messagingSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    cases: casesSlice,
    sessions: sessionsSlice,
    appointments: appointmentsSlice,
    evaluations: evaluationsSlice,
    content: contentSlice,
    reports: reportsSlice,
    notifications: notificationsSlice,
    support: supportSlice,
    messaging: messagingSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// Type definitions for TypeScript (if needed in the future)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

