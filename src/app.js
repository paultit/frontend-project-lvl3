import '@babel/polyfill';
import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import resources from './locales';
import { isValid } from './utils.js';
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
      errors: null,
    },
    feeds: [],
    listPosts: [],
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
      state.form.processState = 'filling';
      state.form.inputValue = e.target.value;
      const { form: { inputValue }, feeds } = state;
      const isValidUrl = isValid(inputValue);
      if (isValidUrl) {
        const links = feeds.map(({ link }) => link);
        const isUniq = !links.includes(inputValue);
        if (isUniq) {
          state.form.valid = true;
          state.form.errors = null;
        } else {
          state.form.valid = false;
          state.form.errors = 'not-uniq';
        }
      } else {
        state.form.valid = false;
        state.form.errors = 'invalid';
      }
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.form.processState = 'sending';
    submitButton.disabled = true;
    const { inputValue } = state.form;
    const url = getUrl(inputValue);
    const id = _.uniqueId();
    axios.get(url)
      .then((response) => {
        const { feed, posts } = parse(response.data);
        state.feeds.push({ ...feed, id, link: inputValue });
        posts.forEach((post) => state.listPosts.push({ ...post, id }));
        state.form.processState = 'finished';
        state.form.inputValue = '';
        state.form.errors = null;
      })
      .catch((response, error) => {
        state.form.valid = false;
        state.form.processState = 'failed';
        submitButton.disabled = true;
        if (response.status >= 500) {
          state.form.errors = 'problems-network';
        } else {
          state.form.errors = 'not-found';
        }
        throw error;
      });
  });
  watch(state);
  const addNewPosts = () => {
    const { feeds } = state;
    const { listPosts } = state;
    if (feeds.length === 0) {
      setTimeout(addNewPosts, 5000);
      return;
    }
    feeds.forEach((feed) => {
      const oldPosts = listPosts.filter((post) => post.id === feed.id);
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
            newPosts.forEach((post) => [post, ...state.listPosts]);
          }
        })
        .catch((error) => {
          state.form.valid = false;
          state.form.processForm = 'filling';
          state.form.errors = 'network';
          throw error;
        });
    });
    setTimeout(addNewPosts, 5000);
  };
  setTimeout(addNewPosts, 5000);
};
