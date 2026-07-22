import { IsNotEmpty, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsString()
  @IsNotEmpty()
  cliente: string;
}

export class BulkMaterialDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaterialDto)
  materiales: CreateMaterialDto[];
}
