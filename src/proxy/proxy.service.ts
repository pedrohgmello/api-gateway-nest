import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

interface ForwardHeaders {
  [key: string]: string | string[] | undefined;
}

@Injectable()
export class ProxyService {
  async forward(req: Request, instance: string) {
    const { method, url, body } = req;

    // Extrai headers de forma tipada, removendo os que não devem ser repassados
    const headers = this.sanitizeHeaders(req.headers as ForwardHeaders);

    const hasBody = method !== 'GET' && method !== 'HEAD';

    try {
      const response = await fetch(`${instance}${url}`, {
        method,
        body: hasBody ? JSON.stringify(body) : undefined,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json') ?? false;
      const resBody: unknown = isJson
        ? await response.json()
        : await response.text();

      return {
        statusCode: response.status,
        body: resBody,
      };
    } catch (error: unknown) {
      console.error('Erro no proxy:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException(
          'Serviço de destino não respondeu a tempo',
        );
      }

      throw new BadGatewayException(
        'Não foi possível se comunicar com o serviço de destino',
      );
    }
  }

  private sanitizeHeaders(headers: ForwardHeaders): Record<string, string> {
    const { 'content-length': _cl, host: _host, ...rest } = headers;
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(rest)) {
      if (typeof value === 'string') {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
