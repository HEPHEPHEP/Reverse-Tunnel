import { Router, Response } from 'express';
import { TunnelModel } from '../models/Tunnel';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all tunnels for current user
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tunnels = TunnelModel.findByUserId(userId);
    res.json(tunnels);
  } catch (error) {
    console.error('Get tunnels error:', error);
    res.status(500).json({ error: 'Failed to fetch tunnels' });
  }
});

// Get all tunnels (admin only)
router.get('/all', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const tunnels = TunnelModel.findAll();
    res.json(tunnels);
  } catch (error) {
    console.error('Get all tunnels error:', error);
    res.status(500).json({ error: 'Failed to fetch tunnels' });
  }
});

// Get single tunnel
router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const tunnel = TunnelModel.findById(req.params.id);

    if (!tunnel) {
      return res.status(404).json({ error: 'Tunnel not found' });
    }

    // Check if user owns the tunnel or is admin
    if (tunnel.user_id !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(tunnel);
  } catch (error) {
    console.error('Get tunnel error:', error);
    res.status(500).json({ error: 'Failed to fetch tunnel' });
  }
});

// Create new tunnel
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { name, local_port, remote_port, protocol } = req.body;

    if (!name || !local_port || !remote_port) {
      return res.status(400).json({ error: 'Name, local_port, and remote_port are required' });
    }

    const tunnel = TunnelModel.create({
      user_id: req.user!.userId,
      name,
      local_port: parseInt(local_port),
      remote_port: parseInt(remote_port),
      protocol: protocol || 'tcp',
    });

    res.status(201).json(tunnel);
  } catch (error) {
    console.error('Create tunnel error:', error);
    res.status(500).json({ error: 'Failed to create tunnel' });
  }
});

// Update tunnel
router.put('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const tunnel = TunnelModel.findById(req.params.id);

    if (!tunnel) {
      return res.status(404).json({ error: 'Tunnel not found' });
    }

    if (tunnel.user_id !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, local_port, remote_port, protocol } = req.body;
    const updates: any = {};

    if (name) updates.name = name;
    if (local_port) updates.local_port = parseInt(local_port);
    if (remote_port) updates.remote_port = parseInt(remote_port);
    if (protocol) updates.protocol = protocol;

    const updatedTunnel = TunnelModel.update(req.params.id, updates);
    res.json(updatedTunnel);
  } catch (error) {
    console.error('Update tunnel error:', error);
    res.status(500).json({ error: 'Failed to update tunnel' });
  }
});

// Delete tunnel
router.delete('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const tunnel = TunnelModel.findById(req.params.id);

    if (!tunnel) {
      return res.status(404).json({ error: 'Tunnel not found' });
    }

    if (tunnel.user_id !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    TunnelModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete tunnel error:', error);
    res.status(500).json({ error: 'Failed to delete tunnel' });
  }
});

export default router;
