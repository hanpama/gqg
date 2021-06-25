// GENERATED: do not edit manually
import * as graphql from 'graphql';
export const StringTypename = 'String';
export const IDTypename = 'ID';
export const FloatTypename = 'Float';
export const IntTypename = 'Int';
export const BooleanTypename = 'Boolean';
export const PostTypename = 'Post';
export const PostConnectionTypename = 'PostConnection';
export const PostEdgeTypename = 'PostEdge';
export const UserTypename = 'User';
export const NodeTypename = 'Node';
export type NodeTypenamePossible = 'Post' | 'User';
export const NodeTypenamePossible = new Set<NodeTypenamePossible>(['Post', 'User']);
export const PageInfoTypename = 'PageInfo';
export const QueryTypename = 'Query';
export const MutationTypename = 'Mutation';
export const DateTypename = 'Date';
export class Config<TContext> {
  constructor(config: Config<TContext>) { Object.assign(this, config) }
  Post!: PostResolver<TContext>
  PostConnection?: PostConnectionResolver<TContext>
  PostEdge!: PostEdgeResolver<TContext>
  User!: UserResolver<TContext>
  PageInfo?: PageInfoResolver<TContext>
  Query!: QueryResolver<TContext>
  Mutation!: MutationResolver<TContext>
  Date?: DateScalarConfig
}
export interface PostSource {
  __typename?: "Post"
  readonly id: string
  readonly title: string
  readonly publishedAt: any
  readonly content: string
  readonly authorId: string
}
export class PostResolver<TContext> {
  constructor(config: PostResolver<TContext>) { Object.assign(this, config) }
  __type?: (source: any, context: TContext, info: graphql.GraphQLResolveInfo) => boolean
  id!: (src:  PostSource, args: {}, context: TContext, info: graphql.GraphQLResolveInfo) => string | null | undefined | Promise<string | null | undefined>
  author!: (src:  PostSource, args: {}, context: TContext, info: graphql.GraphQLResolveInfo) => UserSource | null | undefined | Promise<UserSource | null | undefined>
}
export interface PostConnectionSource {
  __typename?: "PostConnection"
  readonly edges: ReadonlyArray<PostEdgeSource>
  readonly pageInfo: PageInfoSource
}
export class PostConnectionResolver<TContext> {
  constructor(config: PostConnectionResolver<TContext>) { Object.assign(this, config) }
  __type?: (source: any, context: TContext, info: graphql.GraphQLResolveInfo) => boolean
}
export interface PostEdgeSource {
  __typename?: "PostEdge"
  readonly cursor: string
}
export class PostEdgeResolver<TContext> {
  constructor(config: PostEdgeResolver<TContext>) { Object.assign(this, config) }
  __type?: (source: any, context: TContext, info: graphql.GraphQLResolveInfo) => boolean
  node!: (src:  PostEdgeSource, args: {}, context: TContext, info: graphql.GraphQLResolveInfo) => PostSource | null | undefined | Promise<PostSource | null | undefined>
}
export interface UserSource {
  __typename?: "User"
  readonly id: string
  readonly username: string
  readonly profileS3Uri: string
}
export class UserResolver<TContext> {
  constructor(config: UserResolver<TContext>) { Object.assign(this, config) }
  __type?: (source: any, context: TContext, info: graphql.GraphQLResolveInfo) => boolean
  id!: (src:  UserSource, args: {}, context: TContext, info: graphql.GraphQLResolveInfo) => string | null | undefined | Promise<string | null | undefined>
  profileUrl!: (src:  UserSource, args: {}, context: TContext, info: graphql.GraphQLResolveInfo) => string | null | undefined | Promise<string | null | undefined>
  posts!: (src:  UserSource, args: { first: number | null | undefined, after: string | null | undefined, last: number | null | undefined, before: string | null | undefined}, context: TContext, info: graphql.GraphQLResolveInfo) => PostConnectionSource | null | undefined | Promise<PostConnectionSource | null | undefined>
}
export type NodeSource = PostSource | UserSource
export interface PageInfoSource {
  __typename?: "PageInfo"
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
  readonly startCursor: string | null | undefined
  readonly endCursor: string | null | undefined
}
export class PageInfoResolver<TContext> {
  constructor(config: PageInfoResolver<TContext>) { Object.assign(this, config) }
  __type?: (source: any, context: TContext, info: graphql.GraphQLResolveInfo) => boolean
}
export interface QuerySource {
  __typename?: "Query"
}
export class QueryResolver<TContext> {
  constructor(config: QueryResolver<TContext>) { Object.assign(this, config) }
  __type?: (source: any, context: TContext, info: graphql.GraphQLResolveInfo) => boolean
  node!: (src:  QuerySource, args: { id: string | null | undefined}, context: TContext, info: graphql.GraphQLResolveInfo) => NodeSource | null | undefined | Promise<NodeSource | null | undefined>
  nodes!: (src:  QuerySource, args: { ids: ReadonlyArray<string>}, context: TContext, info: graphql.GraphQLResolveInfo) => ReadonlyArray<NodeSource | null | undefined> | null | undefined | Promise<ReadonlyArray<NodeSource | null | undefined> | null | undefined>
  echo!: (src:  QuerySource, args: { message: string}, context: TContext, info: graphql.GraphQLResolveInfo) => string | null | undefined | Promise<string | null | undefined>
}
export interface MutationSource {
  __typename?: "Mutation"
}
export class MutationResolver<TContext> {
  constructor(config: MutationResolver<TContext>) { Object.assign(this, config) }
  __type?: (source: any, context: TContext, info: graphql.GraphQLResolveInfo) => boolean
  echo!: (src:  MutationSource, args: { message: string}, context: TContext, info: graphql.GraphQLResolveInfo) => string | null | undefined | Promise<string | null | undefined>
}
export class DateScalarConfig<TExternal=any, TInternal=any> {
  constructor(config: DateScalarConfig<TExternal, TInternal>) { Object.assign(this, config) }
  serialize?: graphql.GraphQLScalarSerializer<TExternal>
  parseValue?: graphql.GraphQLScalarValueParser<TInternal>
  parseLiteral?: graphql.GraphQLScalarLiteralParser<TInternal>
}
export function createGraphQLSchema<TContext>(config?: Config<TContext>): graphql.GraphQLSchema {
  const StringType = graphql.GraphQLString
  const IDType = graphql.GraphQLID
  const FloatType = graphql.GraphQLFloat
  const IntType = graphql.GraphQLInt
  const BooleanType = graphql.GraphQLBoolean
  const PostType: graphql.GraphQLObjectType = new graphql.GraphQLObjectType({
    name: "Post",
    description: undefined,
    interfaces: () => [NodeType],
    isTypeOf: config?.Post?.__type,
    fields: () => ({
      id: {
        type: new graphql.GraphQLNonNull(IDType), description: undefined, deprecationReason: undefined, args: {},
        resolve: config && config.Post.id as any,
      },
      title: {
        type: new graphql.GraphQLNonNull(StringType), description: undefined, deprecationReason: undefined, args: {},
      },
      publishedAt: {
        type: new graphql.GraphQLNonNull(DateType), description: undefined, deprecationReason: undefined, args: {},
      },
      content: {
        type: new graphql.GraphQLNonNull(StringType), description: undefined, deprecationReason: undefined, args: {},
      },
      author: {
        type: new graphql.GraphQLNonNull(UserType), description: undefined, deprecationReason: undefined, args: {},
        resolve: config && config.Post.author as any,
      },
    }),
  })
  const PostConnectionType: graphql.GraphQLObjectType = new graphql.GraphQLObjectType({
    name: "PostConnection",
    description: undefined,
    interfaces: () => [],
    isTypeOf: config?.PostConnection?.__type,
    fields: () => ({
      edges: {
        type: new graphql.GraphQLNonNull(new graphql.GraphQLList(new graphql.GraphQLNonNull(PostEdgeType))), description: undefined, deprecationReason: undefined, args: {},
      },
      pageInfo: {
        type: new graphql.GraphQLNonNull(PageInfoType), description: undefined, deprecationReason: undefined, args: {},
      },
    }),
  })
  const PostEdgeType: graphql.GraphQLObjectType = new graphql.GraphQLObjectType({
    name: "PostEdge",
    description: undefined,
    interfaces: () => [],
    isTypeOf: config?.PostEdge?.__type,
    fields: () => ({
      node: {
        type: new graphql.GraphQLNonNull(PostType), description: undefined, deprecationReason: undefined, args: {},
        resolve: config && config.PostEdge.node as any,
      },
      cursor: {
        type: new graphql.GraphQLNonNull(StringType), description: undefined, deprecationReason: undefined, args: {},
      },
    }),
  })
  const UserType: graphql.GraphQLObjectType = new graphql.GraphQLObjectType({
    name: "User",
    description: undefined,
    interfaces: () => [NodeType],
    isTypeOf: config?.User?.__type,
    fields: () => ({
      id: {
        type: new graphql.GraphQLNonNull(IDType), description: undefined, deprecationReason: undefined, args: {},
        resolve: config && config.User.id as any,
      },
      username: {
        type: new graphql.GraphQLNonNull(StringType), description: undefined, deprecationReason: undefined, args: {},
      },
      profileUrl: {
        type: new graphql.GraphQLNonNull(StringType), description: undefined, deprecationReason: undefined, args: {},
        resolve: config && config.User.profileUrl as any,
      },
      posts: {
        type: new graphql.GraphQLNonNull(PostConnectionType), description: undefined, deprecationReason: undefined, args: {  first: { type: IntType, defaultValue: undefined, description: undefined },   after: { type: StringType, defaultValue: undefined, description: undefined },   last: { type: IntType, defaultValue: undefined, description: undefined },   before: { type: StringType, defaultValue: undefined, description: undefined },},
        resolve: config && config.User.posts as any,
      },
    }),
  })
  const NodeType: graphql.GraphQLInterfaceType = new graphql.GraphQLInterfaceType({
    name: "Node",
    description: undefined,
    interfaces: () => [],
    fields: () => ({
      id: {
        type: new graphql.GraphQLNonNull(IDType), description: undefined, deprecationReason: undefined, args: {},
      },
    }),
  })
  const PageInfoType: graphql.GraphQLObjectType = new graphql.GraphQLObjectType({
    name: "PageInfo",
    description: undefined,
    interfaces: () => [],
    isTypeOf: config?.PageInfo?.__type,
    fields: () => ({
      hasNextPage: {
        type: new graphql.GraphQLNonNull(BooleanType), description: undefined, deprecationReason: undefined, args: {},
      },
      hasPreviousPage: {
        type: new graphql.GraphQLNonNull(BooleanType), description: undefined, deprecationReason: undefined, args: {},
      },
      startCursor: {
        type: StringType, description: undefined, deprecationReason: undefined, args: {},
      },
      endCursor: {
        type: StringType, description: undefined, deprecationReason: undefined, args: {},
      },
    }),
  })
  const QueryType: graphql.GraphQLObjectType = new graphql.GraphQLObjectType({
    name: "Query",
    description: undefined,
    interfaces: () => [],
    isTypeOf: config?.Query?.__type,
    fields: () => ({
      node: {
        type: NodeType, description: undefined, deprecationReason: undefined, args: {  id: { type: IDType, defaultValue: undefined, description: undefined },},
        resolve: config && config.Query.node as any,
      },
      nodes: {
        type: new graphql.GraphQLNonNull(new graphql.GraphQLList(new graphql.GraphQLNonNull(NodeType))), description: undefined, deprecationReason: undefined, args: {  ids: { type: new graphql.GraphQLNonNull(new graphql.GraphQLList(new graphql.GraphQLNonNull(IDType))), defaultValue: undefined, description: undefined },},
        resolve: config && config.Query.nodes as any,
      },
      echo: {
        type: new graphql.GraphQLNonNull(StringType), description: undefined, deprecationReason: undefined, args: {  message: { type: new graphql.GraphQLNonNull(StringType), defaultValue: undefined, description: undefined },},
        resolve: config && config.Query.echo as any,
      },
    }),
  })
  const MutationType: graphql.GraphQLObjectType = new graphql.GraphQLObjectType({
    name: "Mutation",
    description: undefined,
    interfaces: () => [],
    isTypeOf: config?.Mutation?.__type,
    fields: () => ({
      echo: {
        type: new graphql.GraphQLNonNull(StringType), description: undefined, deprecationReason: undefined, args: {  message: { type: new graphql.GraphQLNonNull(StringType), defaultValue: undefined, description: undefined },},
        resolve: config && config.Mutation.echo as any,
      },
    }),
  })
  const DateType: graphql.GraphQLScalarType = new graphql.GraphQLScalarType({
    name: "Date",
    description: undefined,
    ...(config && config.Date)
  })
  return new graphql.GraphQLSchema({
    query: QueryType,
    mutation: MutationType,
    types: [
      StringType,
      IDType,
      FloatType,
      IntType,
      BooleanType,
      PostType,
      PostConnectionType,
      PostEdgeType,
      UserType,
      NodeType,
      PageInfoType,
      QueryType,
      MutationType,
      DateType,
    ]
  });
}