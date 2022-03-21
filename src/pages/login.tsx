import React from 'react';
import { Box, Center, Heading, Text } from '@chakra-ui/layout';
import { Image } from '@chakra-ui/image';
import { IoLogoGoogle } from 'react-icons/io5';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  useDeviceLanguage,
} from 'firebase/auth';
import { useUniversalColors } from '../hooks/color-mode';
import { auth } from '../utils/auth';
import { Button } from '@chakra-ui/button';

const FirebaseAuth: React.FC<{ redirectUri: string; isLoading: boolean }> = ({
  redirectUri,
  isLoading,
}) => {
  const provider = new GoogleAuthProvider();
  useDeviceLanguage(auth());
  provider.setCustomParameters({
    redirect_uri: redirectUri,
  });
  return (
    <Button
      w={'full'}
      maxW={'md'}
      variant={'outline'}
      onClick={() => signInWithRedirect(auth(), provider)}
      leftIcon={<IoLogoGoogle />}
      isLoading={isLoading}
      colorScheme="gray"
    >
      <Center>
        <Text>Sign in with Google</Text>
      </Center>
    </Button>
  );
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
          <FirebaseAuth
            redirectUri={props.redirectUri}
            isLoading={props.isLoading}
          />
        </Box>
      </Center>
    </>
  );
}
