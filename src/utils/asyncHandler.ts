import { Request, Response, NextFunction } from 'express';

export const asyncHandler =
  <T>(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<T>
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
