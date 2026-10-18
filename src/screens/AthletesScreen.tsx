/** Вкладка «Спортсмены». Содержимое появится, когда разберём еженедельные таблицы тренера. */
export function AthletesScreen() {
  return (
    <>
      <div className="head">
        <h1 className="head__title">Спортсмены</h1>
      </div>
      <section className="empty">
        <h2 className="empty__title">Здесь будут спортсмены</h2>
        <p>Те, кого тренер ведёт по недельной программе. Экран соберём по таблицам, которые тренер присылает каждую неделю.</p>
      </section>
    </>
  );
}
