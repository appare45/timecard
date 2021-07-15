import React from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import Logout from './components/logout';
import User from './components/user';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="App">
        <User path="/">
          <Logout />
          <ul>
            <li>
              <Link to="/">トップ</Link>
            </li>
            <li>
              <Link to="/qr">QRコードをスキャンする</Link>
            </li>
            <li>
              <Link to="/create_card">カードを作成する</Link>
            </li>
          </ul>
        </User>
      </div>
    </BrowserRouter>
  );
}

export default App;
