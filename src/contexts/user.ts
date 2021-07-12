import React, { createContext } from 'react';

export const AuthContext = createContext<{
  loginStatus: boolean | null;
  updateLoginStatus?: React.Dispatch<React.SetStateAction<boolean | null>>;
}>({
  loginStatus: false,
});
