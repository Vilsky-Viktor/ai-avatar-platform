import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ContextProvider, useApp } from './providers/ContextProvider';
import UserLayer from './layers/UserLayer';
import AuthLayer from './layers/AuthLayer';

const RootRouter = () => {
  const { user, loading } = useApp();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-base-100">...</div>;

  return (
    <Routes>
      {user ? (
        <>
          <Route path="/auth/*" element={<Navigate to="/" replace />} />
          <Route path="/*" element={<UserLayer />} />
        </>
      ) : (
        <>
          <Route path="/auth/*" element={<AuthLayer />} />
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </>
      )}
    </Routes>
  );
};

function App() {
  return (
    <ContextProvider>
      <BrowserRouter>
        <RootRouter />
      </BrowserRouter>
    </ContextProvider>
  );
}

export default App;