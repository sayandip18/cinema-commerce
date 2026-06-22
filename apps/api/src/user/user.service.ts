import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { User, AgeGroup, Gender } from './entities/user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findByPhone(phone);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async existsByPhone(phone: string): Promise<boolean> {
    return this.userRepository.existsByPhone(phone);
  }

  async createUser(data: {
    name: string;
    phone: string;
    ageGroup: AgeGroup;
    gender: Gender;
    email?: string;
    password?: string;
  }): Promise<User> {
    let hashedPassword: string | null = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    return this.userRepository.create({
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      password: hashedPassword,
      ageGroup: data.ageGroup,
      gender: data.gender,
    });
  }
}
