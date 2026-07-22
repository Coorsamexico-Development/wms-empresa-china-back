import { IsNotEmpty, IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AtributoSalidaValorDto {
  @IsNumber()
  @IsNotEmpty()
  atributoId: number;

  @IsString()
  @IsNotEmpty()
  valor: string;
}

export class CreateSalidaDto {
  @IsNumber()
  @IsNotEmpty()
  creadoPor: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtributoSalidaValorDto)
  atributos: AtributoSalidaValorDto[];
}

export class DespacharTarimasDto {
  @IsArray()
  @IsNumber({}, { each: true })
  tarimaIds: number[];

  @IsString()
  @IsNotEmpty()
  urlFotografia: string;

  @IsNumber()
  @IsNotEmpty()
  despachadoPor: number;
}
