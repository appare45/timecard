import React, { createContext } from 'react';
import firebase from 'firebase/compat';

export const AuthContext = createContext<{
  loginStatus: {
    current: boolean | null;
    update?: React.Dispatch<React.SetStateAction<boolean | null>>;
  };
  accountEnablement: {
    current: boolean | null;
    update?: React.Dispatch<React.SetStateAction<boolean | null>>;
  };
  account: firebase.User | null;
}>({
  loginStatus: { current: false },
  accountEnablement: { current: false },
  account: null,
});
