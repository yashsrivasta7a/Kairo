// Server-safe schema — imports from @instantdb/admin instead of @instantdb/react-native
// to avoid pulling in React Native dependencies in API routes.

import { i } from '@instantdb/admin';

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      createdAt: i.number().optional(),
      clerkId: i.string().unique().indexed().optional(),
    }),
    builds: i.entity({
      instantId: i.string(),
      code: i.string(),
      streaming: i.string().optional(),
      slug: i.string().indexed().unique(),
      error: i.json().optional(),
      status: i.string().optional(),
      createdAt: i.number(),
      updatedAt: i.number(),
      stage: i.string().optional(),
    }),
    favorites: i.entity({
      createdAt: i.number()
    })
  },
  links: {
    buildOwner: {
      forward: { on: 'builds', has: 'one', label: 'owner', required: true },
      reverse: { on: '$users', has: 'many', label: 'builds' }
    },
    favoriteUser: {
      forward: { on: 'favorites', has: 'one', label: 'user', required: true },
      reverse: { on: '$users', has: 'many', label: 'favorites' }
    },
    favoriteBuild: {
      forward: { on: 'favorites', has: 'one', label: 'build', required: true },
      reverse: { on: 'builds', has: 'many', label: 'favorites' }
    }
  }
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
