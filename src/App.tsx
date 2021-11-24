import { ChakraProvider, Spinner } from '@chakra-ui/react';
import { enableIndexedDbPersistence } from 'firebase/firestore';
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Offline from './pages/offline';
import theme from './theme';
import { Db } from './utils/firebase';
import { observeFps } from './utils/fps-observe';

function App(): JSX.Element {
  const UserUI = React.lazy(() => import('./components/user'));
  // オフライン接続対応
  useEffect(() => {
    enableIndexedDbPersistence(Db())
      .then(() => {
        console.info('Offline connection enabled');
      })
      .catch((error) => {
        console.error(error);
      });
    if (import.meta.env.DEV) observeFps();
  }, []);
  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <div className="App">
          <Suspense fallback={<Spinner />}>
            {navigator.onLine ? <UserUI /> : <Offline />}
          </Suspense>
        </div>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
