const express = require('express');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');
const Project = require('../models/Project');

const hf = new HfInference(process.env.HF_API_TOKEN);

const extractSQL = (text) => {
  const lines = text.split('\n');
  const sqlStartIndex = lines.findIndex((line) =>
    line.trim().startsWith('CREATE TABLE')
  );
  if (sqlStartIndex === -1) return text.trim();
  const sqlEndIndex = lines.findIndex(
    (line, i) =>
      i > sqlStartIndex &&
      line.trim() === ');' &&
      !lines[i + 1]?.trim().startsWith('CREATE TABLE')
  );
  return lines
    .slice(sqlStartIndex, sqlEndIndex !== -1 ? sqlEndIndex + 1 : undefined)
    .join('\n')
    .trim();
};

router.post('/start', async (req, res) => {
  const { step = 0, responses = [] } = req.body;

  if (step === 0 && responses.length === 0) {
    res.json({ step, completed: false });
  } else if (step === 0 && responses.length > 0) {
    const prompt = `
    Based on the following user prompt, generate a SQL database schema:
    Prompt: ${responses[0] || 'Not provided'}
    Provide only the SQL CREATE TABLE statements.`;

    try {
      const response = await hf.textGeneration({
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
        inputs: prompt,
        parameters: { max_new_tokens: 500 },
      });
      const schema = extractSQL(response.generated_text);
      console.log('Hugging Face Response:', response);
      console.log('Extracted Schema:', schema);

      res.json({
        schema,
        messages: [
          { sender: 'ai', text: 'Does this look good?' },
          { sender: 'user', text: responses[0] },
        ],
        step: 1,
        completed: false,
      });
    } catch (err) {
      console.error('Inference Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  } else if (step === 1) {
    const userResponse = responses[responses.length - 1]?.toLowerCase();
    const previousSchema = responses[0];

    if (userResponse.includes('yes')) {
      try {
        const projectId = `project-${Date.now()}`;
        const newProject = new Project({ projectId, schema: previousSchema });
        await newProject.save();
        res.json({
          projectId,
          schema: previousSchema,
          messages: [
            { sender: 'ai', text: 'Great! Project finalized.' },
            { sender: 'user', text: responses[responses.length - 1] },
          ],
          completed: true,
        });
      } catch (err) {
        console.error('Project Save Error:', err.message);
        res.status(500).json({ error: err.message });
      }
    } else {
      const prompt = `
      The current schema is:
      ${previousSchema}
      The user says: "${responses[responses.length - 1]}"
      Modify the schema based on the user's feedback and provide the updated SQL CREATE TABLE statements.`;

      try {
        const response = await hf.textGeneration({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          inputs: prompt,
          parameters: { max_new_tokens: 500 },
        });
        const updatedSchema = extractSQL(response.generated_text);
        console.log('Hugging Face Response:', response);
        console.log('Extracted Schema:', updatedSchema);

        res.json({
          schema: updatedSchema,
          messages: [
            { sender: 'ai', text: 'Does this look good?' },
            { sender: 'user', text: responses[responses.length - 1] },
          ],
          step: 1,
          completed: false,
        });
      } catch (err) {
        console.error('Inference Error:', err.message);
        res.status(500).json({ error: err.message });
      }
    }
  } else {
    res.status(400).json({ error: 'Invalid step' });
  }
});

router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findOne({ projectId });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.schema);
  } catch (err) {
    console.error('Get Project Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/update', async (req, res) => {
  const { projectId, schema } = req.body;

  if (!projectId || !schema) {
    return res.status(400).json({ error: 'projectId and schema are required' });
  }

  try {
    const result = await Project.updateOne({ projectId }, { schema });
    if (result.nModified === 0)
      return res.status(404).json({ error: 'Project not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Update Project Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
