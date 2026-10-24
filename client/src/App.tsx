import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppLayout } from './components/common/AppLayout.js';
import { LandingPage } from './pages/LandingPage.js';
import { CreateJoinPage } from './pages/CreateJoinPage.js';
import { RoomPage } from './pages/RoomPage.js';
import { useAuthStore } from './store/useAuthStore.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/create" element={<CreateJoinPage initialTab="create" />} />
            <Route path="/join" element={<CreateJoinPage initialTab="join" />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <Toaster position="bottom-right" theme="dark" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
