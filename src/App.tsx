import { ChakraProvider, Spinner } from '@chakra-ui/react';
import React, { Suspense } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Offline from './pages/offline';

function App(): JSX.Element {
  const [isOffline, setIsOffline] = useState(navigator.onLine);
  useEffect(() => {
    window.addEventListener('offline', () => {
      setIsOffline(true);
    });
    window.addEventListener('online', () => {
      setIsOffline(false);
    });
  }, []);
  const UserUI = React.lazy(() => import('./components/user'));
  return (
    <BrowserRouter>
      <div className="App">
        <ChakraProvider>
          <Suspense fallback={<Spinner />}>
            {isOffline ? <UserUI /> : <Offline />}
          </Suspense>
        </ChakraProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
