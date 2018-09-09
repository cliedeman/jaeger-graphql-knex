import {Request} from 'express';
import {Tracer, Span, SpanOptions} from 'opentracing';

export default class Context {
  public req: Request;
  private spanStack: Span[];
  private tracer: Tracer;

  constructor(tracer: Tracer, req: Request) {
    this.req = req;
    this.tracer = tracer;
    this.spanStack = [];
  }

  public get span(): Span {
    // @ts-ignore
    return this.spanStack[this.spanStack.length - 1] || this.req.span;
  }

  public startSpan(name: string, options?: SpanOptions): Span {
    const span = this.tracer.startSpan(name, {
      childOf: this.span,
      ...options,
    });

    this.spanStack.push(span);

    const origFn = span.finish;
    // Override finish to pop span off stack
    span.finish = (finishTime?: number) => {
      origFn.call(span, finishTime);

      const topSpan = this.span;

      if (topSpan === span) {
        this.spanStack.pop();
      } else {
        console.warn(
          `Spans being popped off in incorrect order. 
            Span Finishing: ${span}, Expected Span: ${topSpan}.`
        );

        // TODO remove the span anyway?
      }
    };

    return span;
  }
}
