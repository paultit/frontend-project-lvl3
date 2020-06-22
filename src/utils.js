import * as yup from 'yup';

const schema = yup.object().shape({
  checkUrl: yup.string().url().required(),
});

export const isValid = (url) => {
  const isValidUrl = schema.isValidSync({ checkUrl: url });
  return isValidUrl;
};

export const getPosts = (data) => {
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

export const getFeed = (data) => {
  const title = data.querySelector('channel > title').textContent;
  const description = data.querySelector('channel > description').textContent;
  const feed = { title, description };
  return feed;
};
