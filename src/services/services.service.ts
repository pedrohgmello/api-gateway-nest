import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Service, ServiceDocument } from './entities/service.entity';
import { Model } from 'mongoose';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
  ) { }
  async create(createServiceDto: CreateServiceDto) {
    try {
      return this.serviceModel.create(createServiceDto);
    } catch (error) {
      //eslint-disable-next-line
      if (error.code === 11000)
        throw new ConflictException(
          'Já existe um serviço com esse prefixo/nome',
        );
      throw error;
    }
  }

  findAll() {
    return this.serviceModel.find();
  }

  async findOne(id: string) {
    return this.findOrThrow(id, () => this.serviceModel.findById(id).exec());
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    return this.findOrThrow(
      id,
      //eslint-disable-next-line
      () => this.serviceModel.findOneAndUpdate({ _id: id }, updateServiceDto, { new: true }).exec()
    );
  }

  remove(id: string) {
    //eslint-disable-next-line
    return this.findOrThrow(id, () => this.serviceModel.findByIdAndDelete(id).exec());
  }

  async findByPrefix(path: string) {
    const secondSlashIndex = path.indexOf('/', 1);
    const prefix =
      secondSlashIndex === -1 ? path : path.slice(0, secondSlashIndex);
    //eslint-disable-next-line
    return this.findOrThrow(prefix, () => this.serviceModel.findOne({ prefix }).exec());
  }

  private async findOrThrow(
    uniqueElement: string,
    query: () => Promise<ServiceDocument | null>,
  ) {
    const service = await query();
    if (!service)
      throw new NotFoundException(
        `Serviço com identificador: ${uniqueElement} não encontrado`,
      );
    return service;
  }
}
