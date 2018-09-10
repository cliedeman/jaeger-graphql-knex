import {Request} from 'express';
import {Tracer, Span, SpanOptions} from 'opentracing';

import {GraphQLResolveInfo, ResponsePath} from 'graphql';

import {buildPath} from './util';

export interface ResolverTracingContext {
  startResolverSpan(
    info: GraphQLResolveInfo,
    operationName: string,
    options: SpanOptions
  ): Span;
}

export default class ApolloTracingContext implements ResolverTracingContext {
  public readonly req: Request;
  public readonly tracer: Tracer;

  private requestSpan: Span | null = null;
  private executeSpan: Span | null = null;

  private resolverSpans: Map<string, Span> = new Map<string, Span>();

  // Used to make sure we sample the entire request
  public hasErrors = false;

  constructor(tracer: Tracer, req: Request) {
    this.req = req;
    this.tracer = tracer;
  }

  public get rootSpan(): Span {
    // @ts-ignore
    const span = this.req.span;

    if (span == null) {
      throw new Error(
        'Root span is missing, make sure it is populated by your respective middleware'
      );
    }

    return span;
  }

  private get ensureRequestSpan(): Span {
    if (this.requestSpan == null) {
      throw new Error('Request Span is null');
    }

    return this.requestSpan;
  }

  private ensureExecuteSpan(): Span {
    if (this.executeSpan == null) {
      throw new Error('Execute Span is null');
    }

    return this.executeSpan;
  }

  private getParentResolverSpan(path: ResponsePath | undefined): Span {
    let parentSpan: Span | undefined;
    let currentPath: ResponsePath | undefined = path;

    if (currentPath != null) {
      parentSpan = this.resolverSpans.get(buildPath(currentPath));
    }

    return parentSpan || this.ensureExecuteSpan();
  }

  /**
   * Start Resolve span, meant to be invoked from Userland resolvers
   * @param info
   * @param operationName
   * @param options
   */
  public startResolverSpan(
    info: GraphQLResolveInfo,
    operationName: string,
    options: SpanOptions = {}
  ): Span {
    const path = info.path;

    const span = this.tracer.startSpan(operationName, {
      childOf: this.getParentResolverSpan(path),
      ...options,
    });

    return span;
  }

  /**
   * Meant to be called from Apollo Extensions
   * @param info
   * @param operationName
   * @param options
   */
  public startWillResolvedFieldSpan(
    info: GraphQLResolveInfo,
    operationName: string,
    options: SpanOptions = {}
  ): Span {
    const path = info.path;

    const span = this.tracer.startSpan(operationName, {
      childOf: this.getParentResolverSpan(path.prev),
      ...options,
    });

    this.resolverSpans.set(buildPath(path), span);

    return span;
  }

  public startRequestSpan(
    operationName: string,
    options: SpanOptions = {}
  ): Span {
    this.requestSpan = this.tracer.startSpan(operationName, {
      childOf: this.rootSpan,
      ...options,
    });

    return this.requestSpan;
  }

  /**
   * TODO handling batching
   * @param operationName
   * @param options
   */
  public startExecuteSpan(
    operationName: string,
    options: SpanOptions = {}
  ): Span {
    this.executeSpan = this.tracer.startSpan(operationName, {
      childOf: this.ensureRequestSpan,
      ...options,
    });

    return this.executeSpan;
  }

  public requestSpanLog(
    keyValuePairs: {[key: string]: any},
    timestamp?: number
  ): void {
    this.ensureRequestSpan.log(keyValuePairs, timestamp);
  }
}
