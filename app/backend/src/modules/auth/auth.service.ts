import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name?: string, role?: UserRole, clientId?: string, partnerId?: string) {
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name: name || 'Unknown User',
      role: role || UserRole.CLIENT,
      client_id: clientId,
      partner_id: partnerId,
      status: 'ACTIVE',
    });

    const savedUser = await this.userRepository.save(user);

    const payload = { sub: savedUser.id, email: savedUser.email, role: savedUser.role, client_id: savedUser.client_id, partner_id: savedUser.partner_id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        name: savedUser.name,
      },
    };
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      select: ['id', 'name', 'email', 'role', 'status', 'client_id', 'partner_id', 'created_at', 'updated_at'],
      order: { created_at: 'DESC' },
    });
    return users;
  }

  async updateProfile(userId: string, dto: { name?: string; phone?: string; city?: string }) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    if (dto.name  !== undefined) user.name  = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.city  !== undefined) user.city  = dto.city;

    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      email: saved.email,
      name: saved.name,
      phone: saved.phone,
      city: saved.city,
      role: saved.role,
      client_id: saved.client_id,
      partner_id: saved.partner_id,
    };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, client_id: user.client_id, partner_id: user.partner_id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        client_id: user.client_id,
        partner_id: user.partner_id,
      },
    };
  }
}
