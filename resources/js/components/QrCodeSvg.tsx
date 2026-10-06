import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
    value: string;
    size?: number;
    className?: string;
    level?: 'L' | 'M' | 'Q' | 'H';
    includeMargin?: boolean;
}

/**
 * Generate pure SVG string asynchronously using the industry-standard 'qrcode' library.
 * Works 100% in all browser environments without depending on react-dom/server.
 */
export async function generateQrSvgString(
    value: string,
    size = 180,
    level: 'L' | 'M' | 'Q' | 'H' = 'M'
): Promise<string> {
    try {
        const errorCorrectionLevel = level === 'L' ? 'low' : level === 'Q' ? 'quartile' : level === 'H' ? 'high' : 'medium';
        const svg = await QRCode.toString(value || 'https://kilatz.id', {
            type: 'svg',
            width: size,
            margin: 1,
            errorCorrectionLevel: errorCorrectionLevel,
        });
        return svg;
    } catch (err) {
        console.error('Error generating QR SVG string:', err);
        return `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#eee"/><text x="10" y="20" fill="#666">QR Error</text></svg>`;
    }
}

/**
 * Generate base64 Data URL PNG using 'qrcode' library.
 */
export async function generateQrDataUrl(
    value: string,
    size = 250,
    level: 'L' | 'M' | 'Q' | 'H' = 'M'
): Promise<string> {
    try {
        const errorCorrectionLevel = level === 'L' ? 'low' : level === 'Q' ? 'quartile' : level === 'H' ? 'high' : 'medium';
        return await QRCode.toDataURL(value || 'https://kilatz.id', {
            width: size,
            margin: 1,
            errorCorrectionLevel: errorCorrectionLevel,
        });
    } catch (err) {
        console.error('Error generating QR Data URL:', err);
        return '';
    }
}

/**
 * React Component for rendering standard ISO/IEC 18004 QR Code SVG.
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
    value,
    size = 180,
    className = '',
    level = 'M',
    includeMargin = true,
}) => {
    return (
        <QRCodeSVG
            value={value || 'https://kilatz.id'}
            size={size}
            level={level}
            includeMargin={includeMargin}
            marginSize={1}
            className={`select-none ${className}`}
        />
    );
};

export default QrCodeSvg;
