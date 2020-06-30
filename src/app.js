import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import resources from './locales';
import validate from './utils.js';
import parse from './parser';
import watch from './watchers';

const proxy = 'cors-anywhere.herokuapp.com';
const getUrl = (value) => `https://${proxy}/${value}`;
const getNewPosts = (currentPosts, oldPosts) => _.differenceWith(currentPosts, oldPosts, _.isEqual);

export default () => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  });

  const state = {
    form: {
      processState: 'filling',
      processError: null,
      inputValue: null,
      valid: true,
      error: null,
    },
    feeds: [],
    posts: [],
  };

  window.onload = () => {
    const preloader = document.querySelector('.spinner');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 1000);
  };

  const input = document.querySelector('input.form-control');
  const form = document.querySelector('.rss-form');
  input.addEventListener('input', (e) => {
    if (e.target.value === '') {
      state.form.processState = 'filling';
    } else {
      state.form.inputValue = e.target.value;
      validate(state);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.form.processState = 'sending';
    const { inputValue } = state.form;
    const url = getUrl(inputValue);
    axios.get(url)
      .then((response) => {
        const { feed, posts } = parse(response.data);
        const id = _.uniqueId();
        state.feeds.push({ ...feed, id, link: inputValue });
        posts.forEach((post) => state.posts.unshift({ ...post, id }));
        state.form.processState = 'finished';
        state.form.inputValue = '';
        state.form.error = null;
      })
      .catch((response, error) => {
        state.form.valid = false;
        state.form.processState = 'failed';
        if (response.status >= 500) {
          state.form.error = 'problems-network';
        } else {
          state.form.error = 'not-found';
        }
        throw error;
      });
  });

  const updatePosts = () => {
    const { feeds } = state;
    const { posts } = state;
    if (feeds.length === 0) {
      setTimeout(updatePosts, 5000);
    }
    feeds.forEach((feed) => {
      const oldPosts = posts.filter((post) => post.id === feed.id);
      const url = getUrl(feed.link);
      axios.get(url)
        .then((response) => {
          const data = parse(response.data);
          return data.posts.map((post) => ({ ...post, id: feed.id }));
        })
        .then((currentPosts) => getNewPosts(currentPosts, oldPosts))
        .then((newPosts) => {
          if (newPosts.length !== 0) {
            newPosts.forEach((post) => [post, ...state.posts]);
          }
        })
        .catch((error) => {
          state.form.valid = false;
          state.form.processForm = 'filling';
          state.form.error = 'network';
          throw error;
        })
        .finally(() => setTimeout(updatePosts, 5000));
    });
  };
  watch(state);
  updatePosts();
};
