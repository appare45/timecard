import React from 'react';
import * as firebaseui from 'firebaseui';
import { FirebaseAuth } from 'react-firebaseui';
import { Auth, firebase } from './../utils/firebase';
import { Box, Center, Heading, Link, Text } from '@chakra-ui/react';
export default function Login(props: { redirectPath: string }): JSX.Element {
  const firebaseUiConfig: firebaseui.auth.Config = {
    credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
    signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
    signInSuccessUrl: `${process.env.REACT_APP_URL}${props.redirectPath}`,
  };
  return (
    <>
      <Center
        h="100vh"
        bgImage="/background.webp"
        bgSize="cover"
        bgPos="center">
        <Box pb="10" bg="whitesmoke" p="5" rounded="base" opacity="0.95">
          <Heading textAlign="center" mb="3">
            ログイン
          </Heading>
          <FirebaseAuth uiConfig={firebaseUiConfig} firebaseAuth={Auth} />
        </Box>
      </Center>
      <Box pos="fixed" bottom="10px" left="10px" fontSize="sm">
        <Text>＊画像はイメージです</Text>
        <Text>
          Photo by{' '}
          <Link href="https://unsplash.com/@sunday_digital?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">
            Nastuh Abootalebi
          </Link>{' '}
          on{' '}
          <Link href="https://unsplash.com/s/photos/office?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">
            Unsplash
          </Link>
        </Text>
      </Box>
    </>
  );
}
