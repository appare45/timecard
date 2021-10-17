import { ChakraProvider, Spinner } from '@chakra-ui/react';
import { enableIndexedDbPersistence } from 'firebase/firestore';
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import Offline from './pages/offline';
import { Db } from './utils/firebase';

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
  return (
    <ChakraProvider>
      <BrowserRouter>
        <div className="App">
          <RecoilRoot>
            <Suspense fallback={<Spinner />}>
              {navigator.onLine ? <UserUI /> : <Offline />}
            </Suspense>
          </RecoilRoot>
        </div>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
