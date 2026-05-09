import { useEffect, useState } from 'react'

interface Props {
  message: string
  onDone: () => void
}

export function Toast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 2800)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className={`toast ${visible ? 'toast--visible' : ''}`}>
      <span className="toast-emoji">🎉</span>
      <span>{message}</span>
    </div>
  )
}

const HIGH_MESSAGES = [
  '高優先タスク完了！素晴らしい集中力です！',
  '難しいタスクをやり遂げました！最高です！',
  '重要なことをこなしましたね。お見事！',
]
const MED_MESSAGES = [
  'タスク完了！コツコツ積み上げていますね！',
  'また一つクリア！その調子です！',
  '着実に前進していますね！',
]
const LOW_MESSAGES = [
  'タスクを片付けました！スッキリしましたね！',
  'いいペースです！続けていきましょう！',
  '小さな一歩の積み重ねが大きな成果になります！',
]

export function pickMessage(priority: string): string {
  const pool =
    priority === 'high' ? HIGH_MESSAGES :
    priority === 'medium' ? MED_MESSAGES :
    LOW_MESSAGES
  return pool[Math.floor(Math.random() * pool.length)]
}
