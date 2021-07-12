import React from 'react';
import { BrowserRouter, Link, Route, Switch } from 'react-router-dom';
import CreateCard from './components/createCard';
import Login from './components/login';
import QRCodeScan from './components/qrcodeScan';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="App">
        <Login redirectPath="/" />
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
        <Switch>
          <Route path="/qr">
            <QRCodeScan />
          </Route>
          <Route path="/create_card">
            <CreateCard />
          </Route>
        </Switch>
      </div>
    </BrowserRouter>
  );
}

export default App;
