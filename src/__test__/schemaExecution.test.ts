import { graphql, Kind } from 'graphql'
import { Config, createGraphQLSchema, PageInfoSource, PostSource, PostTypename, UserSource, UserTypename } from './testSchema'

interface Context {
  invokedAt: Date
  invokerId: string | null
}

test('schemaExecution', async () => {

  const users: UserSource[] = [
    {
      id: '29ded2c8-a384-446b-a1f3-f1dedafec704',
      profileS3Uri: 's3://test/ddb652ac-f2d1-487c-b0c9-bf695f37bc3c.png',
      username: 'user1',
    },
    {
      id: '18cea1e3-2c2d-4dce-8cdd-1eac327019b9',
      profileS3Uri: 's3://test/0f33e8e2-208b-40e1-b21c-a90313f44e0f.png',
      username: 'user2',
    },
  ]
  const posts: PostSource[] = [
    {
      id: '20ea405f-9196-4d17-829d-799370ebe4cb',
      authorId: '29ded2c8-a384-446b-a1f3-f1dedafec704',
      title: 'Post1',
      content: 'Post1Content',
      publishedAt: new Date(2019, 3, 12),
    },
    {
      id: '1cc7a5dc-3e80-4de2-b4e8-d73d3485e3dd',
      authorId: '29ded2c8-a384-446b-a1f3-f1dedafec704',
      title: 'Post2',
      content: 'Post2Content',
      publishedAt: new Date(2019, 3, 14),
    },
  ]

  const encodeGlobalId = (typeName: string, localId: string) => {
    return Buffer.from(`${typeName}:${localId}`).toString('base64')
  }

  const decodeGlobalId = (globalId: string) => {
    const [typeName, localId] = Buffer.from(globalId, 'base64').toString().split(':')
    return { typeName, localId }
  }


  const fetchNode = async (typeName: string, localId: string) => {
    switch (typeName) {
      case UserTypename:
        return users.find(item => item.id === localId) // call repository method
      case PostTypename:
        return posts.find(item => item.id === localId) // call repository method
      default:
        throw new Error(`Invalid typename: ${typeName}`)
    }
  }

  const resolveNode = async (typeName: string, localId: string) => {
    const source = await fetchNode(typeName, localId)
    return source && Object.assign(source, { __typename: typeName })
  }

  const schemaConfigs: Config<Context> = {
    Query: {
      echo: (_, args) => {
        return args.message
      },
      node: (_, args) => {
        if (!args.id) {
          return null
        }
        const { typeName, localId } = decodeGlobalId(args.id)
        return resolveNode(typeName, localId)
      },
      nodes: (_, args) => {
        const ids = args.ids.map(decodeGlobalId)
        return Promise.all(ids.map(({ typeName, localId }) => {
          return fetchNode(typeName, localId)
        }))
      },
    },
    Mutation: {
      echo: (_, args) => {
        return args.message
      },
    },
    User: {
      id: source => {
        return encodeGlobalId(UserTypename, source.id)
      },
      posts: async source => {
        // call repository method (! ignoring pagination args here)
        const edges = posts
          .filter(item => item.authorId === source.id)
          .map(item => ({ cursor: item.id }))

        const pageInfo: PageInfoSource = {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor
        }

        return {
          pageInfo,
          edges,
        }
      },
      profileUrl: source => {
        const siginedUrl = source.profileS3Uri + '+signed!'
        return siginedUrl
      },
    },
    Post: {
      id: source => {
        return encodeGlobalId(PostTypename, source.id)
      },
      author: async source => {
        return users.find(item => item.id === source.authorId)
      },
    },
    PostEdge: {
      node: source => {
        return posts.find(item => item.id === source.cursor)
      }
    },

    // scalar options
    Date: {
      parseValue(value) {
        return new Date(value)
      },
      parseLiteral(ast) {
        if (ast.kind === Kind.INT) {
          return new Date(parseInt(ast.value, 10))
        } else if (ast.kind === Kind.STRING) {
          return new Date(ast.value)
        }
        return null
      },
    }
  }

  const schema = createGraphQLSchema<Context>(schemaConfigs)


  const res = await graphql({
    schema,
    source: `
      query TestQuery1($userId: ID!) {
        user: node(id: $userId) {
          ... on User {
            id
            username
            profileUrl
            posts {
              edges {
                cursor
                node {
                  id
                  title
                  publishedAt
                  content
                  author {
                    id
                    username
                    profileUrl
                  }
                }
              }
            }
          }
        }
      }
    `,
    variableValues: {
      userId: encodeGlobalId('User', '29ded2c8-a384-446b-a1f3-f1dedafec704')
    }
  })

  const expected = {
    data: {
      user: {
        id: "VXNlcjoyOWRlZDJjOC1hMzg0LTQ0NmItYTFmMy1mMWRlZGFmZWM3MDQ=",
        username: "user1",
        profileUrl: "s3://test/ddb652ac-f2d1-487c-b0c9-bf695f37bc3c.png+signed!",
        posts: {
          edges: [
            {
              cursor: "20ea405f-9196-4d17-829d-799370ebe4cb",
              node: {
                id: "UG9zdDoyMGVhNDA1Zi05MTk2LTRkMTctODI5ZC03OTkzNzBlYmU0Y2I=",
                title: "Post1",
                publishedAt: new Date(2019, 3, 12),
                content: "Post1Content",
                author: {
                  id: "VXNlcjoyOWRlZDJjOC1hMzg0LTQ0NmItYTFmMy1mMWRlZGFmZWM3MDQ=",
                  username: "user1",
                  profileUrl: "s3://test/ddb652ac-f2d1-487c-b0c9-bf695f37bc3c.png+signed!"
                }
              }
            },
            {
              cursor: "1cc7a5dc-3e80-4de2-b4e8-d73d3485e3dd",
              node: {
                id: "UG9zdDoxY2M3YTVkYy0zZTgwLTRkZTItYjRlOC1kNzNkMzQ4NWUzZGQ=",
                title: "Post2",
                publishedAt: new Date(2019, 3, 14),
                content: "Post2Content",
                author: {
                  id: "VXNlcjoyOWRlZDJjOC1hMzg0LTQ0NmItYTFmMy1mMWRlZGFmZWM3MDQ=",
                  username: "user1",
                  profileUrl: "s3://test/ddb652ac-f2d1-487c-b0c9-bf695f37bc3c.png+signed!"
                }
              }
            }
          ]
        }
      }
    }
  }

  expect(res).toEqual(expected)
})
