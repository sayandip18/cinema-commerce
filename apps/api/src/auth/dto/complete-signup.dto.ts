import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AgeGroup, Gender } from '../../user/entities/user.entity';

export class CompleteSignupDto {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  name: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsEnum(AgeGroup, { message: 'Invalid age group' })
  ageGroup: AgeGroup;

  @IsEnum(Gender, { message: 'Invalid gender' })
  gender: Gender;
}
