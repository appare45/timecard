import React from 'react';
import { Button, ButtonProps } from '@chakra-ui/button';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
export const BackButton = (): JSX.Element => {
  const history = useNavigate();
  return (
    <Button
      leftIcon={<IoArrowBack />}
      onClick={() => history(-1)}
      variant="link"
      colorScheme="gray"
    >
      戻る
    </Button>
  );
};

export const BasicButton = (
  props: ButtonProps & { variant: 'primary' | 'secondary' } & {
    to?: unknown;
  }
): JSX.Element => (
  <Button {...props} variant={props.variant == 'primary' ? 'solid' : 'outline'}>
    {props.children}
  </Button>
);

export const CancelButton = (
  props: ButtonProps & { variant: 'primary' | 'secondary' }
): JSX.Element => (
  <Button
    {...props}
    colorScheme="red"
    variant={props.variant == 'primary' ? 'solid' : 'outline'}
  >
    {props.children}
  </Button>
);
