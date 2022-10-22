import React from 'react';
import { Box, Center, Heading } from '@chakra-ui/layout';
import { Image } from '@chakra-ui/image';
import { FirebaseAuth } from 'react-firebaseui';
import { GoogleAuthProvider } from 'firebase/auth';
import { useUniversalColors } from '../hooks/color-mode';
import { auth } from '../utils/auth';

const FirebaseLoginButton: React.FC<{
  redirectUri: string;
  isLoading: boolean;
}> = ({ redirectUri }) => {
  const loginUiConfig: firebaseui.auth.Config = {
    signInFlow: 'redirect',
    signInSuccessUrl: redirectUri,
    signInOptions: [GoogleAuthProvider.PROVIDER_ID],
  };
  return <FirebaseAuth uiConfig={loginUiConfig} firebaseAuth={auth()} />;
};
export default function Login(props: {
  redirectUri: string;
  isLoading: boolean;
}): JSX.Element {
  const { background } = useUniversalColors();
  return (
    <>
      <Center h="100vh" bgSize="cover" bgPos="center" pos="relative">
        <Image
          src="/login.webp"
          loading="lazy"
          pos="absolute"
          top={0}
          w="full"
          h="full"
          objectFit="cover"
          left={0}
        />
        <Box pb="10" bg={background} p="5" rounded="base" opacity="0.95">
          <Heading textAlign="center" mb="3">
            ログイン
          </Heading>
          <FirebaseLoginButton
            redirectUri={props.redirectUri}
            isLoading={props.isLoading}
          />
        </Box>
      </Center>
    </>
  );
}
