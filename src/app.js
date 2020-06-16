import '@babel/polyfill';
import { watch } from 'melanke-watchjs';
import axios from 'axios';
import $ from 'jquery';
import _ from 'lodash';
import i18next from 'i18next';
import resources from './locales';
import { validate, parse } from './utils.js';
import {
  renderErrors, renderForm, renderPosts, renderFeeds,
} from './renderers';

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
    listFeeds: [],
    listPosts: [],
  };

  $(window).on('load', () => {
    const preloader = $('.spinner');
    preloader.delay(1000).fadeOut('slow');
  });

  const submitButton = document.querySelector('button[type="submit"]');
  const input = document.querySelector('input.form-control');
  const form = document.querySelector('.rss-form');
  const message = document.querySelector('div.messages');

  const processFormHandler = () => {
    const { processState } = state.form;
    switch (processState) {
      case 'filling':
        submitButton.disabled = true;
        break;
      case 'sending':
        submitButton.disabled = true;
        message.textContent = i18next.t('processState.sending');
        break;
      case 'finished':
        state.form.inputValue = '';
        submitButton.disabled = false;
        message.textContent = i18next.t('processState.finished');
        break;
      case 'failed':
        submitButton.disabled = true;
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  input.addEventListener('input', (e) => {
    if (e.target.value === '') {
      state.form.processState = 'filling';
    } else {
      state.form.processState = 'filling';
      state.form.inputValue = e.target.value;
      const { form: { inputValue }, listFeeds } = state;
      const isValid = validate(inputValue, listFeeds);
      if (isValid) {
        state.form.valid = true;
        state.form.errors = null;
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
        state.listFeeds.push({ ...feed, id, link: inputValue });
        posts.forEach((post) => state.listPosts.push({ ...post, id }));
        state.form.processState = 'finished';
        state.form.errors = null;
      })
      .catch((response, error) => {
        state.form.valid = false;
        state.form.processState = 'failed';
        submitButton.disabled = true;
        if (response.status >= 500) {
          state.form.errors = 'network';
        } else {
          state.form.errors = 'not-found';
        }
        throw error;
      });
  });

  watch(state.form, 'processState', () => processFormHandler());
  watch(state.form, 'valid', () => renderForm(state, input));
  watch(state, 'listFeeds', () => renderFeeds(state.listFeeds));
  watch(state, 'listPosts', () => renderPosts(state.listPosts));
  watch(state.form, 'errors', () => renderErrors(state));

  const addNewPosts = () => {
    const { listFeeds } = state;
    const { listPosts } = state;
    if (listFeeds.length === 0) {
      setTimeout(addNewPosts, 5000);
      return;
    }
    listFeeds.forEach((feed) => {
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
