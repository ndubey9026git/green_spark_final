/**
 * Middleware to check if the authenticated user's role is included
 * in the list of allowed roles for a specific route.
 * * @param {Array<string>} roles - An array of allowed role strings (e.g., ['admin', 'teacher']).
 * @returns {Function} Express middleware function.
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        // req.user is attached by the auth middleware (which runs first)
        if (!req.user || !req.user.role) {
            // Should theoretically be caught by auth middleware, but added for safety
            return res.status(403).json({ message: 'Authorization failed: User data missing.' });
        }

        // Check if the user's role is included in the allowed roles array
        if (roles.includes(req.user.role)) {
            next(); // User is authorized, proceed to the next middleware/handler
        } else {
            // User is authenticated but does not have the required role
            return res.status(403).json({ 
                message: 'You do not have permission to perform this action.',
                required_roles: roles,
                user_role: req.user.role
            });
        }
    };
};

module.exports = checkRole;