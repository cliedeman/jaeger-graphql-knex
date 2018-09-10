import {ResponsePath} from 'graphql';
import {Span} from 'opentracing';

export function buildPath(path: ResponsePath) {
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

export function handleErrorInSpan(
  span: Span,
  errorMessage: string,
  errorStack?: string
) {
  span.setTag('error', true);

  span.log({
    event: 'error',
    message: errorMessage,
    stack: errorStack,
  });
}

export function ensureSampled(span: Span) {
  span.setTag('sampling.priority', 1);
}
