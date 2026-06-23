import { Type } from 'class-transformer';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsUUID()
  theatreId: string;

  @IsUUID()
  showtimeId: string;

  @IsString()
  @IsNotEmpty()
  screenNumber: string;

  @IsString()
  @IsNotEmpty()
  seatNumber: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;
}
