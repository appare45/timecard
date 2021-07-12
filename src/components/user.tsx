import React, { useEffect, useState } from 'react';
import { AuthContext } from '../contexts/user';
import { Auth } from '../utils/firebase';
import Login from './login';

export default function User(props: {
  children: JSX.Element[];
  path: string;
}): JSX.Element {
  const [loginStatus, updateLoginStatus] = useState<boolean | null>(null);
  useEffect(() => {
    const unregisterAuthObserver = Auth.onAuthStateChanged((user) => {
      if (updateLoginStatus) {
        updateLoginStatus(user === null ? false : !!user);
      }
    });
    return unregisterAuthObserver;
  }, [updateLoginStatus]);
  return (
    <AuthContext.Provider value={{ loginStatus, updateLoginStatus }}>
      {loginStatus === false && <Login redirectPath={props.path} />}
      {loginStatus === true && props.children}
    </AuthContext.Provider>
  );
}
