require('dotenv').config();

const Prismic = require('@prismicio/client');
const PrismicH = require('@prismicio/helpers');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const express = require('express');
const methodOverride = require('method-override');
const logger = require('morgan');
const fetch = require('node-fetch');
const path = require('path');
const { ToWords } = require('to-words');

const app = express();
const port = 3000;

// Initialise Prismic API
const initAPI = (req) => {
  return Prismic.createClient(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req,
    fetch,
  });
};

// Link resolver
const handleLinkResolver = (doc) => {
  if (doc.link_type === 'Web') {
    return doc.url;
  }

  if (doc.type === 'product') {
    return `/detail/${doc.slug}`;
  }

  return `/${doc.slug}`;
};

// Middleware to handle errors
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(errorHandler());
app.use(methodOverride());

// Middleware to inject Prismic context
app.use((req, res, next) => {
  res.locals.ctx = {
    endpoint: process.env.PRISMIC_ENDPOINT,
  };

  res.locals.PrismicH = PrismicH;
  res.locals.linkResolver = handleLinkResolver;

  res.locals.toWords = (index) => {
    return new ToWords().convert(index);
  };

  next();
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.locals.baseDir = app.get('views');

const handleRequest = async (api) => {
  const [
    metadata,
    preloader,
    navigation,
    home,
    about,
    { results: collections },
  ] = await Promise.all([
    api.getSingle('metadata'),
    api.getSingle('preloader'),
    api.getSingle('navigation'),
    api.getSingle('home'),
    api.getSingle('about'),
    api.query(Prismic.Predicates.at('document.type', 'collection'), {
      fetchLinks: 'product.model',
    }),
  ]);

  const assets = [];

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
    preloader,
    navigation,
    home,
    collections,
    about,
  };
};

app.get('/', async (req, res) => {
  const api = await initAPI(req);
  const defaults = await handleRequest(api);

  console.log(defaults.metadata);

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
  // eslint-disable-next-line no-console
  console.log(`App listening at http://localhost:${port}`);
});
