import {
  Avatar,
  Button,
  HStack,
  Popover,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Spinner,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { AuthContext } from '../contexts/user';
import { Auth, firebase } from '../utils/firebase';
import { getUser, setUser } from '../utils/user';
import GroupUI from './group';
import Login from './login';
import Logout from './logout';
import NewAccount from './new_account';

export default function User(props: {
  children: JSX.Element[] | JSX.Element;
  path: string;
}): JSX.Element {
  const [loginStatus, updateLoginStatus] = useState<boolean | null>(null);
  const [accountEnabled, updateAccountEnablement] = useState<boolean | null>(
    null
  );
  const [joinedGroups, updateJoinedGroups] = useState<string[]>([]);
  const [authData, setAuthData] = useState<firebase.User>();
  const [defaultName, setDefaultName] = useState<string | null>(null);
  const [accountStatus, updateAccountStatus] = useState<firebase.User>();
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
              updateAccountStatus(account);
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
        account: accountStatus ?? null,
      }}>
      {/* 読み込み中 */}
      {loginStatus === null && <Spinner />}
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
          <GroupUI groupIds={joinedGroups} />
          <HStack position="fixed" bottom="0" left="0" p="2">
            <Popover>
              <PopoverTrigger>
                <Button
                  size="lg"
                  leftIcon={
                    <Avatar
                      src={authData.photoURL ?? ''}
                      name={authData.displayName ?? ''}
                      size="sm"
                    />
                  }>
                  {authData.displayName}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  {authData.displayName}としてログイン中
                </PopoverHeader>
                <PopoverFooter>
                  <Logout />
                </PopoverFooter>
              </PopoverContent>
            </Popover>
          </HStack>
        </>
      )}
    </AuthContext.Provider>
  );
}
