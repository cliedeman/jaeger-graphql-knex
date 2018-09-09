import {GraphQLResolveInfo, ExecutionArgs, DocumentNode} from 'graphql';
import {
  GraphQLExtension,
  GraphQLResponse,
  EndHandler,
} from 'graphql-extensions';
import {Request} from 'apollo-server-env';
import {Span, Tracer, globalTracer} from 'opentracing';

import Context from './Context';

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
    const span = o.context.startSpan('apolloRequest', {
      tags: {
        // Query Operation name. may be null
        operationName: o.operationName,
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
    const span = o.executionArgs.contextValue.startSpan('apolloExecution', {});
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
    o.context.span.log({event: 'willSendResponse'});
    return o;
  }

  public willResolveField?(
    source: any,
    args: {[argName: string]: any},
    context: Context,
    info: GraphQLResolveInfo
  ): void {
    // TODO include full path
    context.span.log({event: 'willResolveField', fieldName: info.fieldName});
  }
}
