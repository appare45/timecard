import { HStack, Heading, Spacer, Box } from '@chakra-ui/layout';
import React, { ReactElement } from 'react';
import { useHistory } from 'react-router';
import { SideWidget } from '../components/assets';
import { BackButton } from './../components/buttons';

export const GroupTemplate: React.FC<{
  title: string;
  titleLeftButtons?: React.ReactElement;
  displayGoBackButton?: boolean;
  sideWidget?: ReactElement;
  children: ReactElement | ReactElement[];
}> = ({
  title,
  titleLeftButtons,
  displayGoBackButton,
  sideWidget,
  children,
}) => {
  const history = useHistory();
  return (
    <>
      {displayGoBackButton && history.length > 0 && <BackButton />}
      <HStack w="full">
        <Heading>{title}</Heading>
        <Spacer />
        {titleLeftButtons}
      </HStack>
      <HStack align="flex-start">
        <Box flexGrow={1}>{children}</Box>
        {sideWidget && <SideWidget>{sideWidget}</SideWidget>}
      </HStack>
    </>
  );
};
