import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ANN_SYSTEM = `あなたはAI秘書「アン」です。
知的で理知的、常に丁寧な敬語でユーザーのタスク管理を支援します。
指定されたJSONフォーマットのみで回答してください。余計なテキストやマークダウンは一切出力しないでください。`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { phase, task, completedTasks, daysSince } = req.body

  let prompt = ''

  if (phase === 'decomposition') {
    prompt = `タスク「${task.title}」${task.description ? `（説明：${task.description}）` : ''}を分析し、以下のJSONのみを返してください：
{"phase":"decomposition","first_step":"2分以内で完了できる最初の具体的な動作","steps":["ステップ1","ステップ2","ステップ3","ステップ4"],"secretary_advice":"アンからの一言アドバイス（知的・簡潔・敬語）","value_summary":"このタスクの組織・社会的価値の一文要約"}`

  } else if (phase === 'intervention') {
    prompt = `タスク「${task.title}」が${daysSince}日間停滞しています。状況を判断し、以下のJSONのみを返してください：
{"phase":"intervention","recommendation":"redecompose または freeze または delete のいずれか1つ","reason":"推奨理由（アンの口調で丁寧に、1〜2文）","new_steps":["再分解時のみ記入：ステップ1","ステップ2","ステップ3"]}`

  } else if (phase === 'reflection') {
    const taskList = (completedTasks as { title: string }[]).map(t => `・${t.title}`).join('\n')
    prompt = `本日完了したタスク：\n${taskList}\n\n以下のJSONのみを返してください：
{"phase":"reflection","narrative":"完了タスクの価値と貢献を言語化した2〜3文（アンの口調で）","advice":"明日への建設的なアドバイス1文"}`

  } else {
    return res.status(400).json({ error: 'Invalid phase' })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: ANN_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    const json = JSON.parse(text)
    return res.status(200).json(json)
  } catch (err) {
    console.error('[ann] error:', err)
    return res.status(500).json({ error: 'AI応答の生成に失敗しました' })
  }
}
