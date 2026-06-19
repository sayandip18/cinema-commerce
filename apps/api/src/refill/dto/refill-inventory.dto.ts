import { IsUUID, IsInt, Min } from 'class-validator';

export class RefillInventoryDto {
  @IsUUID()
  theatreId: string;

  @IsUUID()
  menuItemId: string;

  @IsInt()
  @Min(0)
  quantity: number;

  @IsInt()
  @Min(0)
  expectedVersion: number;
}
