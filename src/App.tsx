import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Logout from './components/logout';
import User from './components/user';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="App">
        <ChakraProvider>
          <User path="/">
            <Logout />
          </User>
        </ChakraProvider>
      </div>
    </BrowserRouter>
  );
}

export default App;
