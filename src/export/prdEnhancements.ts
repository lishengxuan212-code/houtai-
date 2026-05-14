import type { Project } from '../domain/types';
import { runAiRules } from '../ai/rules';
import type { AiModelConfig } from '../ai/modelSettings';
import { exportMarkdownPrd } from './markdownPrd';
import { sanitizePlainPrd } from './plainPrdVocabulary';

export const PRD_AI_REVIEW_PROMPT =
  '根据此PRD。按照显示层：有什么模块，有什么逻辑；交互层：哪些模块与哪些内容有交互；逻辑：哪些模块与哪些内容有交互的逻辑。';

export function generatePrdAiReviewPreview(project: Project, markdown = exportMarkdownPrd(project)): string {
  const suggestions = runAiRules(project);
  const reviewNotes = suggestions.length
    ? suggestions.map((suggestion) => `- ${suggestion.title}：${suggestion.description}`).join('\n')
    : '- 当前 PRD 未发现明显缺失项。';

  return sanitizePlainPrd(`${markdown.trim()}

## AI 审核润色

审核提示词：
${PRD_AI_REVIEW_PROMPT}

审核结论：
${reviewNotes}`);
}

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

function readChatText(data: ChatResponse): string {
  const content = data.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : JSON.stringify(content ?? '');
}

async function readErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();
  if (!raw) return `PRD AI 审核请求失败：${response.status}`;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Record<string, unknown>;
      const error = record.error;
      if (error && typeof error === 'object' && !Array.isArray(error) && typeof (error as Record<string, unknown>).message === 'string') {
        return `PRD AI 审核请求失败：${response.status} ${(error as Record<string, string>).message}`;
      }
      if (typeof record.message === 'string') return `PRD AI 审核请求失败：${response.status} ${record.message}`;
    }
  } catch {
    // Use raw response below.
  }
  return `PRD AI 审核请求失败：${response.status} ${raw.slice(0, 300)}`;
}

export async function generatePrdAiReviewWithModel(config: AiModelConfig, project: Project, markdown = exportMarkdownPrd(project)): Promise<string> {
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: [
            '你是运营后台 PRD 审核与润色助手。',
            '只输出面向产品经理、业务方和开发的中文 PRD 内容。',
            '禁止输出坐标、技术字段、内部实现词、调试说明。',
            '必须按页面组织，并在每页下使用显示层、交互层、逻辑层。',
          ].join(' '),
        },
        {
          role: 'user',
          content: `${PRD_AI_REVIEW_PROMPT}\n\n项目名称：${project.name}\n\nPRD：\n${markdown}`,
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  const data = (await response.json()) as ChatResponse;
  const text = readChatText(data).trim();
  return sanitizePlainPrd(text || generatePrdAiReviewPreview(project, markdown));
}
