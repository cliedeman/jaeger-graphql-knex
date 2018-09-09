import {GraphQLResolveInfo, ExecutionArgs, DocumentNode} from 'graphql';
import {
  GraphQLExtension,
  GraphQLResponse,
  EndHandler,
} from 'graphql-extensions';
import {Request} from 'apollo-server-env';
// TODO include index.d.ts in opentracing package
// @ts-ignore
import {Tracer, globalTracer} from 'opentracing';

interface TContext {
  req: {
    span: any;
  };
}

export default class ApolloTracingExtension
  implements GraphQLExtension<TContext> {
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
    context: TContext;
  }): EndHandler {
    const span = this.tracer.startSpan('apolloRequest', {
      childOf: o.context.req.span,
      tags: {
        // Query Operation name. may be null
        operationName: o.operationName,
      },
    });
    return (...errors: Array<Error>) => {
      if (errors.length > 0) {
        span.setTag('error', true);
        span.setTag('sampling.priority', 1);
      }

      span.finish();
    };
  }

  // public parsingDidStart?(o: {queryString: string}): EndHandler | void;
  // public validationDidStart?(): EndHandler | void;

  public executionDidStart?(o: {executionArgs: ExecutionArgs}): EndHandler {
    const span = this.tracer.startSpan('apolloExecution', {
      childOf: o.executionArgs.contextValue.req.span,
    });
    return (...errors: Array<Error>) => {
      if (errors.length > 0) {
        span.setTag('error', true);
        span.setTag('sampling.priority', 1);
      }

      span.finish();
    };
  }

  // TODO is this needed?
  public willSendResponse?(o: {
    graphqlResponse: GraphQLResponse;
    context: TContext;
  }): {graphqlResponse: GraphQLResponse; context: TContext} {
    // console.log('willSendResponse');
    return o;
  }

  public willResolveField?(
    source: any,
    args: {[argName: string]: any},
    context: TContext,
    info: GraphQLResolveInfo
  ): ((error: Error | null, result?: any) => void) | void {
    // console.log(
    //   `willResolveField Path: ${JSON.stringify(info.path)}, FieldName: ${
    //     info.fieldName
    //   }`
    // );
    return undefined;
  }
}
