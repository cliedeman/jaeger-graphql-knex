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

export default class ApolloTracingExtension<TContext = any>
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
  }): EndHandler {
    // @ts-ignore
    console.log(o.request.span);

    console.log(`requestDidStart. Operation: ${o.operationName}`);
    return (...errors: Array<Error>) => {
      console.log(`requestDidEnd. Operation: ${o.operationName}`);
    };
  }

  // public parsingDidStart?(o: {queryString: string}): EndHandler | void;
  // public validationDidStart?(): EndHandler | void;

  public executionDidStart?(o: {executionArgs: ExecutionArgs}): EndHandler {
    console.log('executionDidStart');
    return (...errors: Array<Error>) => {
      console.log('executionDidEnd');
    };
  }

  // TODO is this needed?
  public willSendResponse?(o: {
    graphqlResponse: GraphQLResponse;
  }): {graphqlResponse: GraphQLResponse} {
    console.log('willSendResponse');
    return o;
  }

  public willResolveField?(
    source: any,
    args: {[argName: string]: any},
    context: TContext,
    info: GraphQLResolveInfo
  ): ((error: Error | null, result?: any) => void) | void {
    console.log(
      `willResolveField Path: ${JSON.stringify(info.path)}, FieldName: ${
        info.fieldName
      }`
    );
    return undefined;
  }
}
