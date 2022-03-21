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
    Checkbox: {
      defaultProps: {
        colorScheme: 'green',
      },
    },
  },
  initialColorMode: 'light',
  useSystemColorMode: true,
});

export default theme;
