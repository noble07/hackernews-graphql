import { makeSchema } from 'nexus'
import { join } from 'path'
import * as types from './graphql' // 1. 

export const schema = makeSchema({
  types, // 1 Your GraphQL schema will consist of many types that you will pass as an array to the types object. For now, it is intentionally kept empty.
  outputs: {
    schema: join(process.cwd(), 'schema.graphql'), // 2 The first output file that Nexus will generate for you is a GraphQL schema file of type .graphql. This is the GraphQL Schema Definition Language (SDL) for defining the structure of your API. You will learn more about this later in the chapter!
    typegen: join(process.cwd(), 'nexus-typegen.ts') // 3 The second output file is a TypeScript file known as typegen, which will contain TypeScript type definitions for all types in your GraphQL schema. These generated types will help ensure typesafety in your application code and keep your GraphQL schema definition in sync with your schema implementation. Again, more on this later.
  },
  contextType: {
    module: join(process.cwd(), './src/context.ts'),
    export: 'Context'
  }
})