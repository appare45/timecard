import { Button } from '@chakra-ui/button';
import { HStack, Heading, Spacer, Box } from '@chakra-ui/layout';
import React, { ReactElement } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { useHistory } from 'react-router';
import { SideWidget } from '../components/assets';

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
      {displayGoBackButton && history.length > 0 && (
        <Button
          leftIcon={<IoArrowBack />}
          onClick={() => history.goBack()}
          variant="link"
        >
          戻る
        </Button>
      )}
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
