export default function () {
  this.transition(
    this.fromRoute('history-sidebar.index'),
    this.toRoute('history-sidebar.queries'),
    this.toRoute('history-sidebar.domain'),
    this.use('toLeft'),
    this.reverse('toRight')
  );
  this.transition(
    this.fromRoute('history-sidebar.queries.index'),
    this.toRoute('history-sidebar.queries.query'),
    this.use('toLeft'),
    this.reverse('toRight')
  );
  this.transition(
    this.fromRoute('history-sidebar.domain.index'),
    this.toRoute('history-sidebar.domain.news'),
    this.use('toLeft'),
    this.reverse('toRight')
  );
  this.transition(
    this.fromRoute('history-sidebar.domain.index'),
    this.toRoute('history-sidebar.domain.query'),
    this.use('toLeft'),
    this.reverse('toRight')
  );
  this.transition(
    this.fromRoute('freshtab.index'),
    this.toRoute('freshtab.history'),
    this.use('fade', { duration: 250 }),
    this.reverse('fade', { duration: 250 })
  );
}
