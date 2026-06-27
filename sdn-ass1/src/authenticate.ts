import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { User } from './models/user.model';
import bcrypt from 'bcryptjs';

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: any, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const secretKey = process.env.JWT_SECRET || '12345-67890-09876-54321';

export const getToken = (user: { _id: string }) => {
  return jwt.sign(user, secretKey, { expiresIn: 3600 });
};

const opts: any = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secretKey;

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload._id);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

export const verifyUser = passport.authenticate('jwt', { session: false });

export const verifyAdmin = (req: any, _res: any, next: any) => {
  if (req.user && req.user.admin) {
    return next();
  } else {
    const err: any = new Error('You are not authorized to perform this operation!');
    err.status = 403;
    return next(err);
  }
};

export const verifyAuthor = async (req: any, _res: any, next: any) => {
  try {
    const questionId = req.params.questionId;
    if (!questionId) {
      const err: any = new Error('Question ID not provided');
      err.status = 400;
      return next(err);
    }
    const { Question } = await import('./models/question.model');
    const question = await Question.findById(questionId);
    if (!question) {
      const err: any = new Error('Question not found');
      err.status = 404;
      return next(err);
    }
    if (req.user.admin || (question.author && question.author.toString() === req.user._id.toString())) {
      return next();
    } else {
      const err: any = new Error('You are not the author of this question');
      err.status = 403;
      return next(err);
    }
  } catch (error) {
    return next(error);
  }
};
