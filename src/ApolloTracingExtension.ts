import {
  GraphQLResolveInfo,
  ExecutionArgs,
  DocumentNode,
  ResponsePath,
} from 'graphql';
import {
  GraphQLExtension,
  GraphQLResponse,
  EndHandler,
} from 'graphql-extensions';
import {Request} from 'apollo-server-env';
import {Tracer, globalTracer} from 'opentracing';

import Context from './Context';

function buildPath(path: ResponsePath) {
  let current: ResponsePath | undefined = path;
  const segments = [];

  while (current != null) {
    if (typeof current.key === 'number') {
      segments.push(`[${current.key}]`);
    } else {
      segments.push(current.key);
    }

    current = current.prev;
  }

  return segments.reverse().join('.');
}

export default class ApolloTracingExtension
  implements GraphQLExtension<Context> {
  private tracer: Tracer;

  constructor(tracer?: Tracer) {
    this.tracer = tracer || globalTracer();
  }

  public requestDidStart?(o: {
    request: Request;
    queryString?: string;
    parsedQuery?: DocumentNode;
    operationName?: string;
    variables?: {[key: string]: any};
    persistedQueryHit?: boolean;
    persistedQueryRegister?: boolean;
    context: Context;
  }): EndHandler {
    const span = o.context.startSpan('apollo/request', {
      tags: {
        // Query Operation name. may be null
        operationName: o.operationName,
        query: o.queryString,
        variables: JSON.stringify(o.variables),
      },
    });
    return (...errors: Array<Error>) => {
      if (errors.length > 0) {
        span.setTag('error', true);
        span.setTag('sampling.priority', 1);

        span.log({
          event: 'error',
          message: 'Error during Request',
          stack: errors.map((err) => err.stack).join('\n'),
        });
      }

      span.finish();
    };
  }

  // TODO these methods to not have context
  // see https://github.com/apollographql/apollo-server/pull/1547#issuecomment-419736942
  // public parsingDidStart?(o: {queryString: string}): EndHandler | void;
  // public validationDidStart?(): EndHandler | void;

  public executionDidStart?(o: {executionArgs: ExecutionArgs}): EndHandler {
    // TODO: this should always use the root span
    const span = o.executionArgs.contextValue.startSpan('apollo/execution', {});
    return (...errors: Array<Error>) => {
      if (errors.length > 0) {
        span.setTag('error', true);
        span.setTag('sampling.priority', 1);

        span.log({
          event: 'error',
          message: 'Error during Execution',
          stack: errors.map((err) => err.stack).join('\n'),
        });
      }

      span.finish();
    };
  }

  public willSendResponse?(o: {
    graphqlResponse: GraphQLResponse;
    context: Context;
  }): {graphqlResponse: GraphQLResponse; context: Context} {
    o.context.span.log({event: 'apollo/willSendResponse'});
    return o;
  }

  public willResolveField?(
    source: any,
    args: {[argName: string]: any},
    context: Context,
    info: GraphQLResolveInfo
  ): (error: Error | null, result?: any) => void {
    const span = context.startSpan('apollo/willResolveField', {
      tags: {
        fieldName: info.fieldName,
        path: buildPath(info.path),
        args: JSON.stringify(args),
      },
    });

    return (err: Error | null, result?: any) => {
      if (err != null) {
        span.setTag('error', true);
        span.setTag('sampling.priority', 1);

        span.log({
          event: 'error',
          message: err.message,
          stack: err.stack,
        });
      }

      span.finish();
    };
  }
}
