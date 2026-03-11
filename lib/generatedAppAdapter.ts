import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { convex } from './convex';

function createFieldBuilder() {
  return {
    indexed() {
      return this;
    },
    unique() {
      return this;
    },
    optional() {
      return this;
    },
  };
}

export const generatedAppSchemaBuilder = {
  schema(definition: unknown) {
    return definition;
  },
  entity(definition: unknown) {
    return definition;
  },
  string() {
    return createFieldBuilder();
  },
  number() {
    return createFieldBuilder();
  },
  boolean() {
    return createFieldBuilder();
  },
};

function createOperation(type: 'create' | 'update' | 'delete', model: string, entityId: string, data?: Record<string, unknown>) {
  const operation = {
    type,
    model,
    entityId,
    data: data ?? {},
  };

  return {
    ...operation,
    link(linkData: Record<string, unknown>) {
      operation.data = { ...(operation.data ?? {}), ...linkData };
      return operation;
    },
  };
}

function createTxProxy() {
  return new Proxy(
    {},
    {
      get(_target, model) {
        return new Proxy(
          {},
          {
            get(_innerTarget, entityId) {
              return {
                create(data: Record<string, unknown>) {
                  return createOperation('create', String(model), String(entityId), data);
                },
                update(data: Record<string, unknown>) {
                  return createOperation('update', String(model), String(entityId), data);
                },
                delete() {
                  return createOperation('delete', String(model), String(entityId));
                },
              };
            },
          }
        );
      },
    }
  );
}

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `id_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function createGeneratedAppRuntime(buildId: string) {
  const tx = createTxProxy();

  return {
    init() {
      return {
        tx,
        useQuery(querySpec: Record<string, unknown> | null) {
          const data = useConvexQuery(
            api.generatedApps.read,
            querySpec
              ? {
                  buildId: buildId as never,
                  query: querySpec,
                }
              : 'skip'
          );

          return {
            data,
            isLoading: data === undefined,
            error: null,
          };
        },
        async transact(operations: Array<Record<string, unknown>>) {
          const sanitizedOperations = operations.map((operation) => ({
            type: operation.type,
            model: operation.model,
            entityId: operation.entityId,
            data: operation.data ?? {},
          }));

          return convex.mutation(api.generatedApps.transact, {
            buildId: buildId as never,
            operations: sanitizedOperations,
          });
        },
      };
    },
    id: randomId,
    i: generatedAppSchemaBuilder,
  };
}