import { Request, Response, NextFunction } from 'express';

/**
 * Validates that specific route params are numeric.
 * Example: validateNumericParams(['id', 'paqueteId'])
 */
export function validateNumericParams(paramNames: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        for (const name of paramNames) {
            const value = req.params[name];
            if (value && isNaN(Number(value))) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Param '${name}' must be a number` 
                });
            }
        }
        next();
    };
}
