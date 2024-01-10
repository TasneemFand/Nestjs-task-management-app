import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(authCredentials: AuthDto): Promise<void> {
    try {
      const user = new this.userModel(authCredentials);
      const salt = await bcrypt.genSalt();
      user.salt = salt;
      user.password = await this.hashPassword(
        authCredentials.password,
        user.salt,
      );
      await user.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Username already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  private async hashPassword(password: string, salt: string) {
    return bcrypt.hash(password, salt);
  }

  async signIn(authCredentials: AuthDto): Promise<{ accessToken: string }> {
    const user = await this.userModel.findOne({
      username: authCredentials.username,
    });
    if (user) {
      const isValidPassword = await this.validatePassword(
        authCredentials.password,
        user,
      );
      if (isValidPassword) {
        const payload = { username: authCredentials.username };
        const accessToken = await this.jwtService.sign(payload);
        return { accessToken };
      }
      throw new UnauthorizedException('Invalid Credentials');
    }
    throw new NotFoundException('User not found');
  }

  private async validatePassword(
    password: string,
    user: User,
  ): Promise<boolean> {
    const hash = await this.hashPassword(password, user.salt);
    return user.password === hash;
  }
}
