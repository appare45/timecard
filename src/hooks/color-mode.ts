import { useColorModeValue } from '@chakra-ui/react';

interface universalColor {
  background: string;
  component_background: string;
  foreground: string;
  component_foreground: string;
}

export const useUniversalColors = (): universalColor => ({
  background: useColorModeValue('white', 'black'),
  component_background: useColorModeValue('white', 'black'),
  foreground: useColorModeValue('black', 'white'),
  component_foreground: useColorModeValue('black', 'white'),
});
