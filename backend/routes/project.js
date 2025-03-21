const express = require('express');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');
const Project = require('../models/Project');

const hf = new HfInference();

const QUESTIONS = [
  'What is the main purpose of your project?',
  'What entities (e.g., users, products) do you need to store?',
  'What relationships exist between these entities?',
];

router.get('/start', async (req, res) => {
  const { step = 0, response } = req.body;

  if (step >= QUESTIONS.length) {
    const prompt = `
    Based on the following user responses, generate a SQL database schema:
      1. Purpose: ${responses[0]}
      2. Entities: ${responses[1]}
      3. Relationships: ${responses[2]}
      Provide only the SQL CREATE TABLE statements.`;

    try {
      const response = hf.textGeneration({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        inputs: prompt,
        parameters: { max_new_tokens: 500 },
      });

      const schema = (await response).generated_text.trim();
      const projectId = `project-${Date.now()}`;
      const newProject = new Project({ projectId, schema });
      await newProject.save();
      res.json({ projectId, schema, completed: true });
    } catch (error) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.json({ question: QUESTIONS[step], step });
  }
});

router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findOne({ projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.schema);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/update', async (req, res) => {
  const { projectId, schema } = req.body;

  try {
    await Project.updateOne({ projectId }, { schema });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
