import '@babel/polyfill';
import { watch } from 'melanke-watchjs';
import axios from 'axios';
import _ from 'lodash';
import { validate, parse } from './utils.js';
import {
  renderForm, renderPosts, renderFeeds,
} from './renderers';

const proxy = 'cors-anywhere.herokuapp.com';
const getUrl = (value) => `https://${proxy}/${value}`;

export default () => {
  const state = {
    form: {
      processState: 'filling',
      processError: null,
      inputValue: null,
      valid: true,
      errors: {},
    },
    listFeeds: [],
    listPosts: [],
  };
  const submitButton = document.querySelector('button[type="submit"]');
  const input = document.querySelector('input.form-control');
  const form = document.querySelector('.rss-form');
  const processFormHandler = () => {
    const { processState } = state.form;
    switch (processState) {
      case 'filling':
        submitButton.disabled = true;
        break;
      case 'sending':
        submitButton.disabled = true;
        break;
      case 'finished':
        state.form.inputValue = '';
        submitButton.disabled = false;
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
      console.log(listFeeds);
      if (isValid) {
        state.form.valid = true;
      } else {
        state.form.valid = false;
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
        if (state.feed.currentFeed) {
          state.feed.currentFeed.status = 'init';
        }
        console.log(feed);
        state.listFeeds.push({ ...feed, id, link: inputValue });
        console.log(state.listFeeds);
        posts.forEach((post) => state.listPosts.push({ ...post, id }));
        state.form.processState = 'finished';
      })
      .catch((error) => {
        state.form.valid = false;
        state.form.processState = 'failed';
        submitButton.disabled = true;
        throw error;
      });
  });
  watch(state.form, 'processState', () => processFormHandler());
  watch(state.form, 'valid', () => renderForm(state, input));
  watch(state, 'listFeeds', () => renderFeeds(state.listFeeds));
  watch(state, 'listPosts', () => renderPosts(state.listPosts, input));
};
