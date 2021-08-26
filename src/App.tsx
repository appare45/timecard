import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Logout from './components/logout';
import User from './components/user';
import Offline from './pages/offline';

function App(): JSX.Element {
  const [isOffline, setIsOffline] = useState(navigator.onLine);
  useEffect(() => {
    setIsOffline(navigator.onLine);
  }, []);
  return (
    <BrowserRouter>
      <div className="App">
        <ChakraProvider>
          {isOffline ? (
            <User path="/">
              <Logout />
            </User>
          ) : (
            <Offline />
          )}
        </ChakraProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
