# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Проект

Logbook Coach — Telegram Mini App для фитнес-тренера: список клиентов со статусами активности, карточка клиента, журнал тренировок. Vite + React 18 + TypeScript, без роутера и без бэкенда (данные пока моковые). Интерфейс, комментарии в коде, названия тестов и сообщения коммитов — на русском.

## Команды

Нужен Node ≥ 22.18 (тесты запускают `.ts` напрямую через встроенное в Node удаление типов). На этой машине Node 24 стоит в `C:\Program Files\nodejs`; если `node` не находится в PATH, добавить этот путь в начало `$env:Path`.

```bash
npm run dev                                   # Vite, http://localhost:5173/
npm test                                      # node --test "src/**/*.test.ts", без Jest/Vitest
node --test src/domain/status.test.ts         # один файл
node --test --test-name-pattern="риск" "src/**/*.test.ts"   # тесты по имени
npm run build                                 # tsc --noEmit (единственная проверка типов) + vite build
```

Линтера и форматтера нет. Перед коммитом достаточно `npm test` и `npm run build`.

## Архитектура

- `src/domain/` — чистые функции без React и без обращений к данным. Задумано так, чтобы правила легко тестировать и позже перенести на сервер (Supabase cron для напоминаний). Тесты лежат рядом (`*.test.ts`, `node:test` + `node:assert/strict`).
  - `status.ts` — статусы `active | warning | risk`, флаг «кому написать» (`needsNudge`) и сортировка по вниманию. Все пороги — только в объекте `THRESHOLDS`, не дублировать числа в компонентах или тестах (тесты границ ссылаются на `THRESHOLDS`).
  - `format.ts` — русские склонения (`plural`), «N дней назад», инициалы, вес с запятой. Любой текст с числом в UI должен идти через эти функции.
- `src/data/mockClients.ts` — тип `Client` (расширяет `ClientActivity` из домена) и вымышленные клиенты. Это временная замена базы: при подключении Supabase меняется источник данных, а доменный слой остаётся.
- `src/App.tsx` — сейчас единственный экран «Клиенты»: сортирует, считает фильтры и баннер «Кому написать» через функции домена. Компоненты в `src/components/` — презентационные.
- `src/main.tsx` вызывает `Telegram.WebApp.ready()/expand()`; скрипт Telegram подключён в `index.html`. Вне Telegram `window.Telegram.WebApp` нет — код обязан работать и без него. Типы WebApp минимальные, в `src/telegram.d.ts`, расширяются по мере использования методов.
- `src/styles.css` — CSS-переменные (цвета статусов `--ok-*`, `--warn-*`, `--risk-*`, шрифты Onest / JetBrains Mono / Unbounded) со светлой и тёмной темой через `prefers-color-scheme`. Новые цвета добавлять переменными в обе темы.

## Соглашения TypeScript

- Импорты с явным расширением `.ts`/`.tsx` (`allowImportingTsExtensions`): без него тесты не запустятся под Node.
- `verbatimModuleSyntax`: импорт только типов — через `import type` / `type X` в фигурных скобках.
- `strict`, `noUnusedLocals`, `noUnusedParameters` — неиспользуемое ломает `npm run build`.

## Макеты

`project/*.dc.html` — макеты экранов шириной 390px (формат холста Design, раскладка в `project/canvas.json`). Это эталон для вёрстки, не код приложения: в них есть плейсхолдеры вроде `{{accent}}` и ссылка на отсутствующий `support.js`, в браузере напрямую они корректно не откроются. Данные в макетах вымышленные.

- `Main.dc.html` — экран «Клиенты» (уже реализован в `App.tsx`).
- `Client.dc.html` — карточка клиента: красный флаг, график рабочего веса с линией цели, прогноз, три последние тренировки.
- `Logger.dc.html` — экран клиента: план дня, подходы, быстрый ввод строкой «присед 80 на 8».

## План (из README)

1. Карточка клиента с графиком (`Client.dc.html`).
2. Логгер и разбор строки «присед 80 на 8» (`Logger.dc.html`) — парсер класть в `src/domain/` с тестами.
3. Supabase: клиенты, тренировки, авторизация через Telegram.
4. Бот: напоминания клиенту и тренеру.

Хостинг планируется на Vercel или GitHub Pages, поэтому в `vite.config.ts` стоит `base: "./"` — не менять на абсолютный путь.
