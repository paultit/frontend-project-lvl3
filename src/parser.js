import { getFeed, getPosts } from './utils.js';

export default (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  const feed = getFeed(doc);
  const posts = getPosts(doc);
  return { feed, posts };
};
