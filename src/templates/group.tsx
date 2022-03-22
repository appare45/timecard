import { HStack, Heading, Spacer, Box, Text } from '@chakra-ui/layout';
import React, { ReactElement } from 'react';
import { useNavigate } from 'react-router';
import { SideWidget } from '../components/assets';
import { BackButton } from './../components/buttons';

export const GroupTemplate: React.FC<{
  title: string;
  titleLeftButtons?: React.ReactElement;
  displayGoBackButton?: boolean;
  sideWidget?: ReactElement;
  children: ReactElement | ReactElement[];
  description?: string;
}> = ({
  title,
  titleLeftButtons,
  displayGoBackButton,
  sideWidget,
  description,
  children,
}) => {
  const history = useNavigate();
  return (
    <>
      {displayGoBackButton && history.length > 0 && <BackButton />}
      <HStack w="full" alignItems="baseline" mb="5">
        <Heading>{title}</Heading>
        <Text>{description}</Text>
        <Spacer />
        {titleLeftButtons}
      </HStack>
      <HStack align="flex-start" position="relative">
        <Box flexGrow={1}>{children}</Box>
        {sideWidget && <SideWidget>{sideWidget}</SideWidget>}
      </HStack>
    </>
  );
};
