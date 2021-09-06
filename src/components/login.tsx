import React from 'react';
import {
  Box,
  Button,
  Center,
  Heading,
  Image,
  Link,
  Text,
} from '@chakra-ui/react';
import { IoLogoGoogle } from 'react-icons/io5';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  useDeviceLanguage,
} from 'firebase/auth';
import { app } from '../utils/firebase';

const FirebaseAuth: React.FC<{ redirectUri: string; isLoading: boolean }> = ({
  redirectUri,
  isLoading,
}) => {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  useDeviceLanguage(auth);
  provider.setCustomParameters({
    redirect_uri: redirectUri,
  });
  return (
    <Button
      leftIcon={<IoLogoGoogle />}
      colorScheme="blackAlpha"
      variant="outline"
      isLoading={isLoading}
      onClick={() => signInWithRedirect(auth, provider)}>
      Googleアカウントでログイン
    </Button>
  );
};

export default function Login(props: {
  redirectUri: string;
  isLoading: boolean;
}): JSX.Element {
  return (
    <>
      <Center h="100vh" bgSize="cover" bgPos="center" pos="relative">
        <Image
          src="/background.webp"
          loading="lazy"
          pos="absolute"
          top={0}
          w="full"
          h="full"
          objectFit="cover"
          left={0}
        />
        <Box pb="10" bg="whitesmoke" p="5" rounded="base" opacity="0.95">
          <Heading textAlign="center" mb="3">
            ログイン
          </Heading>
          <FirebaseAuth
            redirectUri={props.redirectUri}
            isLoading={props.isLoading}
          />
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
