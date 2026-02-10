import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
    width: 512,
    height: 512,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 256,
                    background: 'linear-gradient(135deg, #1e3a8a, #7e22ce)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '20%',
                    fontFamily: 'sans-serif',
                    fontWeight: 800,
                }}
            >
                CR
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
