import { processAiQuery, generateDashboardSummary, extractSmartLeave } from '../services/aiService.js';
import AiLog from '../models/AiLog.js';

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI assistant (Tool calling, role-scoped answers, policy Q&A)
 */
export const askAssistant = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a prompt' });
    }

    const result = await processAiQuery({
      prompt: prompt.trim(),
      user: req.user,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'The AI assistant encountered a temporary issue. Fallback response active.',
      answer: 'I am currently unable to process this request. Please try again or consult the dashboard directly.',
      tag: 'AI-generated',
    });
  }
};

/**
 * @route   POST /api/ai/summarize
 * @desc    Generates 3-5 sharp insight bullets from current KPI JSON numbers
 */
export const dashboardSummary = async (req, res) => {
  try {
    const { kpiData } = req.body;
    if (!kpiData) {
      return res.status(400).json({ success: false, message: 'kpiData object is required for summary generation' });
    }

    const bullets = generateDashboardSummary(kpiData, req.user.role);

    // Log call in ai_logs
    await AiLog.create({
      userId: req.user._id,
      userRole: req.user.role,
      endpoint: '/ai/summarize',
      prompt: 'Dashboard KPI Summary Request',
      toolsUsed: ['generate_dashboard_summary'],
      response: bullets.join(' | '),
      latencyMs: 15,
      success: true,
    }).catch(() => {});

    res.json({
      success: true,
      bullets,
      tag: 'AI-generated',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/ai/smart-leave
 * @desc    Converts natural language sentence into pre-filled leave form JSON
 */
export const smartLeaveParse = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Sentence text is required' });
    }

    const prefilledForm = extractSmartLeave(text);

    // Log call in ai_logs
    await AiLog.create({
      userId: req.user._id,
      userRole: req.user.role,
      endpoint: '/ai/smart-leave',
      prompt: text,
      toolsUsed: ['extract_smart_leave'],
      response: JSON.stringify(prefilledForm),
      latencyMs: 10,
      success: true,
    }).catch(() => {});

    res.json({
      success: true,
      prefilledForm,
      tag: 'AI-generated',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
