// @ts-ignore
import {initTracer} from 'jaeger-client';

const config = {
  serviceName: 'my-awesome-service',
  // Defaults to localhost
  // reporter: {
  //   collectorEndpoint: 'http://localhost:14268/api/traces',
  // },
};

const options = {
  tags: {
    'my-awesome-service.version': '1.1.2',
  },
  // metrics: metrics,
  logger: {
    info(msg: string) {
      console.log(msg);
    },
    error(msg: string) {
      console.error(msg);
    },
  },
};

const tracer = initTracer(config, options);

export default tracer;
