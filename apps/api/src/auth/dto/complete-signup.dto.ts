import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CompleteSignupDto {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}
