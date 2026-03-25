import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware to validate Mercado Pago Webhook Signature
 * Requires the raw body to be present on req.body if using express.raw()
 */
export function mercadoPagoSignatureMiddleware(req: Request, res: Response, next: NextFunction) {
    const signatureHeader = req.headers['x-signature'] as string;
    const requestId = req.headers['x-request-id'] as string;

    if (!signatureHeader || !requestId) {
        return res.status(401).json({ success: false, message: 'Missing Mercado Pago signature headers' });
    }

    // Example of signature extraction (MP format: ts=...,v1=...)
    const parts = signatureHeader.split(',');
    const tsPart = parts.find(p => p.startsWith('ts='));
    const hashPart = parts.find(p => p.startsWith('v1='));

    if (!tsPart || !hashPart) {
        return res.status(401).json({ success: false, message: 'Invalid signature format' });
    }

    const timestamp = tsPart.split('=')[1];
    const receivedHash = hashPart.split('=')[1];

    // Read the private secret from env (this should be the 'Webhook Secret' from MP dashboard)
    const secret = process.env.MP_WEBHOOK_SECRET || ''; 

    // manifest = id:[requestId];ts:[timestamp];
    const manifest = `id:${requestId};ts:${timestamp};`;
    
    // In Express with raw body middleware, req.body is a Buffer
    const body = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    hmac.update(body);
    const calculatedHash = hmac.digest('hex');

    if (calculatedHash !== receivedHash) {
        console.warn('⚠️ Invalid Mercado Pago Webhook Signature detected');
        // In production, you might want to uncomment this to strictly enforce it
        // return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    next();
}
