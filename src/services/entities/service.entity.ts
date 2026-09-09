import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true, unique: true })
  serviceName: string;

  @Prop({ required: true, unique: true })
  prefix: string;

  @Prop({ required: true })
  instances: string[];

  @Prop({ required: false })
  healthPath: string;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
