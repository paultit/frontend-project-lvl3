import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import resources from './locales';
import { validate } from './utils.js';
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

  const submitButton = document.querySelector('button[type="submit"]');
  const input = document.querySelector('input.form-control');
  const form = document.querySelector('.rss-form');
  input.addEventListener('input', (e) => {
    if (e.target.value === '') {
      state.form.processState = 'filling';
    } else {
      state.form.inputValue = e.target.value;
      const { form: { inputValue }, feeds } = state;
      const validatedUrl = validate(feeds, inputValue);
      if (validatedUrl.checkUrl && validatedUrl.checkAddedLinks) {
        state.form.valid = true;
        state.form.error = null;
      } else if (validatedUrl.checkUrl && validatedUrl.checkUrl.name === 'ValidationError') {
        state.form.valid = false;
        state.form.error = 'invalid';
      } else {
        state.form.valid = false;
        state.form.error = 'not-uniq';
      }
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
        posts.forEach((post) => state.posts.push({ ...post, id }));
        state.form.processState = 'finished';
        state.form.inputValue = '';
        state.form.error = null;
      })
      .catch((response, error) => {
        state.form.valid = false;
        state.form.processState = 'failed';
        submitButton.disabled = true;
        if (response.status >= 500) {
          state.form.error = 'problems-network';
        } else {
          state.form.error = 'not-found';
        }
        throw error;
      });
  });

  const addNewPosts = () => {
    const { feeds } = state;
    const { posts } = state;
    if (feeds.length === 0) {
      setTimeout(addNewPosts, 5000);
    }
    feeds.forEach((feed) => {
      const oldPosts = posts.filter((post) => post.id === feed.id);
      const url = getUrl(feed.link);
      axios.get(url)
        .then((response) => {
          const data = parse(response.data);
          const updatePosts = data.posts;
          return updatePosts.map((post) => ({ ...post, id: feed.id }));
        })
        .then((updatePosts) => getNewPosts(updatePosts, oldPosts))
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
        .finally(() => setTimeout(addNewPosts, 5000));
    });
  };
  watch(state);
  addNewPosts();
};
