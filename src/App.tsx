import { useState, useMemo } from "react";
import "./App.css";
import FilterBar from "./components/FilterBar";
import SearchBar from "./components/SearchBar";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import type { Task, TaskFilter, TaskFormInput } from "./types/task";
import { loadTasks } from "./utils/storage";
import { getTaskStatus } from "./utils/reminder";
import {
  addTask,
  completeTask,
  createTask,
  deleteTask,
  filterTasks,
  searchTasks,
  updateTask,
} from "./utils/taskUtils";
// AI Module imports
import {
  predictPriority,
  categorizeTask,
  calculateTaskScore,
  getSmartTaskOrder,
  getAISummary,
  getTaskInsights,
} from "./utils/ai";

// Page Components
function HomePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const tasks = loadTasks();
  
  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    const overdue = tasks.filter(t => getTaskStatus(t) === 'overdue').length;
    const today = tasks.filter(t => getTaskStatus(t) === 'today').length;
    return { total: tasks.length, completed, pending, overdue, today };
  }, [tasks]);

  return (
    <div className="page home-page">
      <div className="hero-section">
        <div className="hero-badge">▶ PLAYER 1 READY</div>
        <h1 className="hero-title">TASKSENSE (CI/CD)</h1>
        <p className="hero-subtitle">🎮 Your Quest Management System 🎮</p>
        
        <div className="hero-stats">
          <div className="stat-card cyan">
            <span className="stat-emoji">📋</span>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-name">TOTAL</span>
          </div>
          <div className="stat-card green">
            <span className="stat-emoji">✅</span>
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-name">DONE</span>
          </div>
          <div className="stat-card yellow">
            <span className="stat-emoji">⏳</span>
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-name">PENDING</span>
          </div>
          <div className="stat-card pink">
            <span className="stat-emoji">⚠️</span>
            <span className="stat-value">{stats.overdue}</span>
            <span className="stat-name">OVERDUE</span>
          </div>
        </div>
      </div>

      <div className="action-grid">
        <button className="action-card" onClick={() => onNavigate('new-quest')}>
          <span className="action-icon">⚔️</span>
          <h3>NEW QUEST</h3>
          <p>Start a new adventure</p>
        </button>
        
        <button className="action-card" onClick={() => onNavigate('quests')}>
          <span className="action-icon">📜</span>
          <h3>QUEST LOG</h3>
          <p>View all your quests</p>
        </button>
        
        <button className="action-card" onClick={() => onNavigate('inventory')}>
          <span className="action-icon">🎒</span>
          <h3>INVENTORY</h3>
          <p>Manage by priority</p>
        </button>
        
        <button className="action-card" onClick={() => onNavigate('achievements')}>
          <span className="action-icon">🏆</span>
          <h3>ACHIEVEMENTS</h3>
          <p>Track your progress</p>
        </button>
        
        <button className="action-card ai-card" onClick={() => onNavigate('ai-insights')}>
          <span className="action-icon">🤖</span>
          <h3>AI INSIGHTS</h3>
          <p>Smart task analysis</p>
        </button>
      </div>

      <div className="quick-info">
        <div className="info-card">
          <h4>🎯 TODAY'S MISSIONS</h4>
          <p className="info-value">{stats.today} quest{stats.today !== 1 ? 's' : ''} due today</p>
        </div>
        <div className="info-card">
          <h4>⚡ POWER LEVEL</h4>
          <div className="power-bar">
            <div className="power-fill" style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}></div>
          </div>
          <p className="info-value">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% Complete</p>
        </div>
      </div>
    </div>
  );
}

function NewQuestPage({ onAddTask, onNavigate }: { onAddTask: (input: TaskFormInput) => void, onNavigate: (page: string) => void }) {
  return (
    <div className="page new-quest-page">
      <div className="page-header">
        <h1 className="page-title">
          <span>⚔️</span> NEW QUEST <span>✨</span>
        </h1>
        <p className="page-subtitle">Create a new quest to embark on</p>
      </div>
      <div className="form-wrapper">
        <TaskForm
          editingTask={null}
          onAddTask={(input) => {
            onAddTask(input);
            onNavigate('quests');
          }}
          onEditTask={() => {}}
          onCancelEdit={() => {}}
        />
      </div>
    </div>
  );
}

function QuestLogPage({ 
  tasks, 
  onComplete, 
  onDelete, 
  onEdit 
}: { 
  tasks: Task[], 
  onComplete: (id: number) => void, 
  onDelete: (id: number) => void, 
  onEdit: (task: Task) => void 
}) {
  const [filter, setFilter] = useState<TaskFilter>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const visibleTasks = useMemo(() => {
    const searched = searchTasks(tasks, searchTerm);
    const filtered = filterTasks(searched, filter);
    return [...filtered].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);
  }, [tasks, searchTerm, filter]);

  return (
    <div className="page quest-log-page">
      <div className="page-header">
        <h1 className="page-title">
          <span>📜</span> QUEST LOG <span>🗡️</span>
        </h1>
        <p className="page-subtitle">All your active and completed quests</p>
      </div>
      
      <div className="controls-section">
        <div className="control-box">
          <h3 className="control-title">🔍 SEARCH</h3>
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>
        <div className="control-box">
          <h3 className="control-title">📂 FILTER</h3>
          <FilterBar current={filter} onChange={setFilter} />
        </div>
      </div>

      <div className="tasks-section">
        <div className="section-header">
          <h2>▼ ACTIVE QUESTS ({visibleTasks.length}) ▼</h2>
        </div>
        <TaskList
          tasks={visibleTasks}
          onEditTask={onEdit}
          onDeleteTask={onDelete}
          onCompleteTask={onComplete}
        />
      </div>
    </div>
  );
}

function InventoryPage({ tasks }: { tasks: Task[] }) {
  const highPriority = tasks.filter(t => t.priority === 'High' && !t.completed);
  const mediumPriority = tasks.filter(t => t.priority === 'Medium' && !t.completed);
  const lowPriority = tasks.filter(t => t.priority === 'Low' && !t.completed);

  return (
    <div className="page inventory-page">
      <div className="page-header">
        <h1 className="page-title">
          <span>🎒</span> INVENTORY <span>⚔️</span>
        </h1>
        <p className="page-subtitle">Organize quests by priority level</p>
      </div>

      <div className="priority-grid">
        <div className="priority-column high">
          <div className="priority-header">
            <span className="priority-icon">🔥</span>
            <h3>HIGH PRIORITY</h3>
            <span className="priority-count">{highPriority.length}</span>
          </div>
          <div className="priority-items">
            {highPriority.length === 0 ? (
              <p className="empty-priority">No high priority quests</p>
            ) : (
              highPriority.map(task => (
                <div key={task.id} className="priority-item">
                  <span className="item-icon">⚔️</span>
                  <div className="item-info">
                    <h4>{task.title}</h4>
                    <p>📅 {task.dueDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="priority-column medium">
          <div className="priority-header">
            <span className="priority-icon">⚡</span>
            <h3>MEDIUM PRIORITY</h3>
            <span className="priority-count">{mediumPriority.length}</span>
          </div>
          <div className="priority-items">
            {mediumPriority.length === 0 ? (
              <p className="empty-priority">No medium priority quests</p>
            ) : (
              mediumPriority.map(task => (
                <div key={task.id} className="priority-item">
                  <span className="item-icon">🗡️</span>
                  <div className="item-info">
                    <h4>{task.title}</h4>
                    <p>📅 {task.dueDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="priority-column low">
          <div className="priority-header">
            <span className="priority-icon">💚</span>
            <h3>LOW PRIORITY</h3>
            <span className="priority-count">{lowPriority.length}</span>
          </div>
          <div className="priority-items">
            {lowPriority.length === 0 ? (
              <p className="empty-priority">No low priority quests</p>
            ) : (
              lowPriority.map(task => (
                <div key={task.id} className="priority-item">
                  <span className="item-icon">🛡️</span>
                  <div className="item-info">
                    <h4>{task.title}</h4>
                    <p>📅 {task.dueDate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementsPage({ tasks }: { tasks: Task[] }) {
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const highCompleted = tasks.filter(t => t.completed && t.priority === 'High').length;
  
  const achievements = [
    { icon: '🌟', name: 'FIRST QUEST', desc: 'Complete your first quest', unlocked: completed >= 1 },
    { icon: '⚔️', name: 'WARRIOR', desc: 'Complete 5 quests', unlocked: completed >= 5 },
    { icon: '🏆', name: 'CHAMPION', desc: 'Complete 10 quests', unlocked: completed >= 10 },
    { icon: '🔥', name: 'DRAGON SLAYER', desc: 'Complete 3 high priority quests', unlocked: highCompleted >= 3 },
    { icon: '📋', name: 'QUEST MASTER', desc: 'Have 10 total quests', unlocked: total >= 10 },
    { icon: '💯', name: 'PERFECTIONIST', desc: 'Complete all quests', unlocked: total > 0 && completed === total },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="page achievements-page">
      <div className="page-header">
        <h1 className="page-title">
          <span>🏆</span> ACHIEVEMENTS <span>⭐</span>
        </h1>
        <p className="page-subtitle">Your legendary accomplishments</p>
      </div>

      <div className="achievements-progress">
        <div className="progress-circle">
          <span className="progress-value">{unlockedCount}/{achievements.length}</span>
          <span className="progress-label">UNLOCKED</span>
        </div>
      </div>

      <div className="achievements-grid">
        {achievements.map((achievement, i) => (
          <div key={i} className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">{achievement.icon}</span>
            <div className="achievement-info">
              <h3>{achievement.name}</h3>
              <p>{achievement.desc}</p>
            </div>
            <span className="achievement-status">
              {achievement.unlocked ? '✅' : '🔒'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 🤖 AI INSIGHTS PAGE - Smart Task Analysis
function AIInsightsPage({ tasks }: { tasks: Task[] }) {
  const summary = useMemo(() => getAISummary(tasks), [tasks]);
  const smartOrder = useMemo(() => getSmartTaskOrder(tasks.filter(t => !t.completed)), [tasks]);
  
  // Get detailed insights for each task
  const taskInsights = useMemo(() => {
    return smartOrder.slice(0, 5).map(task => ({
      task,
      insights: getTaskInsights(task)
    }));
  }, [smartOrder]);

  return (
    <div className="page ai-insights-page">
      <div className="page-header">
        <h1 className="page-title">
          <span>🤖</span> AI COMMAND CENTER <span>🧠</span>
        </h1>
        <p className="page-subtitle">Artificial Intelligence powered task analysis</p>
      </div>

      {/* AI Summary Dashboard */}
      <div className="ai-dashboard">
        <div className="ai-stat-card glow-cyan">
          <span className="ai-stat-icon">📊</span>
          <div className="ai-stat-content">
            <span className="ai-stat-value">{summary.totalTasks}</span>
            <span className="ai-stat-label">ACTIVE QUESTS</span>
          </div>
        </div>
        <div className="ai-stat-card glow-pink">
          <span className="ai-stat-icon">🚨</span>
          <div className="ai-stat-content">
            <span className="ai-stat-value">{summary.criticalTasks}</span>
            <span className="ai-stat-label">CRITICAL</span>
          </div>
        </div>
        <div className="ai-stat-card glow-green">
          <span className="ai-stat-icon">💡</span>
          <div className="ai-stat-content">
            <span className="ai-stat-value ai-tip">{summary.productivityTip}</span>
          </div>
        </div>
      </div>

      {/* AI Focus Suggestion */}
      {summary.suggestedFocus && (
        <div className="ai-focus-card">
          <div className="focus-header">
            <span className="focus-badge">🎯 AI RECOMMENDS</span>
            <h3>FOCUS ON THIS QUEST</h3>
          </div>
          <div className="focus-content">
            <span className="focus-icon">⚔️</span>
            <div className="focus-details">
              <h4>{summary.suggestedFocus.title}</h4>
              <p>{summary.suggestedFocus.description}</p>
              <div className="focus-meta">
                <span className="meta-item">📅 {summary.suggestedFocus.dueDate}</span>
                <span className={`meta-item priority-${summary.suggestedFocus.priority.toLowerCase()}`}>
                  🎖️ {summary.suggestedFocus.priority}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Priority Queue */}
      <div className="ai-section">
        <div className="ai-section-header">
          <h2><span>⚡</span> SMART PRIORITY QUEUE <span>⚡</span></h2>
          <p>Tasks ordered by AI-calculated urgency score</p>
        </div>

        <div className="priority-queue">
          {taskInsights.length === 0 ? (
            <div className="empty-ai-state">
              <span className="empty-icon">🎉</span>
              <p>No pending quests! Create new ones to see AI insights.</p>
            </div>
          ) : (
            taskInsights.map(({ task, insights }, index) => (
              <div key={task.id} className={`ai-task-card urgency-${insights.scheduleAnalysis.urgencyLevel.toLowerCase()}`}>
                <div className="ai-task-rank">
                  <span className="rank-badge">#{index + 1}</span>
                </div>
                <div className="ai-task-main">
                  <h4>{task.title}</h4>
                  <p className="ai-task-desc">{task.description}</p>
                  
                  <div className="ai-analysis-grid">
                    {/* Priority Prediction */}
                    <div className="analysis-item">
                      <span className="analysis-label">🎯 AI Priority</span>
                      <div className="analysis-value">
                        <span className={`ai-badge priority-${insights.priorityAnalysis.priority.toLowerCase()}`}>
                          {insights.priorityAnalysis.priority}
                        </span>
                        <span className="confidence">{insights.priorityAnalysis.confidence}% confident</span>
                      </div>
                      <p className="analysis-reason">{insights.priorityAnalysis.reason}</p>
                    </div>

                    {/* Category Prediction */}
                    <div className="analysis-item">
                      <span className="analysis-label">📂 AI Category</span>
                      <div className="analysis-value">
                        <span className="ai-badge category">{insights.categoryAnalysis.category}</span>
                        <span className="confidence">{insights.categoryAnalysis.confidence}% confident</span>
                      </div>
                      {insights.categoryAnalysis.relatedCategories.length > 0 && (
                        <p className="analysis-related">
                          Also related: {insights.categoryAnalysis.relatedCategories.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Urgency Score */}
                    <div className="analysis-item full-width">
                      <span className="analysis-label">📊 Urgency Score</span>
                      <div className="urgency-meter">
                        <div className="urgency-bar">
                          <div 
                            className={`urgency-fill ${insights.scheduleAnalysis.urgencyLevel.toLowerCase()}`}
                            style={{ width: `${insights.scheduleAnalysis.score}%` }}
                          ></div>
                        </div>
                        <span className="urgency-score">{insights.scheduleAnalysis.score}/100</span>
                      </div>
                      <p className="urgency-recommendation">{insights.scheduleAnalysis.recommendation}</p>
                      <span className="days-badge">
                        {insights.scheduleAnalysis.daysUntilDue < 0 
                          ? `⚠️ ${Math.abs(insights.scheduleAnalysis.daysUntilDue)} days overdue`
                          : insights.scheduleAnalysis.daysUntilDue === 0
                          ? `🔥 Due today!`
                          : `📅 ${insights.scheduleAnalysis.daysUntilDue} days left`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Concepts Info */}
      <div className="ai-concepts-section">
        <h3><span>🧠</span> AI CONCEPTS USED <span>💡</span></h3>
        <div className="concepts-grid">
          <div className="concept-card">
            <span className="concept-icon">📚</span>
            <h4>Knowledge Base</h4>
            <p>Stores keyword patterns for priorities and categories</p>
          </div>
          <div className="concept-card">
            <span className="concept-icon">⚙️</span>
            <h4>Inference Engine</h4>
            <p>Matches patterns using IF-THEN rules</p>
          </div>
          <div className="concept-card">
            <span className="concept-icon">📐</span>
            <h4>Heuristic Function</h4>
            <p>Calculates urgency using weighted formulas</p>
          </div>
          <div className="concept-card">
            <span className="concept-icon">🔍</span>
            <h4>Pattern Matching</h4>
            <p>Simple NLP for keyword extraction</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditQuestPage({ 
  task, 
  onSave, 
  onCancel 
}: { 
  task: Task | null, 
  onSave: (id: number, input: TaskFormInput) => void, 
  onCancel: () => void 
}) {
  if (!task) return null;

  return (
    <div className="page edit-quest-page">
      <div className="page-header">
        <h1 className="page-title">
          <span>✏️</span> EDIT QUEST <span>💾</span>
        </h1>
        <p className="page-subtitle">Modify your quest details</p>
      </div>
      <div className="form-wrapper">
        <TaskForm
          editingTask={task}
          onAddTask={() => {}}
          onEditTask={onSave}
          onCancelEdit={onCancel}
        />
      </div>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [currentPage, setCurrentPage] = useState('home');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleAddTask = (input: TaskFormInput) => {
    const task = createTask(input.title, input.description, input.dueDate, input.priority);
    setTasks((prev) => addTask(prev, task));
  };

  const handleEditTask = (taskId: number, input: TaskFormInput) => {
    setTasks((prev) => updateTask(prev, taskId, input));
    setEditingTask(null);
    setCurrentPage('quests');
  };

  const handleDeleteTask = (taskId: number) => {
    const confirmed = window.confirm("Delete this quest?");
    if (!confirmed) return;
    setTasks((prev) => deleteTask(prev, taskId));
  };

  const handleCompleteTask = (taskId: number) => {
    setTasks((prev) => completeTask(prev, taskId));
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setEditingTask(null);
  };

  const handleStartEdit = (task: Task) => {
    setEditingTask(task);
    setCurrentPage('edit');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'new-quest':
        return <NewQuestPage onAddTask={handleAddTask} onNavigate={handleNavigate} />;
      case 'quests':
        return <QuestLogPage tasks={tasks} onComplete={handleCompleteTask} onDelete={handleDeleteTask} onEdit={handleStartEdit} />;
      case 'inventory':
        return <InventoryPage tasks={tasks} />;
      case 'achievements':
        return <AchievementsPage tasks={tasks} />;
      case 'ai-insights':
        return <AIInsightsPage tasks={tasks} />;
      case 'edit':
        return <EditQuestPage task={editingTask} onSave={handleEditTask} onCancel={() => handleNavigate('quests')} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="game-layout">
      <nav className="game-nav">
        <div className="nav-header">
          <div className="nav-logo">
            <span className="logo-icon">🎮</span>
            <div className="logo-text">
              <h1>TASKSENSE</h1>
              <span className="logo-subtitle">QUEST MANAGER</span>
            </div>
          </div>
        </div>

        <div className="nav-stats">
          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <span className="stat-label">PLAYER 1</span>
          </div>
          <div className="stat-bar">
            <div className="stat-fill"></div>
          </div>
        </div>

        <ul className="nav-menu">
          <li>
            <button onClick={() => handleNavigate('home')} className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}>
              <span className="nav-icon">🏠</span>
              <span className="nav-text">HOME BASE</span>
              <span className="nav-arrow">▶</span>
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigate('new-quest')} className={`nav-link ${currentPage === 'new-quest' ? 'active' : ''}`}>
              <span className="nav-icon">⚔️</span>
              <span className="nav-text">NEW QUEST</span>
              <span className="nav-arrow">▶</span>
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigate('quests')} className={`nav-link ${currentPage === 'quests' ? 'active' : ''}`}>
              <span className="nav-icon">📜</span>
              <span className="nav-text">QUEST LOG</span>
              <span className="nav-arrow">▶</span>
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigate('inventory')} className={`nav-link ${currentPage === 'inventory' ? 'active' : ''}`}>
              <span className="nav-icon">🎒</span>
              <span className="nav-text">INVENTORY</span>
              <span className="nav-arrow">▶</span>
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigate('achievements')} className={`nav-link ${currentPage === 'achievements' ? 'active' : ''}`}>
              <span className="nav-icon">🏆</span>
              <span className="nav-text">ACHIEVEMENTS</span>
              <span className="nav-arrow">▶</span>
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigate('ai-insights')} className={`nav-link ai-nav ${currentPage === 'ai-insights' ? 'active' : ''}`}>
              <span className="nav-icon">🤖</span>
              <span className="nav-text">AI INSIGHTS</span>
              <span className="nav-arrow">▶</span>
            </button>
          </li>
        </ul>

        <div className="nav-footer">
          <div className="power-ups">
            <span className="power-up" title="Speed Boost">⚡</span>
            <span className="power-up" title="Shield Active">🛡️</span>
            <span className="power-up" title="Focus Mode">🎯</span>
          </div>
          <p className="nav-version">v1.0.0 • ARCADE MODE</p>
        </div>
      </nav>

      <main className="game-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;

