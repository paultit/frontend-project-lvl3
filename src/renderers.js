export const renderFeeds = (feeds) => {
  const listFeeds = document.querySelector('#rss-feeds');
  listFeeds.innerHTML = '';
  feeds.map((feed) => {
    const container = document.createElement('div');
    container.classList.add('border', 'w-100', 'list-group-item');
    const h5 = document.createElement('h5');
    h5.classList.add('mb-1');
    h5.textContent = `${feed.title}`;
    const p = document.createElement('p');
    p.classList.add('mb-1');
    p.textContent = `${feed.description}`;
    container.appendChild(h5);
    container.appendChild(p);
    listFeeds.appendChild(container);
    return listFeeds;
  });
};

export const renderPosts = (posts) => {
  const listPosts = document.querySelector('#rss-posts');
  listPosts.innerHTML = '';
  posts.forEach((post) => {
    const { title, link } = post;
    const container = document.createElement('div');
    container.classList.add('border', 'w-100', 'list-group-item');
    const a = document.createElement('a');
    a.setAttribute('href', link);
    a.setAttribute('target', '_blank');
    a.classList.add('mb-1');
    a.textContent = title;
    container.appendChild(a);
    listPosts.appendChild(container);
    return listPosts;
  });
  const input = document.querySelector('input.form-control');
  input.value = '';
};

export const renderForm = (state, input) => {
  const { valid } = state.form;
  const submitButton = document.querySelector('button[type="submit"]');
  if (state.form.valid === true) {
    input.classList.remove('invalid');
    submitButton.disabled = !valid;
  } else {
    input.classList.add('invalid');
    submitButton.disabled = !valid;
  }
};
