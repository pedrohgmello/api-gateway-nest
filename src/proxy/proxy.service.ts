import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ProxyService {
  async forward(req: Request, instance: string) {
    const { method, url, body, headers: rawHeaders } = req;
    const {
      'content-length': _contentLength,
      host: _host,
      ...headers
    } = rawHeaders;
    try {
      console.log(`URL CONSULTADA: ${instance}${url} | método: ${method}`);
      const response = await fetch(`${instance}${url}`, {
        method,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          ...(headers as unknown as Record<string, string>),
        },
      });
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      const resBody = isJson ? await response.json() : await response.text();

      return {
        statusCode: response.status,
        body: resBody,
      };
    } catch (error) {
      console.log('Erro no proxy: ', error);
      if (error.name === 'AbortError')
        throw new GatewayTimeoutException(
          'Serviço de destino não respondeu a tempo',
        );

      throw new BadGatewayException(
        'Não foi possível se comunicar com o serviço de destino',
      );
    }
  }
}
