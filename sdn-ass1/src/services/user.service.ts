import { User, IUser } from '../models/user.model';
import bcrypt from 'bcryptjs';

export class UserService {
  async getAll(): Promise<IUser[]> {
    return User.find({});
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username });
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    const user = new User(userData);
    return user.save();
  }
}
