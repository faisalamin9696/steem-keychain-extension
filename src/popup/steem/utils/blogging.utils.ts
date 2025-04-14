import { Key, TransactionOptions } from '@interfaces/keys.interface';
import { SteemTxUtils } from '@popup/steem/utils/steem-tx.utils';
import {
  CommentOperation,
  CommentOptionsOperation,
  VoteOperation,
} from '@steempro/dsteem';

const vote = (
  voter: string,
  author: string,
  permlink: string,
  weight: number,
  privateKey: Key,
  options?: TransactionOptions,
) => {
  return SteemTxUtils.sendOperation(
    [BloggingUtils.getVoteOperation(voter, author, permlink, weight)],
    privateKey,
    false,
    options,
  );
};
const post = async (
  parentUsername: string,
  parentPerm: string,
  author: string,
  permlink: string,
  title: string,
  body: string,
  stringifyMetadata: string,
  key: Key,
  options?: TransactionOptions,
) => {
  return SteemTxUtils.sendOperation(
    [
      BloggingUtils.getPostOperation(
        parentUsername,
        parentPerm,
        author,
        permlink,
        title,
        body,
        stringifyMetadata,
      ),
    ],
    key,
    false,
    options,
  );
};

const comment = async (
  parentUsername: string,
  parentPerm: string,
  author: string,
  permlink: string,
  title: string,
  body: string,
  stringifyMetadata: string,
  stringifyCommentOptions: string,
  key: Key,
  options?: TransactionOptions,
) => {
  return SteemTxUtils.sendOperation(
    BloggingUtils.getCommentOperation(
      parentUsername,
      parentPerm,
      author,
      permlink,
      title,
      body,
      stringifyMetadata,
      stringifyCommentOptions,
    ),
    key,
    false,
    options,
  );
};

const getCommentTransaction = (
  parentUsername: string,
  parentPerm: string,
  author: string,
  permlink: string,
  title: string,
  body: string,
  stringifyMetadata: string,
  stringifyCommentOptions: string,
) => {
  return SteemTxUtils.createTransaction(
    BloggingUtils.getCommentOperation(
      parentUsername,
      parentPerm,
      author,
      permlink,
      title,
      body,
      stringifyMetadata,
      stringifyCommentOptions,
    ),
  );
};

const getVoteTransaction = (
  voter: string,
  author: string,
  permlink: string,
  weight: number,
) => {
  return SteemTxUtils.createTransaction([
    BloggingUtils.getVoteOperation(voter, author, permlink, weight),
  ]);
};

const getPostTransaction = (
  parentUsername: string,
  parentPerm: string,
  author: string,
  permlink: string,
  title: string,
  body: string,
  stringifyMetadata: string,
) => {
  return SteemTxUtils.createTransaction([
    BloggingUtils.getPostOperation(
      parentUsername,
      parentPerm,
      author,
      permlink,
      title,
      body,
      stringifyMetadata,
    ),
  ]);
};

const getCommentOperation = (
  parentUsername: string,
  parentPerm: string,
  author: string,
  permlink: string,
  title: string,
  body: string,
  stringifyMetadata: string,
  stringifyCommentOptions: string,
) => {
  return [
    [
      'comment',
      {
        parent_author: parentUsername,
        parent_permlink: parentPerm,
        author: author,
        permlink: permlink,
        title: title,
        body: body,
        json_metadata: stringifyMetadata,
      },
    ] as CommentOperation,
    [
      'comment_options',
      JSON.parse(stringifyCommentOptions),
    ] as CommentOptionsOperation,
  ];
};

const getVoteOperation = (
  voter: string,
  author: string,
  permlink: string,
  weight: number,
) => {
  return [
    'vote',
    {
      voter: voter,
      author: author,
      permlink: permlink,
      weight: weight,
    },
  ] as VoteOperation;
};

const getPostOperation = (
  parentUsername: string,
  parentPerm: string,
  author: string,
  permlink: string,
  title: string,
  body: string,
  stringifyMetadata: string,
) => {
  return [
    'comment',
    {
      parent_author: parentUsername,
      parent_permlink: parentPerm,
      author: author,
      permlink: permlink,
      title: title,
      body: body,
      json_metadata: stringifyMetadata,
    },
  ] as CommentOperation;
};
export const BloggingUtils = {
  comment,
  post,
  vote,
  getPostOperation,
  getPostTransaction,
  getCommentOperation,
  getCommentTransaction,
  getVoteOperation,
  getVoteTransaction,
};
