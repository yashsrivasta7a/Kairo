// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from '@instantdb/react-native';

const rules = {
  $users: {
    allow: {
      view: "true",
    },
  },
  builds: {
    allow: {
      view: "true",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: { "isOwner": "auth.id in data.ref('owner.id')" },
  },
  favorites: {
    allow: {
      view: "true",
      create: "isOwner",
      delete: "isOwner",
    },
    bind: { "isOwner": "auth.id in data.ref('user.id')" },
  },
} satisfies InstantRules;

export default rules;
