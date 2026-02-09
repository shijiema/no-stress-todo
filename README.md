# No Stress Todo

A mobile-first task management app designed around the philosophy that **time flies** — helping you visualize tasks by urgency and timeline rather than overwhelming you with endless lists.

## Concept

Unlike traditional todo apps that present flat lists, No Stress Todo organizes tasks into time-based sections that show you what needs attention now versus what's coming up. Tasks are visually weighted by priority and deadline, so the most pressing items stand out.

**Design Reference:** [Figma Prototype](https://www.figma.com/make/GyOSjMHq4sTpQQCdtMLfkL/Untitled?p=f&t=tevNNzJgVjNE8cds-0)

## Features

### Home Screen

The home screen is vertically organized into distinct sections:

1. **Header** — "Time Flies" banner with right-pointing arrow, emphasizing the passage of time
2. **Today's Date** — Current date displayed prominently
3. **Task Sections** — Five visual boxes showing tasks by timeline:
   - **In Execution** — Active tasks currently being worked on
     - Task cards sized/colored by priority and time remaining
     - Horizontally scrollable when overflow
   - **Start Delayed** — Tasks that should have started but haven't
   - **Start Next Day** — Tasks scheduled for tomorrow
   - **Start In Two Days** — Tasks scheduled for day after tomorrow
4. **Menu** (top-right) — Access to:
   - Full calendar view
   - Import from calendar
   - Export to calendar

### Create/Edit Task Screen

Fields:
- **Description** — Text input (max 500 characters)
- **Start Time** — Date and time picker
- **End Time** — Optional estimated finish time
- **Priority** — Urgent (0) or Regular (1)
- **Status** — Created, In Execution, Completed, Abandoned

### Calendar View

- Full month calendar grid
- Tasks displayed with color-coded status indicators:
  - Green (pulsing) — In Execution
  - Blue — Completed
  - Gray — Other statuses
- Filter dropdown to show specific statuses
- Task list below calendar with quick actions

## Task Data Model

```javascript
{
  id: number,
  description: string,      // max 500 chars
  start: Date,              // when task should start
  end: Date | null,         // optional estimated finish
  priority: 0 | 1,          // 0 = urgent, 1 = regular
  status: 'created' | 'in execution' | 'completed' | 'abandoned',
  createdAt: Date
}
```

## Task Weighting Algorithm

Tasks in the "In Execution" section are visually weighted based on:
- **Priority weight**: Urgent tasks get 500 points, regular tasks get 100
- **Time factor**: Fewer days to deadline = higher visual weight
- Tasks are sorted by calculated weight, with most urgent appearing first

## Tech Stack

- **React 19** — UI framework
- **Vite 7** — Build tool and dev server
- **Lucide React** — Icon library
- **Tailwind CSS** (via inline classes) — Styling

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
no-stress-todo/
├── src/
│   └── App.jsx          # Main application component
├── public/              # Static assets
├── index.html           # Entry HTML
├── package.json
└── vite.config.js
```

## Roadmap

- [ ] Persistent storage (localStorage or backend)
- [ ] Calendar import/export functionality
- [ ] Push notifications for delayed tasks
- [ ] Recurring tasks
- [ ] Task categories/tags
