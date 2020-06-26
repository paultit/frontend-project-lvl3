import { watch } from 'melanke-watchjs';
import i18next from 'i18next';
import {
  renderErrors, renderForm, renderPosts, renderFeeds,
} from './renderers';

export default (state) => {
  const message = document.querySelector('div.messages');
  const submitButton = document.querySelector('button[type="submit"]');
  const input = document.querySelector('input.form-control');
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

  watch(state.form, 'processState', () => processFormHandler());
  watch(state.form, 'valid', () => renderForm(state, input));
  watch(state, 'feeds', () => renderFeeds(state.feeds));
  watch(state, 'posts', () => renderPosts(state.posts));
  watch(state.form, 'error', () => renderErrors(state));
};
