import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateTarimaDto {
  @IsNumber()
  @IsNotEmpty()
  recepcionId: number;

  @IsNumber()
  @IsNotEmpty()
  armadoPor: number;
}

export class AddDetalleTarimaDto {
  @IsNumber()
  @IsNotEmpty()
  materialId: number;

  @IsNumber()
  @IsNotEmpty()
  cantidadCajas: number;

  @IsNumber()
  @IsNotEmpty()
  registradoPor: number;
}

export class CierreTarimaDto {
  @IsString()
  @IsNotEmpty()
  urlFotografia: string;

  @IsNumber()
  @IsNotEmpty()
  cerradoPor: number;
}
