import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { getToken } from '../authenticate';

const userService = new UserService();

export class UserController {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAll();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, admin } = req.body;
      const existingUser = await userService.findByUsername(username);
      if (existingUser) {
        res.status(500).json({ 
          err: { 
            name: 'UserExistsError', 
            message: 'A user with the given username is already registered' 
          } 
        });
        return;
      }
      
      await userService.create({ username, password, admin: admin === true || admin === 'true' });
      
      res.status(200).json({ success: true, status: 'Registration Successful!' });
    } catch (err: any) {
      res.status(500).json({ err: err.message || err });
    }
  }

  login(req: Request, res: Response): void {
    const user = (req as any).user;
    const token = getToken({ _id: user._id });
    res.status(200).json({ 
      success: true, 
      token: token, 
      user: {
        _id: user._id,
        username: user.username,
        admin: user.admin
      },
      status: 'You are successfully logged in!' 
    });
  }
}
