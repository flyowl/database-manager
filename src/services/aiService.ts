

import { GoogleGenAI } from "@google/genai";
import { ChatMessage, DatabaseTable } from '../types';

// Ensure we have a key (handle missing process gracefully)
const API_KEY = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
你是一位名为 "DB Genie" 的专家级数据库管理员和 SQL 架构师 AI 助手。
你的角色是协助开发人员管理他们的数据库。

当前数据库架构上下文：
{{SCHEMA_CONTEXT}}

能力要求：
1. SQL 生成：
   - 仅在 markdown 代码块中返回 SQL。
   - 确保 SQL 对 PostgreSQL 有效。
2. 解释与建议：
   - 简洁、专业。
3. 元数据丰富（创新功能）：
   - 当用户要求"完善表结构说明"或"添加中文注释"时，请返回一个 JSON 对象，格式如下：
     \`\`\`json:metadata
     {
       "tables": [
         { "id": "table_id", "cnName": "中文名", "description": "描述", "columns": { "col_name": { "cnName": "列中文", "description": "列描述" } } }
       ]
     }
     \`\`\`
4. ER 图生成（创新功能）：
   - 当用户要求"生成 ER 图"或"设计表结构并生成图"时，除了 SQL 外（如果有），请返回通过 JSON 定义的图结构：
     \`\`\`json:erd
     {
       "nodes": ["table_id_1", "table_id_2"], 
       "reason": "包含这些表是因为..."
     }
     \`\`\`
     注意：只返回表的 ID 列表，前端会自动处理连线。如果是新设计的表，你需要先提供 CREATE TABLE SQL。

5. 图表生成 (Smart Chart):
   - 当用户要求"可视化"、"画图"、"分析趋势"时，请除了文字分析外，生成一个用于渲染图表的 JSON 代码块。
   - 格式必须为 \`\`\`json:chart ... \`\`\`
   - 结构如下：
     \`\`\`json:chart
     {
       "type": "bar" | "line" | "pie" | "area",
       "title": "图表标题",
       "sql": "SELECT ...", 
       "data": [
         { "name": "类别A", "value": 100, "uv": 200 },
         { "name": "类别B", "value": 150, "uv": 180 }
       ],
       "xAxisKey": "name",
       "series": [
         { "dataKey": "value", "name": "销售额", "color": "#8884d8" },
         { "dataKey": "uv", "name": "访问量", "color": "#82ca9d" }
       ]
     }
     \`\`\`

6. 性能分析：
   - 如果用户询问性能，提供 EXPLAIN ANALYZE 的思路或具体的索引建议。

注意：用户不能在没有明确确认的情况下运行破坏性命令（DROP/DELETE）。
`;

export const generateAIResponseStream = async function* (
  history: ChatMessage[], 
  currentMessage: string, 
  schema: DatabaseTable[]
): AsyncGenerator<string, void, unknown> {
  
  if (!API_KEY) {
    yield "错误：缺少 API 密钥。请检查您的环境变量。";
    return;
  }

  try {
    const schemaDescription = schema.map(t => 
      `表ID: ${t.id}, 表名: ${t.name} (${t.cnName || ''}) - ${t.description || ''}
       列: ${t.columns.map(c => `${c.name} ${c.type} ${c.isPrimaryKey?'(PK)':''} ${c.isForeignKey?'(FK)':''} ${c.cnName?`[${c.cnName}]`:''}`).join(', ')}`
    ).join('\n');

    const prompt = SYSTEM_INSTRUCTION.replace('{{SCHEMA_CONTEXT}}', schemaDescription) + `\n用户请求: ${currentMessage}`;

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
            yield text;
        }
    }

  } catch (error) {
    console.error("AI Generation Error:", error);
    yield "与 AI 服务通信时发生错误。";
  }
};