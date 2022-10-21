import { Page } from 'classes/page';

export const About = class About extends Page {
  constructor() {
    super({
      id: 'about',
      element: '.about',
    });
  }
};
