import * as yup from 'yup';

const schema = yup.object().shape({
  checkUrl: yup.string().url().matches(/rss/),
});

export const validate = (url, feeds) => {
  console.log(url);
  const isValid = schema.isValidSync({ checkUrl: url });
  const isUniq = !feeds.includes(url);
  return isValid && isUniq;
};

const getPosts = (data) => {
  const items = data.querySelectorAll('channel > item');
  const listPosts = [...items].map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    const post = { title, description, link };
    return post;
  });
  return listPosts;
};

const getFeed = (data) => {
  const title = data.querySelector('channel > title').textContent;
  const description = data.querySelector('channel > description').textContent;
  const feed = { title, description };
  return feed;
};

export const parse = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  console.log(doc);
  const feed = getFeed(doc);
  const posts = getPosts(doc);
  return { feed, posts };
};
