import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key';

export function withAuth(handler) {
  return async (req, res) => {
    try {
      // Parse cookies from the request
      const cookies = cookie.parse(req.headers.cookie || '');
      const token = cookies.auth_token;

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      try {
        // Verify the token
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Add the user information to the request object
        req.user = decoded;
        
        // Call the original handler
        return handler(req, res);
      } catch (error) {
        console.error('Token verification error:', error);
        
        // Clear the invalid cookie
        res.setHeader('Set-Cookie', cookie.serialize('auth_token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          expires: new Date(0),
          path: '/',
        }));
        
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}