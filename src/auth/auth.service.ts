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

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async signUp(authCredentials: AuthDto): Promise<User> {
    try {
      const user = new this.userModel(authCredentials);
      const salt = await bcrypt.genSalt();
      user.salt = salt;
      user.password = await this.hashPassword(
        authCredentials.password,
        user.salt,
      );
      return user.save();
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

  async signIn(authCredentials: AuthDto): Promise<User> {
    const user = await this.userModel.findOne({
      username: authCredentials.username,
    });
    if (user) {
      const isValidPassword = await this.validatePassword(
        authCredentials.password,
        user,
      );
      if (isValidPassword) return user;
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
