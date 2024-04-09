export interface WordinessOption {
    text: string;
    max: number;
  }
  
  export const wordinessOptions: WordinessOption[] = [
    {text: 'one word', max: 1},
    {text: 'a phrase', max: 5},
    {text: 'a long phrase', max: 15},
    {text: 'about twenty words', max: 20},
    {text: 'more than fifty words', max: Infinity},
  ];
  