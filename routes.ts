import express from 'express';
import { generateSimulation } from './simulation.js';
import { db } from './db.js';

const router = express.Router();

router.post('/api/simulate', async (req: express.Request, res: express.Response) => {
  try {
    const { name, age, personality, decision } = req.body;

    if (!name || !age || !decision) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await generateSimulation(name, parseInt(age), personality, decision);
    res.status(200).json(result);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Failed to generate simulation' });
  }
});

router.get('/api/simulations/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const simulation = await db
      .selectFrom('simulations')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!simulation) {
      res.status(404).json({ error: 'Simulation not found' });
      return;
    }

    const eventsA = await db
      .selectFrom('timeline_events')
      .selectAll()
      .where('simulation_id', '=', id)
      .where('path', '=', 'A')
      .orderBy('year', 'asc')
      .execute();

    const eventsB = await db
      .selectFrom('timeline_events')
      .selectAll()
      .where('simulation_id', '=', id)
      .where('path', '=', 'B')
      .orderBy('year', 'asc')
      .execute();

    res.status(200).json({
      simulation,
      paths: [
        {
          path: 'A',
          title: simulation.path_a_title || 'Path A',
          events: eventsA
        },
        {
          path: 'B',
          title: simulation.path_b_title || 'Path B',
          events: eventsB
        }
      ]
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
});

router.get('/api/simulations-history', async (req: express.Request, res: express.Response) => {
  try {
    const simulations = await db
      .selectFrom('simulations')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    res.status(200).json(simulations);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch simulation history' });
  }
});

router.delete('/api/simulations/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    await db.deleteFrom('timeline_events').where('simulation_id', '=', id).execute();
    await db.deleteFrom('simulations').where('id', '=', id).execute();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete simulation' });
  }
});

export default router;
