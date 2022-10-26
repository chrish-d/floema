import each from 'lodash/each';
import { About } from 'pages/about';
import { Collections } from 'pages/collections';
import { Detail } from 'pages/detail';
import { Home } from 'pages/home';
import { Preloader } from './components/preloader';

class App {
  constructor() {
    this.createPreloader();
    this.createContent();
    this.createPages();
    this.addLinkListeners();
  }

  createPreloader() {
    this.preloader = new Preloader();
    this.preloader.once('completed', this.onPreloaded.bind(this));
  }

  createContent() {
    this.content = document.querySelector('.content');
    this.template = this.content.dataset.template;
  }

  createPages() {
    this.pages = {
      about: new About(),
      collections: new Collections(),
      detail: new Detail(),
      home: new Home(),
    };

    this.page = this.pages[this.template];
    this.page.create();
  }

  onPreloaded() {
    this.preloader.destroy();
    this.page.show();
  }

  async onChange(url) {
    await this.page.hide();

    const req = await window.fetch(url);

    if (req.status === 200) {
      const html = await req.text();
      const div = document.createElement('div');

      div.innerHTML = html;
      const divContent = div.querySelector('#content');

      this.template = divContent.dataset.template;

      this.content.innerHTML = divContent.innerHTML;
      this.content.dataset.template = this.template;

      this.page = this.pages[this.template];
      this.page.create();
      this.page.show();

      this.addLinkListeners();
    } else {
      console.log('Error');
    }
  }

  addLinkListeners() {
    const links = document.querySelectorAll('a');
    each(links, (link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const { href } = link;
        this.onChange(href);
      });
    });
  }
}

const app = new App();
