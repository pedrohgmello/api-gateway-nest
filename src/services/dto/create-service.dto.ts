/* eslint-disable */
import { IsString, Matches } from "class-validator";

export class CreateServiceDto {
    @IsString()
    readonly serviceName: string;

    @Matches(/^\/[a-z0-9-]+$/, {
        message: 'prefix deve começar com "/" e conter apenas letras minúsculas, números e hífen',
    })
    readonly prefix: string;

    @IsString({ each: true })
    readonly instances: string[];

    @IsString()
    readonly healthPath: string;
}