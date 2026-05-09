import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
    const fullPrompt = `${ANN_SYSTEM}\n\n${prompt}`
    const result = await model.generateContent(fullPrompt)
    const text = result.response.text().trim()
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const json = JSON.parse(cleaned)
    return res.status(200).json(json)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[ann] error:', msg)
    return res.status(500).json({ error: msg })
  }
}
