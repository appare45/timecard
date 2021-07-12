import { createContext } from 'react';

export type authContext = {
  loginStatus: boolean;
  updateLoginStatus: () => void;
};

export const AuthContext = createContext<authContext>({
  loginStatus: false,
  updateLoginStatus: () => {
    return;
  },
});
