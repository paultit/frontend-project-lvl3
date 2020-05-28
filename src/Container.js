import 'bootstrap';

export default class Container {
  constructor(element) {
    this.element = element;
  }

  init() {
    this.element.innerHTML = `
    <div class="container mt-5">
        <div class="jumbotron">
            <h1>Rss Reader</h1>
            <form action="" class="form-inline rss-form">
                <div class="form-group">
                    <input type="text" required class="form-control">
                </div>
                <button type="submit" class="btn btn-primary ml-1">Add</button>
            </form>
        </div>
    </div>`;
  }
}
