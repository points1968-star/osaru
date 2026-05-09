import type { FilterState, Priority, Status } from '../types'

interface Props {
  filter: FilterState
  onChange: (f: FilterState) => void
  totalCount: number
  activeCount: number
  completedCount: number
}

export function FilterBar({ filter, onChange, totalCount, activeCount, completedCount }: Props) {
  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filter, [key]: value })
  }

  return (
    <div className="filter-bar">
      <div className="filter-stats">
        <span>全 {totalCount}</span>
        <span className="stat-sep">|</span>
        <span>未完了 {activeCount}</span>
        <span className="stat-sep">|</span>
        <span>完了 {completedCount}</span>
      </div>

      <div className="filter-controls">
        <div className="filter-group">
          <label className="filter-label">状態</label>
          <div className="btn-group">
            {([['all', '全て'], ['active', '未完了'], ['completed', '完了']] as [Status, string][]).map(
              ([v, label]) => (
                <button
                  key={v}
                  className={`tab-btn ${filter.status === v ? 'tab-btn--active' : ''}`}
                  onClick={() => set('status', v)}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">優先度</label>
          <div className="btn-group">
            {([['all', '全て'], ['high', '高'], ['medium', '中'], ['low', '低']] as [(Priority | 'all'), string][]).map(
              ([v, label]) => (
                <button
                  key={v}
                  className={`tab-btn ${filter.priority === v ? 'tab-btn--active' : ''}`}
                  onClick={() => set('priority', v)}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">並び替え</label>
          <select
            className="select"
            value={filter.sortBy}
            onChange={e => set('sortBy', e.target.value as FilterState['sortBy'])}
          >
            <option value="createdAt">作成日</option>
            <option value="dueDate">期限</option>
            <option value="priority">優先度</option>
          </select>
        </div>
      </div>
    </div>
  )
}
