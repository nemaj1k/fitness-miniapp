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
  - `format.ts` — русские склонения (`plural`), «N дней назад», инициалы, вес с запятой, даты `YYYY-MM-DD` (считаются в UTC, без `Intl`), подходы «65×6 @8». Любой текст с числом в UI должен идти через эти функции.
  - `training.ts` — типы тренировок и `LIFTS` (присед / жим / тяга); `progress.ts` — темп (наименьшие квадраты), прогноз до цели, шкала графика; `nudge.ts` — тексты красного флага.
  - Тексты для клиентов и тренера пишем без рода («Нет записей 5 дней», а не «не логировал»): среди них и мужчины, и женщины.
- `src/data/mockClients.ts` — тип `Client` (расширяет `ClientActivity` из домена) и вымышленные клиенты; «сегодня» для моков — `MOCK_TODAY`. Это временная замена базы: при подключении Supabase меняется источник данных, а доменный слой остаётся. У моков намеренно нет `telegramUsername`: выдуманный ник может принадлежать реальному человеку.
- `src/App.tsx` — два экрана без роутера (`src/screens/`): список и карточка клиента; хранит фильтр и прокрутку списка, чтобы они пережили переход. `?client=<id>` сразу открывает карточку. Компоненты в `src/components/` — презентационные.
- `src/telegram/` — всё общение с Telegram: `webApp.ts` (`getWebApp`, `isInTelegram`, `supports`), `theme.ts`, `useBackButton.ts`. Скрипт Telegram (подключён в `index.html`) создаёт `window.Telegram.WebApp` даже в обычном браузере, с `platform = "unknown"`, поэтому напрямую `window.Telegram` не трогать — только через `getWebApp()`. Методы новее 6.0 — только после `supports("<версия>")`. Типы в `src/telegram.d.ts`, расширяются по мере использования.
- `src/styles.css` — CSS-переменные (цвета статусов `--ok-*`, `--warn-*`, `--risk-*`, шрифты Onest / JetBrains Mono / Unbounded). Тёмная тема — блок `:root[data-theme="dark"]`, атрибут ставит `src/telegram/theme.ts`. Новые цвета добавлять переменными в обе темы.
- `public/preview.html` — предпросмотр в контуре iPhone с нарисованной шапкой Telegram (`/preview.html` на dev-сервере и на Pages). Приложение там в iframe с `?theme=light|dark`. Скриншоты для самопроверки: headless Chrome (`chrome.exe --headless=new --screenshot=… "http://localhost:5173/?theme=dark&client=c3"`).

## Telegram Mini App — главная среда запуска

Приложение открывается внутри Telegram (WebView на iOS, Android и в десктопном клиенте) по кнопке бота. `localhost` в обычном браузере нужен только для быстрой вёрстки; итог проверять в Telegram.

- **Только по HTTPS.** Telegram не откроет `http://localhost`. Приложение выкладывается на GitHub Pages: `https://nemaj1k.github.io/fitness-miniapp/`. Этот адрес указан в BotFather (Menu Button). Деплой делает `.github/workflows/deploy.yml` при каждом push в `main` (тесты, сборка, выкладка `dist/`), так что правки появляются в Telegram примерно через минуту после push.
- Быстрый туннель Cloudflare (`cloudflared tunnel --url`) в сети разработчика не работает: SRV-записи `argotunnel.com` не находятся. `server.allowedHosts` в `vite.config.ts` оставлен на случай другого туннеля: Vite 6 блокирует запросы с чужих доменов.
- **Тема берётся из Telegram, а не из системы.** Источник истины — `Telegram.WebApp.colorScheme` и событие `themeChanged`; шапка и фон Telegram красятся в `--bg` (`setHeaderColor`/`setBackgroundColor`). `prefers-color-scheme` в WebView может не совпадать с темой Telegram, поэтому он используется только в браузере.
- **Мобильный экран.** Ширина около 390px, управление пальцем (цели не меньше 44px), отступы под вырезы и панель Telegram (`viewport-fit=cover`, safe area). Экран держится внутри `viewport`, без горизонтальной прокрутки.
- **Нативные элементы Telegram вместо своих**, где они есть: `BackButton` для навигации назад между экранами, `MainButton` для главного действия (например «Сохранить подход» в логгере), `HapticFeedback` при записи подхода.
- **Пользователь и авторизация.** Кто открыл приложение, приходит в `Telegram.WebApp.initData`. Доверять ему можно только после проверки подписи на сервере (токен бота) — в браузере не проверять и токен в клиент не класть. `initDataUnsafe` годится только для отображения.
- **Две роли в одном приложении:** тренер (экраны «Клиенты», карточка клиента) и клиент (логгер). Роль будет определяться по пользователю Telegram после подключения Supabase.
- Вне Telegram `getWebApp()` возвращает `undefined` — всё должно работать и так; в браузере «назад» — ссылка в шапке карточки вместо `BackButton`.

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
