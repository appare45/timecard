import React from 'react';
import {
  Box,
  Text,
  Link,
  Heading,
  Code,
  OrderedList,
  UnorderedList,
  ListItem,
} from '@chakra-ui/layout';
import { Image } from '@chakra-ui/image';
import { Suspense } from 'react';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { LoadingScreen } from './assets';

const ActivityMemo: React.FC<{ draftText: string }> = ({ draftText }) => {
  const ReactMarkdown = React.lazy(() => import('react-markdown'));
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Box
        border="2px"
        borderColor="black"
        borderStyle="solid"
        rounded="base"
        px="2"
        py="1"
        w="full"
        overflow="scroll"
      >
        <ReactMarkdown
          // eslint-disable-next-line react/no-children-prop
          children={draftText}
          skipHtml={true}
          rehypePlugins={[rehypeKatex]}
          remarkPlugins={[remarkBreaks, remarkMath]}
          components={{
            p({ children }) {
              return <Text lineHeight="7">{children}</Text>;
            },
            a({ children, href }) {
              return (
                <Link href={href} textDecoration="underline">
                  {children}
                </Link>
              );
            },
            h1({ children }) {
              return (
                <Heading size="lg" mb="2" mt="0.5">
                  {children}
                </Heading>
              );
            },
            h2({ children }) {
              return <Heading size="base">{children}</Heading>;
            },
            pre({ children }) {
              // eslint-disable-next-line react/no-children-prop
              return <Code children={children} my="2" />;
            },
            code({ children }) {
              // eslint-disable-next-line react/no-children-prop
              return <Code children={children} />;
            },
            ol({ children }) {
              return <OrderedList my="1">{children}</OrderedList>;
            },
            ul({ children }) {
              return <UnorderedList my="1">{children}</UnorderedList>;
            },
            li({ children }) {
              return <ListItem>{children}</ListItem>;
            },
            img({ src, alt }) {
              return (
                <Image src={src} alt={alt} boxSize="lg" objectFit="contain" />
              );
            },
          }}
        />
      </Box>
    </Suspense>
  );
};

export default ActivityMemo;
