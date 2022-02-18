import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'green',
      },
    },
    Input: {
      defaultProps: {
        colorScheme: 'green',
      },
    },
  },
  initialColorMode: 'light',
  useSystemColorMode: false,
});

export default theme;
