# GQG

Schema-first GraphQL code generator


## Usage

```sh
npm install --global gqg
```

```sh
gqg (SCHEMA_DIR) (OUTPUT_FILE)
# example: gqg schema/ src/__test__/testSchema.ts
```


## `@resolve` and `@source`

A GraphQL implementation is a composition of resolvers and sources.

```graphql
type Post implements Node {
  id: ID!

  title: String!

  publishedAt: Date!

  content: String!

  author: User!
}
```

When you define a type like `Post`, you would have a blueprint of
how its resolver and source type should be.

GQG helps you to explicitly annotate the resolver and source fields.

```graphql
type Post implements Node {
  # "Our post entity already has `id` field (which is a string),
  # but it should be resolved to a Relay global ID."
  id: ID!
    @resolve @source(name: "id", type: "String!")

  # "title, publishedAt, and content are simple scalars
  # and our Post entity have the exact same fields."
  title: String!

  publishedAt: Date!

  content: String!

  author: User!
    @resolve @source(name: "authorId", type: "String!")
    # "We store post-author relations as `authorId` field in `Post` entity.
    # This author resolver will load the actual User entity from the database."
}
```

Based on the schema, GQG generates its source and resolver types like below:

```ts
export interface PostSource {
  __typename?: "Post"
  readonly id: string
  readonly title: string
  readonly publishedAt: any
  readonly content: string
  readonly authorId: string
}
```

```ts
export interface PostResolver<TContext> {
  __type?: (source: any, context: TContext, info: graphql.GraphQLResolveInfo) => boolean
  id!: (src:  PostSource, args: {}, context: TContext, info: graphql.GraphQLResolveInfo) => string | null | undefined | Promise<string | null | undefined>
  author!: (src:  PostSource, args: {}, context: TContext, info: graphql.GraphQLResolveInfo) => UserSource | null | undefined | Promise<UserSource | null | undefined>
}
```

Now, you can implement `PostResolver` and pass the resolver instance to a function `createGraphQLSchema`
which is also created by GQG.

```ts
const schema: graphql.Schema = createGraphQLSchema({
  Post: {
    id: source => {
      return encodeGlobalId(PostTypename, source.id)
    },
    author: async source => {
      return users.find(item => item.id === source.authorId)
    },
  },
})
```

## Schema directory structure

When you execute `gqg (SCHEMA_DIR) (OUTPUT_FILE)`, GQG collects all files in SCHEMA directory.

Let's run it on the [test schema](schema/).

```
schema/
├── Post.graphql
├── User.graphql
├── relay.graphql
└── root.graphql
```

Execution of `gqg schema/ src/__test__/testSchema.ts` creates a single file to the
location of `src/__test__/testSchema.ts`. You can check [the generated code](src/__test__/testSchema.ts).

It should be much more complex in a real application though,
you can also find [the test implementation](src/__test__/schemaExecution.test.ts).

