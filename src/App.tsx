import { ChakraProvider, Spinner } from '@chakra-ui/react';
import { enableIndexedDbPersistence } from 'firebase/firestore';
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Offline from './pages/offline';
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
  }, []);
  useEffect(() => {
    if (window.location.hostname !== process.env.REACT_APP_URL) observeFps();
    console.info(window.location.origin, process.env.REACT_APP_URL);
  });
  return (
    <ChakraProvider>
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
