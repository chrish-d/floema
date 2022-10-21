import { Page } from 'classes/page';

export const Collections = class Collections extends Page {
  constructor() {
    super({
      id: 'collections',
      element: '.collections',
    });
  }
};
