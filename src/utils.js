import * as yup from 'yup';
import _ from 'lodash';

export const validate = (feeds, url) => {
  try {
    const links = feeds.map(({ link }) => link);
    const schema = yup.object().shape({
      checkUrl: yup.string().url().required(''),
      checkAddedLinks: yup.string().notOneOf(links),
    });
    const validatedUrl = schema.validateSync({ checkUrl: url, checkAddedLinks: url },
      { abortEarly: false });
    return validatedUrl;
  } catch (e) {
    return _.keyBy(e.inner, 'path');
  }
};

export const getPosts = (data) => {
  const items = data.querySelectorAll('channel > item');
  const posts = [...items].map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    const post = { title, description, link };
    return post;
  });
  return posts;
};

export const getFeed = (data) => {
  const title = data.querySelector('channel > title').textContent;
  const description = data.querySelector('channel > description').textContent;
  const feed = { title, description };
  return feed;
};
