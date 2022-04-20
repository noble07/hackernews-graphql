import { objectType } from 'nexus'

export const User = objectType({
  name: 'User',
  definition(t) {
    t.nonNull.int('id')
    t.nonNull.string('name')
    t.nonNull.string('email')
    t.nonNull.list.nonNull.field('links', {
      type: 'Link',
      resolve({ id }, _, { prisma }) {
        return prisma.user
          .findUnique({ where: { id } })
          .links()
      }
    })
  }
})