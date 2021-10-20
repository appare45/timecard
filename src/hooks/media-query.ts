import { useMediaQuery } from '@chakra-ui/react';

export default function useIsMobile(): boolean {
  const [isMobile] = useMediaQuery('(max-width: 1280px)');
  return isMobile;
}
export function useIsPrint(): boolean {
  const [isPrint] = useMediaQuery('print');
  return isPrint;
}
