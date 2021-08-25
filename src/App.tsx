import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Logout from './components/logout';
import User from './components/user';
import Offline from './pages/offline';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="App">
        <ChakraProvider>
          <Switch>
            <Route exact path="/">
              <User path="/">
                <Logout />
              </User>
            </Route>
            <Route path="/offline">
              <Offline />
            </Route>
          </Switch>
        </ChakraProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
