import { Button } from '@chakra-ui/react';
import React, { useContext } from 'react';
import { AuthContext } from '../contexts/user';
import { Auth } from '../utils/firebase';
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
        Auth.signOut()
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
      }}>
      ログアウト
    </Button>
  );
}
