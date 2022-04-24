import { arg, enumType, extendType, idArg, inputObjectType, intArg, list, nonNull, objectType, stringArg } from 'nexus'
import { Prisma } from '@prisma/client'

export const Feed = objectType({
  name: 'Feed',
  definition(t) {
    t.nonNull.list.nonNull.field('links', { type: Link })
    t.nonNull.int('count')
    t.id('id')
  }
})

export const LinkOrderByInput = inputObjectType({
  name: 'LinkOrderByInput',
  definition(t) {
    t.field('description', { type: Sort })
    t.field('url', { type: Sort })
    t.field('createdAt', { type: Sort })
  }
})

export const Sort = enumType({
  name: 'Sort',
  members: ['asc', 'desc']
})

export const Link = objectType({
  name: 'Link', // 1. The name option defines the name of the type
  definition(t) { // 2. Inside the definition, you can add different fields that get added to the type
    t.nonNull.int('id'), // 3. This adds a field named id of type Int
    t.nonNull.string('description'), // 4. This adds a field named description of type String
    t.nonNull.string('url') // 5. This adds a field named url of type String
    t.nonNull.dateTime('createdAt')
    t.field('postedBy', {
      type: 'User',
      resolve({ id }, _, { prisma }) {
        return prisma.link
          .findUnique({ where: { id } })
          .postedBy()
      }
    })
    t.nonNull.list.field('voter', {
      type: 'User',
      resolve({ id }, _, { prisma }) {
        return prisma.link.findUnique({ where: { id } }).voters()
      }
    })
  }
})

export const LinkQuery = extendType({ // 2. You are extending the Query root type and adding a new root field to it called feed.
  type: 'Query',
  definition(t) {
    t.nonNull.field('feed', { // 3. You define the return type of the feed query as a not nullable array of link type objects (In the SDL the return type will look like this: [Link!]!).
      type: 'Feed',
      // 4. resolve is the name of the resolver function of the feed query. A resolver is the implementation for a GraphQL field.
      // Every field on each type (including the root types) has a resolver function which is executed to get the return value when fetching that type. For now, our resolver implementation is very simple, it just returns the links array.
      // The resolve function has four arguments, parent, args, context and info. We will get to these later.
      args: {
        filter: stringArg(),
        skip: intArg(),
        take: intArg(),
        orderBy: arg({ type: list(nonNull(LinkOrderByInput)) })
      },
      async resolve(_, args, { prisma }) {
        const where = args.filter
          ? {
            OR: [
              { description: { contains: args.filter } },
              { url: { contains: args.filter } }
            ]
          }
          : {}

        const links = await prisma.link.findMany({ 
          where,
          skip: args?.skip as number | undefined,
          take: args?.take as number | undefined,
          orderBy: args?.orderBy as
            | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
            | undefined
        })

        const count = await prisma.link.count({ where })
        const id = `main-feed:${JSON.stringify(args)}`

        return {
          links,
          count,
          id
        }
        
      }
    })
    t.field('link', {
      type: 'Link',
      description: 'Fetch a single link by its `id`',
      args: {
       id: nonNull(idArg())
      },
      resolve(_, args, { prisma }) {
        const id = parseInt(args.id)
        return prisma.link.findFirst({
          where: {
            id
          }
        })
      }
    })
  }
})

export const LinkMutation = extendType({ // 1: You’re extending the Mutation type to add a new root field. You did something similar in the last chapter with the Query type.
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('post', { // 2: The name of the mutation is defined as post and it returns a (non nullable) link object.
      type: 'Link',
      description: 'Update a link',
      args: { // 3: Here you define the arguments to your mutation. You can pass arguments to your GraphQL API endpoints (just like in REST). 
        //In this case, the two arguments you need to pass are description and url. Both arguments mandatory (hence the nonNull()) because both are needed to create a new link.
        description: nonNull(stringArg()),
        url: nonNull(stringArg())
      },
      resolve(_, args, { prisma, userId }) {
        const { description, url } = args // 4: You’re now using the second argument that’s passed into all resolver functions: args. Any guesses what it’s used for? … Correct! 
        //💡 It carries the arguments for the operation – in this case the url and description of the link to be created.
        
        if (!userId) throw new Error('Cannot post without logging in.')

        const newLink = prisma.link.create({
          data: {
            description,
            url,
            postedBy: { connect: { id: userId } }
          }
        })

        return newLink
      }
    })
    t.nonNull.field('updateLink', {
      type: 'Link',
      description: 'Update a link',
      args: {
        id: nonNull(idArg()),
        url: stringArg(),
        description: stringArg()
      },
      resolve(_, args, { prisma }) {
        const id = parseInt(args.id)
        const description = args.description !== null ? args.description : ''
        const url = args.url !== null ? args.url : ''
        
        const link = prisma.link.update({
          where: {
            id
          },
          data: {
            description,
            url
          }
        })

        return link
      }
    })
    t.nonNull.field('deleteLink', {
      type: 'Link',
      description: 'Delete a link',
      args: {
        id: nonNull(idArg())
      },
      resolve(_, args, { prisma }) {
        const id  = parseInt(args.id)

        const link = prisma.link.delete({
          where: {
            id
          }
        })

        return link
      }
    })
  }
})