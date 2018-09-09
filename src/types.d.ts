// TODO remove these

declare module 'opentracing' {
  export class SpanContext {}

  export class Reference {
    type(): string;
    referencedContext(): SpanContext;
    constructor(type: string, referencedContext: SpanContext | Span);
  }

  export class Span {
    context(): SpanContext;
    tracer(): Tracer;
    setOperationName(name: string): this;
    setBaggageItem(key: string, value: string): this;
    getBaggageItem(key: string): string | undefined;
    setTag(key: string, value: any): this;
    addTags(keyValueMap: {[key: string]: any}): this;
    log(keyValuePairs: {[key: string]: any}, timestamp?: number): this;
    finish(finishTime?: number): void;
  }

  export interface SpanOptions {
    childOf?: Span | SpanContext;
    references?: Reference[];
    tags?: {[key: string]: any};
    startTime?: number;
  }

  export class Tracer {
    startSpan(name: string, options: SpanOptions): Span;
    inject(spanContext: SpanContext | Span, format: string, carrier: any): void;
    extract(format: string, carrier: any): SpanContext | null;
  }

  export function globalTracer(): Tracer;
}
