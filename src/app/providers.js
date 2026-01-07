'use client';

import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from '@/store/store';
import { initializeAuth } from '@/store/slices/authSlice';

function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // تهيئة بيانات المصادقة من localStorage بعد تحميل الصفحة
    dispatch(initializeAuth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}

