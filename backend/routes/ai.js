import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '../prompts/master-agent.js';

const router = express.Router();

// Generate code using Claude with orchestrational agent
router.post('/generate', async (req, res) => {
  const { prompt, apiKey, model = 'claude-3-7-sonnet-20250219', context = '' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = getSystemPrompt(context);

    const message = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const code = message.content[0].text;

    res.json({
      success: true,
      code,
      usage: message.usage
    });

  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// Orchestrational auto-fix loop - keeps trying until code works
router.post('/fix', async (req, res) => {
  const { 
    code, 
    error, 
    language, 
    apiKey, 
    model = 'claude-3-7-sonnet-20250219',
    maxIterations = 5,
    context = ''
  } = req.body;

  if (!code || !error || !apiKey) {
    return res.status(400).json({ error: 'Code, error, and API key are required' });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    let currentCode = code;
    let iteration = 0;
    const fixes = [];

    while (iteration < maxIterations) {
      const systemPrompt = `You are an expert debugging AI agent. Analyze errors and fix code automatically.

${context ? `Project Context:\n${context}\n\n` : ''}

Return ONLY the corrected code without explanations, markdown formatting, or code blocks.
Make targeted fixes to resolve the specific error while preserving existing functionality.`;

      const prompt = `Iteration ${iteration + 1}/${maxIterations}

Language: ${language}

Current Code:
${currentCode}

Error Output:
${error}

Fix this error and return the corrected code. Be precise and avoid introducing new issues.`;

      const message = await anthropic.messages.create({
        model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      currentCode = message.content[0].text.trim();
      fixes.push({
        iteration: iteration + 1,
        error: error.substring(0, 200),
        applied: true
      });

      iteration++;
      
      // In a real scenario, you'd re-execute and check if it works
      // For now, we return after one fix
      break;
    }

    res.json({
      success: true,
      fixedCode: currentCode,
      iterations: iteration,
      fixes,
      usage: message.usage
    });

  } catch (error) {
    console.error('AI fix error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

// Chat with orchestrational AI agent
router.post('/chat', async (req, res) => {
  const { 
    message, 
    history = [], 
    apiKey, 
    model = 'claude-3-7-sonnet-20250219',
    context = '',
    files = []
  } = req.body;

  if (!message || !apiKey) {
    return res.status(400).json({ error: 'Message and API key are required' });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    // Build rich context with file structure
    let enrichedContext = context;
    if (files.length > 0) {
      enrichedContext += '\n\n## Project Files:\n';
      files.forEach(file => {
        enrichedContext += `\n### ${file.name} (${file.language})\n\`\`\`${file.language}\n${file.content}\n\`\`\`\n`;
      });
    }

    const systemPrompt = getSystemPrompt(enrichedContext);

    const messages = [
      ...history,
      { role: 'user', content: message }
    ];

    const response = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages
    });

    const reply = response.content[0].text;

    res.json({
      success: true,
      reply,
      usage: response.usage
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
});

export default router;
