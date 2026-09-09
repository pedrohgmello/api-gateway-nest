import { Injectable } from '@nestjs/common';

@Injectable()
export class LoadBalancerService {
  private counters = new Map<string, number>();

  pickInstance(serviceName: string, instances: string[]) {
    const current = this.counters.get(serviceName) ?? 0;
    const chosen = instances[current % instances.length];
    this.counters.set(serviceName, current + 1);
    return chosen;
  }
}
