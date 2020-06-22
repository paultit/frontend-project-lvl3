import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/alert';
import './styles.scss';
import init from './app';

export default () => {
  init(document.getElementById('point'));
};
