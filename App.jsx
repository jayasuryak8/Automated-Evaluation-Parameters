import React, { useEffect, useMemo, useState } from 'react';
import './theme.css';

const initialExpenses = [
  { id: 'sample-1', title: 'Weekly groceries', category: 'Food', amount: 850, date: 'Today' },
  { id: 'sample-2', title: 'Bus pass', category: 'Travel', amount: 420, date: 'Yesterday' },
  { id: 'sample-3', title: 'Phone bill', category: 'Bills', amount: 399, date: 'Mar 18' },
  { id: 'sample-4', title: 'Coffee & a little treat', category: 'Fun', amount: 180, date: 'Mar 17' },
  { id: 'sample-5', title: 'Course materials', category: 'Education', amount: 650, date: 'Mar 15' },
  { id: 'sample-6', title: 'Room contribution', category: 'Rent', amount: 1301, date: 'Mar 12' },
];

const categories = ['Food', 'Travel', 'Rent', 'Bills', 'Education', 'Fun', 'Other'];
const icons = { Food: '🥑', Travel: '🚌', Rent: '🏠', Bills: '⚡', Education: '📚', Fun: '☕', Other: '✳' };
const defaults = { budget: 6000, days: 20, essentials: 0, expenses: initialExpenses };
const money = (amount) => `₹${Math.max(0, Math.round(amount)).toLocaleString('en-IN')}`;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('broke-functional-budget-v1'));
    return saved ? { ...defaults, ...saved, expenses: Array.isArray(saved.expenses) ? saved.expenses : initialExpenses } : defaults;
  } catch {
    return defaults;
  }
}

function App() {
  const [state, setState] = useState(loadState);
  const [signedInAs, setSignedInAs] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [essentialsInput, setEssentialsInput] = useState(String(state.essentials || ''));
  const [forecastInputs, setForecastInputs] = useState({ income: '6000', spent: '1200', bills: '1500', days: '12' });
  const [forecastError, setForecastError] = useState('');
  const [forecast, setForecast] = useState({ income: 6000, spent: 1200, bills: 1500, days: 12 });
  const [timeMachine, setTimeMachine] = useState({ purchase: 3000, emergency: 0, extraIncome: 0, savings: '1500', days: 30 });

  useEffect(() => {
    localStorage.setItem('broke-functional-budget-v1', JSON.stringify(state));
  }, [state]);

  const total = state.expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const left = state.budget - total;
  const daily = Math.max(0, left / Math.max(1, state.days));
  const adjusted = Math.max(0, (left - state.essentials) / Math.max(1, state.days));
  const percent = state.budget > 0 ? Math.min(100, Math.round((total / state.budget) * 100)) : 0;
  const visibleExpenses = useMemo(() => state.expenses.filter((item) =>
    item.title.toLowerCase().includes(query.trim().toLowerCase()) && (category === 'all' || item.category === category)
  ), [state.expenses, query, category]);
  const forecastBalance = forecast.income - forecast.spent;
  const forecastAfterBills = forecastBalance - forecast.bills;
  const forecastDaily = Math.max(0, forecastAfterBills / Math.max(1, forecast.days));
  const simulatorBalance = 10000 - 2400 - 1600 - Number(timeMachine.purchase) - Number(timeMachine.emergency) + Number(timeMachine.extraIncome);
  const simulatorSavings = Math.min(10000000, Math.max(0, Number(timeMachine.savings) || 0));
  const simulatorAfterSavings = simulatorBalance - simulatorSavings;
  const simulatorDays = timeMachine.days;
  const simulatorDaily = Math.max(0, simulatorAfterSavings / simulatorDays);
  const skipPurchaseBalance = 10000 - 2400 - 1600 - Number(timeMachine.emergency) + Number(timeMachine.extraIncome);
  const skipPurchaseAfterSavings = skipPurchaseBalance - simulatorSavings;
  const skipPurchaseDaily = Math.max(0, skipPurchaseAfterSavings / simulatorDays);
  const simulatorStatus = simulatorAfterSavings < 0 ? 'Shortfall' : simulatorAfterSavings <= 1500 ? 'Caution' : 'On track';
  const simulatorExplanation = simulatorAfterSavings < 0
    ? `This choice leaves a ${money(Math.abs(simulatorAfterSavings))} gap after protecting your savings target. Consider a lower-cost option, reducing flexible spending, or waiting until more income arrives.`
    : simulatorStatus === 'Caution'
      ? 'The scenario preserves your selected savings target and leaves a positive buffer. Keep an eye on timing and any costs not included here.'
      : `After protecting ${money(simulatorSavings)} for savings, you still have ${money(simulatorAfterSavings)} available. This is a useful buffer, but remember that real costs and due dates may differ.`;
  const forecastCoach = forecastBalance < 0
    ? `Your entered expenses are ${money(Math.abs(forecastBalance))} above your income. Check that the figures cover the same period, then review flexible spending before making new commitments.`
    : forecastAfterBills < 0
      ? `Your planned bills are ${money(Math.abs(forecastAfterBills))} more than the balance left after expenses. Prioritize essential payments and consider whether any flexible costs or bill due dates can be adjusted.`
      : `After setting aside ${money(forecast.bills)} for bills, the entered figures leave ${money(forecastAfterBills)} for ${forecast.days} days. That works out to ${money(forecastDaily)} per day; track spending against it and leave room for costs you have not entered.`;

  const updateForecastInput = (field, value) => {
    setForecastInputs((current) => ({ ...current, [field]: value }));
    setForecastError('');
  };

  const calculateForecast = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(Object.entries(forecastInputs).map(([key, value]) => [key, Number(value)]));
    const validAmounts = ['income', 'spent', 'bills'].every((key) => forecastInputs[key].trim() !== '' && Number.isFinite(values[key]) && values[key] >= 0 && values[key] <= 100000000);
    if (!validAmounts || forecastInputs.days.trim() === '' || !Number.isInteger(values.days) || values.days < 1 || values.days > 366) {
      setForecastError('Enter amounts from ₹0 to ₹10 crore and between 1 and 366 days.');
      return;
    }
    setForecast(values);
  };

  const openDialog = (item = null) => {
    setEditingId(item?.id || null);
    setTitle(item?.title || '');
    setAmount(item ? String(item.amount) : '');
    setExpenseCategory(item?.category || 'Food');
    setFormError('');
    setDialogOpen(true);
  };

  const saveExpense = (event) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const numericAmount = Number(amount);
    if (!cleanTitle || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Add a description and an amount greater than zero.');
      return;
    }
    if (editingId) {
      setState((current) => ({ ...current, expenses: current.expenses.map((item) => item.id === editingId ? { ...item, title: cleanTitle, amount: Math.round(numericAmount), category: expenseCategory } : item) }));
    } else {
      setState((current) => ({ ...current, expenses: [{ id: globalThis.crypto?.randomUUID?.() || String(Date.now()), title: cleanTitle, amount: Math.round(numericAmount), category: expenseCategory, date: 'Today' }, ...current.expenses] }));
    }
    setDialogOpen(false);
  };

  const promptForNumber = (message, initial, validate, update) => {
    const value = window.prompt(message, String(initial));
    if (value === null) return;
    const number = Number(value);
    if (validate(number)) setState((current) => ({ ...current, [update]: Math.round(number) }));
  };

  const coachMessage = left < 0
    ? `You're ${money(Math.abs(left))} over this month's budget. Pause non-essentials for now, check for upcoming bills, and make a small plan for the days ahead.`
    : left < state.budget * 0.2
      ? `You've got ${money(left)} left. Keep essentials covered first, and try to stick to ${money(adjusted)} a day after your planned bills.`
      : `You have ${money(left)} left. Review upcoming bills first, reserve money for essentials, and use the rest to set a safe daily limit.`;

  if (!signedInAs) {
    return (
      <main className="login-page">
        <div className="login-layout">
          <section className="login-welcome" aria-labelledby="login-welcome-title">
            <a className="brand login-brand" href="#top" aria-label="PocketWise">
              <span className="brand-mark">↗</span>
              <span>PocketWise<span className="brand-dot">.</span></span>
            </a>
            <div className="login-welcome-copy">
              <p className="hero-kicker"><span /> A LITTLE MORE IN CONTROL</p>
              <h1 id="login-welcome-title">Make room<br />for what matters.</h1>
              <p>Your money, your month, and a gentler plan for getting through it—all in one place.</p>
            </div>
            <div className="login-preview" aria-label="Budget preview">
              <div className="login-preview-heading"><span className="preview-icon">↗</span><span>YOUR MONTH AT A GLANCE</span><span className="preview-leaf">✳</span></div>
              <div className="preview-balance"><span>Safe to spend today</span><strong>₹184</strong></div>
              <div className="preview-progress"><span /></div>
              <div className="preview-caption"><span>Small steps count.</span><span>One day at a time</span></div>
            </div>
            <p className="login-privacy"><span aria-hidden="true">◉</span> Your budget stays on this device.</p>
          </section>

          <section className="login-panel" aria-labelledby="login-title">
            <div className="login-form-wrap">
              <p className="eyebrow">WELCOME BACK</p>
              <h2 id="login-title">Let's get you in.</h2>
              <p className="login-subtitle">Sign in to pick up where you left off.</p>
              <form className="login-form" onSubmit={(event) => {
                event.preventDefault();
                setSignedInAs(loginEmail.trim());
                setLoginPassword('');
              }}>
                <div>
                  <label className="field-label" htmlFor="login-email">Email address</label>
                  <input id="login-email" className="input" type="email" autoComplete="email" placeholder="you@example.com" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} required />
                </div>
                <div>
                  <label className="field-label" htmlFor="login-password">Password</label>
                  <input id="login-password" className="input" type="password" autoComplete="current-password" placeholder="Enter your password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required />
                </div>
                <button className="primary-button login-submit" type="submit">Sign in <span aria-hidden="true">↗</span></button>
              </form>
              <p className="login-demo-note"><span aria-hidden="true">✳</span> Demo sign-in: any email and password will work. Nothing is verified or stored.</p>
            </div>
            <p className="login-footer">A calmer money check-in, whenever you need it.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="PocketWise home"><span className="brand-mark">↗</span><span>PocketWise<span className="brand-dot">.</span></span></a>
        <p className="eyebrow sidebar-label">Financial intelligence</p>
        <nav className="navigation" aria-label="Main navigation">
          <a className="nav-link active" href="#top">◫ <span>Overview</span></a>
          <a className="nav-link" href="#transactions">↕ <span>Transactions</span></a>
          <a className="nav-link" href="#plan">◎ <span>Savings goals</span></a>
          <a className="nav-link" href="#time-machine">◇ <span>Simulator</span></a>
          <a className="nav-link" href="#future-scope">✳ <span>Roadmap</span></a>
        </nav>
        <div className="sidebar-note"><span className="note-icon">✳</span><p className="note-title">Illustrative data</p><p>Compare scenarios, but remember that actual costs and timing can change the outcome.</p></div>
        <p className="privacy-note">Your money stays on this device.</p>
      </aside>

      <main id="top" className="main-content">
        <header className="topbar">
          <a className="brand mobile-brand" href="#top"><span className="brand-mark">↗</span><span>PocketWise<span className="brand-dot">.</span></span></a>
          <div className="page-heading"><p className="eyebrow">Financial intelligence · Illustrative data</p><h1>Your 30-day budget</h1></div>
          <div className="account"><span className="account-caption">{signedInAs}</span><span className="avatar" aria-label="Your account">{signedInAs.charAt(0).toUpperCase()}</span><button className="sign-out-button" type="button" onClick={() => setSignedInAs('')}>Sign out</button></div>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy"><div className="hero-kicker"><span /> FINANCIAL INTELLIGENCE</div><h2 id="hero-title">Your 30-day budget</h2><p>Understand what is available, what is committed, and how today's choices could affect your plan.</p><a className="hero-button" href="#time-machine">Test a decision <span aria-hidden="true">↗</span></a></div>
          <div className="hero-stats">
            <div className="hero-stat"><p>Monthly budget</p><strong>{money(state.budget)}</strong><small>illustrative data</small></div>
            <div className="hero-stat"><p>Available balance</p><strong>{money(left)}</strong><small>after recorded expenses</small></div>
            <div className="budget-meter"><div className="meter-label"><span>Monthly budget used</span><strong>{percent}%</strong></div><div className="progress-track"><div className={`progress-fill ${total > state.budget ? 'over-budget' : ''}`} style={{ width: `${percent}%` }} /></div><div className="meter-caption"><span>{money(total)} spent</span><span>of {money(state.budget)}</span></div></div>
          </div>
        </section>

        <section className="module-launcher" aria-label="Advanced financial modules">
          <a className="module-tile module-ai" href="#ai-coach"><span className="module-icon">✳</span><span className="module-copy"><strong>AI Coach</strong><small>Insights &amp; actions · rules preview</small></span><span className="module-arrow">↗</span></a>
          <a className="module-tile module-cashflow" href="#forecast-title"><span className="module-icon">↗</span><span className="module-copy"><strong>Smart Budget</strong><small>Cash flow &amp; forecast</small></span><span className="module-arrow">↗</span></a>
          <a className="module-tile module-simulator" href="#time-machine"><span className="module-icon">◇</span><span className="module-copy"><strong>Simulator</strong><small>Test decisions</small></span><span className="module-arrow">↗</span></a>
          <a className="module-tile module-risk" href="#forecast-title"><span className="module-icon">!</span><span className="module-copy"><strong>Risk Monitor</strong><small>Scenario warnings</small></span><span className="module-arrow">↗</span></a>
          <a className="module-tile module-savings" href="#plan"><span className="module-icon">◎</span><span className="module-copy"><strong>Savings goals</strong><small>Protect your target</small></span><span className="module-arrow">↗</span></a>
          <a className="module-tile module-commitments" href="#future-scope"><span className="module-icon">◷</span><span className="module-copy"><strong>Commitments</strong><small>Subscriptions · roadmap</small></span><span className="module-arrow">↗</span></a>
          <a className="module-tile module-twin" href="#time-machine"><span className="module-icon">⌁</span><span className="module-copy"><strong>Future Twin</strong><small>Compare scenarios</small></span><span className="module-arrow">↗</span></a>
        </section>

        <section className="recommendation-card" aria-labelledby="recommendation-title">
          <span className="recommendation-mark" aria-hidden="true">✳</span>
          <div><p className="eyebrow">Decision recommendation · rule-based preview</p><h2 id="recommendation-title">Before you spend, check the trade-off.</h2><p>Compare your next purchase against upcoming bills and your savings goal in the simulator. Its estimates are illustrative, not guaranteed.</p></div>
          <a className="recommendation-link" href="#time-machine">Compare a decision <span aria-hidden="true">↗</span></a>
        </section>

        <section className="card survival-forecast module-panel module-risk-panel" aria-labelledby="forecast-title">
          <div className="forecast-heading">
            <div><p className="eyebrow">Live survival demo</p><h2 id="forecast-title">Will your money last until payday?</h2></div>
            <span aria-hidden="true">◷</span>
          </div>
          <p className="forecast-intro">Set your income, spending, upcoming bills, and days left. The calculator shows exactly how your daily limit is worked out.</p>
          <form className="forecast-form" onSubmit={calculateForecast}>
            <div><label className="field-label" htmlFor="forecast-income">Monthly income (₹)</label><input id="forecast-income" className="input" type="number" min="0" max="100000000" step="1" value={forecastInputs.income} onChange={(event) => updateForecastInput('income', event.target.value)} /></div>
            <div><label className="field-label" htmlFor="forecast-spent">Expenses so far (₹)</label><input id="forecast-spent" className="input" type="number" min="0" max="100000000" step="1" value={forecastInputs.spent} onChange={(event) => updateForecastInput('spent', event.target.value)} /></div>
            <div><label className="field-label" htmlFor="forecast-bills">Upcoming essential bills (₹)</label><input id="forecast-bills" className="input" type="number" min="0" max="100000000" step="1" value={forecastInputs.bills} onChange={(event) => updateForecastInput('bills', event.target.value)} /></div>
            <div><label className="field-label" htmlFor="forecast-days">Days until payday</label><input id="forecast-days" className="input" type="number" min="1" max="366" step="1" value={forecastInputs.days} onChange={(event) => updateForecastInput('days', event.target.value)} /></div>
            <button className="primary-button forecast-submit" type="submit">Update forecast</button>
          </form>
          <p className="forecast-error" role="alert">{forecastError}</p>
          <div className="forecast-results" aria-live="polite">
            <div><span>Balance remaining</span><strong className={forecastBalance < 0 ? 'negative-value' : ''}>{forecastBalance < 0 ? '−' : ''}{money(Math.abs(forecastBalance))}</strong></div>
            <div><span>After reserved bills</span><strong className={forecastAfterBills < 0 ? 'negative-value' : ''}>{forecastAfterBills < 0 ? '−' : ''}{money(Math.abs(forecastAfterBills))}</strong></div>
            <div><span>Daily spending limit</span><strong>{money(forecastDaily)}<small> / day</small></strong></div>
          </div>
          <div className={`forecast-explanation ${forecastAfterBills < 0 ? 'forecast-warning' : ''}`}>
            <strong>{forecastAfterBills < 0 ? 'A shortfall is possible.' : 'Your plan currently has money available.'}</strong>
            <p>{forecastAfterBills < 0
              ? `Your income minus spending leaves ${money(Math.abs(forecastBalance))} ${forecastBalance < 0 ? 'already overspent' : 'available'}, but planned bills exceed that balance by ${money(Math.abs(forecastAfterBills))}. Review flexible costs or bill timing; the daily limit is ₹0 until the gap is addressed.`
              : `${money(forecastBalance)} remains after expenses; subtract ${money(forecast.bills)} for bills, then divide ${money(forecastAfterBills)} by ${forecast.days} days to get ${money(forecastDaily)} per day.`}</p>
          </div>
          <div className={`forecast-coach ${forecastAfterBills < 0 ? 'forecast-warning' : ''}`} aria-live="polite">
            <div><span className="eyebrow">Explainable survival coach</span><span className="coach-mode">Rule-based · works offline</span></div>
            <p>{forecastCoach}</p>
          </div>
          <p className="forecast-disclaimer">Illustrative calculator, not a financial forecast. It cannot account for unentered expenses, emergencies, or future income.</p>
        </section>

        <section id="time-machine" className="card time-machine module-panel module-simulator-panel" aria-labelledby="time-machine-title">
          <div className="time-machine-heading">
            <div><p className="eyebrow">Interactive concept demo · ₹10,000 starting budget</p><h2 id="time-machine-title">What happens if I spend this money?</h2></div>
            <span aria-hidden="true">◈</span>
          </div>
          <p className="time-machine-intro">Try a decision, then see how an emergency or extra income changes the money available after protecting your savings goal.</p>
          <p className="scenario-story">A student starts with ₹10,000 for {simulatorDays} days. ₹2,400 is already spent and ₹1,600 is reserved for essentials. Try the purchase, then add a surprise expense or income and see how the plan changes.</p>
          <ol className="scenario-steps" aria-label="Student budget decision story">
            <li className="scenario-step"><span>1</span><div><strong>Start with ₹10,000</strong><small>{simulatorDays}-day student budget</small></div></li>
            <li className="scenario-step"><span>2</span><div><strong>Protect commitments</strong><small>₹2,400 spent · ₹1,600 reserved</small></div></li>
            <li className={`scenario-step ${Number(timeMachine.purchase) > 0 ? 'scenario-step-active' : ''}`}><span>3</span><div><strong>Consider a choice</strong><small>{Number(timeMachine.purchase) > 0 ? `Testing a ${money(Number(timeMachine.purchase))} purchase` : 'Purchase skipped'}</small></div></li>
            <li className={`scenario-step ${Number(timeMachine.emergency) > 0 || Number(timeMachine.extraIncome) > 0 ? 'scenario-step-active' : ''}`}><span>4</span><div><strong>Recheck the plan</strong><small>{Number(timeMachine.emergency) > 0 ? `${money(Number(timeMachine.emergency))} unexpected expense` : Number(timeMachine.extraIncome) > 0 ? `${money(Number(timeMachine.extraIncome))} additional income` : 'Try an emergency or extra income'}</small></div></li>
          </ol>
          <div className="time-machine-controls">
            <div><label className="field-label" htmlFor="scenario-purchase">Choose a decision to simulate</label><select id="scenario-purchase" className="input" value={timeMachine.purchase} onChange={(event) => setTimeMachine((current) => ({ ...current, purchase: Number(event.target.value) }))}><option value="3000">Buy a phone — ₹3,000</option><option value="499">Start a subscription — ₹499</option><option value="1200">Buy a course — ₹1,200</option><option value="0">Skip the purchase — ₹0</option></select></div>
            <div><label className="field-label" htmlFor="scenario-emergency">Unexpected expense</label><select id="scenario-emergency" className="input" value={timeMachine.emergency} onChange={(event) => setTimeMachine((current) => ({ ...current, emergency: Number(event.target.value) }))}><option value="0">No emergency — ₹0</option><option value="1000">Minor emergency — ₹1,000</option><option value="2500">Major emergency — ₹2,500</option></select></div>
            <div><label className="field-label" htmlFor="scenario-income">Expected additional income</label><select id="scenario-income" className="input" value={timeMachine.extraIncome} onChange={(event) => setTimeMachine((current) => ({ ...current, extraIncome: Number(event.target.value) }))}><option value="0">No additional income</option><option value="500">Refund — ₹500</option><option value="2000">Part-time income — ₹2,000</option></select></div>
            <div><label className="field-label" htmlFor="scenario-savings">Savings target to protect (₹)</label><input id="scenario-savings" className="input" type="number" min="0" max="10000000" step="1" value={timeMachine.savings} onChange={(event) => setTimeMachine((current) => ({ ...current, savings: event.target.value }))} /></div>
            <div><label className="field-label" htmlFor="scenario-days">Days in this plan</label><select id="scenario-days" className="input" value={timeMachine.days} onChange={(event) => setTimeMachine((current) => ({ ...current, days: Number(event.target.value) }))}><option value="7">7 days</option><option value="12">12 days</option><option value="20">20 days</option><option value="30">30 days</option><option value="45">45 days</option><option value="60">60 days</option></select></div>
          </div>
          <div className="time-machine-results" aria-live="polite">
            <div><span>Projected cash balance</span><strong className={simulatorBalance < 0 ? 'negative-value' : ''}>{simulatorBalance < 0 ? '−' : ''}{money(Math.abs(simulatorBalance))}</strong></div>
            <div><span>After protecting savings</span><strong className={simulatorAfterSavings < 0 ? 'negative-value' : ''}>{simulatorAfterSavings < 0 ? '−' : ''}{money(Math.abs(simulatorAfterSavings))}</strong></div>
            <div><span>Flexible spending capacity</span><strong>{money(simulatorDaily)}<small> / day for {simulatorDays} days</small></strong></div>
            <div className={`scenario-status ${simulatorAfterSavings < 0 ? 'scenario-risk' : simulatorStatus === 'Caution' ? 'scenario-caution' : ''}`}><span>{simulatorStatus}</span><strong>{simulatorExplanation}</strong></div>
          </div>
          <div className="scenario-comparison" aria-live="polite">
            <div><span>Alternative: skip the purchase</span><strong>{money(skipPurchaseDaily)}<small> / day</small></strong></div>
            <p>{simulatorDaily < skipPurchaseDaily
              ? `Skipping the ${money(Number(timeMachine.purchase))} purchase would leave ${money(skipPurchaseDaily - simulatorDaily)} more per day over this ${simulatorDays}-day plan, with the same emergency, income, and savings assumptions.`
              : simulatorDaily > skipPurchaseDaily
                ? `With the selected purchase skipped as a comparison, the current scenario has ${money(simulatorDaily - skipPurchaseDaily)} less per day over ${simulatorDays} days.`
                : 'The selected purchase is ₹0, so the comparison matches this scenario.'}</p>
          </div>
          <div className={`forecast-coach ${simulatorAfterSavings < 0 ? 'forecast-warning' : ''}`} aria-live="polite">
            <div><span className="eyebrow">Decision explanation</span><span className="coach-mode">Rule-based · calculated from these inputs</span></div>
            <p>{simulatorAfterSavings < 0
              ? `After commitments and your savings target, this plan is short by ${money(Math.abs(simulatorAfterSavings))}. Compare a lower-cost choice or wait for confirmed income before relying on this scenario.`
              : `After commitments and protecting ${money(simulatorSavings)} in savings, ${money(simulatorAfterSavings)} remains—about ${money(simulatorDaily)} per day for ${simulatorDays} days. This is a scenario, not a guarantee; actual timing and unentered costs can change the outcome.`}</p>
          </div>
          <p className="time-machine-disclaimer">Illustrative scenario only. Assumes ₹2,400 already spent and ₹1,600 reserved for commitments. The savings target is protected rather than deducted twice. Actual risk should also consider when income and bills are due.</p>
        </section>

        <section id="future-scope" className="card future-scope" aria-labelledby="future-scope-title">
          <div className="future-heading"><div><p className="eyebrow">From prototype to product</p><h2 id="future-scope-title">A thoughtful path forward</h2></div><span aria-hidden="true">↗</span></div>
          <p className="future-intro">Build trust in stages: get the decision math right first, then add capabilities with clear consent and careful explanations.</p>
          <div className="roadmap-grid">
            {[
              ['01', 'Smart budgeting & simulator', 'Demonstrate the core decision experience.'],
              ['02', 'Coach & predictive alerts', 'Offer personalized, explainable guidance.'],
              ['03', 'Secure bank connections', 'Reduce manual entry—with explicit consent.'],
              ['04', 'Receipt and bill OCR', 'Make expense entry easier to review.'],
              ['05', 'Currencies & shared budgets', 'Support families, friends, and broader needs.'],
              ['06', 'Long-term planning', 'Explore scenario-based financial planning.'],
              ['07', 'Privacy-preserving insights', 'Scale analytics with data minimization.'],
            ].map(([number, title, description]) => (
              <article className="roadmap-item" key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>
            ))}
          </div>
          <div className="future-details">
            <div className="future-detail">
              <p className="eyebrow">Ideas to explore</p>
              <h3>Meet people where they are.</h3>
              <ul className="future-list">
                <li><strong>Student mode</strong><span>Hostel, mess, travel, study materials, and pocket money.</span></li>
                <li><strong>First-job mode</strong><span>Salary, rent, EMIs, savings, and commitments.</span></li>
                <li><strong>Shared expenses</strong><span>Split trips, rent, and food with friends.</span></li>
                <li><strong>Accessible by design</strong><span>Regional languages, voice entry, and clear explanations.</span></li>
                <li><strong>Privacy controls</strong><span>Consent, encryption, data minimization, and user-controlled deletion.</span></li>
              </ul>
            </div>
            <div className="future-detail">
              <p className="eyebrow">Recommended architecture</p>
              <h3>Keep the math deterministic.</h3>
              <div className="architecture-list">
                <div><strong>React + Vite + Tailwind CSS</strong><span>Proposed responsive dashboard, simulator, and charts UI.</span></div>
                <div><strong>Financial decision engine</strong><span>Budget rules, comparisons, cash-flow forecasts, and risk explanations.</span></div>
                <div><strong>FastAPI + MySQL</strong><span>Backend for users, transactions, bills, and goals.</span></div>
                <div><strong>AI explanation service</strong><span>Explain verified calculations; never invent balances or replace the decision engine.</span></div>
              </div>
            </div>
          </div>
          <div className="pitch-card">
            <div><p className="eyebrow">The hackathon story</p><h3>PocketWise — AI-powered financial decision intelligence</h3></div>
            <p>Most personal finance apps tell people where their money went. PocketWise helps them see what could happen next: a student protects essential commitments, tests a phone purchase, faces an unexpected expense, and compares alternatives before deciding.</p>
            <p className="pitch-vision"><strong>Our vision:</strong> Help students and young professionals make more confident financial decisions, one choice at a time.</p>
            <p className="pitch-caution">For a credible demo, measure calculation correctness against test scenarios, time to compare decisions, and whether users understand the trade-offs. Forecasts are illustrative—not guaranteed outcomes. Any future financial-health indicator must not be presented as a regulated credit score.</p>
          </div>
        </section>

        <section className="summary-grid" aria-label="Budget summary">
          <article className="card summary-card"><div><p className="muted">Monthly income</p><strong>{money(state.budget)}</strong></div><span className="summary-icon">↗</span><button className="text-button" onClick={() => promptForNumber('What is your total budget for the month? (₹)', state.budget, (n) => Number.isFinite(n) && n > 0 && n <= 100000000, 'budget')}>Edit monthly budget</button></article>
          <article className="card summary-card"><div><p className="muted">Spent so far</p><strong>{money(total)}</strong></div><span className="summary-icon">↘</span><p className="summary-caption">Keep an eye on the little things.</p></article>
          <article className="card summary-card"><div><p className="muted">Days to payday</p><strong>{state.days} {state.days === 1 ? 'day' : 'days'}</strong></div><span className="summary-icon">◷</span><button className="text-button" onClick={() => promptForNumber('How many days until payday?', state.days, (n) => Number.isInteger(n) && n >= 1 && n <= 366, 'days')}>Set payday date</button></article>
        </section>

        <div className="content-grid">
          <section id="transactions" className="card transactions-card module-panel module-cashflow-panel" aria-labelledby="transactions-title">
            <div className="section-heading"><div><h2 id="transactions-title">Recent spending</h2><p className="muted">Every little bit adds up. Keep it honest.</p></div><button className="primary-button" onClick={() => openDialog()}>＋ Add expense</button></div>
            <div className="filters"><label className="sr-only" htmlFor="search-expenses">Search expenses</label><input id="search-expenses" className="input search-input" type="search" placeholder="Search expenses…" value={query} onChange={(event) => setQuery(event.target.value)} /><label className="sr-only" htmlFor="filter-category">Filter by category</label><select id="filter-category" className="input category-select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div className="expense-list" aria-live="polite">{visibleExpenses.map((item) => <div className="expense-row" key={item.id}><span className="category-icon" aria-hidden="true">{icons[item.category] || '✳'}</span><div className="expense-description"><p>{item.title}</p><small>{item.category} · {item.date}</small></div><strong className="expense-amount">−{money(item.amount)}</strong><button className="row-button edit-button" onClick={() => openDialog(item)} aria-label={`Edit ${item.title}`}>Edit</button><button className="row-button delete-button" onClick={() => setState((current) => ({ ...current, expenses: current.expenses.filter((expense) => expense.id !== item.id) }))} aria-label={`Delete ${item.title}`}>×</button></div>)}</div>
            {visibleExpenses.length === 0 && <p className="empty-state">Nothing here yet. Add an expense to get started.</p>}
          </section>

          <div className="side-panels">
            <section id="ai-coach" className="card coach-card module-panel module-ai-panel" aria-labelledby="coach-title"><div className="coach-heading"><span className="coach-mark">✦</span><div><p className="eyebrow">Rule-based coach preview</p><h2 id="coach-title">Insights &amp; actions</h2></div></div><div className="coach-content"><p>{coachMessage}</p><div className="tip"><span aria-hidden="true">✳</span><p>{left < 0 ? 'A possible next step: review a flexible expense and check upcoming commitments.' : 'A possible next step: reserve money for essentials, then compare optional spending against your daily plan.'}</p></div></div></section>
            <section id="plan" className="card plan-card module-panel module-savings-panel" aria-labelledby="plan-title"><div className="plan-heading"><div><p className="eyebrow muted">Savings &amp; commitments</p><h2 id="plan-title">Essentials first</h2></div><span aria-hidden="true">◎</span></div><p className="plan-description">Set aside what you need for bills before deciding what's safe to spend.</p><label className="field-label" htmlFor="essentials-input">Upcoming essentials (₹)</label><div className="essentials-row"><input id="essentials-input" className="input" type="number" min="0" step="1" placeholder="e.g. 800" value={essentialsInput} onChange={(event) => setEssentialsInput(event.target.value)} /><button className="soft-button" onClick={() => { const value = Number(essentialsInput); if (Number.isFinite(value) && value >= 0) setState((current) => ({ ...current, essentials: Math.round(value) })); }}>Save</button></div><p className="essentials-caption">Set aside: <strong>{money(state.essentials)}</strong></p><div className="adjusted-limit"><p>Your essentials-adjusted daily limit</p><strong>{money(adjusted)} <small>per day</small></strong></div></section>
            <p className="disclaimer">No judgment here. Your data stays in your browser.</p>
          </div>
        </div>
        <footer className="footer"><span>Low balance. Smart choices. Survive the month.</span><button onClick={() => { if (window.confirm('Reset your budget and expenses to the sample data?')) { setState({ ...defaults, expenses: [...initialExpenses] }); setEssentialsInput(''); } }}>Reset demo data</button></footer>
      </main>

      {dialogOpen && <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}><section className="expense-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><form onSubmit={saveExpense}><div className="dialog-title-row"><div><p className="eyebrow">Keep track</p><h2 id="dialog-title">{editingId ? 'Edit expense' : 'Add an expense'}</h2></div><button type="button" className="close-button" onClick={() => setDialogOpen(false)} aria-label="Close">×</button></div><label className="field-label" htmlFor="expense-title">What was it?</label><input required maxLength="50" id="expense-title" className="input dialog-input" placeholder="e.g. Lunch with friends" value={title} onChange={(event) => setTitle(event.target.value)} /><div className="form-grid"><div><label className="field-label" htmlFor="expense-amount">Amount (₹)</label><input required min="1" max="10000000" step="1" type="number" id="expense-amount" className="input dialog-input" placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div><label className="field-label" htmlFor="expense-category">Category</label><select id="expense-category" className="input dialog-input" value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div></div><p className="form-error" role="alert">{formError}</p><button className="primary-button submit-button" type="submit">{editingId ? 'Save changes' : 'Save expense'}</button></form></section></div>}
    </div>
  );
}

export default App;
