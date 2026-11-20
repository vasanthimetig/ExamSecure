import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded data (id, role, stream) to the request
    req.user = decoded; 
    
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied for role: ${req.user?.role || 'Unknown'}` 
      });
    }
    next();
  };
};

export default authMiddleware;