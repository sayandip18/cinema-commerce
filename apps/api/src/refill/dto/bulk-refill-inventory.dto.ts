import { Type } from 'class-transformer';
import {
  IsUUID,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class BulkRefillItemDto {
  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(0)
  quantity: number;
}

export class BulkRefillInventoryDto {
  @IsUUID()
  theatreId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkRefillItemDto)
  items: BulkRefillItemDto[];
}
