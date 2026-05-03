import pino from 'pino';
import { config } from '../config/env.js';

export const logger = pino({
  level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'pin',
      'pin_hash',
      'codigo',
      'dni',
      'token',
      '*.pin',
      '*.dni',
      '*.pin_hash',
      '*.otp',
      '*.password',
    ],
    censor: '[REDACTADO]',
  },
  ...(config.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
});
