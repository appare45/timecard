import React, { createContext } from 'react';
import { User } from 'firebase/auth';

export const AuthContext = createContext<{
  loginStatus: {
    current: boolean | null;
    update?: React.Dispatch<React.SetStateAction<boolean | null>>;
  };
  accountEnablement: {
    current: boolean | null;
    update?: React.Dispatch<React.SetStateAction<boolean | null>>;
  };
  account: User | null;
}>({
  loginStatus: { current: false },
  accountEnablement: { current: false },
  account: null,
});
