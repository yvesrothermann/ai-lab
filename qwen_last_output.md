Wir müssen die Aufgabe lösen. Der Nutzer möchte präzisen Code für einen 4. Reiter in einem bestehenden Single-File Dashboard index.html mit Tailwind Dark Mode, Vanilla JS. Wir sollen HTML Button, JS Daten/Hilfsfunktionen, HTML Template in renderBoardOnly(), Ergänzungen für save/reset/export/import/render (+10 XP pro erledigtem To-Do) liefern. /no_think bedeutet wahrscheinlich keine langen Gedanken? Aber wir müssen final auf Deutsch mit Code und kurzen Erklärungen. Wir müssen sicherstellen, dass Code konsistent ist. Da wir den bestehenden Code nicht vollständig sehen, liefern wir modulare Snippets, die man einfügen kann. Wichtig: XP Berechnung: totalEarnedXp und totalPossibleXp in render() werden berechnet; +10 XP pro erledigtem To-Do. Wir müssen vermutlich state.todos oder todos? localStorage key 'ailab_todos_v05'. defaultTodos 3 sympathische Start-To-Dos mit id, text, done, priority, dueDate, createdAt. Funktionen addTodo(), toggleTodo(id), editTodo(id) prompt, deleteTodo(id), clearCompletedTodos(). HTML Template: Schnell-Eingabeleiste mit Input id todo-inp-text onkeydown Enter addTodo, Select id todo-inp-prio Normal und 🔥 Wichtig, Datumsfeld id todo-inp-due, Button + Hinzufügen. Berücksichtigung globalSearchQuery filtert nach t.text. 2 Spalten grid-cols-1 lg:grid-cols-2 gap-4. Links Offene Alltags-Aufgaben sortiert high zuerst; Anzeige 🔥 Badge, Fälligkeitsdatum und +10 XP Hinweis; Klick Text editTodo(id). Rechts Erledigte durchgestrichen, +10 XP grün, Button 🧹 Erledigte aufräumen.

Wir müssen wahrscheinlich renderBoardOnly() Template als HTML-String? Bestehende Views vermutlich in renderBoardOnly() mit if currentView === 'kanban' etc. Wir liefern else if (currentView === 'todos') { ... } mit innerHTML. Muss XSS escaping? Da Vanilla, prompt text könnte HTML enthalten; besser escapeHtml helper. Vielleicht vorhanden? Wir können einen kleinen escapeHtml einfügen oder annehmen vorhanden. Besser liefern wir `escapeHtml` falls nicht vorhanden: `const escapeHtml = s => String(s).replace(/[&<>"']/g, ...);`. Aber wenn bereits existiert, Duplikat? In Single File kann man es als Hilfsfunktion hinzufügen; wenn schon da, überschreiben? Wir können sagen: Falls kein `escapeHtml` existiert, einfügen. Oder im Code `const _todoEsc = ...` lokal? Besser globaler `escapeTodoText`. Aber bestehender Stil? Wir können `esc()` verwenden und erwähnen, dass falls vorhanden genutzt wird; sonst Code für `esc` liefern.

State: currentView kann 'todos'. In render() aktive View-Buttons ['kanban','grid','wiki'] -> erweitern auf ['kanban','grid','wiki','todos']. XP: totalEarnedXp += todos.filter(t=>t.done).length * 10; totalPossibleXp += todos.length * 10? Aufgabe sagt +10 XP pro erledigtem To-Do. In render() werden totalEarnedXp und totalPossibleXp berechnet. Möglicherweise sollen To-Dos in XP-Berechnung einfließen: earned = base + doneTodos*10; possible = base + todos.length*10? Wenn alle offen, mögliche 10 pro Todo. Ja.

save(): localStorage.setItem('ailab_todos_v05', JSON.stringify(todos)); resetData(): todos = defaultTodos.map(clone); speichern; exportBackupJson(): include todos: [...todos]; importBackupJson(): if backup.todos Array -> todos = sanitize? else default. render(): update todo-count-badge with open count, maybe wiki-count badge etc. Also setView('todos') should work; button id.

Wir müssen HTML Button für Toolbar liefern:
```html
<button onclick="setView('todos')" id="btn-view-todos" class="...">✅ Alltags-To-Dos <span id="todo-count-badge" class="...">0</span></button>
```
Stil passend zu bestehenden Buttons. Da wir bestehende Klassen nicht kennen, liefern wir plausible Tailwind: `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors` etc. Aber View-Switcher hat vermutlich dynamische active classes in render(). Wir können Button mit Basisklassen und Badge. Wichtig id.

Möglicherweise render() setzt active/inactive Klassen für Buttons. Wir müssen ergänzen: `['kanban','grid','wiki','todos'].forEach(v => { const btn = document.getElementById('btn-view-'+v); ... })`. Wenn bestehender Code nutzt, einfach Array erweitern.

Template: In renderBoardOnly() vermutlich container innerHTML. Wir liefern:
```js
else if (currentView === 'todos') {
  const q = (globalSearchQuery || '').trim().toLowerCase();
  const filteredTodos = todos.filter(t => !q || t.text.toLowerCase().includes(q));
  const open = filteredTodos.filter(t=>!t.done).sort((a,b)=> (b.priority==='high'?1:0)-(a.priority==='high'?1:0) || (a.dueDate||'9999').localeCompare(b.dueDate||'9999') || a.createdAt.localeCompare(b.createdAt));
  const done = filteredTodos.filter(t=>t.done).sort((a,b)=> b.createdAt.localeCompare(a.createdAt));
  boardEl.innerHTML = `...`;
}
```
Schnelleingabe:
```html
<div class="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5">
 <div class="flex flex-wrap items-center gap-2">
  <input id="todo-inp-text" type="text" placeholder="Neue Alltags-Aufgabe..." onkeydown="if(event.key==='Enter') addTodo()" class="...">
  <select id="todo-inp-prio" class="..."><option value="normal">Normal</option><option value="high">🔥 Wichtig</option></select>
  <input id="todo-inp-due" type="date" class="...">
  <button onclick="addTodo()" class="...">+ Hinzufügen</button>
 </div>
</div>
```
Need preserve input value? Since render re-renders on every change, if addTodo calls save/render, input cleared. But if user types and clicks elsewhere causing render? Could be okay. Maybe we should not clear before render? In addTodo: get text, trim; if empty return; todos.push({id: crypto.randomUUID?.() || Date.now(), text, done:false, priority, dueDate, createdAt:new Date().toISOString()}); save(); render(); input.value=''. But after render innerHTML replaced, input gone. Fine.

toggleTodo(id): find todo; t.done = !t.done; if now done maybe completedAt? not required. save(); render();
editTodo(id): const t=todos.find; const newText=prompt('Aufgabe bearbeiten:', t.text); if(newText===null) return; const trimmed=newText.trim(); if(!trimmed){ deleteTodo(id)? or keep? prompt empty could clear? Better if empty, set to ''? But task says schnellen Ändern. If user cancels null no change. If empty string maybe delete? Could be dangerous. We can if (!trimmed) { alert('Aufgabe darf nicht leer sein.'); return; } t.text=trimmed; save(); render();
deleteTodo(id): confirm? Maybe not, but to prevent accidental: `if(confirm('To-Do wirklich löschen?'))`. But task doesn't specify. Could include small trash button with onclick deleteTodo(id). If prompt edit and empty maybe no. We can use confirm for delete. clearCompletedTodos(): if none return; if(confirm(...)) todos = todos.filter(t=>!t.done); save(); render();

Need IDs: Use `uid()` helper? Existing may have uid. We'll define `const makeTodoId = () => (crypto.randomUUID ? crypto.randomUUID() : 'todo-' + Date.now().toString(36) + Math.random().toString(36).slice(2,8));` But if global function in single file. Could use `Date.now()` but multiple? Use helper.

defaultTodos: 3 sympathische Start-To-Dos:
- {id:'todo-start-1', text:'☕ Kaffee nachfüllen & Schreibtisch kurz aufräumen', done:false, priority:'normal', dueDate:'', createdAt:new Date().toISOString()}
- {id:'todo-start-2', text:'📬 E-Mails checken und wichtige Antworten senden', done:false, priority:'high', dueDate: today? Could be '' or dynamic. Requirement dueDate YYYY-MM-DD oder ''. We can set one to today using helper `todayISO()`. But defaultTodos as static? If function returns dynamic dates better.
- {id:'todo-start-3', text:'🧘 10 Minuten Pause & durchatmen', done:true, priority:'normal', dueDate:'', createdAt:...} Maybe one done for XP. Sympathisch.

Need load from localStorage: `let todos = loadTodos();` with function:
```js
function loadTodos() {
 try { const raw=localStorage.getItem('ailab_todos_v05'); if(raw){ const arr=JSON.parse(raw); if(Array.isArray(arr)) return arr.map(sanitizeTodo).filter(Boolean); } } catch(e){}
 return defaultTodos().map(t=>({...t}));
}
```
sanitize: ensure fields.

But existing state may have `let` variables. We'll provide code block to insert near other state:
```js
const TODO_STORAGE_KEY = 'ailab_todos_v05';
function todayISO(){...}
function defaultTodos(){ return [ ... ]; }
function sanitizeTodo(t){...}
function loadTodos(){...}
let todos = loadTodos();
```
Need avoid redeclaration if existing? We'll say einfügen.

save(): add `localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));` If save uses state object maybe include. But task says Ergänzungen für save(). We can show:
```js
function save() {
  ...existing...
  localStorage.setItem('ailab_todos_v05', JSON.stringify(todos));
}
```
If existing save is arrow? We'll provide snippet to ergänzen.

resetData(): set todos = defaultTodos(); maybe after resetting other data call save/render. Show:
```js
function resetData() { ...; todos = defaultTodos().map(t=>({...t})); localStorage.setItem(...); render(); }
```

exportBackupJson(): include `todos: [...todos]` in backup object. If existing function constructs object, add property. We can show:
```js
const backup = { version:'0.5', exportedAt:new Date().toISOString(), kanban..., grid..., wiki..., todos:[...todos] };
```
But we don't know keys. Better generic: In exportBackupJson() ergänze `todos: [...todos],` im Backup-Objekt.

importBackupJson(): after parsing, if Array.isArray(data.todos) then todos = data.todos.map(sanitizeTodo); else default. Then save/render. Need sanitize.

render(): update badge and XP. Existing render calculates totalEarnedXp/totalPossibleXp. We need show how to add:
```js
const doneTodosCount = todos.filter(t=>t.done).length;
const openTodosCount = todos.length - doneTodosCount;
totalEarnedXp += doneTodosCount * 10;
totalPossibleXp += todos.length * 10;
const todoBadge=document.getElementById('todo-count-badge'); if(todoBadge) todoBadge.textContent=openTodosCount;
```
And active buttons array include 'todos'. Maybe also set button classes. We can show:
```js
['kanban','grid','wiki','todos'].forEach(v => { ... });
```
If existing uses `document.querySelectorAll('[data-view]')`? But task says aktiven View-Buttons (['kanban', 'grid', 'wiki']) hervorgehoben. So extend array.

Need ensure XP not double count if todos included elsewhere? We'll state: Wenn du To-Dos zusätzlich in anderen XP-Regeln verwendest, nicht doppelt zählen.

Potential issue: renderBoardOnly() may be called before DOM button exists? No.

We need produce final answer with code blocks and short explanations. Since user asks "Bitte liefere mir präzise:" We can structure:
1. Toolbar Button einfügen
2. JS State & Funktionen (einmalig)
3. renderBoardOnly() Template
4. save/reset/export/import/render Ergänzungen

Need ensure code style Tailwind dark: bg-slate-900, border-slate-800, text-sky-400, text-emerald-400. Use rounded-xl, shadow? Keep consistent.

Let's design detailed code.

HTML button:
```html
<button onclick="setView('todos')" id="btn-view-todos" class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white">
  ✅ Alltags-To-Dos <span id="todo-count-badge" class="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-sky-400">0</span>
</button>
```
But active state may override classes in render. If existing uses `classList.add('bg-sky-950','text-sky-300','border-sky-700')` etc. We can mention: Button mit denselben Basisklassen wie die anderen View-Buttons; falls deine Buttons andere Klassen haben, nur ID/onclick/Badge übernehmen. But user wants precise code. Maybe use same as existing? They didn't provide classes except ellipsis. We'll choose plausible and say anpassen falls nötig.

JS functions:
```js
const TODO_KEY = 'ailab_todos_v05';
function todayISO() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function makeTodoId() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `todo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function defaultTodos() { const now=new Date().toISOString(); return [ { id:'todo-start-1', text:'☕ Kaffee nachfüllen & Schreibtisch kurz aufräumen', done:false, priority:'normal', dueDate:'', createdAt:now }, ... ]; }
function sanitizeTodo(t) { if(!t || typeof t.text !== 'string') return null; return { id:String(t.id||makeTodoId()), text:t.text.trim(), done:Boolean(t.done), priority: t.priority==='high'?'high':'normal', dueDate: typeof t.dueDate==='string' && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : '', createdAt: typeof t.createdAt==='string'?t.createdAt:new Date().toISOString() }; }
function loadTodos(){ try { const raw=localStorage.getItem(TODO_KEY); if(raw){ const arr=JSON.parse(raw); if(Array.isArray(arr)){ const clean=arr.map(sanitizeTodo).filter(Boolean); if(clean.length) return clean; } } } catch(e){ console.warn('To-Dos konnten nicht geladen werden', e); } return defaultTodos().map(t=>({...t})); }
let todos = loadTodos();

function addTodo() { const textEl=document.getElementById('todo-inp-text'); const prioEl=document.getElementById('todo-inp-prio'); const dueEl=document.getElementById('todo-inp-due'); if(!textEl) return; const text=textEl.value.trim(); if(!text){ textEl.focus(); return; } todos.push({ id:makeTodoId(), text, done:false, priority:prioEl?.value==='high'?'high':'normal', dueDate:dueEl?.value || '', createdAt:new Date().toISOString() }); save(); render(); }
function toggleTodo(id) { const t=todos.find(x=>x.id===id); if(!t) return; t.done=!t.done; save(); render(); }
function editTodo(id) { const t=todos.find(x=>x.id===id); if(!t) return; const next=prompt('Aufgabe bearbeiten:', t.text); if(next===null) return; const trimmed=next.trim(); if(!trimmed){ alert('Der Aufgabentext darf nicht leer sein.'); return; } t.text=trimmed; save(); render(); }
function deleteTodo(id) { if(!confirm('Diese Alltags-Aufgabe wirklich löschen?')) return; todos=todos.filter(t=>t.id!==id); save(); render(); }
function clearCompletedTodos() { const count=todos.filter(t=>t.done).length; if(count===0){ alert('Keine erledigten Aufgaben vorhanden.'); return; } if(!confirm(`${count} erledigte Aufgabe(n) wirklich aufräumen?`)) return; todos=todos.filter(t=>!t.done); save(); render(); }
```

Need maybe `save()` not defined yet when functions call? In JS function declarations hoisted, okay. But if save is const arrow later? Could be issue. We can say nach vorhandener save() einfügen or use function declarations. Existing likely uses function save(). Fine.

Template: Need boardEl variable? In renderBoardOnly maybe `board.innerHTML = ...` or `document.getElementById('board')`. We don't know. The task says HTML-Template für else if in renderBoardOnly(). We'll provide code assuming current pattern:
```js
else if (currentView === 'todos') {
  const q = (globalSearchQuery || '').trim().toLowerCase();
  const filteredTodos = todos.filter(t => !q || t.text.toLowerCase().includes(q));
  const openTodos = filteredTodos.filter(t=>!t.done).sort(...);
  const doneTodos = filteredTodos.filter(t=>t.done).sort(...);
  boardEl.innerHTML = `...`;
}
```
But if existing uses different variable, user can adapt. Maybe better use `document.getElementById('board').innerHTML`? But renderBoardOnly likely has a container. We can write:
```js
else if (currentView === 'todos') {
   const q=...;
   ...
   board.innerHTML = `...`; // oder dein bestehendes Board-Element
}
```
Need precise. Could use `document.getElementById('board').innerHTML` but if id not known. The existing likely