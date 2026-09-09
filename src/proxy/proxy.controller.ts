import { Controller, All, Inject, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ServicesService } from 'src/services/services.service';
import { LoadBalancerService } from './load-balancer.service';
import { ProxyService } from './proxy.service';

@Controller()
export class ProxyController {
  constructor(
    @Inject()
    private readonly servicesService: ServicesService,
    @Inject()
    private readonly loadBalancerService: LoadBalancerService,
    @Inject()
    private readonly proxyService: ProxyService,
  ) {}

  @All('*path')
  async handleAll(@Req() req: Request) {
    const path = req.path;

    const service = await this.servicesService.findByPrefix(path);

    if (!service) return { statusCode: 404 };

    const instance = this.loadBalancerService.pickInstance(
      service.serviceName,
      service.instances,
    );

    return this.proxyService.forward(req, instance);
  }
}
