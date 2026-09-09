import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from 'src/services/entities/service.entity';
import { ServicesService } from 'src/services/services.service';
import { LoadBalancerService } from './load-balancer.service';
import { ProxyService } from './proxy.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
  ],
  controllers: [ProxyController],
  providers: [ServicesService, LoadBalancerService, ProxyService],
})
export class ProxyModule {}
