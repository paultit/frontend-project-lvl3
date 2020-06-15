import '@babel/polyfill';
import { watch } from 'melanke-watchjs';
import axios from 'axios';
import _ from 'lodash';
import i18next from 'i18next';
import resources from './locales';
import { validate, parse } from './utils.js';
import {
  renderErrors, renderForm, renderPosts, renderFeeds,
} from './renderers';

const proxy = 'cors-anywhere.herokuapp.com';
const getUrl = (value) => `https://${proxy}/${value}`;

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
        // TODO render error
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
        console.log(response);
        const { feed, posts } = parse(response.data);
        console.log(feed);
        state.listFeeds.push({ ...feed, id, link: inputValue });
        console.log(state.listFeeds);
        posts.forEach((post) => state.listPosts.push({ ...post, id }));
        state.form.processState = 'finished';
        state.form.errors = null;
      })
      .catch((error) => {
        state.form.valid = false;
        state.form.processState = 'failed';
        submitButton.disabled = true;
        state.form.errors = 'network';
        throw error;
      });
  });
  watch(state.form, 'processState', () => processFormHandler());
  watch(state.form, 'valid', () => renderForm(state, input));
  watch(state, 'listFeeds', () => renderFeeds(state.listFeeds));
  watch(state, 'listPosts', () => renderPosts(state.listPosts));
  watch(state.form, 'errors', () => renderErrors(state));
};
