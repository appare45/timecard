import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router-dom';
import { AuthContext } from '../contexts/user';
import { Auth, firebase } from '../utils/firebase';
import { getUser, setUser } from '../utils/user';
import CreateCard from './createCard';
import Login from './login';
import NewAccount from './new_account';
import QRCodeScan from './qrcodeScan';

export default function User(props: {
  children: JSX.Element[];
  path: string;
}): JSX.Element {
  const [loginStatus, updateLoginStatus] = useState<boolean | null>(null);
  const [accountEnabled, updateAccountEnablement] = useState<boolean | null>(
    null
  );
  const [authData, setAuthData] = useState<firebase.User>();
  const [defaultName, setDefaultName] = useState<string>('新規ユーザー');
  useEffect(() => {
    const unregisterAuthObserver = Auth.onAuthStateChanged((account) => {
      if (updateLoginStatus) {
        updateLoginStatus(account === null ? false : true);
      }
      if (account) {
        setAuthData(account);
        getUser(account.uid)
          .then((user) => {
            if (user) {
              updateAccountEnablement(true);
              setUser({ name: user.name }, account.uid);
            } else {
              updateAccountEnablement(false);
              if (account.displayName) {
                setDefaultName(account.displayName);
              }
            }
          })
          .catch((e) => {
            console.error(e);
          });
      }
    });
    return unregisterAuthObserver;
  }, [updateLoginStatus]);
  return (
    <AuthContext.Provider
      value={{
        loginStatus: {
          current: loginStatus,
          update: updateLoginStatus,
        },
        accountEnablement: {
          current: accountEnabled,
          update: updateAccountEnablement,
        },
      }}>
      {/* 未ログイン時 */}
      {loginStatus === false && !authData && (
        <Login redirectPath={props.path} />
      )}
      {/* ログイン後アカウント未登録時 */}
      {accountEnabled === false && authData && (
        <NewAccount name={defaultName} id={authData.uid} />
      )}
      {/* ログイン・アカウント登録済 */}
      {loginStatus === true && authData && accountEnabled && (
        <>
          <Switch>
            <Route path="/qr">
              <QRCodeScan />
            </Route>
            <Route path="/create_card">
              <CreateCard />
            </Route>
          </Switch>
          {props.children}
        </>
      )}
    </AuthContext.Provider>
  );
}
