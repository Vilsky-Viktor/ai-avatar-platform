import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ContextProvider, useApp } from './providers/ContextProvider';
import UserLayer from './layers/UserLayer';
import AuthLayer from './layers/AuthLayer';

const RootRouter = () => {
  const { user } = useApp();

  return (
    <Routes>
      {user ? (
        <Route path="/*" element={<UserLayer />} />
      ) : (
        <Route path="/auth/*" element={<AuthLayer />} />
      )}
      
      <Route 
        path="*" 
        element={<Navigate to={user ? "/" : "/auth/login"} replace />} 
      />
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