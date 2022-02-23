import { ChakraProvider } from '@chakra-ui/react';
import { enableIndexedDbPersistence } from 'firebase/firestore';
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LoadingScreen } from './components/assets';
import Offline from './pages/offline';
import theme from './theme';
import { Db, isEmulator, isProduction } from './utils/firebase';
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
    if (isProduction)
      observeFps({
        description: `Build: ${import.meta.env.MODE} - ${
          isEmulator() ? 'emulator' : 'local'
        }`,
      });
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <div className="App">
          <Suspense fallback={<LoadingScreen />}>
            {navigator.onLine ? <UserUI /> : <Offline />}
          </Suspense>
        </div>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
