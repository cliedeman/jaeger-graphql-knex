import {GraphQLResolveInfo, ExecutionArgs, DocumentNode} from 'graphql';
import {
  GraphQLExtension,
  GraphQLResponse,
  EndHandler,
} from 'graphql-extensions';
import {Request} from 'apollo-server-env';

import Context from './Context';
import {buildPath, handleErrorInSpan, ensureSampled} from './util';

export default class ApolloTracingExtension
  implements GraphQLExtension<Context> {
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
    const span = o.context.startRequestSpan('apollo/request', {
      tags: {
        // Query Operation name. may be null
        operationName: o.operationName,
        query: o.queryString,
        variables: JSON.stringify(o.variables),
      },
    });

    return (...errors: Array<Error>) => {
      if (errors.length > 0) {
        o.context.hasErrors = true;
        handleErrorInSpan(
          span,
          'Error during Request',
          errors.map((err) => err.stack).join('\n')
        );
      }

      // No longer convinced this is correct because parent traces
      // may not be sampled reducing value
      if (errors.length > 0 || o.context.hasErrors) {
        ensureSampled(span);
      }

      span.finish();
    };
  }

  // TODO these methods to not have context
  // see https://github.com/apollographql/apollo-server/pull/1547#issuecomment-419736942
  // public parsingDidStart?(o: {queryString: string}): EndHandler | void;
  // public validationDidStart?(): EndHandler | void;

  public executionDidStart?(o: {executionArgs: ExecutionArgs}): EndHandler {
    const span = o.executionArgs.contextValue.startExecuteSpan(
      'apollo/execution'
    );
    return (...errors: Array<Error>) => {
      if (errors.length > 0) {
        o.executionArgs.contextValue.hasErrors = true;

        handleErrorInSpan(
          span,
          'Error during Execution',
          errors.map((err) => err.stack).join('\n')
        );
      }

      if (errors.length > 0 || o.executionArgs.contextValue.hasErrors) {
        ensureSampled(span);
      }

      span.finish();
    };
  }

  public willSendResponse?(o: {
    graphqlResponse: GraphQLResponse;
    context: Context;
  }): {graphqlResponse: GraphQLResponse; context: Context} {
    o.context.requestSpanLog({event: 'apollo/willSendResponse'});
    return o;
  }

  public willResolveField?(
    source: any,
    args: {[argName: string]: any},
    context: Context,
    info: GraphQLResolveInfo
  ): (error: Error | null, result?: any) => void {
    const span = context.startWillResolvedFieldSpan(
      info,
      'apollo/willResolveField',
      {
        tags: {
          fieldName: info.fieldName,
          path: buildPath(info.path),
          args: JSON.stringify(args),
        },
      }
    );

    return (err: Error | null, result?: any) => {
      if (err != null) {
        context.hasErrors = true;
        handleErrorInSpan(span, err.message, err.stack);
      }

      if (err != null || context.hasErrors) {
        ensureSampled(span);
      }

      span.finish();
    };
  }
}
