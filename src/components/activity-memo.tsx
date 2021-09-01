import {
  Box,
  Code,
  Heading,
  Link,
  ListItem,
  OrderedList,
  Skeleton,
  Text,
  UnorderedList,
} from '@chakra-ui/react';
import React from 'react';
import { Suspense } from 'react';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

const ActivityMemo: React.FC<{ draftText: string }> = ({ draftText }) => {
  const ReactMarkdown = React.lazy(() => import('react-markdown'));
  return (
    <Suspense fallback={<Skeleton />}>
      <Box
        border="2px"
        borderColor="black"
        borderStyle="solid"
        rounded="base"
        px="2"
        py="1">
        <ReactMarkdown
          // eslint-disable-next-line react/no-children-prop
          children={draftText}
          skipHtml={true}
          rehypePlugins={[rehypeKatex]}
          remarkPlugins={[remarkBreaks, remarkMath]}
          components={{
            p({ children }) {
              return <Text>{children}</Text>;
            },
            a({ children, href }) {
              return (
                <Link href={href} textDecoration="underline">
                  {children}
                </Link>
              );
            },
            h1({ children }) {
              return <Heading size="2xl">{children}</Heading>;
            },
            h2({ children }) {
              return <Heading size="xl">{children}</Heading>;
            },
            pre({ children }) {
              return <Code>{children}</Code>;
            },
            ol({ children }) {
              return <OrderedList>{children}</OrderedList>;
            },
            ul({ children }) {
              return <UnorderedList>{children}</UnorderedList>;
            },
            li({ children }) {
              return <ListItem>{children}</ListItem>;
            },
          }}
        />
      </Box>
    </Suspense>
  );
};

export default ActivityMemo;
