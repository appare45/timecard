import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router-dom';
import { account, AuthContext } from '../contexts/user';
import { Auth, firebase } from '../utils/firebase';
import { getUser, setUser } from '../utils/user';
import CreateCard from './createCard';
import GroupUI from './group';
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
  const [joinedGroups, updateJoinedGroups] = useState<string[]>([]);
  const [authData, setAuthData] = useState<firebase.User>();
  const [defaultName, setDefaultName] = useState<string | null>(null);
  const [accountStatus, updateAccountStatus] = useState<account>({
    name: null,
    id: null,
  });
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
              updateJoinedGroups(user.groupId ?? []);
              updateAccountStatus({
                name: user.name ?? account.displayName,
                id: account.uid,
              });
              setUser({ name: user.name }, account.uid, { merge: true });
            } else {
              updateAccountEnablement(false);
              setDefaultName(account.displayName);
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
        account: {
          name: accountStatus.name,
          id: accountStatus.id,
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
          <GroupUI groupIds={joinedGroups}>
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
          </GroupUI>
        </>
      )}
    </AuthContext.Provider>
  );
}
