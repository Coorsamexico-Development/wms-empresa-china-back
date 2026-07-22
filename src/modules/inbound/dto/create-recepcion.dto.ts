import { IsNotEmpty, IsNumber, IsArray, ValidateNested, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AtributoValorDto {
  @IsNumber()
  @IsNotEmpty()
  atributoId: number;

  @IsString()
  @IsNotEmpty()
  valor: string;
}

export class CreateRecepcionDto {
  @IsNumber()
  @IsNotEmpty()
  creadoPor: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtributoValorDto)
  atributos: AtributoValorDto[];
}

export class CreateEvidenciaDto {
  @IsNumber()
  @IsNotEmpty()
  tipoEvidenciaId: number;

  @IsString()
  @IsNotEmpty()
  urlArchivo: string;

  @IsNumber()
  @IsNotEmpty()
  subidoPor: number;
}
