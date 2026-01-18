import { Router, Response } from 'express';
import { UserModel } from '../models/User';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all users (admin only)
router.get('/', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const users = UserModel.findAll();
    const sanitizedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      last_login: u.last_login,
    }));
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const user = UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (user.id === req.user!.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    UserModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
