import React, { createContext } from 'react';

export type account = {
  id: string | null;
  name: string | null;
};

export const AuthContext = createContext<{
  loginStatus: {
    current: boolean | null;
    update?: React.Dispatch<React.SetStateAction<boolean | null>>;
  };
  accountEnablement: {
    current: boolean | null;
    update?: React.Dispatch<React.SetStateAction<boolean | null>>;
  };
  account: account;
}>({
  loginStatus: { current: false },
  accountEnablement: { current: false },
  account: { id: null, name: null },
});
