import { Page } from 'classes/page';

export const Detail = class Detail extends Page {
  constructor() {
    super({
      id: 'detail',
      element: '.detail',
    });
  }
};
