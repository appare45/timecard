import React, { useContext } from 'react';
import { Button } from '@chakra-ui/button';
import { AuthContext } from '../contexts/user';
import { auth } from '../utils/auth';

export default function Logout(props: {
  onSignOut?: () => void;
  onError?: (e: unknown) => void;
}): JSX.Element {
  const localAuthContext = useContext(AuthContext);
  return (
    <Button
      colorScheme="red"
      variant="link"
      onClick={() => {
        auth()
          .signOut()
          .then(() => {
            if (props.onSignOut) {
              props.onSignOut();
            }
            if (
              localAuthContext.loginStatus &&
              localAuthContext.loginStatus?.update
            ) {
              localAuthContext.loginStatus?.update(false);
              location.reload();
            }
          })
          .catch((e) => {
            if (props.onError) {
              props.onError(e);
            }
          });
      }}
    >
      ログアウト
    </Button>
  );
}
