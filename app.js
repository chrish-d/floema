require('dotenv').config();

const prismic = require('@prismicio/client');
const prismicH = require('@prismicio/helpers');
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = 3000;

// Initialise Prismic API
const initAPI = (req) => {
  return prismic.createClient(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req,
    fetch,
  });
};

// Link resolver
const handleLinkResolver = (doc) => {
  return '/';
};

// Middleware to inject Prismic context
app.use((req, res, next) => {
  res.locals.ctx = {
    endpoint: process.env.PRISMIC_ENDPOINT,
    linkResolver: handleLinkResolver,
  };
  res.locals.PrismicH = prismicH;
  next();
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.locals.baseDir = app.get('views');

const handleRequest = async (api) => {
  const [metadata, home, about, { results: collections }] = await Promise.all([
    api.getSingle('metadata'),
    api.getSingle('home'),
    api.getSingle('about'),
    api.query(prismic.Predicates.at('document.type', 'collection'), {
      fetchLinks: 'product.model',
    }),
  ]);

  const assets = [];

  // home.data.gallery.forEach((item) => {
  //   assets.push(item.image.url);
  // });

  about.data.body.forEach((section) => {
    if (section.slice_type === 'gallery') {
      section.items.forEach((item) => {
        assets.push(item.image.url);
      });
    }
  });

  collections.forEach((collection) => {
    collection.data.products.forEach((item) => {
      assets.push(item.products_product.data.model.url);
    });
  });

  return {
    assets,
    metadata,
    home,
    collections,
    about,
  };
};

app.get('/', async (req, res) => {
  const api = await initAPI(req);
  const defaults = await handleRequest(api);
  res.render('pages/home', {
    ...defaults,
  });
});

app.get('/about', async (req, res) => {
  const api = await initAPI(req);
  const defaults = await handleRequest(api);
  res.render('pages/about', {
    ...defaults,
  });
});

app.get('/collections', async (req, res) => {
  const api = await initAPI(req);
  const defaults = await handleRequest(api);
  res.render('pages/collections', {
    ...defaults,
  });
});

app.get('/detail/:uid', async (req, res) => {
  const api = await initAPI(req);
  const defaults = await handleRequest(api);

  const product = await api.getByUID('product', req.params.uid, {
    fetchLinks: 'collection.title',
  });

  res.render('pages/detail', {
    ...defaults,
    product,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
